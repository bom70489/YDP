import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from google import genai
from dotenv import load_dotenv

load_dotenv()

# ==================== Configuration ====================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "real_estate_db"
COLLECTION_NAME = "assets"

if not GEMINI_API_KEY or not MONGO_URI:
    raise ValueError("GEMINI_API_KEY and MONGO_URI must be set in the .env file.")

# ==================== Global Clients ====================
gemini_client = genai.Client(api_key=GEMINI_API_KEY)
mongo_client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None
assets_collection: AsyncIOMotorCollection | None = None

# ==================== Application Lifespan ====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown"""
    global mongo_client, db, assets_collection
    
    # Startup
    mongo_client = AsyncIOMotorClient(MONGO_URI)
    db = mongo_client[DB_NAME]
    assets_collection = db[COLLECTION_NAME]
    print("✅ Connected to MongoDB")
    
    # Setup routes with database connection
    from routes.auth_routes import set_database as set_auth_db
    from routes.search_routes import set_database as set_search_db
    from routes.favorite_routes import set_database as set_favorite_db
    from routes.property_routes import set_database as set_property_db
    from middleware.auth_middleware import set_database as set_middleware_db
    
    set_auth_db(db)
    set_search_db(db)
    set_favorite_db(db)
    set_property_db(db, assets_collection, gemini_client)
    set_middleware_db(db)
    print("✅ Routes configured with database")
    
    print("🚀 Application started")
    
    yield
    
    # Shutdown
    if mongo_client:
        mongo_client.close()
        print("❌ Closed MongoDB connection")
    print("👋 Application shutdown")

# ==================== FastAPI App ====================
app = FastAPI(
    title="Real Estate Search API",
    description="Backend API for property search with user authentication and favorites",
    version="1.0.0",
    lifespan=lifespan
)

# ==================== CORS Configuration ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Register Routes ====================
from routes import auth_router, search_router, favorite_router, property_router

app.include_router(auth_router)
app.include_router(search_router)
app.include_router(favorite_router)
app.include_router(property_router)

# ==================== Root Endpoints ====================
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Real Estate Vector Search API with Authentication",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "auth": "/api/auth/*",
            "search": "/api/search/*",
            "favorites": "/api/favorites/*",
            "properties": "/hybrid_search, /property/{id}, /recommendations"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)