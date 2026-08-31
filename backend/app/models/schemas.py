from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Literal, List, Dict, Any

class UserPreferences(BaseModel):
    notification_email: bool = True
    max_risk_per_trade: float = 0.02  # 2% of portfolio
    portfolio_heat_limit: float = 0.50  # 50% max heat
    max_trades_per_day: int = 5
    # Per-Trade Greeks limits
    max_trade_delta: float = 0.30
    max_trade_gamma: float = 0.15
    max_trade_vega: float = 0.25
    min_trade_theta: float = 0.05
    # Portfolio Greeks limits
    max_portfolio_delta: float = 0.50
    max_portfolio_gamma: float = 0.30
    max_portfolio_vega: float = 0.40


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=1)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    password_hash: str
    full_name: str
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    subscription_tier: Literal["free", "pro", "enterprise"] = "free"
    preferences: UserPreferences

    class Config:
        populate_by_name = True

class UserResponse(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    full_name: str
    created_at: datetime
    subscription_tier: str
    preferences: UserPreferences

    class Config:
        populate_by_name = True

class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1)
    permissions: List[Literal["read_portfolio", "execute_trades", "admin"]] = ["read_portfolio"]
    expires_in_days: int = 365

class APIKeyResponse(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    api_key: str  # Plaintext key returned only once upon creation
    created_at: datetime
    expires_at: datetime

    class Config:
        populate_by_name = True

class APIKeyInDB(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    api_key_hash: str
    name: str
    created_at: datetime
    last_used_at: Optional[datetime] = None
    is_active: bool = True
    permissions: List[str]
    expires_at: datetime

    class Config:
        populate_by_name = True

class TradingAccountCreate(BaseModel):
    account_name: str = Field(..., min_length=1)
    alpaca_api_key: str = Field(..., min_length=1)
    alpaca_secret_key: str = Field(..., min_length=1)
    is_paper_trading: bool = True

class TradingAccountResponse(BaseModel):
    id: str = Field(..., alias="_id")
    account_id: str
    account_name: str
    broker: str = "alpaca"
    is_paper_trading: bool
    status: str
    created_at: datetime

    class Config:
        populate_by_name = True
