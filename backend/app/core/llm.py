import httpx
import logging
import json
import random
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

MOCK_RESPONSES = {
    "scanner": {
        "candidates": [
            {
                "symbol": "SPY",
                "expiration": "2026-09-05",
                "signal_type": "high_iv_rank",
                "iv_rank": 78,
                "volume_zscore": 3.2,
                "proposed_strike": 640,
                "rationale": "Elevated IV rank on SPY with above-average put volume suggesting hedging activity."
            },
            {
                "symbol": "AAPL",
                "expiration": "2026-09-05",
                "signal_type": "high_iv_rank",
                "iv_rank": 85,
                "volume_zscore": 4.0,
                "proposed_strike": 230,
                "rationale": "Unusual call volume skew with IV rank above 80%. Earnings recently passed."
            },
            {
                "symbol": "NVDA",
                "expiration": "2026-09-05",
                "signal_type": "volume_spike",
                "iv_rank": 72,
                "volume_zscore": 3.8,
                "proposed_strike": 130,
                "rationale": "Significant volume spike with elevated IV. Semiconductor sector rotation in play."
            }
        ]
    },
    "strategy": {
        "proposed_trades": [
            {
                "symbol": "SPY",
                "strategy_type": "IRON_CONDOR",
                "expiration": "2026-09-05",
                "legs": [
                    {"type": "short_call", "strike": 655, "bid": 1.20, "ask": 1.25},
                    {"type": "long_call", "strike": 660, "bid": 0.45, "ask": 0.48},
                    {"type": "short_put", "strike": 625, "bid": 1.35, "ask": 1.40},
                    {"type": "long_put", "strike": 620, "bid": 0.50, "ask": 0.53}
                ],
                "net_credit": 1.57,
                "max_loss": 3.43,
                "max_profit": 1.57,
                "probability_of_profit": 0.72,
                "greeks": {"delta": 0.05, "gamma": 0.02, "theta": 55.0, "vega": -25.3},
                "edge_rationale": "Wide iron condor on SPY taking advantage of elevated IV rank. Both short strikes ~1 std dev OTM."
            },
            {
                "symbol": "AAPL",
                "strategy_type": "BULL_PUT_SPREAD",
                "expiration": "2026-09-05",
                "legs": [
                    {"type": "short_put", "strike": 225, "bid": 1.10, "ask": 1.15},
                    {"type": "long_put", "strike": 220, "bid": 0.40, "ask": 0.43}
                ],
                "net_credit": 0.70,
                "max_loss": 4.30,
                "max_profit": 0.70,
                "probability_of_profit": 0.78,
                "greeks": {"delta": -0.12, "gamma": 0.03, "theta": 35.0, "vega": -15.0},
                "edge_rationale": "Bullish bias post-earnings. Short put at 225 provides premium with good downside buffer."
            }
        ]
    },
    "reflection": {
        "reflection": "Cycle completed with mixed results. The scanner correctly identified elevated IV in SPY and AAPL. Risk officer appropriately filtered candidates based on Greek exposure limits. Execution was clean with limit orders placed at optimal prices.",
        "lessons": [
            "IV rank filtering remains effective for identifying premium selling opportunities",
            "Risk officer correctly vetoed one high-delta trade that exceeded portfolio limits",
            "Consider tightening profit targets when IV rank is above 80%"
        ],
        "metrics": {
            "signal_quality": "good",
            "risk_management": "passed",
            "execution_quality": "passed"
        }
    }
}


def _detect_prompt_type(prompt: str) -> str:
    prompt_lower = prompt.lower()
    if "scanner" in prompt_lower or "candidate" in prompt_lower:
        return "scanner"
    elif "strategy" in prompt_lower or "proposed_trade" in prompt_lower:
        return "strategy"
    elif "reflection" in prompt_lower or "lesson" in prompt_lower:
        return "reflection"
    return "scanner"


async def run_llm_inference(prompt: str) -> str:
    """Execute LLM inference. Uses NVIDIA-optimized endpoints with mock fallback."""
    if not settings.NVIDIA_API_KEY:
        logger.warning("NVIDIA_API_KEY not set. Using mock LLM response.")
        prompt_type = _detect_prompt_type(prompt)
        return json.dumps(MOCK_RESPONSES.get(prompt_type, MOCK_RESPONSES["scanner"]))

    try:
        logger.info(f"Calling NVIDIA optimized inference API... using model {settings.LLM_MODEL}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.NVIDIA_ENDPOINT}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 2048,
                }
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                logger.error(f"NVIDIA API error {response.status_code}: {response.text}. Falling back to mock.")
                prompt_type = _detect_prompt_type(prompt)
                return json.dumps(MOCK_RESPONSES.get(prompt_type, MOCK_RESPONSES["scanner"]))
    except Exception as e:
        logger.error(f"Failed calling NVIDIA API: {e}. Falling back to mock.")
        prompt_type = _detect_prompt_type(prompt)
        return json.dumps(MOCK_RESPONSES.get(prompt_type, MOCK_RESPONSES["scanner"]))
