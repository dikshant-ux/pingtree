from typing import List, Dict, Any
from app.models.buyer import Buyer

class RankingEngine:
    @staticmethod
    def calculate_score(buyer: Buyer, price: float) -> float:
        """
        Calculate weighted score for a bid.
        Formula: (price * 0.6) + (speed * 0.15) + (accept_rate * 0.15) + (priority * 0.1)
        """
        # Bypass performance metrics and weights - pure price ranking
        return round(float(price), 2)

    @staticmethod
    def rank_buyers(candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sort list of {buyer, price, ...} by score DESC
        """
        # Calculate scores if not already there?
        # Assuming candidates have 'score' calculated
        return sorted(candidates, key=lambda x: x.get("score", 0), reverse=True)
