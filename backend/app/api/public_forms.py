from fastapi import APIRouter, HTTPException
from app.models.form import LeadForm
from app.core.config import settings
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
        "style": getattr(form, 'style', 'multi-step'),
        "recaptcha_enabled": getattr(form, 'recaptcha_enabled', False),
        "recaptcha_site_key": form.recaptcha_site_key or settings.RECAPTCHA_SITE_KEY,
        "click_id_configs": form.click_id_configs
    }
