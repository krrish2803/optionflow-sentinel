from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # JWT & Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    JWT_REFRESH_EXPIRATION_DAYS: int = 7
    ENCRYPTION_KEY: str

    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "optionflow_sentinel"

    # Alpaca API Credentials
    ALPACA_API_KEY: Optional[str] = None
    ALPACA_SECRET_KEY: Optional[str] = None
    ALPACA_BASE_URL: str = "https://paper-api.alpaca.markets"

    # NVIDIA / GPU Inference
    USE_GPU: bool = True
    GPU_DEVICE: int = 0
    NVIDIA_API_KEY: Optional[str] = None
    NVIDIA_ENDPOINT: str = "https://integrate.api.nvidia.com/v1"
    LLM_MODEL: str = "meta/llama-3.1-70b-instruct"

    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
