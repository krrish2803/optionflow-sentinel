from typing import TypedDict, List, Dict, Any
from datetime import datetime

class AgentState(TypedDict):
    # Context
    timestamp: datetime
    user_id: str
    trading_account_id: str
    cycle_id: str
    
    # Scanner
    candidates: List[Dict[str, Any]]
    
    # Strategy
    proposed_trades: List[Dict[str, Any]]
    
    # Risk Officer
    approved_trades: List[Dict[str, Any]]
    rejected_trades: List[Dict[str, Any]]
    risk_checks: List[Dict[str, Any]]
    
    # Execution
    executed_orders: List[Dict[str, Any]]
    execution_errors: List[str]
    
    # Reflection
    reflection_notes: str
    lessons_learned: List[str]
    
    # Logs
    decision_log: List[Dict[str, Any]]
