import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db = Database()

def get_db() -> AsyncIOMotorDatabase:
    """Dependency helper to get the database instance."""
    if db.db is None:
        raise RuntimeError("Database not initialized. Make sure to call connect_to_mongo() first.")
    return db.db

async def connect_to_mongo():
    """Establish connection to MongoDB and construct unique indexes."""
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.DATABASE_NAME]

    # Create collection indexes
    await db.db.users.create_index("email", unique=True)
    await db.db.api_keys.create_index("api_key_hash", unique=True)
    await db.db.trading_accounts.create_index("account_id", unique=True)
    
    # Seed Earnings Calendar
    if await db.db.earnings_calendar.count_documents({}) == 0:
        logger.info("Seeding default earnings_calendar dataset...")
        calendar_seeds = [
            {"symbol": "NVDA", "earnings_date": "2026-09-15"},
            {"symbol": "AAPL", "earnings_date": "2026-10-29"},
            {"symbol": "TSLA", "earnings_date": "2026-10-18"},
            {"symbol": "SPY", "earnings_date": "2026-12-15"},
            {"symbol": "QQQ", "earnings_date": "2026-12-15"},
            {"symbol": "IWM", "earnings_date": "2026-12-15"}
        ]
        await db.db.earnings_calendar.insert_many(calendar_seeds)

    # Seed Strategy Weights
    if await db.db.strategy_weights.count_documents({}) == 0:
        logger.info("Seeding default strategy_weights dataset...")
        weight_seeds = [
            {"signal_type": "high_iv_rank", "strategy_type": "IRON_CONDOR", "weight": 1.0, "win_rate": 0.0, "avg_profit_factor": 0.0, "total_trades": 0},
            {"signal_type": "high_iv_rank", "strategy_type": "BULL_PUT_SPREAD", "weight": 1.0, "win_rate": 0.0, "avg_profit_factor": 0.0, "total_trades": 0},
            {"signal_type": "high_iv_rank", "strategy_type": "BEAR_CALL_SPREAD", "weight": 1.0, "win_rate": 0.0, "avg_profit_factor": 0.0, "total_trades": 0},
            {"signal_type": "put_skew", "strategy_type": "BULL_PUT_SPREAD", "weight": 1.0, "win_rate": 0.0, "avg_profit_factor": 0.0, "total_trades": 0},
            {"signal_type": "volume_spike", "strategy_type": "IRON_CONDOR", "weight": 1.0, "win_rate": 0.0, "avg_profit_factor": 0.0, "total_trades": 0}
        ]
        await db.db.strategy_weights.insert_many(weight_seeds)

    logger.info("MongoDB unique indexes and seeded data successfully initialized.")

async def close_mongo_connection():
    """Disconnect from MongoDB."""
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed.")
