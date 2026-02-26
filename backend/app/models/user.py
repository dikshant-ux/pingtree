from typing import Optional
from beanie import Document
from pydantic import EmailStr, Field
from datetime import datetime

class User(Document):
    email: EmailStr = Field(unique=True)
    password_hash: str
    role: str = "admin" # admin, super_admin
    is_active: bool = True
    two_factor_secret: Optional[str] = None
    is_2fa_enabled: bool = False
    api_key: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
