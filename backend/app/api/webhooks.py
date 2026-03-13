from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel, Field

from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.webhook import Webhook

router = APIRouter()


class WebhookCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., min_length=1)
    is_active: bool = True
    content_type: str = Field(default="application/json", description="application/json or application/x-www-form-urlencoded")
    status_filters: List[str] = Field(default_factory=lambda: ["sold"])
    source_filters: List[str] = Field(default_factory=list)
    source_domain_filters: List[str] = Field(default_factory=list)
    headers: dict = Field(default_factory=dict)


class WebhookUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    is_active: bool | None = None
    content_type: str | None = None
    status_filters: List[str] | None = None
    source_filters: List[str] | None = None
    source_domain_filters: List[str] | None = None
    headers: dict | None = None


@router.get("/", response_model=List[Webhook])
async def list_webhooks(current_user: User = Depends(get_current_active_user)):
    """List all webhooks for the current user."""
    return await Webhook.find(Webhook.user_id == str(current_user.id)).to_list()


@router.post("/", response_model=Webhook)
async def create_webhook(
    data: WebhookCreate,
    current_user: User = Depends(get_current_active_user),
):
    """Create a new webhook."""
    wh = Webhook(
        user_id=str(current_user.id),
        name=data.name,
        url=data.url,
        is_active=data.is_active,
        content_type=data.content_type,
        status_filters=data.status_filters,
        source_filters=data.source_filters,
        source_domain_filters=data.source_domain_filters,
        headers=data.headers,
    )
    await wh.insert()
    return wh


@router.get("/{webhook_id}", response_model=Webhook)
async def get_webhook(
    webhook_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get a webhook by ID."""
    wh = await Webhook.get(webhook_id)
    if not wh or wh.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    return wh


@router.put("/{webhook_id}", response_model=Webhook)
async def update_webhook(
    webhook_id: str,
    data: WebhookUpdate,
    current_user: User = Depends(get_current_active_user),
):
    """Update a webhook."""
    wh = await Webhook.get(webhook_id)
    if not wh or wh.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    from datetime import datetime
    update_dict = data.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow()
    await wh.set(update_dict)
    return wh


@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Delete a webhook."""
    wh = await Webhook.get(webhook_id)
    if not wh or wh.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Webhook not found")
    await wh.delete()
    return {"status": "success"}
