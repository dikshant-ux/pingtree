import redis.asyncio as redis
from app.core.config import settings

class RedisClient:
    def __init__(self):
        self.redis: redis.Redis = None

    async def connect(self):
        try:
            self.redis = await redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            # Ping to check connection immediately
            await self.redis.ping()
        except Exception as e:
            print(f"⚠️ Redis Connection Failed: {e}. Running in Fail-Open mode (No Caching/Throttling).")
            self.redis = None

    async def close(self):
        if self.redis:
            await self.redis.close()

    async def set(self, key: str, value: str, expire: int = None):
        if not self.redis: return
        try:
            await self.redis.set(key, value, ex=expire)
        except: pass

    async def get(self, key: str):
        if not self.redis: return None
        try:
            return await self.redis.get(key)
        except: return None
        
    async def incr(self, key: str):
        if not self.redis: return 1
        return await self.redis.incr(key)

    async def expire(self, key: str, seconds: int):
        if not self.redis: return
        await self.redis.expire(key, seconds)

    async def throttle_check(self, key: str, limit: int, window_seconds: int) -> bool:
        """
        Returns True if request is ALLOWED (count <= limit).
        Returns False if throttled.
        """
        if not self.redis:
            return True # Fail open
            
        try:
            # Simple fixed window counter
            # INCR returns the new value
            current = await self.redis.incr(key)
            if current == 1:
                await self.redis.expire(key, window_seconds)
            
            return current <= limit
        except Exception as e:
            # Fail open if Redis fails
            print(f"Redis throttle error: {e}")
            return True

redis_client = RedisClient()
