from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.validation import LeadValidationConfig

router = APIRouter()

@router.get("/", response_model=List[LeadValidationConfig])
async def get_validation_configs(
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve all validation configurations for the current user."""
    return await LeadValidationConfig.find(LeadValidationConfig.user_id == str(current_user.id)).to_list()

@router.post("/", response_model=LeadValidationConfig)
async def create_validation_config(
    config_data: LeadValidationConfig,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new validation configuration."""
    config_data.user_id = str(current_user.id)
    await config_data.insert()
    return config_data

@router.get("/{config_id}", response_model=LeadValidationConfig)
async def get_validation_config(
    config_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve a specific validation configuration."""
    config = await LeadValidationConfig.get(config_id)
    if not config or config.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Configuration not found")
    return config

@router.put("/{config_id}", response_model=LeadValidationConfig)
async def update_validation_config(
    config_id: str,
    config_update: LeadValidationConfig,
    current_user: User = Depends(get_current_active_user)
):
    """Update a validation configuration."""
    config = await LeadValidationConfig.get(config_id)
    if not config or config.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    # Update fields manually to avoid overwriting user_id or ID
    update_data = config_update.dict(exclude={"id", "user_id", "created_at"})
    await config.set(update_data)
    return config

@router.delete("/{config_id}")
async def delete_validation_config(
    config_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a validation configuration."""
    config = await LeadValidationConfig.get(config_id)
    if not config or config.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    await config.delete()
    return {"status": "success"}

@router.post("/{config_id}/toggle")
async def toggle_validation_config(
    config_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Toggle the enabled status of a validation configuration."""
    config = await LeadValidationConfig.get(config_id)
    if not config or config.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Configuration not found")
    
    config.is_active = not config.is_active
    await config.save()
    return {"status": "success", "is_active": config.is_active}
