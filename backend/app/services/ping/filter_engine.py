from typing import Dict, Any, Tuple, Optional
from datetime import datetime
from app.models.buyer import Buyer

class FilterEngine:
    @staticmethod
    def check_filters(buyer: Buyer, lead_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Returns (Passed, RejectReason)
        """
        # 1. State Filter
        if buyer.filters.states:
            lead_state = lead_data.get("state", "").upper()
            if lead_state not in [s.upper() for s in buyer.filters.states]:
                return False, f"State {lead_state} not in allowed"
        
        # 2. Zip Filter
        if buyer.filters.zip_codes:
            lead_zip = str(lead_data.get("zip_code", ""))
            if lead_zip not in buyer.filters.zip_codes:
                return False, f"Zip {lead_zip} not in allowed"
        
        # 3. Age Filter
        lead_age = lead_data.get("age")
        if lead_age is None and "dob" in lead_data:
            try:
                dob = datetime.strptime(lead_data["dob"], "%Y-%m-%d")
                today = datetime.today()
                lead_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            except:
                pass
        
        if lead_age is not None:
            if buyer.filters.min_age is not None and lead_age < buyer.filters.min_age:
                return False, f"Age {lead_age} < Min {buyer.filters.min_age}"
            if buyer.filters.max_age is not None and lead_age > buyer.filters.max_age:
                return False, f"Age {lead_age} > Max {buyer.filters.max_age}"
                
        # 4. Custom Conditions
        if buyer.filters.custom_conditions:
            for key, value in buyer.filters.custom_conditions.items():
                if lead_data.get(key) != value:
                    return False, f"Custom {key}!={value}"

        # 5. Capabilities Check
        # Example: if lead needs exclusive, check if buyer supports it (Not fully implemented in MVP but placeholder)
        
        return True, None
