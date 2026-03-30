from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api import deps
from app.models.user import User
import pytz

router = APIRouter()

# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class UserTimezoneUpdate(BaseModel):
    timezone: str

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=User)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get current user (includes email, role, timezone, etc.)"""
    return current_user


@router.patch("/me")
async def update_user_me(
    updates: UserTimezoneUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update current user's preferences (timezone)."""
    # Validate that the timezone string is a valid IANA zone
    if updates.timezone not in pytz.all_timezones_set:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid timezone: '{updates.timezone}'. Must be a valid IANA timezone."
        )
    current_user.timezone = updates.timezone
    await current_user.save()
    return {"message": "Preferences updated.", "timezone": current_user.timezone}
