from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from utils import (
    create_access_token,
    hash_password,
    verify_password,
    is_valid_email,
    is_strong_password
)


router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# This will be set by main.py
_db = None

def set_database(database):
    """Set database instance from main.py"""
    global _db
    _db = database

def get_db():
    """Get database instance"""
    return _db


class RegisterRequest(BaseModel):
    """Register request schema"""
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response schema"""
    success: bool
    token: str = None
    username: str = None
    message: str = None


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user
    
    Args:
        request: Registration data (name, email, password)
        
    Returns:
        Authentication response with token and username
    """
    try:
        db = get_db()
        
        # 👇 เพิ่มส่วนนี้เพื่อ debug
        print("=" * 50)
        print(f"📝 Received registration request:")
        print(f"   Name: {request.name}")
        print(f"   Email: {request.email}")
        print(f"   Password length: {len(request.password)} characters")
        print(f"   Password bytes: {len(request.password.encode('utf-8'))} bytes")
        print(f"   Password preview: {request.password[:10]}...")
        print(f"   Password type: {type(request.password)}")
        print("=" * 50)
        # 👆 จบส่วน debug
        
        # Check if user already exists
        exists = await db.users.find_one({"email": request.email})
        if exists:
            return AuthResponse(
                success=False,
                message="อีเมลถูกใช้ไปเเล้ว"
            )
        
        # Validate email format
        if not is_valid_email(request.email):
            return AuthResponse(
                success=False,
                message="Please enter a valid email"
            )
        
        # Validate password strength
        if not is_strong_password(request.password, min_length=8):
            return AuthResponse(
                success=False,
                message="รหัสผ่านต้อง 8 ตัวขึ้นไป"
            )
        
        # Hash password
        print("🔐 Attempting to hash password...")
        hashed_password = hash_password(request.password)
        print(f"✅ Password hashed successfully: {hashed_password[:20]}...")
        
        # Create new user
        new_user = {
            "name": request.name,
            "email": request.email,
            "password": hashed_password,
            "searchHistory": [],
            "favorites": []
        }
        
        result = await db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # Create token
        token = create_access_token(user_id)
        
        return AuthResponse(
            success=True,
            token=token,
            username=request.name
        )
        
    except Exception as error:
        print(f"❌ Register error: {error}")
        import traceback
        traceback.print_exc()  # แสดง full error stack
        return AuthResponse(
            success=False,
            message=str(error)
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login user
    
    Args:
        request: Login credentials (email, password)
        
    Returns:
        Authentication response with token and username
    """
    try:
        db = get_db()
        
        # Find user by email
        user = await db.users.find_one({"email": request.email})
        
        if not user:
            return AuthResponse(
                success=False,
                message="ไม่มีผู้ใช้นี้"
            )
        
        # Verify password
        is_match = verify_password(request.password, user["password"])
        
        if is_match:
            # Create token
            token = create_access_token(str(user["_id"]))
            
            return AuthResponse(
                success=True,
                token=token,
                username=user["name"]
            )
        else:
            return AuthResponse(
                success=False,
                message="อีเมลหรือรหัสผิด"
            )
        
    except Exception as error:
        print(f"❌ Login error: {error}")
        return AuthResponse(
            success=False,
            message=str(error)
        )