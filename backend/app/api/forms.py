from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.form import LeadForm, ClickIdConfig
from app.models.lead import LeadStatus
from app.core.security import encrypt_secret
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class LeadFormCreate(BaseModel):
    name: str
    title: str
    primary_color: str = "#28a745"
    style: str = "multi-step"
    allowed_domains: List[str] = []
    recaptcha_enabled: bool = False
    recaptcha_site_key: Optional[str] = None
    recaptcha_secret_key: Optional[str] = None
    reject_redirect_url: Optional[str] = None
    click_id_configs: List[ClickIdConfig] = []

class LeadFormUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    primary_color: Optional[str] = None
    style: Optional[str] = None
    allowed_domains: Optional[List[str]] = None
    is_active: Optional[bool] = None
    recaptcha_enabled: Optional[bool] = None
    recaptcha_site_key: Optional[str] = None
    recaptcha_secret_key: Optional[str] = None
    reject_redirect_url: Optional[str] = None
    click_id_configs: Optional[List[ClickIdConfig]] = None

@router.get("/", response_model=List[LeadForm])
async def get_forms(current_user: User = Depends(get_current_active_user)):
    return await LeadForm.find(LeadForm.user_id == str(current_user.id)).to_list()

@router.post("/", response_model=LeadForm)
async def create_form(
    form_in: LeadFormCreate,
    current_user: User = Depends(get_current_active_user)
):
    form_dict = form_in.model_dump()
    secret_key = form_dict.pop("recaptcha_secret_key", None)
    
    form = LeadForm(
        **form_dict,
        user_id=str(current_user.id),
        encrypted_recaptcha_secret_key=encrypt_secret(secret_key) if secret_key else None
    )
    await form.insert()
    return form

@router.get("/{id}", response_model=LeadForm)
async def get_form(id: str, current_user: User = Depends(get_current_active_user)):
    form = await LeadForm.get(id)
    if not form or form.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@router.patch("/{id}", response_model=LeadForm)
async def update_form(
    id: str,
    form_in: LeadFormUpdate,
    current_user: User = Depends(get_current_active_user)
):
    form = await LeadForm.get(id)
    if not form or form.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Form not found")
    
    update_data = form_in.model_dump(exclude_unset=True)
    if "recaptcha_secret_key" in update_data:
        secret_key = update_data.pop("recaptcha_secret_key")
        update_data["encrypted_recaptcha_secret_key"] = encrypt_secret(secret_key) if secret_key else None
        
    for field, value in update_data.items():
        setattr(form, field, value)
    
    await form.save()
    return form

@router.delete("/{id}")
async def delete_form(id: str, current_user: User = Depends(get_current_active_user)):
    form = await LeadForm.get(id)
    if not form or form.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Form not found")
    
    await form.delete()
    return {"status": "success"}
