import logging
from datetime import datetime
from bson import ObjectId
from app.agents.state import AgentState
from app.core.database import db

# ---------------------------------------------------------------------------
# MCP client import (graceful degradation)
# ---------------------------------------------------------------------------
try:
    from app.mcp.client import MCPAlpacaClient

    MCP_CLIENT_AVAILABLE = True
except ImportError:
    MCP_CLIENT_AVAILABLE = False

# ---------------------------------------------------------------------------
# Direct Alpaca SDK fallback import
# ---------------------------------------------------------------------------
try:
    from app.core.alpaca import get_alpaca_client, get_account as direct_get_account

    DIRECT_ALPACA_AVAILABLE = True
except ImportError:
    DIRECT_ALPACA_AVAILABLE = False

logger = logging.getLogger(__name__)

class RiskOfficerAgent:
    """Evaluates proposed trades against strict per-trade and portfolio-level risk and Greek limits."""

    async def run(self, state: AgentState) -> AgentState:
        proposed_trades = state.get("proposed_trades", [])
        state["approved_trades"] = []
        state["rejected_trades"] = []
        state["risk_checks"] = []

        if not proposed_trades:
            return state

        # 1. Load User Preferences (Greeks and risk limits)
        prefs = {
            "max_risk_per_trade": 0.02, # 2% default limit
            "portfolio_heat_limit": 0.50, # 50% default limit
            "max_trade_delta": 0.30,
            "max_trade_gamma": 0.15,
            "max_trade_vega": 0.25,
            "min_trade_theta": 0.05,
            "max_portfolio_delta": 0.50,
            "max_portfolio_gamma": 0.30,
            "max_portfolio_vega": 0.40
        }

        user_id_str = state.get("user_id")
        if db.db is not None and user_id_str:
            try:
                user_id_obj = ObjectId(user_id_str) if ObjectId.is_valid(user_id_str) else ObjectId()
                user_doc = await db.db.users.find_one({"_id": user_id_obj})
                if user_doc and "preferences" in user_doc:
                    prefs.update(user_doc["preferences"])
            except Exception as e:
                logger.error(f"Error loading user preferences: {e}")

        # 2. Fetch Open Positions from MongoDB to calculate current Greeks and Heat
        current_heat_loss = 0.0
        current_port_delta = 0.0
        current_port_gamma = 0.0
        current_port_vega = 0.0

        open_positions = []
        if db.db is not None and user_id_str:
            try:
                user_id_obj = ObjectId(user_id_str) if ObjectId.is_valid(user_id_str) else ObjectId()
                cursor = db.db.positions.find({
                    "user_id": user_id_obj,
                    "status": "open"
                })
                async for pos in cursor:
                    open_positions.append(pos)
                    current_heat_loss += float(pos.get("max_loss", 0.0))
                    greeks = pos.get("greeks", {})
                    current_port_delta += float(greeks.get("delta", 0.0))
                    current_port_gamma += float(greeks.get("gamma", 0.0))
                    current_port_vega += float(greeks.get("vega", 0.0))
            except Exception as e:
                logger.error(f"Error fetching open positions: {e}")

        # Fetch real account equity — try MCP first, then direct Alpaca, then DB
        account_equity = 100000.00  # ultimate fallback
        buying_power = None

        # 1. Try MCP client
        if MCP_CLIENT_AVAILABLE:
            try:
                mcp_client = MCPAlpacaClient()
                await mcp_client.connect()
                try:
                    acct = await mcp_client.get_account()
                    if "error" not in acct:
                        account_equity = float(acct.get("equity", account_equity))
                        buying_power = float(acct.get("buying_power", 0))
                        logger.info("Fetched real equity via MCP: $%.2f", account_equity)
                finally:
                    await mcp_client.close()
            except Exception as e:
                logger.warning("MCP equity fetch failed, trying direct Alpaca: %s", e)

        # 2. Try direct Alpaca SDK
        if account_equity == 100000.00 and DIRECT_ALPACA_AVAILABLE:
            try:
                client = await get_alpaca_client(state.get("trading_account_id"))
                if client is not None:
                    acct = direct_get_account(client)
                    if "error" not in acct:
                        account_equity = float(acct.get("equity", account_equity))
                        buying_power = float(acct.get("buying_power", 0))
                        logger.info("Fetched real equity via direct Alpaca: $%.2f", account_equity)
            except Exception as e:
                logger.warning("Direct Alpaca equity fetch failed, falling back to DB: %s", e)

        # 3. Fall back to stored DB value
        if account_equity == 100000.00 and db.db is not None:
            try:
                trading_account = await db.db.trading_accounts.find_one(
                    {"_id": ObjectId(state["trading_account_id"])}
                ) if ObjectId.is_valid(state["trading_account_id"]) else None
                if trading_account:
                    account_equity = float(trading_account.get("equity", account_equity))
                    buying_power = trading_account.get("buying_power", buying_power)
            except Exception as e:
                logger.error("DB equity fetch failed: %s", e)

        max_loss_allowed = account_equity * prefs["max_risk_per_trade"]

        for idx, trade in enumerate(proposed_trades):
            symbol = trade["symbol"]
            max_loss = float(trade["max_loss"]) * 100.0 # scale premium width
            
            # Check 1: Max Risk Per Trade
            risk_percent = max_loss / account_equity
            if risk_percent > prefs["max_risk_per_trade"]:
                veto_msg = f"Trade rejected: max_loss of ${max_loss:.2f} exceeds {prefs['max_risk_per_trade']:.1%} of account equity (${account_equity:.2f}). Limit is ${max_loss_allowed:.2f}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue

            # Check 2: Per-Trade Greeks Checks
            greeks = trade.get("greeks", {})
            trade_delta = abs(float(greeks.get("delta", 0.0)))
            trade_gamma = abs(float(greeks.get("gamma", 0.0)))
            trade_vega = abs(float(greeks.get("vega", 0.0)))
            trade_theta = float(greeks.get("theta", 0.0))

            if trade_delta > prefs["max_trade_delta"]:
                veto_msg = f"Trade rejected: Delta of {trade_delta} exceeds per-trade limit of {prefs['max_trade_delta']}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue
            if trade_gamma > prefs["max_trade_gamma"]:
                veto_msg = f"Trade rejected: Gamma of {trade_gamma} exceeds per-trade limit of {prefs['max_trade_gamma']}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue
            if trade_vega > prefs["max_trade_vega"]:
                veto_msg = f"Trade rejected: Vega of {trade_vega} exceeds per-trade limit of {prefs['max_trade_vega']}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue
            if trade_theta <= prefs["min_trade_theta"]:
                veto_msg = f"Trade rejected: Theta of {trade_theta} is below positive theta decay limit of {prefs['min_trade_theta']}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue

            # Check 3: Aggregate Portfolio Greeks Checks
            post_port_delta = abs(current_port_delta + float(greeks.get("delta", 0.0)))
            post_port_gamma = abs(current_port_gamma + float(greeks.get("gamma", 0.0)))
            post_port_vega = abs(current_port_vega + float(greeks.get("vega", 0.0)))

            if post_port_delta > prefs["max_portfolio_delta"]:
                veto_msg = f"Trade rejected: Post-trade portfolio Delta would be {post_port_delta}, exceeds limit of {prefs['max_portfolio_delta']}. Current is {current_port_delta}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue
            if post_port_gamma > prefs["max_portfolio_gamma"]:
                veto_msg = f"Trade rejected: Post-trade portfolio Gamma would be {post_port_gamma}, exceeds limit of {prefs['max_portfolio_gamma']}. Current is {current_port_gamma}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue
            if post_port_vega > prefs["max_portfolio_vega"]:
                veto_msg = f"Trade rejected: Post-trade portfolio Vega would be {post_port_vega}, exceeds limit of {prefs['max_portfolio_vega']}. Current is {current_port_vega}."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue

            # Check 4: Cash at Risk (Portfolio Heat)
            post_heat_loss = current_heat_loss + max_loss
            post_heat_percent = post_heat_loss / account_equity
            if post_heat_percent > prefs["portfolio_heat_limit"]:
                veto_msg = f"Trade rejected: Post-trade portfolio heat would be {post_heat_percent:.1%}, exceeds limit of {prefs['portfolio_heat_limit']:.1%}. Current portfolio heat: {current_heat_loss / account_equity:.1%} (${current_heat_loss:.2f})."
                await self._reject_trade(state, trade, veto_msg, idx)
                continue

            # If all checks pass
            state["approved_trades"].append(trade)
            check_record = {
                "trade_index": idx,
                "symbol": symbol,
                "decision": "APPROVE",
                "reason": "All strict risk management checks and Greek limits successfully passed."
            }
            state["risk_checks"].append(check_record)
            state["decision_log"].append({
                "timestamp": datetime.utcnow(),
                "agent": "risk_officer",
                "status": "info",
                "message": f"Approved {symbol} trade: Max loss ${max_loss:.2f} is within limit."
            })
            
            # Log approval to audit trail
            if db.db is not None:
                user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                await db.db.audit_trail.insert_one({
                    "timestamp": datetime.utcnow(),
                    "user_id": user_id_obj,
                    "event_type": "agent_decision",
                    "event_source": "risk_officer",
                    "status": "success",
                    "actor": "risk_officer",
                    "notes": f"Approved trade option for {symbol}. Premium max loss ${max_loss:.2f} complies with Greek safety boundaries."
                })

        state["decision_log"].append({
            "timestamp": datetime.utcnow(),
            "agent": "risk_officer",
            "status": "success",
            "approved": len(state["approved_trades"]),
            "rejected": len(state["rejected_trades"])
        })
        return state

    async def _reject_trade(self, state: AgentState, trade: dict, veto_msg: str, idx: int):
        trade_copy = trade.copy()
        trade_copy["veto_reason"] = veto_msg
        state["rejected_trades"].append(trade_copy)
        
        check_record = {
            "trade_index": idx,
            "symbol": trade["symbol"],
            "decision": "VETO",
            "reason": veto_msg
        }
        state["risk_checks"].append(check_record)
        state["decision_log"].append({
            "timestamp": datetime.utcnow(),
            "agent": "risk_officer",
            "status": "veto",
            "message": veto_msg
        })

        # Log rejection/veto to audit trail
        if db.db is not None:
            user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
            await db.db.audit_trail.insert_one({
                "timestamp": datetime.utcnow(),
                "user_id": user_id_obj,
                "event_type": "agent_decision",
                "event_source": "risk_officer",
                "status": "warning",
                "actor": "risk_officer",
                "notes": f"Vetoed trade proposal for {trade['symbol']}: {veto_msg}"
            })
