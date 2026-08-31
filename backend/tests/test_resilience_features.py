import pytest
from datetime import datetime
from bson import ObjectId
from unittest.mock import patch, AsyncMock
from app.agents.state import AgentState
from app.agents.orchestrator import TradingOrchestrator
from app.agents.execution import ExecutionAgent
from app.core.database import db

@pytest.mark.asyncio
async def test_market_closed_skips_trading_cycle():
    orchestrator = TradingOrchestrator()
    
    # Mock market status to closed
    with patch("app.agents.orchestrator.check_market_status", new_callable=AsyncMock) as mock_status:
        mock_status.return_value = {
            "is_open": False,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        result = await orchestrator.run_trading_cycle(
            user_id=str(ObjectId()),
            trading_account_id=str(ObjectId())
        )
        
        assert result["status"] == "skipped"
        assert "Market is closed." in result["reason"]
        
        # Verify audit trail entry was inserted
        audit_entry = await db.db.audit_trail.find_one({"event_type": "market_status_check"})
        assert audit_entry is not None
        assert audit_entry["status"] == "skipped"

@pytest.mark.asyncio
async def test_startup_reconciliation():
    orchestrator = TradingOrchestrator()
    user_id = ObjectId()
    account_id = ObjectId()
    
    # Insert a position representing SPY that was closed offline (not in AAPL active symbols)
    await db.db.positions.insert_one({
        "user_id": user_id,
        "trading_account_id": account_id,
        "symbol": "SPY",
        "strategy_type": "IRON_CONDOR",
        "status": "open"
    })
    
    reconciled_count = await orchestrator.reconcile_positions_startup()
    assert reconciled_count == 1
    
    # Verify the SPY position is now closed locally
    spy_pos = await db.db.positions.find_one({"symbol": "SPY"})
    assert spy_pos["status"] == "closed"
    assert spy_pos["exit_reason"] == "System startup reconciliation"
    
    # Verify audit entry was logged
    audit_entry = await db.db.audit_trail.find_one({"event_type": "position_reconciliation"})
    assert audit_entry is not None
    assert "SPY" in audit_entry["notes"]

@pytest.mark.asyncio
async def test_execution_order_rejection():
    execution = ExecutionAgent()
    user_id = ObjectId()
    
    state: AgentState = {
        "user_id": str(user_id),
        "trading_account_id": str(ObjectId()),
        "cycle_id": "test-cycle",
        "timestamp": datetime.utcnow(),
        "candidates": [],
        "proposed_trades": [],
        "approved_trades": [
            {
                "symbol": "FAIL",
                "strategy_type": "BULL_PUT_SPREAD",
                "max_loss": 5.0,
                "legs": [],
                "greeks": {"delta": 0.05, "gamma": 0.01, "vega": 0.02, "theta": 0.05}
            }
        ],
        "rejected_trades": [],
        "risk_checks": [],
        "executed_orders": [],
        "execution_errors": [],
        "decision_log": []
    }
    
    result = await execution.run(state)
    assert len(result["executed_orders"]) == 0
    assert len(result["execution_errors"]) == 1
    assert "Insufficient buying power" in result["execution_errors"][0]
    
    # Verify order rejection logged in audit trail
    audit_entry = await db.db.audit_trail.find_one({"event_type": "order_rejected"})
    assert audit_entry is not None
    assert "FAIL" in audit_entry["notes"]

@pytest.mark.asyncio
async def test_execution_partial_fill_unwind():
    execution = ExecutionAgent()
    user_id = ObjectId()
    
    state: AgentState = {
        "user_id": str(user_id),
        "trading_account_id": str(ObjectId()),
        "cycle_id": "test-cycle",
        "timestamp": datetime.utcnow(),
        "candidates": [],
        "proposed_trades": [],
        "approved_trades": [
            {
                "symbol": "PARTIAL",
                "strategy_type": "BULL_PUT_SPREAD",
                "max_loss": 5.0,
                "legs": [],
                "greeks": {"delta": 0.05, "gamma": 0.01, "vega": 0.02, "theta": 0.05}
            }
        ],
        "rejected_trades": [],
        "risk_checks": [],
        "executed_orders": [],
        "execution_errors": [],
        "decision_log": []
    }
    
    result = await execution.run(state)
    assert len(result["executed_orders"]) == 0
    assert len(result["execution_errors"]) == 1
    assert "Partial fill detected" in result["execution_errors"][0]
    
    # Verify partial fill unwinding logged in audit trail
    audit_entry = await db.db.audit_trail.find_one({"event_type": "order_partial_fill_unwound"})
    assert audit_entry is not None
    assert "PARTIAL" in audit_entry["notes"]
