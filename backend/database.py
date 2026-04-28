import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://plinagerman_db_user:AGJa7QAGJa7Q@oquery.dv9hpun.mongodb.net/")
DB_NAME = os.getenv("MONGO_DB", "oncoquery")

client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
db = client[DB_NAME]

# Collections
users = db["users"]
projects = db["projects"]
chat_sessions = db["chat_sessions"]
export_logs = db["export_logs"]


async def init_indexes():
    """Create indexes defined in the schema."""
    await users.create_index("email", unique=True)
    await projects.create_index("user_id")
    await chat_sessions.create_index("user_id")
    await chat_sessions.create_index("project_id")
    await chat_sessions.create_index([("updated_at", -1)])
    await export_logs.create_index("user_id")
    await export_logs.create_index("session_id")
