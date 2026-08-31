import pytest
from datetime import datetime, timedelta
from bson import ObjectId
from app.agents.state import AgentState
from app.agents.scanner import ScannerAgent
from app.agents.risk import RiskOfficerAgent
from app.agents.reflection import ReflectionAgent
from app.worker import _monitor_positions_logic
from app.core.database import db

@pytest.mark.asyncio
async def test_risk_officer_veto_exceeded_equity_limit():
    risk_officer = RiskOfficerAgent()
    # Mock user preferences in database
    user_id = ObjectId()
    await db.db.users.insert_one({
        "_id": user_id,
        "email": "veto-test@quant.com",
        "preferences": {
            "max_risk_per_trade": 0.02, # 2% limit
        }
    })

    # Portfolio value: 100k. Limit: $2,000. 
    # Mock proposed trade with max_loss $3,500 (exceeds 2% limit)
    state: AgentState = {
        "user_id": str(user_id),
        "trading_account_id": str(ObjectId()),
        "cycle_id": "test-cycle",
        "timestamp": datetime.utcnow(),
        "candidates": [],
        "proposed_trades": [
            {
                "symbol": "SPY",
                "strategy_type": "BULL_PUT_SPREAD",
                "max_loss": 3500.0, # $3,500
                "legs": [],
                "greeks": {"delta": 0.05, "gamma": 0.02, "vega": 0.05, "theta": 0.10}
            }
        ],
        "approved_trades": [],
        "rejected_trades": [],
        "risk_checks": [],
        "executed_orders": [],
        "execution_errors": [],
        "decision_log": []
    }

    result = await risk_officer.run(state)
    assert len(result["approved_trades"]) == 0
    assert len(result["rejected_trades"]) == 1
    assert "exceeds 2.0% of account equity" in result["rejected_trades"][0]["veto_reason"]

@pytest.mark.asyncio
async def test_risk_officer_veto_exceeded_greeks_limit():
    risk_officer = RiskOfficerAgent()
    user_id = ObjectId()
    await db.db.users.insert_one({
        "_id": user_id,
        "email": "greek-test@quant.com",
        "preferences": {
            "max_trade_delta": 0.30
        }
    })

    # Mock proposed trade with Delta 0.45 (exceeds 0.30 limit)
    state: AgentState = {
        "user_id": str(user_id),
        "trading_account_id": str(ObjectId()),
        "cycle_id": "test-cycle",
        "timestamp": datetime.utcnow(),
        "candidates": [],
        "proposed_trades": [
            {
                "symbol": "QQQ",
                "strategy_type": "BEAR_CALL_SPREAD",
                "max_loss": 15.0, # $1,500 (within 2% limit)
                "legs": [],
                "greeks": {"delta": 0.45, "gamma": 0.02, "vega": 0.05, "theta": 0.10}
            }
        ],
        "approved_trades": [],
        "rejected_trades": [],
        "risk_checks": [],
        "executed_orders": [],
        "execution_errors": [],
        "decision_log": []
    }

    result = await risk_officer.run(state)
    assert len(result["approved_trades"]) == 0
    assert len(result["rejected_trades"]) == 1
    assert "Delta of 0.45 exceeds per-trade limit" in result["rejected_trades"][0]["veto_reason"]

@pytest.mark.asyncio
async def test_scanner_earnings_blackout():
    scanner = ScannerAgent()
    
    # NVDA is in database with earnings date on 2026-09-02 (5 days from cycle timestamp 2026-08-28)
    await db.db.earnings_calendar.update_one(
        {"symbol": "NVDA"},
        {"$set": {"earnings_date": "2026-09-02"}},
        upsert=True
    )
    
    state: AgentState = {
        "user_id": str(ObjectId()),
        "trading_account_id": str(ObjectId()),
        "cycle_id": "test-cycle",
        "timestamp": datetime(2026, 8, 28), # Local cycle time
        "candidates": [],
        "proposed_trades": [],
        "approved_trades": [],
        "rejected_trades": [],
        "risk_checks": [],
        "executed_orders": [],
        "execution_errors": [],
        "decision_log": []
    }

    result = await scanner.run(state)
    
    # Verify that NVDA was skipped because of earnings blackout (within 7 days)
    # The default prompt candidate mock returns NVDA and SPY. NVDA should be skipped, leaving only SPY.
    assert len(result["candidates"]) == 1
    assert result["candidates"][0]["symbol"] == "SPY"
    
    # Confirm blackout message is logged
    skipped_logs = [log for log in result["decision_log"] if "blackout" in log.get("message", "")]
    assert len(skipped_logs) > 0
    assert "NVDA" in skipped_logs[0]["message"]

@pytest.mark.asyncio
async def test_reflection_agent_updates_strategy_weights():
    reflection = ReflectionAgent()
    user_id = ObjectId()
    account_id = ObjectId()
    
    # Seed weights with 9 completed trades (so this 10th one triggers weight updates)
    await db.db.strategy_weights.update_one(
        {"signal_type": "high_iv_rank", "strategy_type": "IRON_CONDOR"},
        {"$set": {"weight": 1.0, "win_rate": 0.88, "wins": 8, "total_trades": 9}},
        upsert=True
    )

    # Insert a closed, win trade that has NOT been processed for weight updating
    await db.db.positions.insert_one({
        "user_id": user_id,
        "trading_account_id": account_id,
        "symbol": "SPY",
        "strategy_type": "IRON_CONDOR",
        "signal_type": "high_iv_rank",
        "status": "closed",
        "realized_pnl": 50.00, # positive (win)
        "weights_processed": False
    })

    state: AgentState = {
        "user_id": str(user_id),
        "trading_account_id": str(account_id),
        "cycle_id": "test-cycle",
        "timestamp": datetime.utcnow(),
        "candidates": [],
        "proposed_trades": [],
        "approved_trades": [],
        "rejected_trades": [],
        "risk_checks": [],
        "executed_orders": [],
        "execution_errors": [],
        "decision_log": []
    }

    result = await reflection.run(state)
    
    # Check that weights doc was updated: total_trades becomes 10, wins becomes 9. Win rate is 90% (>70% threshold).
    # Since total_trades >= 10, weight should increase from 1.0 to 1.1!
    updated_weight = await db.db.strategy_weights.find_one({
        "signal_type": "high_iv_rank",
        "strategy_type": "IRON_CONDOR"
    })
    
    assert updated_weight["total_trades"] == 10
    assert updated_weight["wins"] == 9
    assert updated_weight["win_rate"] == 0.90
    assert updated_weight["weight"] == 1.1

@pytest.mark.asyncio
async def test_celery_task_auto_position_closure():
    # Insert an open position
    user_id = ObjectId()
    account_id = ObjectId()
    await db.db.positions.insert_one({
        "user_id": user_id,
        "trading_account_id": account_id,
        "symbol": "TSLA",
        "strategy_type": "BEAR_CALL_SPREAD",
        "status": "open",
        "max_profit": 100.0,
        "max_loss": 400.0,
        "profit_target": 75.0, # Target 75%
        "stop_loss": 400.0
    })

    # Trigger position monitoring logic directly
    closed_count = await _monitor_positions_logic()
    assert closed_count == 1

    # Check updated document
    closed_pos = await db.db.positions.find_one({"symbol": "TSLA"})
    assert closed_pos["status"] == "closed"
    assert closed_pos["realized_pnl"] in [75.0, -400.0]
    assert closed_pos["exit_reason"] in ["Automatic: profit target reached", "Automatic: stop loss triggered"]
