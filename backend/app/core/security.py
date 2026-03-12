from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

import hashlib

def _pre_hash(password: str) -> str:
    # BCRYPT has a 72 byte limit on password length.
    # To support longer passwords, we pre-hash with SHA256 (returns 64 hex chars).
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not plain_password or not hashed_password:
            return False
        
        # Consistent pre-hashing handles any length
        plain_password = _pre_hash(plain_password)
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"DEBUG: verify_password error: {e}")
        return False

def get_password_hash(password: str) -> str:
    # Always pre-hash
    password = _pre_hash(password)
    return pwd_context.hash(password)

import base64
from cryptography.fernet import Fernet

def _get_fernet_key() -> bytes:
    # Derive a valid Fernet key from the application's SECRET_KEY
    key_material = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key_material)

def encrypt_secret(plain_text: str) -> str:
    if not plain_text:
        return ""
    f = Fernet(_get_fernet_key())
    return f.encrypt(plain_text.encode()).decode()

def decrypt_secret(encrypted_text: str) -> str:
    if not encrypted_text:
        return ""
    try:
        f = Fernet(_get_fernet_key())
        return f.decrypt(encrypted_text.encode()).decode()
    except Exception as e:
        print(f"DEBUG: decrypt_secret error: {e}")
        return ""
