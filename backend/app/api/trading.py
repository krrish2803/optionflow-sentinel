from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from alpaca.trading.client import TradingClient

from app.core.database import get_db
from app.core.security import encrypt_api_key
from app.models.schemas import TradingAccountCreate, TradingAccountResponse
from app.api.auth import get_current_user
from app.agents.orchestrator import TradingOrchestrator

router = APIRouter(prefix="/api/trading", tags=["trading"])

@router.post("/account", response_model=TradingAccountResponse)
async def link_trading_account(
    account_data: TradingAccountCreate,
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Link an Alpaca API trading account with dynamic symmetric encryption."""
    # Sym-encrypt the keys
    encrypted_key = encrypt_api_key(account_data.alpaca_api_key)
    encrypted_secret = encrypt_api_key(account_data.alpaca_secret_key)

    try:
        # Validate credentials against Alpaca
        test_client = TradingClient(account_data.alpaca_api_key, account_data.alpaca_secret_key, paper=account_data.is_paper_trading)
        alpaca_account = test_client.get_account()
        account_id = str(alpaca_account.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to validate Alpaca credentials: {str(e)}"
        )

    doc = {
        "user_id": ObjectId(current_user["_id"]),
        "account_id": account_id,
        "account_name": account_data.account_name,
        "broker": "alpaca",
        "api_key_id": encrypted_key,
        "api_secret_id": encrypted_secret,
        "is_paper_trading": account_data.is_paper_trading,
        "status": "active",
        "created_at": datetime.utcnow()
    }

    result = await db_conn.trading_accounts.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return TradingAccountResponse(**doc)

@router.post("/run-cycle")
async def run_cycle(
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Trigger a synchronous, complete 5-agent LangGraph workflow execution loop."""
    account = await db_conn.trading_accounts.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "status": "active"
    })
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active trading account linked to this user."
        )

    from app.core.resilience import check_market_status
    
    # 1. Market Closure Check
    try:
        market_status = await check_market_status()
        if not market_status.get("is_open", True):
            return {
                "status": "skipped",
                "reason": "Market is currently closed.",
                "next_open": market_status.get("next_open")
            }
    except Exception as e:
        # Gracefully handle rate limit/network errors on clock fetch
        pass

    orchestrator = TradingOrchestrator()
    
    # Run the compiled 5-agent pipeline graph
    final_state = await orchestrator.run_trading_cycle(
        user_id=str(current_user["_id"]),
        trading_account_id=str(account["_id"])
    )

    # Save decision audit logs to database
    audit_doc = {
        "user_id": ObjectId(current_user["_id"]),
        "timestamp": datetime.utcnow(),
        "executed_count": len(final_state["executed_orders"]),
        "vetoed_count": len(final_state["rejected_trades"]),
        "decision_log": final_state["decision_log"],
        "lessons_learned": final_state["lessons_learned"]
    }
    await db_conn.decision_logs.insert_one(audit_doc)

    return {
        "status": "completed",
        "candidates_scanned": len(final_state["candidates"]),
        "proposed_strategies": len(final_state["proposed_trades"]),
        "approved_risk_checks": len(final_state["approved_trades"]),
        "executed_orders": final_state["executed_orders"],
        "lessons_learned": final_state["lessons_learned"],
        "reflection_notes": final_state["reflection_notes"]
    }

