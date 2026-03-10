import httpx
import logging
from typing import Dict, Any, Optional, Tuple
from app.models.validation import LeadValidationConfig

logger = logging.getLogger(__name__)

class ValidatorService:
    async def validate_lead(
        self, 
        config: LeadValidationConfig, 
        lead_data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Executes external validation for a lead.
        Returns (is_valid, response_body).
        """
        if not config.is_active:
            return True, {"status": "inactive", "message": "Validator is disabled"}

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
            headers = {
                "Origin": "https://pingtree.vellko.com/",
                "Referer": "https://pingtree.vellko.com/"
            }
            async with httpx.AsyncClient(timeout=20.0) as client:
                if config.method.upper() == "GET":
                    response = await client.get(config.api_url, params=params, headers=headers)
                else:
                    response = await client.post(config.api_url, json=params, headers=headers)

                logger.info(f"Validator Request URL: {response.url}")
                logger.info(f"Validator Response ({response.status_code}): {response.text}")

                resp_text = response.text
                try:
                    result = response.json()
                except:
                    result = {"raw": resp_text}

                if response.status_code != 200:
                    logger.error(f"Validator API returned status {response.status_code}: {response.text}")
                    # In case of API error, we might decide to fail-secure (reject)
                    # For now, let's reject if the validator is down
                    return False, {"error": f"API returned {response.status_code}", "body": result}

                
                # 3. Evaluate Success Criteria
                # We expect response to be a dict. Check the field value.
                actual_value = result.get(config.success_criteria_field)
                
                # Handle case-insensitive comparison for "valid"
                is_valid = str(actual_value).lower() == str(config.success_criteria_value).lower()
                
                return is_valid, result

        except httpx.TimeoutException:
            logger.error(f"Timeout during lead validation for URL: {config.api_url}")
            return False, {"error": "validator_timeout"}
        except Exception as e:
            logger.error(f"Error during lead validation: {str(e)}")
            # Fail-safe: if validator service is down, let the lead through
            return False, {"error": str(e)}

validator_service = ValidatorService()
