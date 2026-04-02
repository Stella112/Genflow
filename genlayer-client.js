/**
 * GenFlow — genlayer-client.js
 *
 * Per genlayer-js README:
 *  - readClient: chain: studionet (reads from RPC, no wallet)
 *  - writeClient: chain: studionet + account + provider: window.ethereum (MetaMask signs)
 *  - client.connect('studionet') switches MetaMask to the right chain
 *
 * For reads:  SDK uses gen_call (correct binary encoding, hosted studionet URL)
 * For writes: SDK uses MetaMask for signing, sends eth_sendRawTransaction
 */

const CONTRACT = '0xc05A4011e072c34658Eb9a49EDFD5e2c938F9631';

let _readClient  = null;
let _writeClient = null;
let _account     = null;
let _sdkLoaded   = false;
let _sdk         = null;

async function getSDK() {
    if (_sdk) return _sdk;
    _sdk = await import('https://esm.sh/genlayer-js@latest');
    _sdkLoaded = true;
    return _sdk;
}

async function getReadClient() {
    if (_readClient) return _readClient;
    const sdk = await getSDK();
    const { studionet } = await import('https://esm.sh/genlayer-js@latest/chains');
    _readClient = sdk.createClient({ chain: studionet });
    return _readClient;
}

async function getWriteClient(account) {
    if (!account) throw new Error('No account — connect wallet first.');
    if (!window.ethereum) throw new Error('MetaMask not installed.');
    const sdk = await getSDK();
    const { studionet } = await import('https://esm.sh/genlayer-js@latest/chains');
    _writeClient = sdk.createClient({
        chain:    studionet,
        account:  account,
        provider: window.ethereum,
    });
    return _writeClient;
}

// ── Poll tx via readClient ──
async function pollTx(hash, onProgress) {
    const client = await getReadClient();
    for (let i = 0; i < 240; i++) {   // 20 min max (5s × 240)
        await new Promise(r => setTimeout(r, 5000));
        try {
            const tx = await client.getTransaction({ hash });
            if (tx) {
                const status = tx.status || tx.transactionStatus;
                if (onProgress) onProgress(status, i + 1);
                if (status === 'FINALIZED' || status === 'ACCEPTED') return tx;
                if (status === 'CANCELED' || status === 'UNDETERMINED') {
                    throw new Error(`Transaction ${status}: consensus failed`);
                }
            }
        } catch (e) {
            if (e.message.includes('CANCELED') || e.message.includes('UNDETERMINED')) throw e;
        }
    }
    throw new Error('Transaction timed out after 10 minutes');
}

// ── Normalize decoded flow data (SDK returns Maps) ──
function normFlows(raw) {
    const toPlain = (v) => {
        if (v instanceof Map) {
            const o = {};
            v.forEach((val, k) => { o[k] = toPlain(val); });
            return o;
        }
        if (Array.isArray(v)) return v.map(toPlain);
        if (typeof v === 'bigint') return v.toString();
        return v;
    };

    let source = raw;
    if (typeof raw === 'string') {
        try { source = JSON.parse(raw); } catch { return {}; }
    } else if (raw instanceof Map) {
        const o = {};
        raw.forEach((v, k) => { o[k] = toPlain(v); });
        return o;
    }
    if (source && typeof source === 'object') {
        const o = {};
        Object.keys(source).forEach(k => { o[k] = toPlain(source[k]); });
        return o;
    }
    return {};
}

// ── Public API ──
const GenLayerClient = {
    CONTRACT,
    getAccount() { return _account; },

    // Connect MetaMask — switch to studionet chain first
    async connectMetaMask() {
        if (!window.ethereum) throw new Error('MetaMask not installed.');
        // Request accounts
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts?.length) throw new Error('No accounts found.');
        _account = accounts[0];

        // Switch MetaMask to StudioNet
        try {
            const client = await getWriteClient(_account);
            await client.connect('studionet');
        } catch (e) {
            console.warn('Could not auto-switch chain:', e.message);
        }

        window.ethereum.on('accountsChanged', accs => {
            _account = accs[0] || null;
            _writeClient = null; // reset write client on account change
            window.dispatchEvent(new CustomEvent('genflow:account', { detail: _account }));
        });
        return _account;
    },

    // Connect with plain address (StudioNet test account)
    connectAddress(addr) {
        _account = addr;
        _writeClient = null;
        return addr;
    },

    // ── Read all flows ──
    async getFlowData() {
        const client = await getReadClient();
        const raw = await client.readContract({
            address:      CONTRACT,
            functionName: 'get_flow_data',
            args:         [],
        });
        const flows = normFlows(raw);
        Object.keys(flows).forEach(k => {
            const u = (flows[k].trigger_url || '').toLowerCase();
            flows[k].category =
                u.includes('github')                             ? 'github'   :
                u.includes('flight') || u.includes('flightaware') ? 'flight'  :
                u.includes('ups') || u.includes('fedex')         ? 'delivery' :
                u.includes('binance') || u.includes('coingecko') ? 'crypto'   : 'custom';
        });
        return flows;
    },

    async getFlowCount() {
        const client = await getReadClient();
        const n = await client.readContract({
            address: CONTRACT, functionName: 'get_flow_count', args: [],
        });
        return parseInt(String(n ?? 0), 10);
    },

    // ── Create flow (write) ──
    async createFlow(title, condition, url, payee, amount, creator) {
        const wc = await getWriteClient(_account);
        await wc.connect('studionet');   // switch MetaMask to chain 61999
        return wc.writeContract({
            address:      CONTRACT,
            functionName: 'create_flow',
            args: [
                title, condition, url,
                payee   || '0x0000000000000000000000000000000000000000',
                parseInt(amount) || 0,
                creator || _account,
            ],
            value: BigInt(0),
        });
    },

    // ── Trigger AI check (write) ──
    async checkFlow(flowId) {
        const wc = await getWriteClient(_account);
        await wc.connect('studionet');   // switch MetaMask to chain 61999
        return wc.writeContract({
            address:      CONTRACT,
            functionName: 'check_flow',
            args:         [String(flowId)],
            value:        BigInt(0),
        });
    },

    waitForTx: pollTx,
};

window.GenLayerClient = GenLayerClient;
