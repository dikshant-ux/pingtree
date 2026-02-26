import httpx
import asyncio

async def test_ingestion():
    url = "http://localhost:8000/api/v1/public/leads/ingest"
    # Get the API key from the DB for the test user
    from app.models.user import User
    from app.db.mongodb import init_db
    
    await init_db()
    user = await User.find_one(User.email == "1dikshantbhatiya21@gmail.com")
    if not user or not user.api_key:
        print("Test user or API key not found")
        return

    headers = {
        "X-API-Key": user.api_key
    }
    
    lead_data = {
        "First_Name": "Test",
        "Last_Name": "Ingestion",
        "Email": "test_ingestion@example.com",
        "Zip": "12345",
        "State": "NY"
    }
    
    print(f"Testing ingestion with API Key: {user.api_key[:8]}...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=lead_data, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

if __name__ == "__main__":
    asyncio.run(test_ingestion())
