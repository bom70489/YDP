from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

class Database:
    """MongoDB database connection handler"""
    
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB"""
        cls.client = AsyncIOMotorClient(settings.MONGODB_URI)
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
    
    @classmethod
    def get_db(cls):
        """Get database instance"""
        return cls.client.get_default_database()


# Helper function to get database
def get_database():
    return Database.get_db()