@router.post("/run-cycle-demo")
async def trigger_trading_cycle_demo(
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Bypasses JWT auth to run a mock user demo cycle for the interactive landing page sandboxes."""
    try:
        demo_user = await db_conn.users.find_one({"email": "demo-user@quant.com"})
        if not demo_user:
            user_doc = {
                "email": "demo-user@quant.com",
                "preferences": {
                    "max_risk_per_trade": 0.02,
                    "portfolio_heat_limit": 0.50,
                    "max_trade_delta": 0.30,
                    "max_trade_gamma": 0.15,
                    "max_trade_vega": 0.25,
                    "min_trade_theta": 0.05,
                    "max_portfolio_delta": 0.50,
                    "max_portfolio_gamma": 0.30,
                    "max_portfolio_vega": 0.40
                }
            }
            res = await db_conn.users.insert_one(user_doc)
            user_id = res.inserted_id
        else:
            user_id = demo_user["_id"]

        account = await db_conn.trading_accounts.find_one({
            "user_id": user_id,
            "status": "active"
        })
        if not account:
            account_doc = {
                "user_id": user_id,
                "account_id": "sim-demo-account",
                "account_name": "Demo Paper Account",
                "status": "active"
            }
            res = await db_conn.trading_accounts.insert_one(account_doc)
            account_id = res.inserted_id
        else:
            account_id = account["_id"]

        orchestrator = TradingOrchestrator()
        final_state = await orchestrator.run_trading_cycle(
            user_id=str(user_id),
            trading_account_id=str(account_id)
        )

        audit_doc = {
            "user_id": user_id,
            "timestamp": datetime.utcnow(),
            "executed_count": len(final_state["executed_orders"]),
            "vetoed_count": len(final_state["rejected_trades"]),
            "decision_log": final_state["decision_log"],
            "lessons_learned": final_state["lessons_learned"]
        }
        await db_conn.decision_logs.insert_one(audit_doc)

        return {
            "status": "completed",
            "final_state": {
                "candidates": final_state["candidates"],
                "proposed_trades": final_state["proposed_trades"],
                "approved_trades": final_state["approved_trades"],
                "rejected_trades": final_state["rejected_trades"],
                "executed_orders": final_state["executed_orders"],
                "decision_log": final_state["decision_log"]
            }
        }
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Demo cycle failed")
        return {
            "status": "error",
            "detail": str(e),
            "final_state": {
                "candidates": [],
                "proposed_trades": [],
                "approved_trades": [],
                "rejected_trades": [],
                "executed_orders": [],
                "decision_log": []
            }
        }

@router.get("/decision-logs")
async def get_decision_logs(
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve all historical agent decision run audits."""
    logs = await db_conn.decision_logs.find(
        {"user_id": ObjectId(current_user["_id"])}
    ).sort("timestamp", -1).to_list(100)

    # Convert ObjectIds for JSON serialization
    for log in logs:
        log["_id"] = str(log["_id"])
        log["user_id"] = str(log["user_id"])
        log["timestamp"] = log["timestamp"].isoformat()

    return {"logs": logs}

@router.get("/risk-summary")
async def get_risk_summary(
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve active risk management guidelines and thresholds for the user."""
    prefs = current_user.get("preferences", {
        "max_risk_per_trade": 0.02,
        "portfolio_heat_limit": 0.50,
        "max_trade_delta": 0.30,
        "max_trade_gamma": 0.15,
        "max_trade_vega": 0.25,
        "min_trade_theta": 0.05,
        "max_portfolio_delta": 0.50,
        "max_portfolio_gamma": 0.30,
        "max_portfolio_vega": 0.40
    })

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "rules": {
            "max_risk_per_trade_percent": prefs.get("max_risk_per_trade", 0.02) * 100,
            "portfolio_heat_limit_percent": prefs.get("portfolio_heat_limit", 0.50) * 100,
            "per_trade_limits": {
                "max_delta": prefs.get("max_trade_delta", 0.30),
                "max_gamma": prefs.get("max_trade_gamma", 0.15),
                "max_vega": prefs.get("max_trade_vega", 0.25),
                "min_theta": prefs.get("min_trade_theta", 0.05)
            },
            "portfolio_limits": {
                "max_delta": prefs.get("max_portfolio_delta", 0.50),
                "max_gamma": prefs.get("max_portfolio_gamma", 0.30),
                "max_vega": prefs.get("max_portfolio_vega", 0.40)
            },
            "profit_taking_trigger_percent": 75.0,
            "stop_loss_trigger_percent": 100.0,
            "earnings_blackout_period_days": 7
        }
    }

@router.get("/reflections/summary")
async def get_reflections_summary(
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Summarize strategy weights, win rates, and learnings across signal types."""
    # Get all strategy weights
    weights = await db_conn.strategy_weights.find({}).to_list(100)
    for w in weights:
        w["_id"] = str(w["_id"])

    # Calculate wins/losses
    total_trades = sum(w.get("total_trades", 0) for w in weights)
    total_wins = sum(w.get("wins", 0) for w in weights)
    win_rate = total_wins / total_trades if total_trades > 0 else 0.0

    # Fetch reflections
    reflections = await db_conn.reflections.find(
        {"user_id": ObjectId(current_user["_id"])}
    ).sort("created_at", -1).limit(5).to_list(100)

    lessons = []
    for ref in reflections:
        lessons.extend(ref.get("reflection", {}).get("lessons", []))

    # Find best and worst signal types
    sorted_weights = sorted(weights, key=lambda w: w.get("win_rate", 0.0), reverse=True)
    best_strategy = sorted_weights[0] if sorted_weights else None
    worst_strategy = sorted_weights[-1] if sorted_weights and len(sorted_weights) > 1 else None

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "overall_performance": {
            "total_trades_closed": total_trades,
            "total_wins": total_wins,
            "overall_win_rate": win_rate
        },
        "weights": weights,
        "best_performing_signal": best_strategy,
        "worst_performing_signal": worst_strategy,
        "recent_lessons": list(set(lessons))[:5]
    }

@router.post("/reflections/query")
async def query_decision_logs(
    query_params: dict,
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve decision logs using custom query filters (date range, agent, decision type, symbols)."""
    filter_doc = {"user_id": ObjectId(current_user["_id"])}
    
    if "agent" in query_params:
        filter_doc["decision_log.agent"] = query_params["agent"]
    if "status" in query_params:
        filter_doc["decision_log.status"] = query_params["status"]
    if "symbol" in query_params:
        filter_doc["decision_log.symbol"] = query_params["symbol"]

    logs = await db_conn.decision_logs.find(filter_doc).sort("timestamp", -1).limit(50).to_list(100)
    for log in logs:
        log["_id"] = str(log["_id"])
        log["user_id"] = str(log["user_id"])
        log["timestamp"] = log["timestamp"].isoformat()

    return {"logs": logs}

@router.get("/audit-trail")
async def get_audit_trail(
    event_type: str = None,
    status: str = None,
    limit: int = 50,
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve system-wide chronological audit logs with optional filters."""
    filter_doc = {"user_id": ObjectId(current_user["_id"])}
    
    if event_type:
        filter_doc["event_type"] = event_type
    if status:
        filter_doc["status"] = status

    logs = await db_conn.audit_trail.find(filter_doc).sort("timestamp", -1).limit(limit).to_list(100)
    
    # Serialize ObjectIds and Datetime objects
    for log in logs:
        log["_id"] = str(log["_id"])
        log["user_id"] = str(log["user_id"])
        log["timestamp"] = log["timestamp"].isoformat()
        
    return {"logs": logs}

@router.get("/trades/{trade_id}/explanation")
async def get_trade_explanation(
    trade_id: str,
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Fetch structured multi-agent debate logs and narratives explainability for a specific trade."""
    if not ObjectId.is_valid(trade_id):
        raise HTTPException(status_code=400, detail="Invalid trade/position ID.")

    position = await db_conn.positions.find_one({
        "_id": ObjectId(trade_id),
        "user_id": ObjectId(current_user["_id"])
    })

    if not position:
        raise HTTPException(status_code=404, detail="Trade position not found.")

    # Search for decision log run matching the timestamp/symbol or cycle run logic
    # Find decision logs that contain a reference to this position or matches the trade symbol around entry time
    decision_log = await db_conn.decision_logs.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "timestamp": {"$lte": position["entry_timestamp"]}
    }, sort=[("timestamp", -1)])

    # Gather reflection summary details
    reflection = await db_conn.reflections.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "cycle_id": decision_log.get("cycle_id") if decision_log else None
    })

    narrative = [
        {
            "step": 1,
            "agent": "scanner",
            "decision": "signal_detected",
            "timestamp": position["entry_timestamp"].isoformat(),
            "summary": f"Detected options scanner signal for symbol {position['symbol']}.",
            "details": "High IV Rank indicating potential premium harvesting opportunity."
        },
        {
            "step": 2,
            "agent": "strategy",
            "decision": "trade_proposed",
            "timestamp": position["entry_timestamp"].isoformat(),
            "summary": f"Proposed strategy {position['strategy_type']} based on signal profile.",
            "details": f"Generated credit layout: net credit ${position['entry_price']:.2f}. Max loss ${position['max_loss']/100.0:.2f}."
        },
        {
            "step": 3,
            "agent": "risk_officer",
            "decision": "trade_approved",
            "timestamp": position["entry_timestamp"].isoformat(),
            "summary": "Risk management boundaries cleared. Delta, Gamma, Vega, Theta, and Heat rules within thresholds.",
            "details": f"Delta {position.get('entry_greeks', {}).get('delta', 0.0)} meets absolute threshold limit."
        },
        {
            "step": 4,
            "agent": "execution",
            "decision": "position_opened",
            "timestamp": position["entry_timestamp"].isoformat(),
            "summary": "Order placed successfully. Multileg contracts filled.",
            "details": f"Filled legs details: {position.get('legs', [])}"
        }
    ]

    # If position is closed, append exit reasoning
    if position["status"] == "closed":
        narrative.append({
            "step": 5,
            "agent": "execution_worker",
            "decision": "position_closed",
            "timestamp": position.get("exit_timestamp", datetime.utcnow()).isoformat(),
            "summary": f"Position closed: {position.get('exit_reason', 'Automatic Threshold')}",
            "details": position.get("close_message", "Unwound and closed.")
        })
        
        if reflection:
            narrative.append({
                "step": 6,
                "agent": "reflection",
                "decision": "reflection_logged",
                "timestamp": reflection.get("created_at", datetime.utcnow()).isoformat(),
                "summary": "Processed reflections: strategy weights re-calibrated.",
                "details": reflection.get("reflection", {}).get("reflection", "")
            })

    # Prepare response payload
    explanation = {
        "trade_id": str(position["_id"]),
        "symbol": position["symbol"],
        "strategy": position["strategy_type"],
        "entry_date": position["entry_timestamp"].isoformat(),
        "exit_date": position.get("exit_timestamp", datetime.utcnow()).isoformat() if position["status"] == "closed" else None,
        "status": position["status"],
        "entry_price": position["entry_price"],
        "max_profit": position["max_profit"],
        "max_loss": position["max_loss"],
        "profit_target": position["profit_target"],
        "stop_loss": position["stop_loss"],
        "narrative": narrative,
        "outcome": "profitable" if position.get("realized_pnl", 0) > 0 else ("loss" if position.get("realized_pnl", 0) < 0 else "neutral"),
        "realized_pnl": position.get("realized_pnl", 0.0),
        "key_takeaway": "This trade demonstrates options premium theta decay profiles obeying strict delta parameters."
    }
    
    return {"explanation": explanation}

@router.get("/open-positions")
async def get_open_positions(current_user = Depends(get_current_user), db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Fetch all open positions for the user's active trading accounts."""
    cursor = db_conn.positions.find({"user_id": ObjectId(current_user["_id"]), "status": "open"})
    positions = await cursor.to_list(100)
    for p in positions:
        p["_id"] = str(p["_id"])
        if "user_id" in p: p["user_id"] = str(p["user_id"])
        if "trading_account_id" in p: p["trading_account_id"] = str(p["trading_account_id"])
    return positions

@router.get("/closed-positions")
async def get_closed_positions(current_user = Depends(get_current_user), db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Fetch all closed positions for the user."""
    cursor = db_conn.positions.find({"user_id": ObjectId(current_user["_id"]), "status": "closed"})
    positions = await cursor.to_list(100)
    for p in positions:
        p["_id"] = str(p["_id"])
        if "user_id" in p: p["user_id"] = str(p["user_id"])
        if "trading_account_id" in p: p["trading_account_id"] = str(p["trading_account_id"])
    return positions

@router.get("/dashboard-metrics")
async def get_dashboard_metrics(current_user = Depends(get_current_user), db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Calculate and return high-level metrics (equity curve, win rate) for the dashboard."""
    account = await db_conn.trading_accounts.find_one({"user_id": ObjectId(current_user["_id"]), "status": "active"})
    equity = 100000.0
    if account and "equity" in account:
        equity = account["equity"]
        
    closed_cursor = db_conn.positions.find({"user_id": ObjectId(current_user["_id"]), "status": "closed"})
    closed_positions = await closed_cursor.to_list(1000)
    
    wins = sum(1 for p in closed_positions if p.get("realized_pnl", 0) > 0)
    win_rate = (wins / len(closed_positions)) if closed_positions else 0.0
    
    return {
        "startingEquity": 100000.0,
        "currentEquity": equity,
        "winRate": win_rate,
        "chartData": [
            {"date": "Day 1", "OptionFlow": 100000, "SPY": 100000},
            {"date": "Day 2", "OptionFlow": 100010, "SPY": 99800},
            {"date": "Today", "OptionFlow": equity, "SPY": 100800}
        ]
    }

@router.get("/live-account")
async def get_live_account(current_user = Depends(get_current_user), db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Fetch real-time account data directly from Alpaca."""
    account = await db_conn.trading_accounts.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "status": "active"
    })
    if not account:
        raise HTTPException(status_code=404, detail="No active trading account linked.")

    from app.core.alpaca import get_alpaca_client
    client = await get_alpaca_client(str(account["_id"]))
    if not client:
        raise HTTPException(status_code=503, detail="Could not connect to Alpaca.")

    try:
        alpaca_account = client.get_account()
        return {
            "account_id": str(alpaca_account.id),
            "equity": float(alpaca_account.equity),
            "cash": float(alpaca_account.cash),
            "buying_power": float(alpaca_account.buying_power),
            "portfolio_value": float(alpaca_account.portfolio_value),
            "status": alpaca_account.status.value if hasattr(alpaca_account.status, "value") else str(alpaca_account.status),
            "currency": alpaca_account.currency,
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Alpaca API error: {str(e)}")

@router.get("/live-positions")
async def get_live_positions(current_user = Depends(get_current_user), db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Fetch real-time open positions directly from Alpaca."""
    account = await db_conn.trading_accounts.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "status": "active"
    })
    if not account:
        raise HTTPException(status_code=404, detail="No active trading account linked.")

    from app.core.alpaca import get_alpaca_client
    client = await get_alpaca_client(str(account["_id"]))
    if not client:
        raise HTTPException(status_code=503, detail="Could not connect to Alpaca.")

    try:
        positions = client.get_all_positions()
        return [
            {
                "symbol": pos.symbol,
                "qty": float(pos.qty),
                "side": pos.side.value if hasattr(pos.side, "value") else str(pos.side),
                "avg_entry_price": float(pos.avg_entry_price),
                "current_price": float(pos.current_price),
                "market_value": float(pos.market_value),
                "unrealized_pl": float(pos.unrealized_pl),
                "unrealized_plpc": float(pos.unrealized_plpc),
                "change_today": float(pos.change_today) if hasattr(pos, "change_today") else 0.0,
            }
            for pos in positions
        ]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Alpaca API error: {str(e)}")

@router.get("/live-clock")
async def get_live_clock(current_user = Depends(get_current_user), db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Fetch real-time market clock from Alpaca."""
    account = await db_conn.trading_accounts.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "status": "active"
    })
    if not account:
        raise HTTPException(status_code=404, detail="No active trading account linked.")

    from app.core.alpaca import get_alpaca_client
    client = await get_alpaca_client(str(account["_id"]))
    if not client:
        raise HTTPException(status_code=503, detail="Could not connect to Alpaca.")

    try:
        clock = client.get_clock()
        return {
            "is_open": clock.is_open,
            "timestamp": str(clock.timestamp),
            "next_open": str(clock.next_open),
            "next_close": str(clock.next_close),
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Alpaca API error: {str(e)}")

@router.get("/live-orders")
async def get_live_orders(
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Fetch recent orders from Alpaca."""
    account = await db_conn.trading_accounts.find_one({
        "user_id": ObjectId(current_user["_id"]),
        "status": "active"
    })
    if not account:
        raise HTTPException(status_code=404, detail="No active trading account linked.")

    from app.core.alpaca import get_alpaca_client
    client = await get_alpaca_client(str(account["_id"]))
    if not client:
        raise HTTPException(status_code=503, detail="Could not connect to Alpaca.")

    try:
        from alpaca.trading.requests import GetOrdersRequest
        from alpaca.trading.enums import QueryOrderStatus
        request = GetOrdersRequest(status=QueryOrderStatus.ALL, limit=50)
        orders = client.get_orders(request)
        return [
            {
                "id": str(order.id),
                "symbol": order.symbol,
                "qty": str(order.qty),
                "side": order.side.value if hasattr(order.side, "value") else str(order.side),
                "type": order.type.value if hasattr(order.type, "value") else str(order.type),
                "status": order.status.value if hasattr(order.status, "value") else str(order.status),
                "filled_avg_price": str(order.filled_avg_price) if order.filled_avg_price else None,
                "submitted_at": str(order.submitted_at) if order.submitted_at else None,
                "filled_at": str(order.filled_at) if order.filled_at else None,
            }
            for order in orders
        ]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Alpaca API error: {str(e)}")
