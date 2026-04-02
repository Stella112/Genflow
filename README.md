# ⚡ GenFlow — AI-Powered Programmable Escrow

**"Define a condition. AI verifies it. Funds release automatically."**

GenFlow is a programmable escrow protocol built on [GenLayer StudioNet](https://studio.genlayer.com). Anyone can create an escrow flow with a plain-English condition linked to any public URL — crypto prices, GitHub PRs, flight data, weather events, or Reddit posts. AI validators fetch the data, evaluate the condition, and trigger payouts automatically. No middlemen. No manual claims.

> **Live on StudioNet** — Contract: `0xc05A4011e072c34658Eb9a49EDFD5e2c938F9631`

---

## ✅ Verified Live Demos

| Flow | URL | Condition | Result |
|---|---|---|---|
| BTC Price Check | Binance API | BTC > $60,000 | ✅ TRIGGERED ($68,413) |
| GitHub PR Merge | GitHub filtered view | PR is merged | ✅ TRIGGERED |
| Earthquake Cover | USGS Feed | M5.0+ quake today | ✅ TRIGGERED (M7.8 Indonesia) |

---

## 🚀 How It Works

1. **Create a Flow** → Connect MetaMask, fill in a URL + condition in plain English
2. **AI Monitors** → Click "Run AI Verification" — GenLayer validators fetch the URL in real-time
3. **Consensus reached** → 5 independent AI validators agree (Optimistic Democracy)
4. **Payout triggers** → Contract state updates to `TRIGGERED`, funds marked for release

---

## 🧠 GenLayer Features Used

| Feature | How GenFlow Uses It |
|---|---|
| `gl.nondet.web.render(url)` | Fetches real-time data from any public URL |
| `gl.exec_prompt()` | AI evaluates the condition in plain English |
| `gl.eq_principle_prompt_comparative()` | 5 validators must reach consensus before triggering |
| Optimistic Democracy | Decentralized AI consensus — no single point of failure |

---

## 📂 Project Structure

```
genflow/
├── contracts/
│   └── genflow.py          # GenLayer Intelligent Contract (Python)
├── index.html              # Frontend — dashboard, create flow, wallet modal
├── style.css               # Premium dark terminal design
├── app.js                  # Flow logic, templates, MetaMask integration
├── genlayer-client.js      # StudioNet RPC client (read + MetaMask write)
└── README.md
```

---

## 🖥️ Running Locally

```bash
# Clone the repo
git clone https://github.com/Stella112/Genflow.git
cd Genflow

# Serve with Python
python -m http.server 5173

# Open in browser
# http://localhost:5173
```

Connect MetaMask → it will auto-switch to **GenLayer StudioNet (chain 61999)**.

---

## 🛠️ Creating Your Own Flow

1. Click **+ New Flow**
2. Choose a template or fill in manually:
   - **IF** → paste any public URL (API, webpage, raw file)
   - **AND** → describe the condition in plain English
   - **THEN** → set payee address + amount in GEN
3. Click **Create Flow** → MetaMask pops up → approve
4. Click **Run AI Verification** → watch validators check the URL live

---

## 🛡️ Template Library

| Category | Example | URL |
|---|---|---|
| ₿ Crypto | BTC above $60k | `api.binance.com` (Binance API) |
| ⬡ GitHub | PR merged / release shipped | `api.github.com` |
| 🛡 Insurance | Earthquake M5.0+ | `earthquake.usgs.gov` (USGS) |
| 🛡 Insurance | Rainfall > 10mm | `api.open-meteo.com` |
| ✈ Flight | Flight cancelled | `api.adsb.lol` (ADS-B Exchange) |
| 📦 Delivery | Package delivered | UPS / FedEx tracking page |
| 💬 Social | Reddit post score | Reddit `.json` API |

---

## 🏗️ Architecture

```
User (MetaMask) → Frontend → genlayer-js SDK
                                    │
                    ┌───────────────┴──────────────────┐
                    │ Reads: gen_call → StudioNet RPC   │
                    │ Writes: eth_sendTransaction       │
                    │         (signed by MetaMask)      │
                    └───────────────┬──────────────────┘
                                    │
                          GenLayer Consensus Contract
                                    │
                    ┌───────────────┴──────────────────┐
                    │  5 AI Validators                  │
                    │  gl.nondet.web.render(url)        │
                    │  gl.eq_principle_prompt()         │
                    │  → TRUE / FALSE                   │
                    └───────────────┬──────────────────┘
                                    │
                          Flow state: ACTIVE → TRIGGERED
```

---

## 📜 License

MIT License — Built for the GenLayer Hackathon 2026
