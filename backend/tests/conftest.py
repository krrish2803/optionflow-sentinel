import pytest
import sys
import os
from unittest.mock import MagicMock
from bson import ObjectId
from datetime import datetime

# Set PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import db

# Global in-memory document store representing our MongoDB tables
DB_STORE = {
    "users": [],
    "api_keys": [],
    "trading_accounts": [],
    "earnings_calendar": [
        {"symbol": "NVDA", "earnings_date": "2026-09-02"},  # default within blackout
        {"symbol": "SPY", "earnings_date": "2026-12-15"}
    ],
    "strategy_weights": [
        {"signal_type": "high_iv_rank", "strategy_type": "IRON_CONDOR", "weight": 1.0, "win_rate": 0.88, "wins": 8, "total_trades": 9},
        {"signal_type": "high_iv_rank", "strategy_type": "BULL_PUT_SPREAD", "weight": 1.0, "win_rate": 0.0, "avg_profit_factor": 0.0, "total_trades": 0}
    ],
    "positions": [],
    "reflections": [],
    "decision_logs": [],
    "audit_trail": []
}

class MockCursor:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.index < len(self.data):
            res = self.data[self.index]
            self.index += 1
            return res
        raise StopAsyncIteration

    async def to_list(self, limit=None):
        return self.data[:limit] if limit else self.data

class MockCollection:
    def __init__(self, name):
        self.name = name

    async def find_one(self, filter_query, *args, **kwargs):
        # Match filter key-value pairs
        for doc in DB_STORE.get(self.name, []):
            match = True
            for k, v in filter_query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        
        # Fallbacks for empty setups
        if self.name == "users":
            return {
                "_id": ObjectId(),
                "email": "test-fallback@quant.com",
                "preferences": {
                    "max_risk_per_trade": 0.02,
                    "max_trade_delta": 0.30,
                    "max_trade_gamma": 0.15,
                    "max_trade_vega": 0.25,
                    "min_trade_theta": 0.05,
                    "max_portfolio_delta": 0.50,
                    "max_portfolio_gamma": 0.30,
                    "max_portfolio_vega": 0.40,
                    "portfolio_heat_limit": 0.50
                }
            }
        return None

    def find(self, filter_query, *args, **kwargs):
        matches = []
        for doc in DB_STORE.get(self.name, []):
            match = True
            for k, v in filter_query.items():
                # Support nested search in decision_log
                if k.startswith("decision_log."):
                    continue
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                matches.append(doc)
        return MockCursor(matches)

    async def insert_one(self, doc, *args, **kwargs):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        DB_STORE.setdefault(self.name, []).append(doc)
        return MagicMock(inserted_id=doc["_id"])

    async def update_one(self, filter_query, update_doc, *args, **kwargs):
        # Find document
        target_doc = None
        for doc in DB_STORE.get(self.name, []):
            match = True
            for k, v in filter_query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                target_doc = doc
                break
        
        if not target_doc and update_doc.get("$set"):
            # Upsert support
            new_doc = filter_query.copy()
            new_doc.update(update_doc["$set"])
            if "_id" not in new_doc:
                new_doc["_id"] = ObjectId()
            DB_STORE.setdefault(self.name, []).append(new_doc)
            return MagicMock(modified_count=1)

        if target_doc and update_doc.get("$set"):
            target_doc.update(update_doc["$set"])

        return MagicMock(modified_count=1)

    async def count_documents(self, filter_query, *args, **kwargs):
        count = 0
        for doc in DB_STORE.get(self.name, []):
            match = True
            for k, v in filter_query.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                count += 1
        return count

    async def create_index(self, *args, **kwargs):
        return "index_created"

class MockDatabase:
    def __getattr__(self, name):
        return MockCollection(name)

@pytest.fixture(scope="function", autouse=True)
def mock_db():
    # Clean store for every test function run to prevent pollution
    global DB_STORE
    DB_STORE = {
        "users": [],
        "api_keys": [],
        "trading_accounts": [],
        "earnings_calendar": [
            {"symbol": "NVDA", "earnings_date": "2026-09-02"},  # default within blackout
            {"symbol": "SPY", "earnings_date": "2026-12-15"}
        ],
        "strategy_weights": [
            {"signal_type": "high_iv_rank", "strategy_type": "IRON_CONDOR", "weight": 1.0, "win_rate": 0.88, "wins": 8, "total_trades": 9},
            {"signal_type": "high_iv_rank", "strategy_type": "BULL_PUT_SPREAD", "weight": 1.0, "win_rate": 0.0, "avg_profit_factor": 0.0, "total_trades": 0}
        ],
        "positions": [],
        "reflections": [],
        "decision_logs": [],
        "audit_trail": []
    }
    db.client = MagicMock()
    db.db = MockDatabase()
    yield
    db.db = None
    db.client = None

@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
