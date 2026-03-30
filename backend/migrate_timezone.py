"""
Migration: Add timezone field to existing User documents.

Run once:  python migrate_timezone.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL   = "YOUR_MONGODB_URL"   # replace or load from .env
DATABASE_NAME = "pingtree"           # adjust to your DB name

async def main():
    client = AsyncIOMotorClient(MONGODB_URL, tls=True, tlsAllowInvalidCertificates=True)
    db = client[DATABASE_NAME]
    users_col = db["users"]

    result = await users_col.update_many(
        {"timezone": {"$exists": False}},          # only docs without the field
        {"$set": {"timezone": "UTC"}}              # set default
    )
    print(f"✅ Updated {result.modified_count} user document(s) to add timezone field.")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
