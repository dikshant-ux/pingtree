import httpx
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class HttpClientManager:
    """
    Manages a global httpx.AsyncClient to be reused across all requests.
    Reusing the client enables HTTP keep-alive, preventing the massive overhead
    of creating a new TCP/SSL handshake for every ping/post when handling 1L requests.
    """
    _client: Optional[httpx.AsyncClient] = None

    @classmethod
    def get_client(cls) -> httpx.AsyncClient:
        if cls._client is None:
            # Note: HTTPX's default pool limits are 100 max_connections, 10 max_keepalive_connections.
            # We increase these significantly to handle high concurrency.
            limits = httpx.Limits(max_connections=500, max_keepalive_connections=100)
            cls._client = httpx.AsyncClient(limits=limits, timeout=20.0)
            logger.info("Global HTTPX AsyncClient initialized with high concurrency limits.")
        return cls._client

    @classmethod
    async def close(cls):
        if cls._client is not None:
            await cls._client.aclose()
            cls._client = None
            logger.info("Global HTTPX AsyncClient closed.")

http_client_manager = HttpClientManager()
