from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security.http import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, verify_token, generate_api_key, hash_api_key
)
from app.models.schemas import (
    UserCreate, UserResponse, UserPreferences, APIKeyCreate, APIKeyResponse, UserLogin
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Extract and validate the logged-in user from JWT token."""
    token = credentials.credentials
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )
    user = await db_conn.users.find_one({"_id": ObjectId(token_data.user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found."
        )
    return user

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Register a new user account."""
    existing = await db_conn.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered."
        )

    password_hash = hash_password(user_data.password)
    user_doc = {
        "email": user_data.email,
        "password_hash": password_hash,
        "full_name": user_data.full_name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "subscription_tier": "free",
        "preferences": UserPreferences().model_dump()
    }
    
    result = await db_conn.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    return UserResponse(**user_doc)

@router.post("/login")
async def login(credentials: UserLogin, db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Login and obtain access + refresh tokens."""
    user = await db_conn.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    user_id_str = str(user["_id"])
    access_token = create_access_token(user_id_str, user["email"])
    refresh_token = create_refresh_token(user_id_str, user["email"])

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@router.post("/refresh")
async def refresh_token(refresh_token: str, db_conn: AsyncIOMotorDatabase = Depends(get_db)):
    """Exchange a valid refresh token for a new access token."""
    from jose import jwt as jose_jwt
    from app.core.config import settings

    try:
        payload = jose_jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token is not a refresh token."
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    token_data = verify_token(refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token."
        )

    user = await db_conn.users.find_one({"_id": ObjectId(token_data.user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found."
        )

    new_access_token = create_access_token(str(user["_id"]), user["email"])
    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": 86400
    }

@router.post("/api-key", response_model=APIKeyResponse)
async def create_user_api_key(
    key_data: APIKeyCreate,
    current_user = Depends(get_current_user),
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Generate a hashed, cryptographically secure API key for automation access."""
    key, key_hash = generate_api_key()
    expires_at = datetime.utcnow() + timedelta(days=key_data.expires_in_days)
    
    key_doc = {
        "user_id": ObjectId(current_user["_id"]),
        "api_key_hash": key_hash,
        "name": key_data.name,
        "created_at": datetime.utcnow(),
        "last_used_at": None,
        "is_active": True,
        "permissions": key_data.permissions,
        "expires_at": expires_at
    }

    result = await db_conn.api_keys.insert_one(key_doc)
    
    # Return plaintext api key only once in response
    return APIKeyResponse(
        _id=str(result.inserted_id),
        name=key_data.name,
        api_key=key,
        created_at=key_doc["created_at"],
        expires_at=expires_at
    )

async def verify_api_key(
    api_key: str,
    db_conn: AsyncIOMotorDatabase = Depends(get_db)
):
    """Verify an API key and return the associated user. Used by programmatic access."""
    key_hash = hash_api_key(api_key)
    key_doc = await db_conn.api_keys.find_one({
        "api_key_hash": key_hash,
        "is_active": True,
    })

    if not key_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key."
        )

    if key_doc.get("expires_at") and key_doc["expires_at"] < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired."
        )

    # Update last_used_at
    await db_conn.api_keys.update_one(
        {"_id": key_doc["_id"]},
        {"$set": {"last_used_at": datetime.utcnow()}}
    )

    user = await db_conn.users.find_one({"_id": key_doc["user_id"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found."
        )

    return user
