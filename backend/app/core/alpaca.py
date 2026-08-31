import logging
from typing import Optional
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import LimitOrderRequest, MarketOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce
from app.core.security import decrypt_api_key
from app.core.database import db
from app.core.config import settings

logger = logging.getLogger(__name__)


async def get_alpaca_client(trading_account_id: str) -> Optional[TradingClient]:
    """Retrieve a trading account by its _id, decrypt credentials, return TradingClient.

    Falls back to environment variable credentials if the account has no stored keys.
    Returns None if no credentials are available.
    """
    if not trading_account_id or db.db is None:
        # Fall back to env vars
        if settings.ALPACA_API_KEY and settings.ALPACA_SECRET_KEY:
            try:
                return TradingClient(
                    api_key=settings.ALPACA_API_KEY,
                    secret_key=settings.ALPACA_SECRET_KEY,
                    paper=True,
                )
            except Exception as e:
                logger.error(f"Failed to create Alpaca client from env vars: {e}")
        return None

    from bson import ObjectId
    try:
        account_id = ObjectId(trading_account_id)
    except Exception:
        logger.error(f"Invalid trading_account_id: {trading_account_id}")
        return None

    account = await db.db.trading_accounts.find_one({"_id": account_id})
    if not account:
        logger.warning(f"No trading account found for id {trading_account_id}.")
        # Fall back to env vars
        if settings.ALPACA_API_KEY and settings.ALPACA_SECRET_KEY:
            try:
                return TradingClient(
                    api_key=settings.ALPACA_API_KEY,
                    secret_key=settings.ALPACA_SECRET_KEY,
                    paper=True,
                )
            except Exception as e:
                logger.error(f"Failed to create Alpaca client from env vars: {e}")
        return None

    # Try stored credentials first
    if account.get("api_key_id") and account.get("secret_key_id"):
        try:
            api_key = decrypt_api_key(account["api_key_id"])
            secret_key = decrypt_api_key(account["secret_key_id"])
        except Exception as e:
            logger.error(f"Failed to decrypt Alpaca credentials: {e}")
            api_key = None
            secret_key = None

        if api_key and secret_key:
            try:
                return TradingClient(
                    api_key=api_key,
                    secret_key=secret_key,
                    paper=account.get("is_paper_trading", True),
                )
            except Exception as e:
                logger.error(f"Failed to initialise Alpaca TradingClient: {e}")

    # Fall back to env vars
    if settings.ALPACA_API_KEY and settings.ALPACA_SECRET_KEY:
        try:
            return TradingClient(
                api_key=settings.ALPACA_API_KEY,
                secret_key=settings.ALPACA_SECRET_KEY,
                paper=True,
            )
        except Exception as e:
            logger.error(f"Failed to create Alpaca client from env vars: {e}")

    logger.warning("No Alpaca credentials available (stored or env vars).")
    return None


async def get_alpaca_client_from_keys(
    api_key: str, secret_key: str, paper: bool = True
) -> TradingClient:
    """Create an Alpaca client directly from plaintext keys (used during
    account linking to validate credentials before encrypting & storing)."""
    return TradingClient(api_key=api_key, secret_key=secret_key, paper=paper)


def place_limit_order(
    client: TradingClient,
    symbol: str,
    qty: int,
    side: OrderSide,
    limit_price: str,
    time_in_force: TimeInForce = TimeInForce.DAY,
) -> dict:
    """Submit a limit order and return a serialisable dict of the result."""
    request = LimitOrderRequest(
        symbol=symbol,
        qty=qty,
        side=side,
        limit_price=limit_price,
        time_in_force=time_in_force,
    )
    order = client.submit_order(request)
    return {
        "alpaca_order_id": str(order.id),
        "symbol": order.symbol,
        "side": order.side.value,
        "qty": str(order.qty),
        "limit_price": str(order.limit_price) if order.limit_price else None,
        "type": order.type.value,
        "status": order.status.value,
        "submitted_at": str(order.submitted_at) if order.submitted_at else None,
        "filled_avg_price": str(order.filled_avg_price) if order.filled_avg_price else None,
    }


def place_market_order(
    client: TradingClient,
    symbol: str,
    qty: int,
    side: OrderSide,
    time_in_force: TimeInForce = TimeInForce.DAY,
) -> dict:
    """Submit a market order and return a serialisable dict of the result."""
    request = MarketOrderRequest(
        symbol=symbol,
        qty=qty,
        side=side,
        time_in_force=time_in_force,
    )
    order = client.submit_order(request)
    return {
        "alpaca_order_id": str(order.id),
        "symbol": order.symbol,
        "side": order.side.value,
        "qty": str(order.qty),
        "type": order.type.value,
        "status": order.status.value,
        "submitted_at": str(order.submitted_at) if order.submitted_at else None,
        "filled_avg_price": str(order.filled_avg_price) if order.filled_avg_price else None,
    }


def get_account(client: TradingClient) -> dict:
    """Return the Alpaca account snapshot as a plain dict."""
    account = client.get_account()
    return {
        "account_id": str(account.id),
        "status": account.status.value if hasattr(account.status, "value") else str(account.status),
        "equity": str(account.equity),
        "cash": str(account.cash),
        "buying_power": str(account.buying_power),
        "portfolio_value": str(account.portfolio_value),
        "currency": account.currency,
    }


def get_positions(client: TradingClient) -> list[dict]:
    """Return all open positions as a list of plain dicts."""
    positions = client.get_all_positions()
    return [
        {
            "symbol": pos.symbol,
            "qty": str(pos.qty),
            "avg_entry_price": str(pos.avg_entry_price),
            "current_price": str(pos.current_price),
            "market_value": str(pos.market_value),
            "unrealized_pl": str(pos.unrealized_pl),
            "unrealized_plpc": str(pos.unrealized_plpc),
            "side": pos.side.value if hasattr(pos.side, "value") else str(pos.side),
        }
        for pos in positions
    ]


def get_clock(client: TradingClient) -> dict:
    """Return the market clock from Alpaca."""
    clock = client.get_clock()
    return {
        "is_open": clock.is_open,
        "timestamp": str(clock.timestamp),
        "next_open": str(clock.next_open),
        "next_close": str(clock.next_close),
    }


def cancel_order(client: TradingClient, order_id: str) -> bool:
    """Cancel a specific open order by ID."""
    try:
        client.cancel_order(order_id)
        return True
    except Exception as e:
        logger.error(f"Failed to cancel order {order_id}: {e}")
        return False
