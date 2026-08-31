"""
Alpaca MCP Server — wraps the Alpaca trading API via Model Context Protocol.

Run as:  python -m app.mcp.server
"""
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("app.mcp.server")

# ---------------------------------------------------------------------------
# Alpaca SDK imports (graceful degradation)
# ---------------------------------------------------------------------------
try:
    from alpaca.trading.client import TradingClient
    from alpaca.trading.requests import LimitOrderRequest, MarketOrderRequest
    from alpaca.trading.enums import OrderSide, TimeInForce

    ALPACA_AVAILABLE = True
except ImportError:
    ALPACA_AVAILABLE = False
    logger.warning("alpaca-py not installed – Alpaca tools will return errors.")

try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False

# ---------------------------------------------------------------------------
# MCP SDK imports (graceful degradation)
# ---------------------------------------------------------------------------
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import (
        TextContent,
        Tool,
    )

    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    logger.error("mcp package not installed – server cannot start.")


def _get_env_credentials() -> tuple[Optional[str], Optional[str]]:
    return os.environ.get("ALPACA_API_KEY"), os.environ.get("ALPACA_SECRET_KEY")


def _build_trading_client() -> Optional["TradingClient"]:
    if not ALPACA_AVAILABLE:
        return None
    api_key, secret_key = _get_env_credentials()
    if not api_key or not secret_key:
        return None
    return TradingClient(api_key=api_key, secret_key=secret_key, paper=True)


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def tool_get_account() -> Dict[str, Any]:
    client = _build_trading_client()
    if client is None:
        return {"error": "Alpaca client unavailable. Check ALPACA_API_KEY / ALPACA_SECRET_KEY."}
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


def tool_get_positions() -> List[Dict[str, Any]]:
    client = _build_trading_client()
    if client is None:
        return [{"error": "Alpaca client unavailable."}]
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


def tool_get_order(order_id: str) -> Dict[str, Any]:
    client = _build_trading_client()
    if client is None:
        return {"error": "Alpaca client unavailable."}
    order = client.get_order(order_id)
    return {
        "id": str(order.id),
        "symbol": order.symbol,
        "side": order.side.value,
        "qty": str(order.qty),
        "type": order.type.value,
        "status": order.status.value,
        "limit_price": str(order.limit_price) if order.limit_price else None,
        "filled_avg_price": str(order.filled_avg_price) if order.filled_avg_price else None,
        "submitted_at": str(order.submitted_at) if order.submitted_at else None,
    }


def tool_submit_order(
    symbol: str,
    qty: int,
    side: str,
    order_type: str = "market",
    limit_price: Optional[str] = None,
    time_in_force: str = "day",
) -> Dict[str, Any]:
    client = _build_trading_client()
    if client is None:
        return {"error": "Alpaca client unavailable."}

    order_side = OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL
    tif = TimeInForce(time_in_force.lower())

    if order_type.lower() == "limit":
        if limit_price is None:
            return {"error": "limit_price is required for limit orders."}
        request = LimitOrderRequest(
            symbol=symbol,
            qty=qty,
            side=order_side,
            limit_price=limit_price,
            time_in_force=tif,
        )
    else:
        request = MarketOrderRequest(
            symbol=symbol,
            qty=qty,
            side=order_side,
            time_in_force=tif,
        )

    order = client.submit_order(request)
    return {
        "alpaca_order_id": str(order.id),
        "symbol": order.symbol,
        "side": order.side.value,
        "qty": str(order.qty),
        "type": order.type.value,
        "status": order.status.value,
        "limit_price": str(order.limit_price) if order.limit_price else None,
        "filled_avg_price": str(order.filled_avg_price) if order.filled_avg_price else None,
        "submitted_at": str(order.submitted_at) if order.submitted_at else None,
    }


def tool_cancel_order(order_id: str) -> Dict[str, Any]:
    client = _build_trading_client()
    if client is None:
        return {"error": "Alpaca client unavailable."}
    try:
        client.cancel_order(order_id)
        return {"cancelled": True, "order_id": order_id}
    except Exception as e:
        return {"cancelled": False, "error": str(e)}


def tool_get_clock() -> Dict[str, Any]:
    client = _build_trading_client()
    if client is None:
        return {"error": "Alpaca client unavailable."}
    clock = client.get_clock()
    return {
        "is_open": clock.is_open,
        "timestamp": str(clock.timestamp),
        "next_open": str(clock.next_open),
        "next_close": str(clock.next_close),
    }


