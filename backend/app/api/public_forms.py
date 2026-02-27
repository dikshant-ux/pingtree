from fastapi import APIRouter, HTTPException
from app.models.form import LeadForm
from typing import Optional

router = APIRouter()

@router.get("/{id}")
async def get_public_form(id: str):
    form = await LeadForm.get(id)
    if not form or not form.is_active:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Return only what's needed for the public script
    return {
        "id": str(form.id),
        "title": form.title,
        "primary_color": form.primary_color,
        "click_id_configs": form.click_id_configs
    }
