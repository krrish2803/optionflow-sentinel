import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def run_llm_inference(prompt: str) -> str:
    """Execute LLM inference. Uses NVIDIA-optimized endpoints."""
    if not settings.NVIDIA_API_KEY:
        raise ValueError("NVIDIA_API_KEY is not set. Real LLM inference requires a valid API key.")
        
    try:
        logger.info(f"Calling NVIDIA optimized inference API... using model {settings.LLM_MODEL}")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.NVIDIA_ENDPOINT}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 2048,
                }
            )
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                logger.error(f"NVIDIA API error {response.status_code}: {response.text}")
                raise RuntimeError(f"LLM API returned {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Failed calling NVIDIA API: {e}")
        raise e
