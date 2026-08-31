# OptionFlow Sentinel

An autonomous AI trading system that scans, strategizes, vets, and executes multi-leg options strategies using a 5-agent pipeline — built on LangGraph, NVIDIA Llama 3.1 70B, and Alpaca live trading.

---

## Problem Statement

Retail options trading has exploded in popularity, but the tools available to retail investors have fundamentally failed to keep pace with institutional capabilities.

**1. The Complexity Barrier**
Trading multi-leg options strategies (Iron Condors, Butterfly Spreads, Calendar Spreads) requires deep knowledge of Greeks (Delta, Gamma, Theta, Vega) and implied volatility crush. Most retail traders enter these trades blindly without mathematically sound entry/exit points.

**2. The Lack of Risk Management**
Emotions drive retail trading. When a position moves against them, traders freeze or "hope" it bounces back, blowing past logical stop-loss limits and devastating their account equity.

**3. The Context Deficit**
Institutional traders have armies of quants and real-time news terminals parsing market sentiment. Retail traders are reacting to lagging indicators and Reddit threads.

Retail traders don't need another charting platform. They need an autonomous AI risk officer and execution engine that removes emotion and trades strictly on probability.

---

## Proposed Solution

OptionFlow Sentinel is a production-grade, multi-tenant AI trading system that autonomously scans, strategizes, vets, and executes multi-leg options strategies on behalf of users.

### 5-Agent Pipeline (LangGraph + NVIDIA Llama 3.1 70B)

A synchronous debate graph where each agent has a specific role:

| Agent | Role |
|---|---|
| **Scanner Agent** | Ingests live market data, fetches real-time news via Alpaca MCP Server, identifies volatility mispricings |
| **Strategy Agent** | Formulates complex multi-leg options profiles based on the Scanner's findings |
| **Risk Officer** | Mathematically evaluates strategies against hard account equity limits. Veto gate for dangerous trades |
| **Execution Agent** | Converts approved strategies into live `LimitOrderRequest` payloads and routes them to the exchange |
| **Reflection Agent** | Analyzes closed trade outcomes, adjusts strategy weights for future cycles |

### Key Features

- **Emotionless Auto-Management** — Background workers poll real-time P&L from Alpaca. Trades auto-close at predefined Profit Targets and Stop Losses.
- **Military-Grade Security** — Alpaca API keys are symmetrically encrypted with 256-bit Fernet cryptography and stored in MongoDB. Decrypted only in-memory at the millisecond a trade executes.
- **Transparent Explainability** — Live Audit Trail and Multi-Agent Debate Accordion for every position. Read the AI's internal monologue for why a trade was taken or vetoed.
- **Real-time Dashboard** — Live P&L equity curves, Greeks exposure, risk vetoes, decision trail, and strategy weights — all updating every 5 seconds.

---

## File Structure

