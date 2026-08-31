import logging
from datetime import datetime
from bson import ObjectId
from app.agents.state import AgentState
from app.core.database import db
from app.core.alpaca import get_alpaca_client, place_limit_order

try:
    from alpaca.trading.enums import OrderSide, TimeInForce
except ImportError:
    OrderSide = None
    TimeInForce = None

# ---------------------------------------------------------------------------
# MCP client import (graceful degradation)
# ---------------------------------------------------------------------------
try:
    from app.mcp.client import MCPAlpacaClient

    MCP_CLIENT_AVAILABLE = True
except ImportError:
    MCP_CLIENT_AVAILABLE = False

logger = logging.getLogger(__name__)


class ExecutionAgent:
    """Submits multi-leg orders to Alpaca and records filled positions in MongoDB."""

    async def run(self, state: AgentState) -> AgentState:
        approved_trades = state.get("approved_trades", [])
        state["executed_orders"] = []
        state["execution_errors"] = []

        if not approved_trades:
            return state

        # ------------------------------------------------------------------
        # Try MCP client first, fall back to direct alpaca-py
        # ------------------------------------------------------------------
        mcp_client = None
        direct_client = None
        use_mcp = False

        if MCP_CLIENT_AVAILABLE:
            try:
                mcp_client = MCPAlpacaClient()
                await mcp_client.connect()
                use_mcp = True
                logger.info("Using MCP client for order execution.")
            except Exception as e:
                logger.warning("MCP client unavailable, falling back to direct alpaca-py: %s", e)
                try:
                    await mcp_client.close()
                except Exception:
                    pass
                mcp_client = None

        if not use_mcp:
            try:
                direct_client = await get_alpaca_client(state["trading_account_id"])
            except Exception as e:
                logger.warning("Could not initialise Alpaca client: %s", e)
                direct_client = None
            if direct_client is None:
                err_msg = "Alpaca client unavailable — recording approved trades without broker execution."
                logger.warning(err_msg)
                for trade in approved_trades:
                    symbol = trade["symbol"]
                    net_credit = float(trade.get("net_credit", 0.0))
                    max_profit = net_credit * 100.0
                    max_loss = float(trade.get("max_loss", 0.0)) * 100.0
                    state["executed_orders"].append({
                        "position_id": "demo",
                        "symbol": symbol,
                        "strategy": trade["strategy_type"],
                        "net_credit": net_credit,
                        "max_profit": max_profit,
                        "max_loss": max_loss,
                        "profit_target": max_profit * 0.75,
                        "stop_loss": max_loss,
                        "legs_filled": [],
                        "all_filled": False,
                        "timestamp": datetime.utcnow(),
                        "demo_mode": True,
                    })
                    state["decision_log"].append({
                        "timestamp": datetime.utcnow(),
                        "agent": "execution",
                        "status": "demo",
                        "symbol": symbol,
                        "output": f"Demo mode: {trade['strategy_type']} recorded but not sent to broker.",
                        "message": f"Demo: {trade['strategy_type']} on {symbol} at net credit ${net_credit:.2f}.",
                    })
                return state

        try:
            for trade in approved_trades:
                symbol = trade["symbol"]
                legs = trade["legs"]

                # Calculate position management thresholds (assuming 1 contract, size multiplier 100)
                net_credit = float(trade.get("net_credit", 0.0))
                max_profit = net_credit * 100.0
                max_loss = float(trade.get("max_loss", 0.0)) * 100.0

                profit_target = max_profit * 0.75
                stop_loss = max_loss

                # --- Submit each leg as a real Alpaca limit order ---
                executed_legs = []
                all_filled = True

                for leg in legs:
                    is_short = "short" in leg["type"]
                    side_str = "sell" if is_short else "buy"
                    limit_price = str(leg["bid"]) if is_short else str(leg["ask"])

                    try:
                        if use_mcp and mcp_client is not None:
                            order_result = await mcp_client.submit_order(
                                symbol=symbol,
                                qty=1,
                                side=side_str,
                                order_type="limit",
                                limit_price=limit_price,
                                time_in_force="day",
                            )
                        else:
                            side = OrderSide.SELL if is_short else OrderSide.BUY
                            order_result = place_limit_order(
                                client=direct_client,
                                symbol=symbol,
                                qty=1,
                                side=side,
                                limit_price=limit_price,
                                time_in_force=TimeInForce.DAY,
                            )
                        status = order_result.get("status", "unknown")

                        if status == "partially_filled":
                            logger.warning(
                                "Partial fill detected on %s leg. Will require manual reconciliation.",
                                symbol,
                            )
                            state["decision_log"].append({
                                "timestamp": datetime.utcnow(),
                                "agent": "execution",
                                "status": "warning",
                                "symbol": symbol,
                                "notes": f"Leg partially filled. Filled qty: {order_result.get('filled_qty', 'unknown')}/1",
                            })

                        executed_legs.append({
                            "alpaca_order_id": order_result.get("alpaca_order_id"),
                            "symbol": symbol,
                            "leg_type": leg["type"],
                            "strike": leg["strike"],
                            "side": order_result.get("side"),
                            "qty": 1,
                            "filled_qty": order_result.get("filled_qty", 0),
                            "limit_price": limit_price,
                            "status": status,
                            "filled_avg_price": order_result.get("filled_avg_price"),
                        })

                        if status not in ("filled", "partially_filled", "accepted", "new"):
                            all_filled = False

                    except Exception as e:
                        err_msg = f"Alpaca order failed for {symbol} ({leg['type']}): {e}"
                        logger.error(err_msg)
                        state["execution_errors"].append(err_msg)
                        all_filled = False

                        # Log rejection to audit trail
                        if db.db is not None:
                            user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                            await db.db.audit_trail.insert_one({
                                "timestamp": datetime.utcnow(),
                                "user_id": user_id_obj,
                                "event_type": "order_rejected",
                                "event_source": "execution_agent",
                                "status": "failure",
                                "actor": "execution_agent",
                                "notes": err_msg,
                            })

                        state["decision_log"].append({
                            "timestamp": datetime.utcnow(),
                            "agent": "execution",
                            "status": "failed",
                            "symbol": symbol,
                            "error": err_msg,
                        })

                # --- Save position document to MongoDB ---
                trade_position_id = None
                if db.db is not None:
                    try:
                        user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                        account_id_obj = ObjectId(state["trading_account_id"]) if ObjectId.is_valid(state["trading_account_id"]) else ObjectId()
                        position_doc = {
                            "user_id": user_id_obj,
                            "trading_account_id": account_id_obj,
                            "symbol": symbol,
                            "strategy_type": trade["strategy_type"],
                            "entry_timestamp": datetime.utcnow(),
                            "entry_price": net_credit,
                            "entry_greeks": trade.get("greeks", {}),
                            "greeks": trade.get("greeks", {}),
                            "max_profit": max_profit,
                            "max_loss": max_loss,
                            "profit_target": profit_target,
                            "stop_loss": stop_loss,
                            "status": "open",
                            "realized_pnl": 0.0,
                            "unrealized_pnl": 0.0,
                            "legs": executed_legs,
                            "days_held": 0,
                        }
                        result = await db.db.positions.insert_one(position_doc)
                        trade_position_id = str(result.inserted_id)

                        await db.db.audit_trail.insert_one({
                            "timestamp": datetime.utcnow(),
                            "user_id": user_id_obj,
                            "event_type": "position_opened",
                            "event_source": "execution_agent",
                            "status": "success",
                            "actor": "execution_agent",
                            "impact": f"Position opened: ${max_loss:.2f} at risk",
                            "notes": f"Opened {trade['strategy_type']} on {symbol} with net credit ${net_credit:.2f}.",
                        })
                    except Exception as e:
                        logger.error("Error saving position to MongoDB: %s", e)
                        state["execution_errors"].append(str(e))

                state["executed_orders"].append({
                    "position_id": trade_position_id or "unknown",
                    "symbol": symbol,
                    "strategy": trade["strategy_type"],
                    "net_credit": net_credit,
                    "max_profit": max_profit,
                    "max_loss": max_loss,
                    "profit_target": profit_target,
                    "stop_loss": stop_loss,
                    "legs_filled": executed_legs,
                    "all_filled": all_filled,
                    "timestamp": datetime.utcnow(),
                })

                status_msg = "filled" if all_filled else "partially filled / errors"
                state["decision_log"].append({
                    "timestamp": datetime.utcnow(),
                    "agent": "execution",
                    "status": "success" if all_filled else "partial",
                    "symbol": symbol,
                    "output": f"Submitted {len(executed_legs)} leg(s) to Alpaca. Status: {status_msg}.",
                    "message": f"Executed {trade['strategy_type']} on {symbol} at net credit ${net_credit:.2f}.",
                })

        finally:
            if mcp_client is not None:
                try:
                    await mcp_client.close()
                except Exception:
                    pass

        return state
