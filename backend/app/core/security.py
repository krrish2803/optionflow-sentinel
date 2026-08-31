import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
from pydantic import BaseModel
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _get_cipher():
    """Lazy-init Fernet cipher to avoid crash at import time if ENCRYPTION_KEY is unset."""
    from app.core.config import settings
    return Fernet(settings.ENCRYPTION_KEY.encode())


class TokenData(BaseModel):
    user_id: str
    email: str
    exp: datetime

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify password against bcrypt hash."""
    return pwd_context.verify(plain_password, password_hash)

def create_access_token(user_id: str, email: str) -> str:
    """Generate JWT access token."""
    expires = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expires.timestamp(),
        "iat": datetime.utcnow().timestamp(),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(user_id: str, email: str) -> str:
    """Generate JWT refresh token."""
    expires = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_EXPIRATION_DAYS)
    payload = {
        "user_id": user_id,
        "email": email,
        "type": "refresh",
        "exp": expires.timestamp(),
        "iat": datetime.utcnow().timestamp(),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_token(token: str) -> Optional[TokenData]:
    """Verify JWT token and extract TokenData."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("user_id")
        email: str = payload.get("email")
        exp_timestamp = payload.get("exp")
        if user_id is None or email is None or exp_timestamp is None:
            return None
        return TokenData(user_id=user_id, email=email, exp=datetime.fromtimestamp(exp_timestamp))
    except JWTError:
        return None

def generate_api_key() -> Tuple[str, str]:
    """Generate an API key and its hash."""
    key = f"sk_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    return key, key_hash

def hash_api_key(key: str) -> str:
    """Hash an existing API key for verification lookup."""
    return hashlib.sha256(key.encode()).hexdigest()

def encrypt_api_key(key: str) -> str:
    """Encrypt sensitive credentials before storing in MongoDB."""
    return _get_cipher().encrypt(key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt sensitive credentials after retrieving from MongoDB."""
    return _get_cipher().decrypt(encrypted_key.encode()).decode()
