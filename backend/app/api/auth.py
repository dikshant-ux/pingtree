from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, Body
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password, get_password_hash
from app.models.user import User
from app.core.config import settings
from app.api import deps
import pyotp
from pydantic import BaseModel, EmailStr

router = APIRouter()

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "admin"

class TwoFactorSetup(BaseModel):
    secret: str
    otpauth_url: str

class TwoFactorVerify(BaseModel):
    token: str

@router.post("/login/access-token", response_model=Token)
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    otp_code: Optional[str] = Form(None),
    remember_me: bool = Form(False)
):
    user = await User.find_one(User.email == form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # 2FA Check
    if user.is_2fa_enabled:
        if not otp_code:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, # Specific code to trigger 2FA prompt
                detail="2FA_REQUIRED",
            )
        
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(otp_code):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code",
            )

    if remember_me:
        access_token_expires = timedelta(days=30)
    else:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.email, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me/api-key")
async def get_api_key(
    current_user: User = Depends(deps.get_current_user)
):
    return {"api_key": current_user.api_key}

@router.post("/me/api-key/rotate")
async def rotate_api_key(
    current_user: User = Depends(deps.get_current_user)
):
    import secrets
    current_user.api_key = secrets.token_hex(32)
    await current_user.save()
    return {"api_key": current_user.api_key}

@router.post("/register", response_model=User)
async def register(user_in: UserCreate):
    # TODO: Add admin check dependency here
    existing_user = await User.find_one(User.email == user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    import secrets
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
        api_key=secrets.token_hex(32)
    )
    await user.create()
    return user

@router.post("/2fa/setup", response_model=TwoFactorSetup)
async def setup_2fa(
    current_user: User = Depends(deps.get_current_user)
):
    if current_user.is_2fa_enabled:
         raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    # Generate new secret if not exists or if re-setting up (though re-setup usually implies disabling first)
    # We will generate a fresh one for the setup flow
    secret = pyotp.random_base32()
    
    # Save secret temporarily? Or just return it and save only when verified?
    # Better to save it but keep is_2fa_enabled = False until verified.
    current_user.two_factor_secret = secret
    await current_user.save()

    otpauth_url = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email, 
        issuer_name="PingTree App"
    )

    return {"secret": secret, "otpauth_url": otpauth_url}

@router.post("/2fa/enable")
async def enable_2fa(
    verify_data: TwoFactorVerify,
    current_user: User = Depends(deps.get_current_user)
):
    if current_user.is_2fa_enabled:
         raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    if not current_user.two_factor_secret:
         raise HTTPException(status_code=400, detail="2FA setup not initiated")

    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(verify_data.token):
         raise HTTPException(status_code=400, detail="Invalid code")
    
    current_user.is_2fa_enabled = True
    await current_user.save()
    return {"message": "2FA enabled successfully"}

class TwoFactorDisable(BaseModel):
    password: str

@router.post("/2fa/disable")
async def disable_2fa(
    disable_data: TwoFactorDisable,
    current_user: User = Depends(deps.get_current_user)
):
    if not current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    if not verify_password(disable_data.password, current_user.password_hash):
         raise HTTPException(status_code=400, detail="Invalid password")

    current_user.is_2fa_enabled = False
    current_user.two_factor_secret = None
    await current_user.save()
    return {"message": "2FA disabled successfully"}

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(deps.get_current_user)
):
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.password_hash = get_password_hash(password_data.new_password)
    await current_user.save()
    return {"message": "Password updated successfully"}
