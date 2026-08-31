import pytest
from app.core.security import hash_password, verify_password, verify_token

def test_password_hashing():
    pwd = "securepassword123"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed)
    assert not verify_password("wrongpassword", hashed)

def test_jwt_token_handling():
    user_id = "507f1f77bcf86cd799439011"
    email = "trader@quant.com"
    
    from app.core.security import create_access_token
    token = create_access_token(user_id, email)
    
    token_data = verify_token(token)
    assert token_data is not None
    assert token_data.user_id == user_id
    assert token_data.email == email
