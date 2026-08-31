import pytest
from app.agents.state import AgentState
from app.agents.scanner import ScannerAgent
from app.agents.strategy import StrategyAgent
from app.agents.risk import RiskOfficerAgent
from app.agents.reflection import ReflectionAgent
from app.agents.orchestrator import TradingOrchestrator

@pytest.mark.asyncio
async def test_scanner_agent_execution():
    scanner = ScannerAgent()
    state: AgentState = {
        "timestamp": None, "user_id": "", "trading_account_id": "",
        "candidates": [], "proposed_trades": [], "approved_trades": [], "rejected_trades": [],
        "risk_checks": [], "executed_orders": [], "execution_errors": [],
        "reflection_notes": "", "lessons_learned": [], "decision_log": []
    }
    result = await scanner.run(state)
    assert "candidates" in result
    assert len(result["candidates"]) > 0
    assert result["candidates"][0]["symbol"] == "SPY"

from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_full_orchestration_cycle():
    orchestrator = TradingOrchestrator()
    with patch("app.agents.orchestrator.check_market_status", new_callable=AsyncMock) as mock_status:
        mock_status.return_value = {
            "is_open": True,
            "timestamp": "2026-08-28T09:30:00Z"
        }
        final_state = await orchestrator.run_trading_cycle(
            user_id="test-user-id",
            trading_account_id="test-account-id"
        )
        assert len(final_state["candidates"]) > 0
        assert len(final_state["proposed_trades"]) > 0
        assert len(final_state["approved_trades"]) > 0
        assert len(final_state["executed_orders"]) > 0
        assert len(final_state["lessons_learned"]) > 0
        assert final_state["reflection_notes"] != ""
