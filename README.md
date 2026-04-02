# ⚖️ Verdikta — The Internet's AI Arbitration Layer

**"Any dispute. Any evidence. AI consensus. Final verdict."**

Verdikta is a universal dispute resolution protocol built on [GenLayer](https://genlayer.com). It allows **anyone** — freelancers, online shoppers, friends with bets, DAOs, businesses — to open a case, submit evidence (URLs, text, screenshots), and have AI validators reach consensus on a fair verdict.

No lawyers. No waiting weeks. No centralized arbiters.

---

## 🚀 How It Works

1. **Open a Case** → Describe your dispute and provide evidence URLs
2. **Respondent Replies** → The other party submits counter-evidence
3. **AI Consensus** → Validators fetch web evidence, analyze both sides, reach consensus via GenLayer's Optimistic Democracy
4. **Final Verdict** → Immutable ruling stored on-chain with reasoning, confidence score, and recommendation

## 🧠 GenLayer Features Used

| Feature | How Verdikta Uses It |
|---|---|
| `gl.get_webpage()` | Fetches real-time evidence from any URL (product pages, status pages, news, social media) |
| `gl.exec_prompt()` | AI analyzes evidence and renders impartial judgment |
| `gl.eq_principle_prompt_comparative()` | Multiple validators must agree on the verdict — true consensus |
| Optimistic Democracy | Decentralized consensus ensures no single AI can dictate a ruling |

## 📂 Project Structure

```
genbradury/
├── contracts/
│   └── verdikta.py          # GenLayer Intelligent Contract
├── index.html                # Frontend entry point
├── style.css                 # Design system (legal-tech noir)
├── app.js                    # Application logic & demo mode
├── genlayer-client.js        # GenLayer RPC client
└── README.md                 # This file
```

## 🖥️ Running Locally

### Frontend (Demo Mode)
```bash
# Option 1: Use any static file server
npx -y serve .

# Option 2: Python
python -m http.server 8000

# Option 3: VS Code Live Server extension
```

The app starts in **Demo Mode** with 5 pre-loaded showcase cases. No blockchain connection required.

### Smart Contract (GenLayer Studio)

1. Open [GenLayer Studio](https://studio.genlayer.com)
2. Upload `contracts/verdikta.py`
3. Deploy the contract
4. Use the Studio UI to interact with the contract functions

### Smart Contract (Bradbury Testnet)

1. Install the GenLayer CLI: `pip install genlayer`
2. Deploy: `genlayer deploy contracts/verdikta.py --network bradbury`
3. Update `genlayer-client.js` with the contract address and switch to `testnet` network

## 🎯 Demo Scenarios

| Case | Category | Dispute |
|---|---|---|
| Logo Never Delivered | 💼 Freelance | Designer ghosted after $500 deposit |
| False Advertising | 🛒 E-Commerce | "100% Organic" product contains synthetics |
| World Cup Bet | 🎲 Bet | Friend won't pay $100 bet on Argentina |
| SLA Violation | ☁️ Service | Cloud provider broke 99.9% uptime guarantee |
| DAO Budget Misuse | 🏛️ DAO | Treasury spent without governance vote |

## 🏗️ Architecture

```
User → Frontend (HTML/CSS/JS) → GenLayer RPC → Intelligent Contract
                                                     ↓
                                         gl.get_webpage() → Evidence
                                         gl.exec_prompt() → AI Analysis
                                         gl.eq_principle() → Consensus
                                                     ↓
                                              Immutable Verdict
```

## 📜 License

MIT License — Built for the GenLayer Hackathon 2025
