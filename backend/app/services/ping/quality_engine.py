from typing import Dict, Any, Tuple
import re

class QualityScoringEngine:
    @staticmethod
    def calculate_score(lead_data: Dict[str, Any]) -> Tuple[float, list[str]]:
        score = 100.0
        flags = []

        # 1. Phone Validation
        phone = str(lead_data.get("phone", ""))
        if not re.match(r"^\+?[1-9]\d{9,14}$", phone):
             score -= 50
             flags.append("Invalid Phone Format")
        elif "555555" in phone:
             score -= 100
             flags.append("Test Phone Detected")

        # 2. Email Validation
        email = lead_data.get("email", "")
        if "@" not in email:
            score -= 30
            flags.append("Invalid Email")
        elif any(x in email for x in ["test.com", "example.com"]):
            score -= 100
            flags.append("Test Email Domain")

        # 3. State Check
        state = lead_data.get("state", "")
        if len(state) != 2:
             score -= 10
             flags.append("Invalid State Format")

        return max(0.0, score), flags
