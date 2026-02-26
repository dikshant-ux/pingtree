import asyncio
import secrets
from app.models.user import User
from app.db.mongodb import init_db

async def generate_api_keys():
    await init_db()
    users = await User.find(User.api_key == None).to_list()
    print(f"Found {len(users)} users without API keys.")
    
    for user in users:
        key = secrets.token_hex(32)
        user.api_key = key
        await user.save()
        print(f"Generated key for {user.email}")

if __name__ == "__main__":
    asyncio.run(generate_api_keys())
