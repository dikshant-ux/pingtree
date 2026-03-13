import httpx
import logging
import hmac
import hashlib
import json
from datetime import datetime
from typing import Any, Dict, Optional
import asyncio
from app.models.lead import Lead, LeadStatus
from app.models.webhook import WebhookConfig, WebhookEvent
from app.models.sync_task import SyncTask, SyncTaskStatus

logger = logging.getLogger(__name__)

class IntegrationService:
    async def run_bulk_sync(self, user_id: str):
        """
        Background task that iterates through historical leads and dispatches them.
        """
        print(f"DEBUG: run_bulk_sync started for {user_id}")
        logger.info(f"Starting run_bulk_sync for user: {user_id}")
        try:
            # Small delay to ensure DB persistence from the main thread
            await asyncio.sleep(1.0)
            
            # Explicit dictionary find to avoid any Beanie-specific sugar issues in background
            task = await SyncTask.find_one({"user_id": user_id})
            if not task:
                logger.error(f"Sync task NOT FOUND in DB for user {user_id}. Terminating.")
                return

            logger.info(f"Worker check - Status: {task.status}, Processed: {task.processed_leads}/{task.total_leads}")

            if task.status != SyncTaskStatus.RUNNING:
                logger.warning(f"Worker aborting: status is {task.status} (expected RUNNING)")
                return

            # Ensure total_leads is accurate
            snapshot_time = task.started_at or datetime.utcnow()
            if task.total_leads == 0:
                task.total_leads = await Lead.find({"created_at": {"$lte": snapshot_time}}).count()
                logger.info(f"Recalculated total leads for snapshot: {task.total_leads}")
                await task.save()

            batch_size = 50
            while True:
                # Re-fetch task to check for external PAUSE/RESET
                task = await SyncTask.find_one({"user_id": user_id})
                if not task or task.status != SyncTaskStatus.RUNNING:
                    logger.info("Worker loop ending: task paused, reset, or missing.")
                    break
                
                # Query leads <= started_at AND > last_lead_id
                query = {"created_at": {"$lte": snapshot_time}}
                if task.last_lead_id:
                    from bson import ObjectId
                    query["_id"] = {"$gt": ObjectId(task.last_lead_id)}
                
                logger.info(f"Sync batch query: {query}")
                leads = await Lead.find(query).sort("_id").limit(batch_size).to_list()
                
                logger.info(f"Found {len(leads)} leads in this batch.")
                
                if not leads:
                    logger.info("No more leads found. Marking task as COMPLETED.")
                    task.status = SyncTaskStatus.COMPLETED
                    await task.save()
                    break
                
                for lead in leads:
                    # Re-check status before each lead to honor PAUSE immediately
                    task = await SyncTask.find_one({"user_id": user_id})
                    if not task or task.status != SyncTaskStatus.RUNNING:
                        logger.info(f"Loop interrupted: task is {task.status if task else 'missing'}")
                        return

                    # Determine event type
                    event_type = WebhookEvent.LEAD_REJECTED
                    if lead.status == LeadStatus.SOLD:
                        event_type = WebhookEvent.LEAD_SOLD
                    elif lead.status == LeadStatus.UNSOLD:
                        event_type = WebhookEvent.LEAD_UNSOLD
                    
                    # Dispatch to external webhooks
                    await self.dispatch_lead_event(str(lead.id), event_type)
                    
                    # Track progress
                    task.processed_leads += 1
                    task.last_lead_id = str(lead.id)
                    
                    # Atomic update: only touch progress fields, NOT status
                    if task.processed_leads % 5 == 0:
                        await task.set({
                            SyncTask.processed_leads: task.processed_leads,
                            SyncTask.last_lead_id: task.last_lead_id,
                            SyncTask.updated_at: datetime.utcnow()
                        })
                    
                    # Throttling delay
                    await asyncio.sleep(5.0)

                # Final batch save (atomic)
                await task.set({
                    SyncTask.processed_leads: task.processed_leads,
                    SyncTask.last_lead_id: task.last_lead_id,
                    SyncTask.updated_at: datetime.utcnow()
                })
                logger.info(f"Finished batch. Total processed: {task.processed_leads}")

        except Exception as e:
            logger.error(f"CRITICAL ERROR in run_bulk_sync: {str(e)}")
            if 'task' in locals() and task:
                # Here we explicitly WANT to update status
                await task.set({
                    SyncTask.status: SyncTaskStatus.FAILED,
                    SyncTask.error_message: str(e),
                    SyncTask.updated_at: datetime.utcnow()
                })

    async def dispatch_lead_event(self, lead_id: str, event_type: WebhookEvent):
        """
        Fetches the lead and dispatches data to all active webhooks subscribed to the event_type.
        Designed to be run as a FastAPI BackgroundTask.
        """
        try:
            lead = await Lead.get(lead_id)
            if not lead:
                logger.error(f"Lead {lead_id} not found for webhook dispatch")
                return

            # Find active webhooks for this event
            webhooks = await WebhookConfig.find(
                WebhookConfig.is_active == True,
                {"event_types": event_type}
            ).to_list()

            if not webhooks:
                return

            payload = {
                "event": event_type,
                "timestamp": datetime.utcnow().isoformat(),
                "lead_id": str(lead.id),
                "readable_id": lead.readable_id,
                "status": lead.status,
                "data": lead.lead_data,
                "auction": {
                    "buyer_id": lead.buyer_id,
                    "buyer_name": lead.buyer_name,
                    "price": lead.sold_price,
                    "redirect_url": lead.redirect_url
                },
                "metadata": {
                    "source_domain": lead.source_domain,
                    "created_at": lead.created_at.isoformat()
                }
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                for webhook in webhooks:
                    status_code = await self._send_webhook(client, webhook, payload)
                    
                    # Smart Backoff: If we hit a rate limit (429), sleep longer
                    if status_code == 429:
                        logger.warning("Rate limit hit (429). Backing off for 5 seconds...")
                        await asyncio.sleep(5.0)

        except Exception as e:
            logger.error(f"Error in dispatch_lead_event: {str(e)}", exc_info=True)

    async def dispatch_test_event(self, webhook_id: str):
        """
        Sends a mock lead payload to a specific webhook for testing purposes.
        """
        try:
            webhook = await WebhookConfig.get(webhook_id)
            if not webhook:
                logger.error(f"Webhook {webhook_id} not found for test dispatch")
                return

            payload = {
                "event": "test_connection",
                "timestamp": datetime.utcnow().isoformat(),
                "lead_id": "test_lead_123",
                "readable_id": "TEST-LEAD",
                "status": "sold",
                "data": {
                    "First_Name": "Test",
                    "Last_Name": "User",
                    "Email": "test@example.com",
                    "Phone": "+15550199"
                },
                "auction": {
                    "buyer_id": "buyer_999",
                    "buyer_name": "Test Alpha Buyer",
                    "price": 25.50,
                    "redirect_url": "https://pingtree.dev/test-success"
                },
                "metadata": {
                    "source_domain": "tester.pingtree.dev",
                    "created_at": datetime.utcnow().isoformat(),
                    "is_test": True
                }
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                await self._send_webhook(client, webhook, payload)

        except Exception as e:
            logger.error(f"Error in dispatch_test_event: {str(e)}", exc_info=True)

    async def _send_webhook(self, client: httpx.AsyncClient, webhook: WebhookConfig, payload: Dict[str, Any]) -> Optional[int]:
        headers = {"Content-Type": "application/json"}
        
        # Add HMAC signature if secret key is present
        if webhook.secret_key:
            signature = hmac.new(
                webhook.secret_key.encode(),
                json.dumps(payload).encode(),
                hashlib.sha256
            ).hexdigest()
            headers["X-PingTree-Signature"] = signature
            headers["X-PingTree-Event"] = payload.get("event", "unknown")

        try:
            response = await client.post(webhook.url, json=payload, headers=headers)
            if response.status_code >= 400:
                logger.warning(f"Webhook {webhook.name} returned {response.status_code} for lead {payload['lead_id']}")
                if response.status_code == 429:
                    print(f"RATE LIMIT: Webhook {webhook.name} is rate limiting us (429)")
            else:
                logger.info(f"Successfully dispatched webhook {webhook.name} for lead {payload['lead_id']}")
            return response.status_code
        except Exception as e:
            logger.error(f"Failed to send webhook {webhook.name}: {str(e)}")
            return None

integration_service = IntegrationService()
