import json
import logging
from datetime import datetime
from bson import ObjectId
from app.agents.state import AgentState
from app.core.llm import run_llm_inference
from app.core.database import db

logger = logging.getLogger(__name__)

class ReflectionAgent:
    """Logs decisions, extracts quantitative lessons, and updates strategy weights from closed trades."""

    async def run(self, state: AgentState) -> AgentState:
        decision_json = json.dumps(state["decision_log"], default=str)
        executed_json = json.dumps(state.get("executed_orders", []), default=str)
        rejected_json = json.dumps(state.get("rejected_trades", []), default=str)

        # 1. Update Strategy Weights from closed trades that haven't been processed yet
        processed_count = 0
        weight_updates_logged = []
        
        if db.db is not None:
            try:
                # Query closed positions that haven't been processed by the reflection agent
                user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                cursor = db.db.positions.find({
                    "user_id": user_id_obj,
                    "status": "closed",
                    "weights_processed": False
                })
                
                async for pos in cursor:
                    # Deduce signal type and strategy type
                    # In a production environment, the scanner signal type is stored in the position.
                    # We default to high_iv_rank if not specified.
                    signal_type = pos.get("signal_type", "high_iv_rank")
                    strategy_type = pos.get("strategy_type", "IRON_CONDOR")
                    realized_pnl = float(pos.get("realized_pnl", 0.0))
                    
                    is_win = realized_pnl > 0
                    
                    # Fetch current weights document
                    weight_doc = await db.db.strategy_weights.find_one({
                        "signal_type": signal_type,
                        "strategy_type": strategy_type
                    })
                    
                    if not weight_doc:
                        # Fallback insert if not found
                        weight_doc = {
                            "signal_type": signal_type,
                            "strategy_type": strategy_type,
                            "weight": 1.0,
                            "win_rate": 0.0,
                            "total_trades": 0,
                            "wins": 0
                        }
                    
                    wins = weight_doc.get("wins", 0)
                    total_trades = weight_doc.get("total_trades", 0) + 1
                    if is_win:
                        wins += 1
                    
                    win_rate = wins / total_trades
                    new_weight = float(weight_doc.get("weight", 1.0))
                    
                    # Safeguard: Do not change strategy weights based on fewer than 10 completed trades
                    if total_trades >= 10:
                        if win_rate > 0.70:
                            new_weight = min(1.5, new_weight + 0.1) # Max weight 1.5
                        elif win_rate < 0.50:
                            new_weight = max(0.5, new_weight - 0.1) # Min weight 0.5
                    
                    # Save updated weights
                    await db.db.strategy_weights.update_one(
                        {"signal_type": signal_type, "strategy_type": strategy_type},
                        {
                            "$set": {
                                "wins": wins,
                                "total_trades": total_trades,
                                "win_rate": win_rate,
                                "weight": new_weight
                            }
                        },
                        upsert=True
                    )
                    
                    # Log weight update to audit trail
                    await db.db.audit_trail.insert_one({
                        "timestamp": datetime.utcnow(),
                        "user_id": user_id_obj,
                        "event_type": "weight_updated",
                        "event_source": "reflection",
                        "status": "success",
                        "actor": "reflection",
                        "impact": f"Weight change for {signal_type}/{strategy_type} to {new_weight:.2f}",
                        "notes": f"Re-calculated win rate of {win_rate:.1%} over {total_trades} trades."
                    })
                    
                    # Mark the closed position as processed for strategy weights
                    await db.db.positions.update_one(
                        {"_id": pos["_id"]},
                        {"$set": {"weights_processed": True}}
                    )
                    
                    processed_count += 1
                    weight_updates_logged.append(
                        f"Processed closed trade {pos['_id']} ({pos.get('symbol', 'Spread')}). P&L: ${realized_pnl:.2f}. "
                        f"New Win Rate: {win_rate:.1%}, New Weight: {new_weight:.2f}."
                    )
            except Exception as e:
                logger.error(f"Error executing strategy weight updates: {e}")

        # 2. Invoke LLM for narrative reflection logs
        prompt = f"""
        You are the Reflection Agent for OptionFlow Sentinel.
        
        Review the completed trading run:
        - Executed: {executed_json}
        - Vetoed/Rejected: {rejected_json}
        - Decision Log: {decision_json}
        
        Formulate a reflection summary and extract lessons learned for subsequent cycles.
        
        Respond ONLY with a valid JSON document matching this structure:
        {{
          "reflection": "Options flow scanner correctly targeted high IV Rank indices...",
          "lessons": [
            "Theta decay metrics are highly favorable",
            "Scanner remains robust in tracking indices"
          ],
          "metrics": {{
            "signal_quality": "good",
            "risk_management": "passed",
            "execution_quality": "passed"
          }}
        }}
        """

        result_text = await run_llm_inference(prompt)

        try:
            reflection = json.loads(result_text)
            state["reflection_notes"] = reflection.get("reflection", "")
            state["lessons_learned"] = reflection.get("lessons", [])
            
            # Save reflection to DB
            if db.db is not None:
                user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                account_id_obj = ObjectId(state["trading_account_id"]) if ObjectId.is_valid(state["trading_account_id"]) else ObjectId()
                await db.db.reflections.insert_one({
                    "user_id": user_id_obj,
                    "trading_account_id": account_id_obj,
                    "cycle_id": state["cycle_id"],
                    "reflection": reflection,
                    "created_at": datetime.utcnow()
                })
                
                await db.db.audit_trail.insert_one({
                    "timestamp": datetime.utcnow(),
                    "user_id": user_id_obj,
                    "event_type": "agent_decision",
                    "event_source": "reflection",
                    "status": "success",
                    "actor": "reflection",
                    "notes": f"Reflection completed for cycle {state['cycle_id']}."
                })
            
            state["decision_log"].append({
                "timestamp": datetime.utcnow(),
                "agent": "reflection",
                "status": "success",
                "processed_closed_trades": processed_count,
                "output": result_text
            })
        except Exception as e:
            state["reflection_notes"] = "Error parsing reflection output."
            state["lessons_learned"] = []
            state["decision_log"].append({
                "timestamp": datetime.utcnow(),
                "agent": "reflection",
                "status": "failed",
                "error": str(e),
                "output": result_text
            })

        return state
