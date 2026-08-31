import logging
import asyncio
import time
import httpx
from datetime import datetime
from typing import Callable, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

def retry_on_failure(max_retries: int = 3, initial_delay: float = 1.0, backoff_factor: float = 2.0):
    """Exponential backoff decorator for resilient external API queries."""
    def decorator(func: Callable[..., Any]):
        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(*args, **kwargs):
                delay = initial_delay
                for attempt in range(1, max_retries + 1):
                    try:
                        return await func(*args, **kwargs)
                    except Exception as e:
                        logger.warning(f"Attempt {attempt} failed for {func.__name__}: {e}")
                        if attempt == max_retries:
                            raise e
                        await asyncio.sleep(delay)
                        delay *= backoff_factor
            return async_wrapper
        else:
            def sync_wrapper(*args, **kwargs):
                delay = initial_delay
                for attempt in range(1, max_retries + 1):
                    try:
                        return func(*args, **kwargs)
                    except Exception as e:
                        logger.warning(f"Attempt {attempt} failed for {func.__name__}: {e}")
                        if attempt == max_retries:
                            raise e
                        time.sleep(delay)
                        delay *= backoff_factor
            return sync_wrapper
    return decorator

@retry_on_failure(max_retries=3, initial_delay=1.0)
async def check_market_status() -> dict:
    """Fetch market status from Alpaca API."""
    url = f"{settings.ALPACA_BASE_URL}/v2/clock"
    headers = {
        "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": settings.ALPACA_SECRET_KEY
    }
    
    if not settings.ALPACA_API_KEY:
        raise ValueError("ALPACA_API_KEY is not set. Cannot fetch real market status.")

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise httpx.HTTPStatusError(
                f"Alpaca returned status code {response.status_code}",
                request=response.request,
                response=response
            )
