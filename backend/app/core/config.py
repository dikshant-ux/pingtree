from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Ping Tree Platform"
    
    # DATABASE
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "pingtree_db"
    
    # REDIS
    REDIS_URL: str = "redis://localhost:6379"
    
    # SECURITY
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    BASE_URL: str = "https://js.trustedagentforyou.com"
    FRONTEND_URL: str = "https://js.trustedagentforyou.com"
    
    # RECAPTCHA
    RECAPTCHA_SITE_KEY: str = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" # Default test key
    RECAPTCHA_SECRET_KEY: str = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe" # Default test key
    
    
    class Config:
        env_file = ".env"

settings = Settings()
