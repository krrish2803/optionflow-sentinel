import json
import logging
from datetime import datetime
from bson import ObjectId
from app.agents.state import AgentState
from app.core.llm import run_llm_inference
from app.core.database import db

logger = logging.getLogger(__name__)

class StrategyAgent:
    """Proposes defined-risk credit spreads or iron condors based on Scanner signals and strategy weights."""

    async def run(self, state: AgentState) -> AgentState:
        if not state.get("candidates"):
            state["proposed_trades"] = []
            return state

        # Fetch current strategy weights from MongoDB
        weights_info = []
        if db.db is not None:
            try:
                cursor = db.db.strategy_weights.find({})
                async for doc in cursor:
                    weights_info.append(
                        f"- {doc['signal_type']} + {doc['strategy_type']}: weight={doc['weight']} (win_rate={doc['win_rate']:.1%}, trades={doc['total_trades']})"
                    )
            except Exception as e:
                logger.error(f"Error fetching strategy weights: {e}")

        weights_prose = "\n".join(weights_info) if weights_info else "No weights seeded yet. Use default weight 1.0 for all strategy types."
        candidates_json = json.dumps(state["candidates"])

        prompt = f"""
        You are the Strategy Agent for OptionFlow Sentinel.
        
        Candidates detected by Scanner:
        {candidates_json}
        
        Current strategy weights (based on historical win rates):
        {weights_prose}
        
        For each candidate, formulate a defined-risk option credit spread or iron condor.
        - High IV (>70) -> Propose credit spread (Short side at ~1 std dev / 15 Delta, Buy long wing for protection) or iron condor.
        - Prioritize combinations with higher weights.
        - Compute Greeks: Delta, Gamma, Theta, Vega for the entire combined position.
        
        Respond ONLY with a valid JSON document matching this structure:
        {{
          "proposed_trades": [
            {{
              "symbol": "SPY",
              "strategy_type": "BULL_PUT_SPREAD",
              "expiration": "2026-09-04",
              "legs": [
                {{"type": "short_put", "strike": 585, "bid": 1.42, "ask": 1.45}},
                {{"type": "long_put", "strike": 580, "bid": 0.35, "ask": 0.38}}
              ],
              "net_credit": 1.07,
              "max_loss": 3.93,
              "max_profit": 1.07,
              "probability_of_profit": 0.79,
              "greeks": {{"delta": 0.12, "gamma": 0.04, "theta": 42.5, "vega": -18.2}},
              "edge_rationale": "High IV Rank provides deep safety buffer."
            }},
            {{
              "symbol": "NVDA",
              "strategy_type": "BEAR_CALL_SPREAD",
              "expiration": "2026-09-04",
              "legs": [
                {{"type": "short_call", "strike": 140, "bid": 1.65, "ask": 1.70}},
                {{"type": "long_call", "strike": 145, "bid": 0.40, "ask": 0.45}}
              ],
              "net_credit": 1.25,
              "max_loss": 3.75,
              "max_profit": 1.25,
              "probability_of_profit": 0.76,
              "greeks": {{"delta": -0.14, "gamma": 0.03, "theta": 38.0, "vega": -22.1}},
              "edge_rationale": "Call resistance wall active at $140 strike with heavy volume pinning."
            }}
          ]
        }}
        """

        result_text = await run_llm_inference(prompt)

        try:
            proposed_trades = json.loads(result_text)["proposed_trades"]
            state["proposed_trades"] = proposed_trades
            state["decision_log"].append({
                "timestamp": datetime.utcnow(),
                "agent": "strategy",
                "status": "success",
                "trades_proposed": len(proposed_trades),
                "output": result_text
            })
            
            # Log to audit trail
            if db.db is not None:
                user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                await db.db.audit_trail.insert_one({
                    "timestamp": datetime.utcnow(),
                    "user_id": user_id_obj,
                    "event_type": "agent_decision",
                    "event_source": "strategy",
                    "status": "success",
                    "actor": "strategy",
                    "notes": f"Strategy parsed signals. Proposed {len(proposed_trades)} trade combinations."
                })
        except Exception as e:
            state["proposed_trades"] = []
            if db.db is not None:
                user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                await db.db.audit_trail.insert_one({
                    "timestamp": datetime.utcnow(),
                    "user_id": user_id_obj,
                    "event_type": "agent_decision",
                    "event_source": "strategy",
                    "status": "failure",
                    "actor": "strategy",
                    "notes": f"Strategy failed: {e}"
                })
            state["decision_log"].append({
                "timestamp": datetime.utcnow(),
                "agent": "strategy",
                "status": "failed",
                "error": str(e),
                "output": result_text
            })

        return state
