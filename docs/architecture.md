# System Architecture

OptionFlow Sentinel is built on a highly resilient, modern, event-driven architecture.

### Frontend
*   **Framework:** React + Vite + TypeScript
*   **Styling:** Tailwind CSS (Fintech "Dark Mode" Theme)
*   **Data Vis:** Recharts (Live Equity Curves)
*   **Integration:** Polling-based hydration via JWT-authenticated REST endpoints.

### Backend
*   **API Framework:** FastAPI (Python)
*   **Database:** MongoDB (Motor Asyncio) - Non-blocking, schema-less document storage.
*   **AI Orchestration:** LangGraph (Stateful Multi-Agent Workflows).
*   **Inference Engine:** NVIDIA NIM APIs (`meta/llama-3.1-70b-instruct`).
*   **Background Workers:** Celery + Redis (P&L Polling, Backtesting).

### Trading & Data Execution
*   **Broker Integration:** `alpaca-py` SDK for live multi-leg order execution and P&L polling.
*   **Historical Backtesting:** Deep integration via subprocess execution of the official **Alpaca CLI**.
*   **Real-time Context:** Dynamic connection to the official **Alpaca MCP Server** (`stdio` / Node.js) for live news and corporate actions.
