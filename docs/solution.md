# The Solution: OptionFlow Sentinel

OptionFlow Sentinel is a production-grade, multi-tenant AI trading system that autonomously scans, strategizes, vets, and executes multi-leg options strategies on behalf of users.

### 1. Autonomous Agent Pipeline (LangGraph + NVIDIA Llama 3.1 70B)
Instead of a single black-box LLM prompt, Sentinel utilizes a synchronous 5-agent debate graph:
*   **Scanner Agent:** Ingests live market data and uses the **Alpaca MCP Server** to fetch real-time news, identifying volatility mispricings.
*   **Strategy Agent:** Formulates complex multi-leg options profiles to capitalize on the Scanner's findings.
*   **Risk Officer (The Veto Gate):** Mathematically evaluates the strategy against the user's hard account equity limits. It strictly vetoes any dangerous trades.
*   **Execution Agent:** Converts approved strategies into live `LimitOrderRequest` payloads and routes them to the exchange.
*   **Reflection Agent:** Analyzes the outcomes of closed trades to adjust strategy weights for future cycles.

### 2. Emotionless Auto-Management (Celery)
Once a trade is live, Sentinel's background workers take over. They constantly poll real-time P&L from the Alpaca API. If a trade hits a predefined Profit Target or Stop Loss, the system instantly fires closing orders, removing all emotional hesitation.

### 3. Military-Grade Security
Users link their Alpaca API keys via the React Dashboard. The FastAPI backend symmetrically encrypts these credentials using 256-bit Fernet cryptography and stores them in MongoDB. The keys are only dynamically decrypted in-memory at the exact millisecond a trade is executed.

### 4. Transparent Explainability
The React frontend doesn't just show a P&L curve. It provides a live **Audit Trail** and a **Multi-Agent Debate Accordion** for every single position, allowing users to literally read the AI's internal monologue and understand exactly *why* a trade was taken or vetoed.
