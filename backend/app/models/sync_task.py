from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum

class SyncTaskStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class SyncTask(Document):
    user_id: str
    total_leads: int = 0
    processed_leads: int = 0
    status: SyncTaskStatus = SyncTaskStatus.IDLE
    last_lead_id: Optional[str] = None
    started_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    error_message: Optional[str] = None

    class Settings:
        name = "sync_tasks"
