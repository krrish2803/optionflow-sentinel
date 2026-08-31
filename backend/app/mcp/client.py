"""
Async client that connects to the Alpaca MCP Server and calls its tools.

Falls back gracefully if the ``mcp`` package is not installed.
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# MCP SDK imports (graceful degradation)
# ---------------------------------------------------------------------------
try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    logger.info("mcp package not installed – MCPAlpacaClient will use direct Alpaca SDK fallback.")


def _server_params() -> Optional["StdioServerParameters"]:
    if not MCP_AVAILABLE:
        return None
    return StdioServerParameters(
        command="python",
        args=["-m", "app.mcp.server"],
        env={
            "ALPACA_API_KEY": os.environ.get("ALPACA_API_KEY", ""),
            "ALPACA_SECRET_KEY": os.environ.get("ALPACA_SECRET_KEY", ""),
            "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
        },
    )


def _parse_json_result(result: Any) -> Any:
    """Extract the JSON payload from an MCP CallToolResult."""
    if hasattr(result, "content") and result.content:
        for item in result.content:
            if hasattr(item, "text"):
                try:
                    return json.loads(item.text)
                except (json.JSONDecodeError, TypeError):
                    return item.text
    return result


class MCPAlpacaClient:
    """Thin async wrapper around the Alpaca MCP server.

    Usage::

        async with MCPAlpacaClient() as client:
            account = await client.get_account()
            positions = await client.get_positions()
    """

    def __init__(self):
        self._session: Optional[ClientSession] = None
        self._cm: Any = None  # context-manager for stdio_client
        self._session_cm: Any = None

    # -- lifecycle -----------------------------------------------------------

    async def connect(self):
        if not MCP_AVAILABLE:
            raise RuntimeError("mcp package not installed")
        params = _server_params()
        if params is None:
            raise RuntimeError("Could not build StdioServerParameters")

        self._cm = stdio_client(params)
        read_stream, write_stream = await self._cm.__aenter__()
        self._session = ClientSession(read_stream, write_stream)
        self._session_cm = self._session.__aenter__()
        await self._session.initialize()

    async def close(self):
        try:
            if self._session_cm is not None:
                await self._session.__aexit__(None, None, None)
        except Exception:
            pass
        try:
            if self._cm is not None:
                await self._cm.__aexit__(None, None, None)
        except Exception:
            pass
        self._session = None
        self._cm = None
        self._session_cm = None

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, *exc):
        await self.close()

    # -- helpers -------------------------------------------------------------

    async def _call(self, tool_name: str, arguments: Optional[Dict[str, Any]] = None) -> Any:
        if self._session is None:
            raise RuntimeError("Not connected. Call connect() first.")
        result = await self._session.call_tool(tool_name, arguments or {})
        return _parse_json_result(result)

    # -- public API (mirrors server tools) -----------------------------------

    async def get_account(self) -> Dict[str, Any]:
        return await self._call("get_account")

    async def get_positions(self) -> List[Dict[str, Any]]:
        return await self._call("get_positions")

    async def get_order(self, order_id: str) -> Dict[str, Any]:
        return await self._call("get_order", {"order_id": order_id})

    async def submit_order(
        self,
        symbol: str,
        qty: int,
        side: str,
        order_type: str = "market",
        limit_price: Optional[str] = None,
        time_in_force: str = "day",
    ) -> Dict[str, Any]:
        return await self._call(
            "submit_order",
            {
                "symbol": symbol,
                "qty": qty,
                "side": side,
                "order_type": order_type,
                "limit_price": limit_price,
                "time_in_force": time_in_force,
            },
        )

    async def cancel_order(self, order_id: str) -> Dict[str, Any]:
        return await self._call("cancel_order", {"order_id": order_id})

    async def get_clock(self) -> Dict[str, Any]:
        return await self._call("get_clock")

    async def get_news(
        self, symbols: Optional[List[str]] = None, limit: int = 10
    ) -> List[Dict[str, Any]]:
        return await self._call("get_news", {"symbols": symbols, "limit": limit})
