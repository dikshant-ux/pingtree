from fastapi import APIRouter, Depends, HTTPException, Body
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.form import LeadForm
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class LeadFormCreate(BaseModel):
    name: str
    title: str
    primary_color: str = "#28a745"
    allowed_domains: List[str] = []
    reject_redirect_url: Optional[str] = None

class LeadFormUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    primary_color: Optional[str] = None
    allowed_domains: Optional[List[str]] = None
    is_active: Optional[bool] = None
    reject_redirect_url: Optional[str] = None

@router.get("/", response_model=List[LeadForm])
async def get_forms(current_user: User = Depends(get_current_active_user)):
    return await LeadForm.find(LeadForm.user_id == str(current_user.id)).to_list()

@router.post("/", response_model=LeadForm)
async def create_form(
    form_in: LeadFormCreate,
    current_user: User = Depends(get_current_active_user)
):
    form = LeadForm(
        user_id=str(current_user.id),
        **form_in.dict()
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
    
    update_data = form_in.dict(exclude_unset=True)
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
