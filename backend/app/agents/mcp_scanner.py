import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

async def fetch_market_news_via_mcp(symbol: str) -> str:
    """
    Connects to the official Alpaca MCP Server to retrieve real-time market news.
    Falls back to mock news if MCP is unavailable or times out.
    """
    try:
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client
        
        server_params = StdioServerParameters(
            command="npx",
            args=["-y", "@alpacahq/alpaca-mcp-server"],
            env={
                "ALPACA_API_KEY": settings.ALPACA_API_KEY or "",
                "ALPACA_SECRET_KEY": settings.ALPACA_SECRET_KEY or "",
                "PATH": "/usr/local/bin:/usr/bin:/bin"
            }
        )
        
        logger.info(f"Spawning Alpaca MCP Server to fetch news for {symbol}...")
        
        async with asyncio.timeout(10):
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool("get_news", arguments={"symbols": [symbol], "limit": 3})
                    news_content = "\n".join([item.text for item in result.content])
                    return news_content

    except asyncio.TimeoutError:
        logger.warning("MCP server timed out. Using mock news.")
        return f"Mock News: Market sentiment neutral for {symbol}. Moderate volume detected."
    except ImportError:
        logger.warning("MCP SDK not installed. Falling back to mock news.")
        return f"Mock News: Volatility expected for {symbol}."
    except Exception as e:
        logger.error(f"Alpaca MCP Server error: {e}. Using mock news.")
        return f"Mock News: {symbol} showing elevated activity. Market sentiment cautiously bullish."

