from beanie import Document
from pydantic import Field

class Counter(Document):
    collection_name: str
    last_value: int = 0

    class Settings:
        name = "counters"
