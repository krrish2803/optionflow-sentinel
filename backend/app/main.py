import logging
import os
import httpx
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, db
from app.api import auth, trading
from app.agents.orchestrator import TradingOrchestrator

# Logging config
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)

app_start_time = datetime.utcnow()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to MongoDB
    await connect_to_mongo()
    
    # Run startup position reconciliation sweep for resilience
    try:
        orchestrator = TradingOrchestrator()
        await orchestrator.reconcile_positions_startup()
    except Exception as e:
        logging.error(f"Failed startup position reconciliation: {e}")
        
    yield
    # Disconnect from MongoDB
    await close_mongo_connection()

app = FastAPI(
    title="OptionFlow Sentinel Backend",
    description="Production-ready multi-agent options trading backend system.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(trading.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/health")
async def api_health_check():
    """Diagnostic endpoint verifying external connections and internal status."""
    db_ok = db.db is not None
    try:
        if db_ok:
            await db.db.command("ping")
            mongo_status = "ok"
        else:
            mongo_status = "offline"
    except Exception:
        mongo_status = "offline"

    open_pos_count = 0
    if db_ok:
        try:
            open_pos_count = await db.db.positions.count_documents({"status": "open"})
        except Exception:
            pass

    # Ping Alpaca clock API to verify real connectivity
    alpaca_status = "offline"
    if settings.ALPACA_API_KEY and settings.ALPACA_SECRET_KEY:
        try:
            async with httpx.AsyncClient(timeout=5.0) as http_client:
                resp = await http_client.get(
                    f"{settings.ALPACA_BASE_URL}/v2/clock",
                    headers={
                        "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
                        "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY,
                    },
                )
                alpaca_status = "ok" if resp.status_code == 200 else "error"
        except Exception:
            alpaca_status = "error"

    llm_status = "ok" if settings.NVIDIA_API_KEY else "offline"

    uptime = (datetime.utcnow() - app_start_time).total_seconds() if 'app_start_time' in globals() else 0

    return {
        "status": "healthy" if mongo_status == "ok" else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {
            "mongodb": {"status": mongo_status},
            "alpaca_api": {"status": alpaca_status},
            "llm_api": {"status": llm_status}
        },
        "open_positions": open_pos_count,
        "system_uptime_seconds": int(uptime)
    }
