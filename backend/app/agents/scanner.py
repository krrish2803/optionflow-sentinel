import json
import logging
import asyncio
from datetime import datetime
from bson import ObjectId
from app.agents.state import AgentState
from app.core.llm import run_llm_inference
from app.core.database import db
from app.agents.mcp_scanner import fetch_market_news_via_mcp

logger = logging.getLogger(__name__)

class ScannerAgent:
    """Scans option flow utilizing NVIDIA LLMs and the Alpaca MCP Server for real-time news context."""

    async def run(self, state: AgentState) -> AgentState:
        logger.info("Scanner Agent: Initiating market sweep...")
        
        mcp_context = await fetch_market_news_via_mcp("SPY")
        
        prompt = f"""
        Role: Options Flow Scanner Agent
        Context: Identify unusual option activity and formulate trade candidates.
        Market News (via Alpaca MCP): {mcp_context}
        
        Your job: Scan high-liquidity symbols (SPY, NVDA, AAPL, TSLA, QQQ) to identify volatility mispricings.
        
        Detection criteria:
        1. Implied Volatility Rank (IV Rank) > 70% or < 30%
        2. Option volume > 3.0x standard 30-day average
        3. Significant call/put skew shifts
        
        Generate a list of top trading candidate setups.
        
        Respond ONLY with a valid JSON document matching this structure:
        {{
          "candidates": [
            {{
              "symbol": "SPY",
              "expiration": "2026-09-04",
              "signal_type": "high_iv_rank",
              "iv_rank": 82,
              "volume_zscore": 3.4,
              "proposed_strike": 585,
              "rationale": "Description here"
            }}
          ]
        }}
        """
        
        result_text = await run_llm_inference(prompt)
        logger.info("Scanner Agent: LLM response received, length=%d", len(result_text))
        
        try:
            parsed = json.loads(result_text)
            raw_candidates = parsed.get("candidates", [])
            logger.info("Scanner Agent: Parsed %d candidates", len(raw_candidates))
            filtered_candidates = []
            
            earnings_map = {}
            if db.db is not None:
                cursor = db.db.earnings_calendar.find({})
                async for doc in cursor:
                    earnings_map[doc["symbol"]] = doc["earnings_date"]

            cycle_time = state.get("timestamp", datetime.utcnow())

            for cand in raw_candidates:
                symbol = cand.get("symbol", "")
                earnings_date_str = earnings_map.get(symbol)
                
                if earnings_date_str:
                    try:
                        earnings_date = datetime.strptime(earnings_date_str, "%Y-%m-%d")
                        diff = earnings_date - cycle_time
                        days_diff = diff.days
                        
                        if 0 <= days_diff <= 7:
                            state["decision_log"].append({
                                "timestamp": datetime.utcnow(),
                                "agent": "scanner",
                                "status": "info",
                                "message": f"Skipped {symbol}. Earnings on {earnings_date_str} ({days_diff} days away)."
                            })
                            continue
                    except Exception as err:
                        logger.error(f"Error checking earnings dates for {symbol}: {err}")
                
                filtered_candidates.append(cand)

            state["candidates"] = filtered_candidates
            
            if db.db is not None:
                user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                await db.db.audit_trail.insert_one({
                    "timestamp": datetime.utcnow(),
                    "user_id": user_id_obj,
                    "event_type": "agent_decision",
                    "event_source": "scanner",
                    "status": "success",
                    "actor": "scanner",
                    "notes": f"Scanner parsed candidates. Found {len(filtered_candidates)} viable candidates."
                })

            state["decision_log"].append({
                "timestamp": datetime.utcnow(),
                "agent": "scanner",
                "status": "success",
                "candidates_found": len(filtered_candidates),
                "output": result_text[:500]
            })
        except Exception as e:
            logger.error("Scanner Agent: Failed to parse LLM output: %s", e)
            state["candidates"] = []
            if db.db is not None:
                user_id_obj = ObjectId(state["user_id"]) if ObjectId.is_valid(state["user_id"]) else ObjectId()
                await db.db.audit_trail.insert_one({
                    "timestamp": datetime.utcnow(),
                    "user_id": user_id_obj,
                    "event_type": "agent_decision",
                    "event_source": "scanner",
                    "status": "failure",
                    "actor": "scanner",
                    "notes": f"Scanner failed: {e}"
                })
            state["decision_log"].append({
                "timestamp": datetime.utcnow(),
                "agent": "scanner",
                "status": "failed",
                "error": str(e),
                "output": result_text[:500] if result_text else ""
            })
            
        return state
