from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from bson import ObjectId
from utils import verify_token


security = HTTPBearer()

# This will be set by main.py
_db = None

def set_database(database):
    """Set database instance from main.py"""
    global _db
    _db = database

def get_db():
    """Get database instance for authentication"""
    return _db


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Middleware to get current authenticated user
    
    Args:
        credentials: HTTP Bearer token from request header
        
    Returns:
        User document from database
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    )
):
    """
    Middleware to get current user (optional - doesn't raise error if not authenticated)
    
    Args:
        credentials: HTTP Bearer token from request header (optional)
        
    Returns:
        User document if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None