from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from datetime import datetime
from bson import ObjectId
import os
from motor.motor_asyncio import AsyncIOMotorClient
from middleware import get_current_user


router = APIRouter(prefix="/api/favorites", tags=["Favorites"])

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



class FavoriteRequest(BaseModel):
    """Favorite property request schema"""
    propertyId: str


class FavoriteResponse(BaseModel):
    """Favorite response schema"""
    success: bool
    message: str = None


class Favorite(BaseModel):
    """Favorite item schema"""
    propertyId: str
    addedAt: datetime


class FavoritesListResponse(BaseModel):
    """Favorites list response schema"""
    success: bool
    favorites: List[Favorite] = []


class CheckFavoriteResponse(BaseModel):
    """Check favorite response schema"""
    success: bool
    isFavorite: bool


@router.post("/add", response_model=FavoriteResponse)
async def add_favorite(
    request: FavoriteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Add property to favorites
    
    Args:
        request: Property ID to add
        current_user: Authenticated user from middleware
        
    Returns:
        Success response
    """
    try:
        db = get_db()
        user_id = current_user["_id"]
        
        # Get user favorites
        user = await db.users.find_one({"_id": user_id})
        favorites = user.get("favorites", [])
        
        # Check if already exists
        exists = any(fav.get("propertyId") == request.propertyId for fav in favorites)
        
        if exists:
            return FavoriteResponse(
                success=False,
                message="Already in favorites"
            )
        
        # Add to favorites
        await db.users.update_one(
            {"_id": user_id},
            {
                "$push": {
                    "favorites": {
                        "propertyId": request.propertyId,
                        "addedAt": datetime.utcnow()
                    }
                }
            }
        )
        
        return FavoriteResponse(
            success=True,
            message="Added to favorites"
        )
        
    except Exception as error:
        print(f"❌ Error: {error}")
        return FavoriteResponse(
            success=False,
            message=str(error)
        )


@router.post("/remove", response_model=FavoriteResponse)
async def remove_favorite(
    request: FavoriteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove property from favorites
    
    Args:
        request: Property ID to remove
        current_user: Authenticated user from middleware
        
    Returns:
        Success response
    """
    try:
        db = get_db()
        user_id = current_user["_id"]
        
        # Remove from favorites
        await db.users.update_one(
            {"_id": user_id},
            {
                "$pull": {
                    "favorites": {"propertyId": request.propertyId}
                }
            }
        )
        
        return FavoriteResponse(
            success=True,
            message="Removed from favorites"
        )
        
    except Exception as error:
        print(f"❌ Error: {error}")
        return FavoriteResponse(
            success=False,
            message=str(error)
        )


@router.get("/list", response_model=FavoritesListResponse)
async def get_favorites(current_user: dict = Depends(get_current_user)):
    """
    Get user's favorite properties
    
    Args:
        current_user: Authenticated user from middleware
        
    Returns:
        List of favorite properties
    """
    try:
        db = get_db()
        user_id = current_user["_id"]
        
        # Get user with only favorites field
        user = await db.users.find_one(
            {"_id": user_id},
            {"favorites": 1}
        )
        
        favorites = user.get("favorites", [])
        
        return FavoritesListResponse(
            success=True,
            favorites=favorites
        )
        
    except Exception as error:
        print(f"❌ Error: {error}")
        return FavoritesListResponse(
            success=False,
            favorites=[]
        )


@router.get("/check/{propertyId}", response_model=CheckFavoriteResponse)
async def check_favorite(
    propertyId: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Check if property is in favorites
    
    Args:
        propertyId: Property ID to check
        current_user: Authenticated user from middleware
        
    Returns:
        Whether property is favorited
    """
    try:
        db = get_db()
        user_id = current_user["_id"]
        
        # Get user favorites
        user = await db.users.find_one({"_id": user_id})
        favorites = user.get("favorites", [])
        
        # Check if property is in favorites
        is_favorite = any(fav.get("propertyId") == propertyId for fav in favorites)
        
        return CheckFavoriteResponse(
            success=True,
            isFavorite=is_favorite
        )
        
    except Exception as error:
        print(f"❌ Error: {error}")
        return CheckFavoriteResponse(
            success=False,
            isFavorite=False
        )