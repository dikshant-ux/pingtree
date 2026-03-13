from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from datetime import datetime
from app.models.webhook import WebhookConfig, WebhookEvent
from app.services.integration_service import integration_service
from pydantic import BaseModel, HttpUrl

router = APIRouter()

class WebhookCreate(BaseModel):
    name: str
    url: str
    event_types: List[WebhookEvent]
    secret_key: Optional[str] = None
    is_active: bool = True

class WebhookUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    event_types: Optional[List[WebhookEvent]] = None
    secret_key: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/", response_model=List[WebhookConfig])
async def get_webhooks():
    return await WebhookConfig.find_all().to_list()

@router.post("/", response_model=WebhookConfig)
async def create_webhook(webhook: WebhookCreate):
    new_webhook = WebhookConfig(**webhook.dict())
    await new_webhook.insert()
    return new_webhook

@router.put("/{webhook_id}", response_model=WebhookConfig)
async def update_webhook(webhook_id: str, webhook_update: WebhookUpdate):
    webhook = await WebhookConfig.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    update_data = webhook_update.dict(exclude_unset=True)
    await webhook.set(update_data)
    return webhook

@router.delete("/{webhook_id}")
async def delete_webhook(webhook_id: str):
    webhook = await WebhookConfig.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    await webhook.delete()
    return {"message": "Webhook deleted"}

from app.models.sync_task import SyncTask, SyncTaskStatus
from app.models.lead import Lead

@router.get("/sync/status")
async def get_sync_status():
    task = await SyncTask.find_one({"user_id": "system"})
    if not task:
        return {"status": "idle", "processed_leads": 0, "total_leads": 0}
    return task

@router.post("/sync/start")
async def start_sync(background_tasks: BackgroundTasks):
    task = await SyncTask.find_one({"user_id": "system"})
    now = datetime.utcnow()
    
    if not task:
        total = await Lead.find({"created_at": {"$lte": now}}).count()
        task = SyncTask(
            user_id="system", 
            total_leads=total, 
            status=SyncTaskStatus.RUNNING,
            started_at=now
        )
        await task.insert()
    else:
        if task.status == SyncTaskStatus.RUNNING:
            return {"message": "Sync already running"}
        
        # If it's a fresh start (processed_leads == 0), set the boundary now
        if task.processed_leads == 0:
             task.started_at = now
             task.total_leads = await Lead.find({"created_at": {"$lte": now}}).count()
             task.last_lead_id = None
        
        # Ensure started_at exists even for old tasks
        if not task.started_at:
             task.started_at = now
             task.total_leads = await Lead.find({"created_at": {"$lte": now}}).count()

        task.status = SyncTaskStatus.RUNNING
        task.updated_at = now
        await task.save()

    background_tasks.add_task(integration_service.run_bulk_sync, task.user_id)
    return {"message": "Sync started", "task": task}

@router.post("/sync/pause")
async def pause_sync():
    task = await SyncTask.find_one({"user_id": "system"})
    if not task:
        raise HTTPException(status_code=404, detail="No sync task found")
    
    task.status = SyncTaskStatus.PAUSED
    task.updated_at = datetime.utcnow()
    await task.save()
    return {"message": "Sync paused", "task": task}

@router.post("/sync/reset")
async def reset_sync():
    task = await SyncTask.find_one({"user_id": "system"})
    if task:
        now = datetime.utcnow()
        task.status = SyncTaskStatus.IDLE
        task.processed_leads = 0
        task.last_lead_id = None
        task.started_at = now
        task.total_leads = await Lead.find({"created_at": {"$lte": now}}).count()
        task.updated_at = now
        await task.save()
    return {"message": "Sync reset", "task": task}

@router.post("/{webhook_id}/test")
async def test_webhook(webhook_id: str, background_tasks: BackgroundTasks):
    webhook = await WebhookConfig.get(webhook_id)
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    # Trigger actual mock dispatch in the background
    background_tasks.add_task(integration_service.dispatch_test_event, str(webhook.id))
    
    return {"message": f"Test event queued for {webhook.name}"}
