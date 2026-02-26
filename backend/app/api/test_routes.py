
from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter()

class MockResponse(BaseModel):
    status: str
    price: float
    redirect_url: str
    reason: str = ""

@router.post("/buyer", response_model=MockResponse)
async def mock_buyer_endpoint(data: dict):
    """
    Simulates a buyer receiving a lead.
    Returns a success or reject response randomly or based on data.
    """
    # Simulate some logic
    if data.get("age", 0) < 18:
         return {"status": "rejected", "price": 0.0, "redirect_url": "", "reason": "Age < 18"}

    # 80% chance of buy
    if random.random() < 0.8:
        return {
            "status": "success",
            "price": round(random.uniform(5.0, 50.0), 2),
            "redirect_url": "http://localhost:3000/thank-you",
            "reason": "Accepted"
        }
    
    return {"status": "rejected", "price": 0.0, "redirect_url": "", "reason": "Random rejection"}
