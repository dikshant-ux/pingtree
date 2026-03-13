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
    @staticmethod
    async def run_bulk_sync(user_id: str):
        """
        Background task that iterates through historical leads and dispatches them.
        """
        try:
            task = await SyncTask.find_one(SyncTask.user_id == user_id)
            if not task or task.status != SyncTaskStatus.RUNNING:
                return

            if task.total_leads == 0:
                task.total_leads = await Lead.count()
                await task.save()

            batch_size = 50
            
            while True:
                # Refresh task state to check for PAUSE
                task = await SyncTask.find_one(SyncTask.user_id == user_id)
                if not task or task.status != SyncTaskStatus.RUNNING:
                    logger.info(f"Bulk sync for user {user_id} stopped or paused.")
                    break
                
            while True:
                # Refresh task state to check for PAUSE
                task = await SyncTask.find_one(SyncTask.user_id == user_id)
                if not task or task.status != SyncTaskStatus.RUNNING:
                    logger.info(f"Bulk sync for user {user_id} stopped or paused.")
                    break
                
                # Fetch next batch: Leads created before started_at AND after last_lead_id
                query = {"created_at": {"$lte": task.started_at}}
                if task.last_lead_id:
                    from bson import ObjectId
                    query["_id"] = {"$gt": ObjectId(task.last_lead_id)}
                
                leads = await Lead.find(query).sort("_id").limit(batch_size).to_list()
                
                if not leads:
                    task.status = SyncTaskStatus.COMPLETED
                    await task.save()
                    logger.info(f"Bulk sync for user {user_id} completed.")
                    break
                
                for lead in leads:
                    # Double check status before each lead for immediate pause
                    # (Optimization: check every 5 leads if high volume)
                    
                    # Determine event type
                    event_type = WebhookEvent.LEAD_REJECTED
                    if lead.status == LeadStatus.SOLD:
                        event_type = WebhookEvent.LEAD_SOLD
                    elif lead.status == LeadStatus.UNSOLD:
                        event_type = WebhookEvent.LEAD_UNSOLD
                    
                    # Dispatch
                    await IntegrationService.dispatch_lead_event(str(lead.id), event_type)
                    
                    # Update task state
                    task.processed_leads += 1
                    task.last_lead_id = str(lead.id)
                    
                    # Save progress every 5 leads to avoid DB overhead but keep UI lively
                    if task.processed_leads % 5 == 0:
                        await task.save()
                        # Small sleep to yield and prevent blocking event loop entirely
                        await asyncio.sleep(0.01)

                await task.save()

        except Exception as e:
            logger.error(f"Error in run_bulk_sync: {str(e)}", exc_info=True)
            if 'task' in locals():
                task.status = SyncTaskStatus.FAILED
                task.error_message = str(e)
                await task.save()

    @staticmethod
    async def dispatch_lead_event(lead_id: str, event_type: WebhookEvent):
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
                    await IntegrationService._send_webhook(client, webhook, payload)

        except Exception as e:
            logger.error(f"Error in dispatch_lead_event: {str(e)}", exc_info=True)

    @staticmethod
    async def dispatch_test_event(webhook_id: str):
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
                await IntegrationService._send_webhook(client, webhook, payload)

        except Exception as e:
            logger.error(f"Error in dispatch_test_event: {str(e)}", exc_info=True)

    @staticmethod
    async def _send_webhook(client: httpx.AsyncClient, webhook: WebhookConfig, payload: Dict[str, Any]):
        headers = {"Content-Type": "application/json"}
        
        # Add HMAC signature if secret key is present
        if webhook.secret_key:
            signature = hmac.new(
                webhook.secret_key.encode(),
                json.dumps(payload).encode(),
                hashlib.sha256
            ).hexdigest()
            headers["X-PingTree-Signature"] = signature

        try:
            response = await client.post(webhook.url, json=payload, headers=headers)
            if response.status_code >= 400:
                logger.warning(f"Webhook {webhook.name} returned {response.status_code} for lead {payload['lead_id']}")
            else:
                logger.info(f"Successfully dispatched webhook {webhook.name} for lead {payload['lead_id']}")
        except Exception as e:
            logger.error(f"Failed to send webhook {webhook.name}: {str(e)}")

integration_service = IntegrationService()
