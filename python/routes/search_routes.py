from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import os
from motor.motor_asyncio import AsyncIOMotorClient
from middleware import get_current_user


router = APIRouter(prefix="/api/search", tags=["Search"])

# Get database configuration
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "real_estate_db"

_mongo_client = None
_db = None

def get_db():
    """Get database instance"""
    global _mongo_client, _db
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(MONGO_URI)
        _db = _mongo_client[DB_NAME]
    return _db

def set_database(database):
    """Set database instance from main.py"""
    global _db
    _db = database


class SearchRequest(BaseModel):
    """Search request schema"""
    query: str


class SearchResponse(BaseModel):
    """Search response schema"""
    success: bool
    message: str = None


@router.post("/save", response_model=SearchResponse)
async def save_search(
    request: SearchRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Save user search history
    
    Args:
        request: Search query to save
        current_user: Authenticated user from middleware
        
    Returns:
        Success response
    """
    try:
        db = get_db()
        user_id = current_user["_id"]
        
        # Get current user data
        user = await db.users.find_one({"_id": user_id})
        
        print(f"🔍 Before - Length: {len(user.get('searchHistory', []))}")
        
        # Get current search history
        search_history = user.get("searchHistory", [])
        
        # Add new search
        search_history.append({
            "query": request.query,
            "timestamp": datetime.utcnow()
        })
        
        # Keep only latest 20 searches
        latest_searches = search_history[-20:]
        
        # Update user with new search history
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"searchHistory": latest_searches}}
        )
        
        print(f"✅ After - Length: {len(latest_searches)}")
        
        return SearchResponse(success=True)
        
    except Exception as error:
        print(f"❌ Error: {error}")
        return SearchResponse(
            success=False,
            message=str(error)
        )


@router.post("/guest", response_model=SearchResponse)
async def guest_search(request: SearchRequest):
    """
    Save guest search (unauthenticated users)
    
    Args:
        request: Search query to save
        
    Returns:
        Success response
    """
    try:
        db = get_db()
        
        # Create guest search record
        await db.guest_searches.insert_one({
            "query": request.query,
            "timestamp": datetime.utcnow()
        })
        
        # Count total guest searches
        count = await db.guest_searches.count_documents({})
        
        # If more than 100, delete oldest
        if count > 100:
            # Find oldest records
            oldest = await db.guest_searches.find().sort("timestamp", 1).limit(count - 100).to_list(length=None)
            ids_to_delete = [doc["_id"] for doc in oldest]
            
            # Delete old records
            await db.guest_searches.delete_many({"_id": {"$in": ids_to_delete}})
        
        return SearchResponse(success=True)
        
    except Exception as error:
        print(f"❌ Error: {error}")
        return SearchResponse(
            success=False,
            message=str(error)
        )