def tool_get_news(symbols: Optional[List[str]] = None, limit: int = 10) -> List[Dict[str, Any]]:
    if not HTTPX_AVAILABLE:
        return [{"error": "httpx not installed – news unavailable."}]
    api_key, secret_key = _get_env_credentials()
    if not api_key or not secret_key:
        return [{"error": "Alpaca credentials not configured."}]
    try:
        params: Dict[str, Any] = {"limit": limit}
        if symbols:
            params["symbols"] = ",".join(symbols)
        resp = httpx.get(
            "https://data.alpaca.markets/v1beta1/news",
            params=params,
            headers={
                "APCA-API-KEY-ID": api_key,
                "APCA-API-SECRET-KEY": secret_key,
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return [
            {
                "id": str(article.get("id", "")),
                "headline": article.get("headline", ""),
                "source": article.get("source", ""),
                "summary": article.get("summary", ""),
                "created_at": article.get("created_at", ""),
                "symbols": article.get("symbols", []),
            }
            for article in data.get("news", [])
        ]
    except Exception as e:
        return [{"error": f"Failed to fetch news: {e}"}]


# ---------------------------------------------------------------------------
# MCP Server definition
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS: List[Tool] = [
    Tool(
        name="get_account",
        description="Get Alpaca account equity, cash, and buying power.",
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    Tool(
        name="get_positions",
        description="Get all open positions from Alpaca.",
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    Tool(
        name="get_order",
        description="Get a specific order by ID.",
        inputSchema={
            "type": "object",
            "properties": {"order_id": {"type": "string", "description": "Alpaca order ID"}},
            "required": ["order_id"],
        },
    ),
    Tool(
        name="submit_order",
        description="Submit a market or limit order.",
        inputSchema={
            "type": "object",
            "properties": {
                "symbol": {"type": "string", "description": "Ticker symbol"},
                "qty": {"type": "integer", "description": "Quantity"},
                "side": {"type": "string", "enum": ["buy", "sell"], "description": "Order side"},
                "order_type": {"type": "string", "enum": ["market", "limit"], "default": "market"},
                "limit_price": {"type": "string", "description": "Required for limit orders"},
                "time_in_force": {"type": "string", "default": "day"},
            },
            "required": ["symbol", "qty", "side"],
        },
    ),
    Tool(
        name="cancel_order",
        description="Cancel an open order by ID.",
        inputSchema={
            "type": "object",
            "properties": {"order_id": {"type": "string", "description": "Alpaca order ID"}},
            "required": ["order_id"],
        },
    ),
    Tool(
        name="get_clock",
        description="Get market clock (is_open, next_open, next_close).",
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    Tool(
        name="get_news",
        description="Get market news for given symbols.",
        inputSchema={
            "type": "object",
            "properties": {
                "symbols": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Optional list of ticker symbols to filter.",
                },
                "limit": {"type": "integer", "default": 10},
            },
            "required": [],
        },
    ),
]

TOOL_DISPATCH = {
    "get_account": lambda args: tool_get_account(),
    "get_positions": lambda args: tool_get_positions(),
    "get_order": lambda args: tool_get_order(args["order_id"]),
    "submit_order": lambda args: tool_submit_order(
        symbol=args["symbol"],
        qty=args["qty"],
        side=args["side"],
        order_type=args.get("order_type", "market"),
        limit_price=args.get("limit_price"),
        time_in_force=args.get("time_in_force", "day"),
    ),
    "cancel_order": lambda args: tool_cancel_order(args["order_id"]),
    "get_clock": lambda args: tool_get_clock(),
    "get_news": lambda args: tool_get_news(
        symbols=args.get("symbols"),
        limit=args.get("limit", 10),
    ),
}


async def run_server():
    if not MCP_AVAILABLE:
        logger.error("Cannot start MCP server: 'mcp' package not installed.")
        sys.exit(1)

    server = Server("alpaca-trading")

    @server.list_tools()
    async def list_tools():
        return TOOL_DEFINITIONS

    @server.call_tool()
    async def call_tool(name: str, arguments: Dict[str, Any]):
        handler = TOOL_DISPATCH.get(name)
        if handler is None:
            return [TextContent(type="text", text=json.dumps({"error": f"Unknown tool: {name}"}))]
        try:
            result = handler(arguments)
            return [TextContent(type="text", text=json.dumps(result, default=str))]
        except Exception as e:
            logger.exception("Tool %s failed", name)
            return [TextContent(type="text", text=json.dumps({"error": str(e)}))]

    logger.info("Starting Alpaca MCP server on stdio …")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


def main():
    import asyncio

    asyncio.run(run_server())


if __name__ == "__main__":
    main()
