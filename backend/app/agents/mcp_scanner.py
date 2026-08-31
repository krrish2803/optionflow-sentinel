import logging
import asyncio
from app.core.config import settings

logger = logging.getLogger(__name__)

async def fetch_market_news_via_mcp(symbol: str) -> str:
    """
    Connects to the official Alpaca MCP Server to retrieve real-time market news.
    This demonstrates explicit MCP (Model Context Protocol) integration.
    """
    try:
        # We use langchain_mcp to dynamically load tools from the Alpaca MCP server
        from mcp import ClientSession, StdioServerParameters
        from mcp.client.stdio import stdio_client
        
        server_params = StdioServerParameters(
            command="npx",
            args=["-y", "@alpacahq/alpaca-mcp-server"],
            env={
                "ALPACA_API_KEY": settings.ALPACA_API_KEY,
                "ALPACA_SECRET_KEY": settings.ALPACA_SECRET_KEY,
                "PATH": "/usr/local/bin:/usr/bin:/bin"
            }
        )
        
        logger.info(f"Spawning Alpaca MCP Server to fetch news for {symbol}...")
        
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Execute the get_news tool exposed by Alpaca MCP
                result = await session.call_tool("get_news", arguments={"symbols": [symbol], "limit": 3})
                
                # Parse the MCP tool result
                news_content = "\n".join([item.text for item in result.content])
                return news_content

    except ImportError:
        logger.warning("MCP SDK not installed. Falling back to basic scanner logic.")
        return f"Mock News: Volatility expected for {symbol}."
    except Exception as e:
        logger.error(f"Alpaca MCP Server error: {e}")
        return f"Error fetching MCP news: {e}"

