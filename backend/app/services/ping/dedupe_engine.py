from typing import Dict, Any
from app.db.redis import redis_client
from app.models.lead import Lead

class DuplicateDetectionEngine:
    @staticmethod
    async def is_duplicate(lead_data: Dict[str, Any], lookback_days: int = 30) -> bool:
        """
        Check for duplicates using Redis (fast) and optionally MongoDB (deep).
        Returns True if duplicate.
        """
        phone = lead_data.get("phone")
        email = lead_data.get("email")
        
        # 1. Redis Check (Fast)
        if phone:
            key = f"dedupe:phone:{phone}"
            if await redis_client.get(key):
                return True
        
        if email:
            key = f"dedupe:email:{email}"
            if await redis_client.get(key):
                return True
                
        # 2. MongoDB Check (Skip for now to optimize speed, or add if strict)
        # strict mode: count = await Lead.find(...).count()
        
        return False

    @staticmethod
    async def register_lead(lead_data: Dict[str, Any], lookback_days: int = 30):
        """
        Register lead in dedupe cache
        """
        phone = lead_data.get("phone")
        email = lead_data.get("email")
        ttl = lookback_days * 86400
        
        if phone:
            await redis_client.set(f"dedupe:phone:{phone}", "1", expire=ttl)
        if email:
            await redis_client.set(f"dedupe:email:{email}", "1", expire=ttl)
