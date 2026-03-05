from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_current_user
from app.models.user import User
from app.models.domain_mapping import DomainTokenMapping
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class DomainMappingCreate(BaseModel):
    domain_name: str
    api_token: str

@router.get("/", response_model=List[DomainTokenMapping])
async def get_domain_mappings(current_user: User = Depends(get_current_user)):
    return await DomainTokenMapping.find(DomainTokenMapping.user_id == str(current_user.id)).to_list()

@router.post("/", response_model=DomainTokenMapping)
async def create_domain_mapping(
    mapping: DomainMappingCreate,
    current_user: User = Depends(get_current_user)
):
    # Normalize domain name
    from app.services.domain_service import domain_service
    normalized = domain_service.normalize_domain(mapping.domain_name)
    
    # Check if exists
    existing = await DomainTokenMapping.find_one(
        DomainTokenMapping.user_id == str(current_user.id),
        DomainTokenMapping.domain_name == normalized
    )
    if existing:
        existing.api_token = mapping.api_token
        existing.updated_at = datetime.utcnow()
        await existing.save()
        return existing

    new_mapping = DomainTokenMapping(
        user_id=str(current_user.id),
        domain_name=normalized,
        api_token=mapping.api_token
    )
    await new_mapping.create()
    return new_mapping

@router.delete("/{mapping_id}")
async def delete_domain_mapping(
    mapping_id: str,
    current_user: User = Depends(get_current_user)
):
    mapping = await DomainTokenMapping.get(mapping_id)
    if not mapping or mapping.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    await mapping.delete()
    return {"status": "success"}
