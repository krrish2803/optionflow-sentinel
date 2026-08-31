import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from bson import ObjectId
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.optionflow_sentinel
    
    # Check if user exists
    user = await db.users.find_one({"email": "demo-user@quant.com"})
    if not user:
        print("Creating demo user...")
        await db.users.insert_one({
            "email": "demo-user@quant.com",
            "hashed_password": pwd_context.hash("password123"),
            "full_name": "Demo User",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        print("Demo user created.")
    else:
        print("Demo user already exists.")
        
    # Check if they have a trading account linked (required for dashboard metrics)
    user = await db.users.find_one({"email": "demo-user@quant.com"})
    account = await db.trading_accounts.find_one({"user_id": user["_id"]})
    if not account:
        print("Creating mock trading account for dashboard...")
        await db.trading_accounts.insert_one({
            "user_id": user["_id"],
            "account_name": "Paper Trading Demo",
            "broker": "alpaca",
            "is_paper_trading": True,
            "status": "active",
            "equity": 100000.0,
            "api_key_id": "mock_encrypted_key",
            "api_secret_id": "mock_encrypted_secret",
            "created_at": datetime.utcnow()
        })
        print("Mock trading account created.")

asyncio.run(seed())
