import httpx
import logging
from typing import Dict, Any, Optional
from app.models.validation import LeadValidationConfig

logger = logging.getLogger(__name__)

class ValidatorService:
    async def validate_lead(
        self, 
        config: LeadValidationConfig, 
        lead_data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Executes external validation for a lead.
        Returns True if valid, False otherwise.
        """
        if not config.is_active:
            return True

        # 1. Prepare parameters
        params = config.static_params.copy()
        
        # Add mapped parameters from lead_data
        for lead_field, api_param in config.param_mappings.items():
            if lead_field in lead_data:
                params[api_param] = lead_data[lead_field]
            elif metadata and lead_field in metadata:
                params[api_param] = metadata[lead_field]

        # 2. Add API Key if present
        if config.api_key:
            params["api_key"] = config.api_key

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                if config.method.upper() == "GET":
                    response = await client.get(config.api_url, params=params)
                else:
                    response = await client.post(config.api_url, json=params)

                if response.status_code != 200:
                    logger.error(f"Validator API returned status {response.status_code}: {response.text}")
                    # In case of API error, we might decide to fail-safe (accept) or fail-secure (reject)
                    # For now, let's accept to avoid blocking business if the validator is down
                    return True

                result = response.json()
                
                # 3. Evaluate Success Criteria
                # We expect response to be a dict. Check the field value.
                actual_value = result.get(config.success_criteria_field)
                
                # Handle case-insensitive comparison for "valid"
                if str(actual_value).lower() == str(config.success_criteria_value).lower():
                    return True
                
                logger.info(f"Lead rejected by validator. Expected {config.success_criteria_field}={config.success_criteria_value}, got {actual_value}")
                return False

        except Exception as e:
            logger.error(f"Error during lead validation: {str(e)}")
            # Fail-safe: if validator service is down, let the lead through
            return True

validator_service = ValidatorService()
