from typing import Any
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

@router.get("/me")
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get current user profile including timezone preference."""
    return {
        "id":             str(current_user.id),
        "email":          current_user.email,
        "role":           current_user.role,
        "is_active":      current_user.is_active,
        "is_2fa_enabled": current_user.is_2fa_enabled,
        "timezone":       current_user.timezone,
    }


@router.patch("/me")
async def update_user_me(
    updates: UserTimezoneUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update current user's preferences (timezone)."""
    # Validate IANA timezone string
    if updates.timezone not in pytz.all_timezones_set:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid timezone: '{updates.timezone}'. Must be a valid IANA timezone string."
        )
    current_user.timezone = updates.timezone
    await current_user.save()
    return {"message": "Preferences updated.", "timezone": current_user.timezone}
