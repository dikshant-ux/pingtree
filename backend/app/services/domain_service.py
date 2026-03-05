import logging
from typing import Optional
from app.models.domain_mapping import DomainTokenMapping

logger = logging.getLogger(__name__)

class DomainService:
    @staticmethod
    def normalize_domain(domain: str) -> str:
        if not domain:
            return ""
        # Lowercase, trim, remove protocol if present, remove www.
        domain = domain.lower().strip()
        if "://" in domain:
            domain = domain.split("://")[1]
        if "/" in domain:
            domain = domain.split("/")[0]
        if domain.startswith("www."):
            domain = domain[4:]
        return domain

    async def get_token_for_domain(self, user_id: str, domain: str) -> Optional[str]:
        if not domain:
            return None
        
        normalized = self.normalize_domain(domain)
        mapping = await DomainTokenMapping.find_one(
            DomainTokenMapping.user_id == user_id,
            DomainTokenMapping.domain_name == normalized,
            DomainTokenMapping.is_active == True
        )
        
        if mapping:
            logger.info(f"Resolved API token '{mapping.api_token}' for domain '{normalized}'")
            return mapping.api_token
        
        return None

domain_service = DomainService()
