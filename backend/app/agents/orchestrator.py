import uuid
import logging
from datetime import datetime
from bson import ObjectId
from langgraph.graph import StateGraph, END

from app.agents.state import AgentState
from app.agents.scanner import ScannerAgent
from app.agents.strategy import StrategyAgent
from app.agents.risk import RiskOfficerAgent
from app.agents.execution import ExecutionAgent
from app.agents.reflection import ReflectionAgent
from app.core.resilience import check_market_status
from app.core.database import db

logger = logging.getLogger(__name__)

class TradingOrchestrator:
    """Orchestrates the 5-agent lifecycle graph with market status checks and state reconciliation."""

    def __init__(self):
        self.scanner = ScannerAgent()
        self.strategy = StrategyAgent()
        self.risk_officer = RiskOfficerAgent()
        self.execution = ExecutionAgent()
        self.reflection = ReflectionAgent()
        self.graph = self._build_graph()

    def _build_graph(self):
        """Construct the LangGraph workflow layout."""
        workflow = StateGraph(AgentState)

        # Register nodes
        workflow.add_node("scanner", self.scanner.run)
        workflow.add_node("strategy", self.strategy.run)
        workflow.add_node("risk_officer", self.risk_officer.run)
        workflow.add_node("execution", self.execution.run)
        workflow.add_node("reflection", self.reflection.run)

        # Wire edges
        workflow.add_edge("scanner", "strategy")
        workflow.add_edge("strategy", "risk_officer")
        workflow.add_edge("risk_officer", "execution")
        workflow.add_edge("execution", "reflection")
        workflow.add_edge("reflection", END)

        workflow.set_entry_point("scanner")
        return workflow.compile()

    async def run_trading_cycle(self, user_id: str, trading_account_id: str) -> dict:
        """Execute a full pipeline run, starting from the entry point, checking market hours first."""
        cycle_id = str(uuid.uuid4())

        # 1. Enforce Market Closed Gate
        try:
            market_clock = await check_market_status()
            if not market_clock.get("is_open", False):
                logger.info("Market closed. Skipping trading cycle gracefully.")

                # Log skipping event to Audit Trail
                if db.db is not None:
                    user_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else ObjectId()
                    await db.db.audit_trail.insert_one({
                        "timestamp": datetime.utcnow(),
                        "user_id": user_id_obj,
                        "event_type": "market_status_check",
                        "event_source": "system",
                        "status": "skipped",
                        "impact": "Cycle skipped",
                        "actor": "system",
                        "notes": "Market is closed. Trading cycle skipped gracefully."
                    })

                return {
                    "status": "skipped",
                    "reason": "Market is closed.",
                    "candidates": [],
                    "proposed_trades": [],
                    "approved_trades": [],
                    "rejected_trades": [],
                    "executed_orders": [],
                    "lessons_learned": [],
                    "decision_log": [{
                        "timestamp": datetime.utcnow(),
                        "agent": "system",
                        "status": "info",
                        "message": "Trading cycle skipped because markets are closed."
                    }],
                    "reflection_notes": "Trading cycle bypassed because markets are closed."
                }
        except Exception as e:
            logger.error(f"Error checking market status: {e}. Proceeding in simulation mode.")

        # Log cycle start in Audit Trail
        if db.db is not None:
            user_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else ObjectId()
            await db.db.audit_trail.insert_one({
                "timestamp": datetime.utcnow(),
                "user_id": user_id_obj,
                "event_type": "trading_cycle_started",
                "event_source": "system",
                "status": "success",
                "actor": "system",
                "notes": f"Cycle {cycle_id} successfully initiated."
            })

        initial_state: AgentState = {
            "timestamp": datetime.utcnow(),
            "user_id": user_id,
            "trading_account_id": trading_account_id,
            "cycle_id": cycle_id,
            "candidates": [],
            "proposed_trades": [],
            "approved_trades": [],
            "rejected_trades": [],
            "risk_checks": [],
            "executed_orders": [],
            "execution_errors": [],
            "reflection_notes": "",
            "lessons_learned": [],
            "decision_log": []
        }

        # Invoke compiled state machine graph
        final_state = await self.graph.ainvoke(initial_state)

        # Log cycle end in Audit Trail
        if db.db is not None:
            user_id_obj = ObjectId(user_id) if ObjectId.is_valid(user_id) else ObjectId()
            await db.db.audit_trail.insert_one({
                "timestamp": datetime.utcnow(),
                "user_id": user_id_obj,
                "event_type": "trading_cycle_completed",
                "event_source": "system",
                "status": "success",
                "actor": "system",
                "impact": f"Executed: {len(final_state['executed_orders'])}, Vetoed: {len(final_state['rejected_trades'])}",
                "notes": f"Cycle {cycle_id} successfully finished execution."
            })

        return final_state

    async def reconcile_positions_startup(self) -> int:
        """Startup reconciliation: reconcile local open positions with active broker state."""
        logger.info("Initializing system startup position reconciliation sweep...")
        if db.db is None:
            logger.warning("Database offline. Skipping position reconciliation.")
            return 0

        reconciled_count = 0
        try:
            from app.core.alpaca import get_alpaca_client
            from collections import defaultdict

            # Query all locally open positions
            cursor = db.db.positions.find({"status": "open"})
            open_local_positions = await cursor.to_list(100)

            # Group open positions by trading account
            positions_by_account = defaultdict(list)
            for pos in open_local_positions:
                acc_id = str(pos.get("trading_account_id", ""))
                if acc_id:
                    positions_by_account[acc_id].append(pos)

            for acc_id, pos_list in positions_by_account.items():
                trading_client = await get_alpaca_client(acc_id)
                if trading_client is None:
                    continue

                try:
                    alpaca_positions = trading_client.get_all_positions()
                    active_broker_symbols = [p.symbol for p in alpaca_positions]
                except Exception:
                    continue

                for pos in pos_list:
                    symbol = pos["symbol"]
                    if symbol not in active_broker_symbols:
                        # Reconcile closed position locally
                        await db.db.positions.update_one(
                            {"_id": pos["_id"]},
                            {
                                "$set": {
                                    "status": "closed",
                                    "exit_timestamp": datetime.utcnow(),
                                    "exit_reason": "System startup reconciliation",
                                    "close_message": "Position closed on broker while system was offline. Reconciled state.",
                                    "realized_pnl": 0.0,
                                    "pnl_percent": 0.0,
                                    "weights_processed": True
                                }
                            }
                        )

                        # Log reconciliation event to Audit Trail
                        await db.db.audit_trail.insert_one({
                            "timestamp": datetime.utcnow(),
                            "user_id": pos["user_id"],
                            "event_type": "position_reconciliation",
                            "event_source": "system",
                            "status": "success",
                            "actor": "system",
                            "impact": f"Closed position {pos['_id']} locally",
                            "notes": f"Reconciled state for {symbol}: Position marked closed offline."
                        })

                        reconciled_count += 1
                        logger.info(f"Reconciled position for {symbol}: Position marked closed offline.")
        except Exception as e:
            logger.error(f"Error during startup reconciliation sweep: {e}")

        logger.info(f"Startup reconciliation complete. Reconciled positions: {reconciled_count}")
        return reconciled_count
