/**
 * GenFlow — app.js
 * All real. No demo mode. Direct StudioNet interaction.
 */
const $ = id => document.getElementById(id);
const App = { flows: {} };

// ═══ VIEW ═══
function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const el = $(`view-${name}`);
    if (el) el.classList.add('active');
    const lnk = document.querySelector(`[data-view="${name}"]`);
    if (lnk) lnk.classList.add('active');
}

// ═══ TOAST ═══
function toast(msg, type = 'info', ms = 4000) {
    const c = $('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${type==='success'?'✓':type==='error'?'✕':'◈'}</span><span>${msg}</span>`;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, ms);
}

// ═══ CATEGORIES ═══
const catConfig = {
    flight:    { icon: '✈',  color: '#3ecfcf',  label: 'Flight Insurance' },
    github:    { icon: '⬡',  color: '#6c63ff',  label: 'Freelance / GitHub' },
    delivery:  { icon: '📦', color: '#f59e0b', label: 'E-Commerce' },
    crypto:    { icon: '₿',  color: '#22c55e',  label: 'Crypto Trigger' },
    insurance: { icon: '🛡', color: '#e879f9',  label: 'Parametric Insurance' },
    social:    { icon: '💬', color: '#38bdf8',  label: 'Social Trigger' },
    custom:    { icon: '◈',  color: '#8a94a8',  label: 'Custom Flow' },
};

// ═══ FLOW CARD ═══
function buildFlowCard(flow) {
    const cat = catConfig[flow.category] || catConfig.custom;
    const isTriggered = flow.status === 'TRIGGERED';
    const card = document.createElement('div');
    card.className = `flow-card ${isTriggered ? 'flow-triggered' : ''}`;

    let resultBadge = '';
    if (flow.last_check_result === 'TRUE') resultBadge = `<span class="result-badge result-true">▲ TRUE</span>`;
    else if (flow.last_check_result === 'FALSE') resultBadge = `<span class="result-badge result-false">▼ FALSE</span>`;
    else resultBadge = `<span class="result-badge result-pending">… ${flow.last_check_result || 'Pending'}</span>`;

    const statusBadge = isTriggered
        ? `<span class="badge badge-triggered">✓ Triggered</span>`
        : `<span class="badge badge-active">◉ Active</span>`;

    card.innerHTML = `
        <div class="flow-card-top">
            <div class="flow-cat-badge" style="background:${cat.color}22;color:${cat.color};border:1px solid ${cat.color}44">${cat.icon} ${cat.label}</div>
            ${statusBadge}
        </div>
        <h3 class="flow-title">${flow.title || 'Untitled Flow'}</h3>
        <div class="flow-ifthen">
            <div class="mini-if"><span class="mini-label">IF</span><a href="${flow.trigger_url}" target="_blank" class="mini-url">${(flow.trigger_url||'').replace(/^https?:\/\//,'').slice(0,45)}</a></div>
            <div class="mini-if"><span class="mini-label and">AND</span><span class="mini-cond">${flow.condition}</span></div>
            <div class="mini-if"><span class="mini-label then">THEN</span><span class="mini-pay">${flow.amount} GEN → ${(flow.payee_address||'').slice(0,6)}…${(flow.payee_address||'').slice(-4)}</span></div>
        </div>
        ${flow.trigger_reasoning ? `<div class="flow-reasoning"><span class="reasoning-label">AI Verdict</span><p class="reasoning-text">${flow.trigger_reasoning}</p></div>` : ''}
        <div class="flow-footer">
            <span class="last-check">${resultBadge}</span>
            <div class="flow-btns">
                <button class="btn btn-sm btn-ghost" onclick="openFlowModal('${flow.id}')">Details</button>
                ${!isTriggered ? `<button class="btn btn-sm btn-primary verify-btn" onclick="App.triggerCheck('${flow.id}',event)"><span>🧠</span> Verify AI</button>` : `<button class="btn btn-sm btn-success" disabled>✓ Paid</button>`}
            </div>
        </div>`;
    return card;
}

// ═══ LOAD FLOWS ═══
App.loadFlows = async function(silent = false) {
    const btn = $('refresh-btn');
    if (btn) { btn.disabled = true; $('refresh-icon').textContent = '⟳'; }
    try {
        const flows = await GenLayerClient.getFlowData();
        App.flows = flows;
        const grid = $('flows-grid');
        grid.innerHTML = '';
        const keys = Object.keys(flows);
        if (keys.length === 0) {
            grid.innerHTML = `<div class="empty-state"><div class="empty-icon">◈</div><h3>No Flows On-Chain Yet</h3><p>Create the first intelligent escrow flow.</p><button class="btn btn-primary" onclick="showView('create')">+ Create Flow</button></div>`;
        } else {
            keys.reverse().forEach(id => grid.appendChild(buildFlowCard(flows[id])));
        }
        const triggered = keys.filter(k => flows[k].status === 'TRIGGERED').length;
        $('stat-total').textContent = keys.length;
        $('stat-active').textContent = keys.length - triggered;
        $('stat-triggered').textContent = triggered;
        if (!silent) toast('Loaded ' + keys.length + ' flows from chain', 'success');
    } catch (e) {
        console.error('[GenFlow] Load error:', e);
        if (!silent) toast('Failed to load flows: ' + e.message, 'error');
        $('flows-grid').innerHTML = `<div class="empty-state"><div class="empty-icon">✕</div><h3>Connection Error</h3><p>${e.message}</p><button class="btn btn-primary" onclick="App.loadFlows()">Retry</button></div>`;
    } finally {
        if (btn) { btn.disabled = false; $('refresh-icon').textContent = '↻'; }
    }
};

// ═══ FLOW MODAL ═══
function openFlowModal(flowId) {
    const flow = App.flows[flowId]; if (!flow) return;
    const cat = catConfig[flow.category] || catConfig.custom;
    const isTriggered = flow.status === 'TRIGGERED';
    $('modal-body').innerHTML = `
        <div class="modal-cat" style="color:${cat.color}">${cat.icon} ${cat.label}</div>
        <h2 class="modal-flow-title">${flow.title}</h2>
        <div class="ifthen-modal">
            <div class="ifthen-modal-row"><span class="if-badge">IF</span><a href="${flow.trigger_url}" target="_blank" class="detail-link">${flow.trigger_url}</a></div>
            <div class="ifthen-modal-row"><span class="if-badge and-badge">AND</span><span>"${flow.condition}"</span></div>
            <div class="ifthen-modal-row"><span class="if-badge then-badge">THEN</span><span>${flow.amount} GEN → <code>${flow.payee_address}</code></span></div>
        </div>
        <div class="detail-grid">
            <div class="detail-row"><span class="detail-label">Status</span>${isTriggered ? '<span style="color:var(--green)">✓ TRIGGERED</span>' : '<span style="color:var(--accent)">◉ ACTIVE</span>'}</div>
            <div class="detail-row"><span class="detail-label">Creator</span><code style="font-size:11px">${flow.creator}</code></div>
            <div class="detail-row"><span class="detail-label">Last Check</span>${flow.last_check_result}</div>
            ${flow.trigger_reasoning ? `<div class="detail-row" style="grid-column:1/-1"><span class="detail-label">AI Reasoning</span><p class="detail-reasoning">${flow.trigger_reasoning}</p></div>` : ''}
        </div>
        ${!isTriggered ? `<div class="modal-actions"><button class="btn btn-primary" onclick="App.triggerCheck('${flow.id}');closeModal()">🧠 Run AI Verification</button></div>` : ''}`;
    $('modal-overlay').classList.add('show');
}
function closeModal() { $('modal-overlay').classList.remove('show'); }

// ═══ POLL TX ═══  wait for finalization
async function pollTxStatus(hash, onProgress, overlayMsg, addLog) {
    const client = GenLayerClient;
    for (let i = 0; i < 240; i++) {  // 20-minute max
        await new Promise(r => setTimeout(r, 5000));
        try {
            const tx = await client.waitForTx(hash, null);
            if (tx) return tx;
        } catch (e) {
            if (e.message.includes('CANCELED') || e.message.includes('UNDETERMINED')) throw e;
            if (e.message.includes('timed out')) {
                // Re-read from chain
                await App.loadFlows(true);
                const f = App.flows[currentPollFlowId];
                if (f && f.last_check_result !== 'Pending...') return { status: 'FINALIZED' };
            }
        }
        const attempt = i + 1;
        if (onProgress) onProgress(attempt);
    }
    throw new Error('TIMEOUT_SOFT');
}

// ═══ AI TRIGGER — real on-chain ═══
App.triggerCheck = async function(flowId, e) {
    if (e) e.stopPropagation();
    if (!GenLayerClient.getAccount()) {
        openWalletModal();
        toast('Connect your account first', 'info');
        return;
    }

    const overlay = $('consensus-overlay');
    const log = $('consensus-log');
    overlay.style.display = 'flex';
    log.innerHTML = '';
    const vns = ['vn-0','vn-1','vn-2','vn-3'];
    vns.forEach(id => { const el=$(id); if(el){el.classList.remove('vn-done','vn-active');el.classList.add('vn-active');}});

    const addLog = (msg, cls='') => {
        const l = document.createElement('div');
        l.className = `log-line ${cls}`;
        l.innerHTML = '> ' + msg;
        log.appendChild(l);
        log.scrollTop = log.scrollHeight;
    };

    try {
        $('consensus-msg').textContent = 'Sending check_flow transaction…';
        addLog(`Calling check_flow("${flowId}") via gen_sendTransaction…`);

        const txHash = await GenLayerClient.checkFlow(flowId);
        addLog(`Tx hash: <span style="color:var(--accent-2)">${txHash}</span>`, 'log-success');
        addLog('Waiting for validators to reach consensus…');
        $('consensus-msg').textContent = 'Validators fetching trigger URL…';

        let stage = 0;
        const stages = [
            'Validators fetching trigger URL…',
            'AI reading page content…',
            'Applying Equivalence Principle…',
            'Waiting for consensus…',
            'Finalizing on-chain…',
        ];

        const receipt = await GenLayerClient.waitForTx(txHash, (status, attempt) => {
            const idx = Math.min(Math.floor(attempt / 4), stages.length - 1);
            if (idx !== stage) {
                stage = idx;
                $('consensus-msg').textContent = stages[stage];
                addLog(stages[stage]);
            }
            // Progressively mark validators done
            if (attempt >= 3)  { const el=$('vn-0'); if(el){el.classList.remove('vn-active');el.classList.add('vn-done');} }
            if (attempt >= 7)  { const el=$('vn-1'); if(el){el.classList.remove('vn-active');el.classList.add('vn-done');} }
            if (attempt >= 11) { const el=$('vn-2'); if(el){el.classList.remove('vn-active');el.classList.add('vn-done');} }
            if (attempt >= 15) { const el=$('vn-3'); if(el){el.classList.remove('vn-active');el.classList.add('vn-done');} }
        });

        vns.forEach(id => { const el=$(id); if(el){el.classList.remove('vn-active');el.classList.add('vn-done');}});
        addLog(`Transaction ${receipt.status}!`, 'log-success');
        $('consensus-msg').textContent = 'Reading updated state…';

        // Re-read the chain for the verdict
        await App.loadFlows(true);
        const updated = App.flows[flowId];
        if (updated) {
            const isTrue = updated.last_check_result === 'TRUE';
            addLog(`AI Verdict: <strong>${updated.last_check_result}</strong>`, isTrue ? 'log-success' : 'log-warn');
            if (updated.trigger_reasoning) addLog(`"${updated.trigger_reasoning}"`);
            $('consensus-msg').textContent = isTrue ? '✓ Condition MET — Payout triggered!' : '✓ Condition not met';
        } else {
            $('consensus-msg').textContent = '✓ Done!';
        }
        setTimeout(() => { overlay.style.display = 'none'; }, 5000);
        toast(`Flow #${flowId} verified! Result: ${updated?.last_check_result || 'OK'}`, 'success', 6000);

    } catch (err) {
        if (err.message === 'TIMEOUT_SOFT' || err.message.includes('timed out')) {
            // Transaction still pending — don't show as error
            addLog('⏳ Still processing… validators may be fetching a slow URL.', 'log-warn');
            addLog('Close this window — result will appear on the dashboard when ready.', 'log-warn');
            $('consensus-msg').textContent = '⏳ Processing (takes up to 20 min for complex checks)';
            // Refresh dashboard in background
            await App.loadFlows(true);
            setTimeout(() => { overlay.style.display = 'none'; }, 15000);
            toast('Tx submitted — still processing. Check dashboard in a few minutes.', 'info', 8000);
        } else {
            addLog('Error: ' + err.message, 'log-error');
            $('consensus-msg').textContent = 'Transaction failed.';
            vns.forEach(id => { const el=$(id); if(el){el.classList.remove('vn-active','vn-done');}});
            setTimeout(() => { overlay.style.display = 'none'; }, 5000);
            toast(err.message, 'error', 6000);
        }
    }
};

// ═══ CREATE FLOW ═══
const templates = {
    // ── Parametric Insurance ──
    weather_insurance: {
        title: 'London Rainfall Event Insurance',
        condition: 'The precipitation_sum value for the most recent date is greater than 10 mm (indicating significant rainfall)',
        url: 'https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&daily=precipitation_sum&timezone=Europe%2FLondon&past_days=1&forecast_days=0',
        amount: '5000',
        category: 'insurance',
    },
    earthquake_insurance: {
        title: 'Earthquake Insurance Trigger',
        condition: 'There is at least one earthquake with magnitude (mag) greater than 5.0 in the features array',
        url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
        amount: '10000',
        category: 'insurance',
    },
    flight_insurance: {
        title: 'Flight Cancellation Insurance',
        condition: 'The ac array is empty, meaning the flight has no active aircraft (cancelled or not operating)',
        url: 'https://api.adsb.lol/v2/callsign/BAW112',
        amount: '800',
        category: 'flight',
    },
    crypto_crash: {
        title: 'ETH Crash Insurance',
        condition: 'The price of ETHUSDT is below 1500',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT',
        amount: '3000',
        category: 'insurance',
    },

    // ── Social Media (open APIs) ──
    // Farcaster: decentralized social on Ethereum — fully open API, no auth
    farcaster_mention: {
        title: 'Farcaster Mention Trigger',
        condition: 'The cast text mentions GenLayer or contains the words genlayer or intelligent contract',
        url: 'https://api.pinata.cloud/v3/farcaster/casts?fid=239&pageSize=5',
        amount: '500',
        category: 'social',
    },
    // Reddit: public subreddit JSON — no auth needed (add .json to any subreddit)
    reddit_sentiment: {
        title: 'Reddit Crypto Sentiment Check',
        condition: 'The top post in the subreddit has a score (upvotes) greater than 1000',
        url: 'https://www.reddit.com/r/cryptocurrency/hot.json?limit=1',
        amount: '1000',
        category: 'social',
    },
    // GitHub discussions/releases: also social-adjacent
    github_release: {
        title: 'New GitHub Release Trigger',
        condition: 'The latest release tag_name exists and is not empty (a new version was released)',
        url: 'https://api.github.com/repos/yeagerai/genlayer-studio/releases/latest',
        amount: '2000',
        category: 'github',
    },

    // ── Standard Flows ──
    flight:   {
        title: 'Flight In-Air Verification',
        condition: 'The ac array contains at least one aircraft where alt_baro is NOT the string "ground"',
        url: 'https://api.adsb.lol/v2/callsign/BAW112',
        amount: '200',
    },
    github:   {
        title: 'GenLayer Repo Verification',
        condition: 'The content mentions GenLayer or genlayer',
        url: 'https://raw.githubusercontent.com/yeagerai/genlayer-studio/main/README.md',
        amount: '1500',
    },
    delivery: {
        title: 'Package Delivery Confirmation',
        condition: 'The tracking status shows Delivered or the package has been delivered',
        url: 'https://www.ups.com/track?tracknum=1Z999AA10123456784&requester=ST/trackdetails',
        amount: '2499',
    },
    crypto:   {
        title: 'BTC Above $60k Payout',
        condition: 'The price of Bitcoin (BTC) is above 60000 USD',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
        amount: '500',
    },
};

document.querySelectorAll('.template-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        const t = templates[chip.dataset.template]; if (!t) return;
        $('f-title').value     = t.title;
        $('f-condition').value = t.condition;
        $('f-url').value       = t.url;
        $('f-amount').value    = t.amount;
        // Store category override for this template if set
        $('f-url').dataset.templateCategory = t.category || '';
        document.querySelectorAll('.template-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

$('create-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!GenLayerClient.getAccount()) { openWalletModal(); toast('Connect first', 'info'); return; }

    const title = $('f-title').value.trim();
    const condition = $('f-condition').value.trim();
    const url = $('f-url').value.trim();
    const payee = $('f-payee').value.trim() || '0x0000000000000000000000000000000000000000';
    const amount = $('f-amount').value || '0';
    const creator = $('f-creator').value.trim() || GenLayerClient.getAccount();

    const btn = $('form-submit-btn');
    btn.disabled = true;
    $('submit-icon').textContent = '⟳';
    $('submit-label').textContent = 'Submitting to chain…';

    try {
        const txHash = await GenLayerClient.createFlow(title, condition, url, payee, amount, creator);
        toast('Tx sent: ' + String(txHash).slice(0, 18) + '…', 'success');
        $('submit-label').textContent = 'Waiting for finalization…';

        await GenLayerClient.waitForTx(txHash, (status, attempt) => {
            $('submit-label').textContent = `${status}… (${attempt * 5}s)`;
        });

        await App.loadFlows(true);
        $('create-form').reset();
        document.querySelectorAll('.template-chip').forEach(c => c.classList.remove('active'));
        showView('dashboard');
        toast('🎉 Flow created on StudioNet!', 'success', 5000);
    } catch (err) {
        toast('Error: ' + err.message, 'error', 6000);
    } finally {
        btn.disabled = false;
        $('submit-icon').textContent = '⚡';
        $('submit-label').textContent = 'Create Flow';
    }
});

// ═══ WALLET MODAL ═══
function openWalletModal() { $('wallet-modal-overlay').classList.add('show'); }
function closeWalletModal() { $('wallet-modal-overlay').classList.remove('show'); }

function onWalletConnected(address) {
    const short = address.slice(0, 6) + '…' + address.slice(-4);
    $('connect-wallet-btn').innerHTML = `<span id="wallet-btn-icon">●</span><span id="wallet-btn-label">${short}</span>`;
    $('connect-wallet-btn').classList.add('connected');
    $('f-creator').value = address;
    closeWalletModal();
}

$('connect-wallet-btn').addEventListener('click', openWalletModal);
$('wallet-modal-close').addEventListener('click', closeWalletModal);
$('wallet-modal-overlay').addEventListener('click', e => { if (e.target === $('wallet-modal-overlay')) closeWalletModal(); });

$('metamask-btn').addEventListener('click', async () => {
    const btn = $('metamask-btn');
    btn.disabled = true;
    try {
        const address = await GenLayerClient.connectMetaMask();
        // Fill the input so user can see which address was picked
        $('addr-input').value = address;
        onWalletConnected(address);
        toast('MetaMask connected: ' + address.slice(0,8) + '…', 'success');
        await App.loadFlows(true);
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        btn.disabled = false;
    }
});

$('wallet-connect-btn').addEventListener('click', async () => {
    const addr = $('addr-input').value.trim();
    if (!addr || !addr.startsWith('0x') || addr.length < 10) {
        toast('Enter a valid 0x address', 'error');
        return;
    }
    try {
        GenLayerClient.connectAddress(addr);
        onWalletConnected(addr);
        toast('Connected as ' + addr.slice(0,8) + '…', 'success');
        await App.loadFlows(true);
    } catch (err) {
        toast(err.message, 'error');
    }
});

// Handle MetaMask account changes
window.addEventListener('genflow:account', e => {
    if (e.detail) onWalletConnected(e.detail);
});

// ═══ NAV ═══
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    showView(l.dataset.view);
    if (l.dataset.view === 'dashboard') App.loadFlows(true);
}));
$('hero-create-btn').addEventListener('click', () => showView('create'));
$('hero-browse-btn').addEventListener('click', () => { showView('dashboard'); document.querySelector('.flows-section')?.scrollIntoView({behavior:'smooth'}); });
$('refresh-btn').addEventListener('click', () => App.loadFlows());
$('form-back-btn').addEventListener('click', () => showView('dashboard'));
$('modal-close-btn').addEventListener('click', closeModal);
$('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) closeModal(); });

// ═══ INIT ═══
(async () => {
    // Load flows publicly (no account needed for reads)
    await App.loadFlows(true);
    // Prompt wallet after short delay
    setTimeout(() => openWalletModal(), 800);
})();
