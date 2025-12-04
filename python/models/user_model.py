from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class SearchHistory(BaseModel):
    """Search history item schema"""
    query: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Favorite(BaseModel):
    """Favorite property schema"""
    propertyId: str
    addedAt: datetime = Field(default_factory=datetime.utcnow)


class UserBase(BaseModel):
    """Base user schema"""
    name: str
    email: EmailStr


class UserCreate(UserBase):
    """User creation schema"""
    password: str


class UserInDB(UserBase):
    """User in database schema"""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    password: str
    searchHistory: List[SearchHistory] = []
    favorites: List[Favorite] = []
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserResponse(UserBase):
    """User response schema (without password)"""
    id: str
    searchHistory: List[SearchHistory] = []
    favorites: List[Favorite] = []
    
    class Config:
        from_attributes = True