```
optionflow-sentinel/
├── backend/                          # Python FastAPI backend
│   ├── app/
│   │   ├── agents/                   # 5-agent LangGraph pipeline
│   │   │   ├── execution.py          #   Order execution via Alpaca
│   │   │   ├── orchestrator.py       #   Pipeline coordinator + reconciliation
│   │   │   ├── reflection.py         #   Post-trade analysis
│   │   │   ├── risk.py               #   Risk vetoes + equity limits
│   │   │   ├── scanner.py            #   Market data + news scanning
│   │   │   ├── state.py              #   Shared agent state
│   │   │   └── strategy.py           #   Multi-leg strategy formulation
│   │   ├── api/
│   │   │   ├── auth.py               # JWT auth, API keys, register/login
│   │   │   └── trading.py            # 18 trading endpoints (positions, orders, live data)
│   │   ├── core/
│   │   │   ├── alpaca.py             # Alpaca client with encrypted credential lookup
│   │   │   ├── config.py             # Pydantic settings (env vars)
│   │   │   ├── database.py           # MongoDB connection + seeding
│   │   │   ├── llm.py                # NVIDIA LLM integration
│   │   │   ├── resilience.py         # Circuit breaker, retry, rate limiting
│   │   │   └── security.py           # Fernet encryption, JWT tokens, API key hashing
│   │   ├── mcp/
│   │   │   ├── client.py             # MCP client with graceful fallback
│   │   │   └── server.py             # Alpaca MCP Server (7 tools via stdio)
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic schemas
│   │   ├── main.py                   # FastAPI app, lifespan, CORS, health checks
│   │   └── worker.py                 # Celery workers (position monitoring, P&L)
│   ├── cli.py                        # CLI tool (status, positions, orders, kill-switch)
│   ├── tests/                        # Unit tests
│   ├── Dockerfile                    # Docker image for Render/Railway
│   ├── render.yaml                   # Render blueprint
│   ├── requirements.txt              # Python dependencies
│   └── docker-compose.yml            # Full local stack (MongoDB, Redis, FastAPI)
│
├── src/                              # React frontend
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx         # Live dashboard (equity, Greeks, vetoes, decisions)
│   │   ├── 3d/
│   │   │   └── HeroScene.tsx         # Three.js hero animation
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── sections/                 # Landing page sections
│   │   └── ui/                       # Reusable UI components
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── docs/                             # Documentation
│   ├── problem.md
│   ├── solution.md
│   ├── architecture.md
│   ├── setup.md
│   └── deployment.md
│
├── package.json                      # Node.js dependencies
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Local Setup

### Prerequisites

- Node.js v18+
- Python 3.10+
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379` (optional, for Celery workers)
- Alpaca paper trading account (free at https://alpaca.markets)
- NVIDIA API key (for LLM inference)

### 1. Clone and Install

```bash
git clone https://github.com/krrish2803/optionflow-sentinel.git
cd optionflow-sentinel
```

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd ..
npm install
```

### 2. Configure Environment Variables

Create `backend/.env`:
```env
JWT_SECRET_KEY=any-random-secret-string-here
ENCRYPTION_KEY=any-random-32-char-string-here
ALPACA_API_KEY=your_alpaca_api_key
ALPACA_SECRET_KEY=your_alpaca_secret_key
NVIDIA_API_KEY=nvapi-your_nvidia_key
MONGODB_URL=mongodb://localhost:27017
```

### 3. Start MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Or Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 4. Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

### 5. Start Frontend

```bash
npm run dev
```

Open http://localhost:5173

---

## How to Use

1. **Register** — Create an account on the login page
2. **Connect Alpaca** — Enter your paper trading API keys in Settings
3. **Run a Cycle** — Click "Run Cycle" to trigger the 5-agent pipeline
4. **Monitor** — Watch the live dashboard update every 5 seconds:
   - **Overview** — Equity curve, unrealized P&L, market status
   - **Greeks** — Portfolio delta/gamma/vega/theta exposure
   - **Audit** — Risk vetoes with reasons and rule violations
   - **Decision Trail** — Agent-colored pipeline flow per cycle
   - **Reflection** — Strategy weight adjustments and lessons learned
5. **Ask Sentinel** — Type natural language queries about your portfolio

### CLI Usage

```bash
cd backend
python3 cli.py status          # System health
python3 cli.py account         # Alpaca account info
python3 cli.py positions       # Open positions
python3 cli.py orders          # Recent orders
python3 cli.py clock           # Market hours
python3 cli.py kill-switch     # Emergency: close all positions
python3 cli.py audit           # Audit trail
python3 cli.py cycles          # Cycle history
```

---

## Deployment

### Render (Recommended)

1. Push to GitHub
2. Render Dashboard → New → Blueprint → connect repo
3. Render detects `backend/render.yaml` automatically
4. Set env vars: `MONGODB_URL` (MongoDB Atlas), `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`, `NVIDIA_API_KEY`
5. Deploy

### Docker

```bash
cd backend
docker-compose up --build -d
```

Spins up MongoDB, Redis, Celery worker, and FastAPI in one command.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts, Three.js |
| Backend | FastAPI, Python 3.10 |
| Database | MongoDB (Motor async) |
| AI Pipeline | LangGraph, NVIDIA Llama 3.1 70B |
| Broker | Alpaca (paper trading) |
| MCP Server | Model Context Protocol (stdio) |
| Background Jobs | Celery + Redis |
| Security | Fernet encryption, JWT, bcrypt |

---

## License

MIT
