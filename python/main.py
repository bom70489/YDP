import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from google import genai
from dotenv import load_dotenv
from mangum import Mangum

load_dotenv()

# ==================== Configuration ====================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "real_estate_db"
COLLECTION_NAME = "assets"

if not GEMINI_API_KEY or not MONGO_URI:
    raise ValueError("GEMINI_API_KEY and MONGO_URI must be set in environment variables.")

# ==================== Global Clients ====================
gemini_client = genai.Client(api_key=GEMINI_API_KEY)
mongo_client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None
assets_collection: AsyncIOMotorCollection | None = None

# ==================== Initialize Database (for Vercel) ====================
def init_database():
    """Initialize database connection - called at module load for serverless"""
    global mongo_client, db, assets_collection
    
    if mongo_client is None:
        mongo_client = AsyncIOMotorClient(MONGO_URI)
        db = mongo_client[DB_NAME]
        assets_collection = db[COLLECTION_NAME]
        
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
        print("✅ Database initialized")

# ==================== FastAPI App ====================
app = FastAPI(
    title="Real Estate Search API",
    description="Backend API for property search with user authentication and favorites",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# ==================== CORS Configuration ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on module load
init_database()

# ==================== Register Routes ====================
from routes import auth_router, search_router, favorite_router, property_router

app.include_router(auth_router)
app.include_router(search_router)
app.include_router(favorite_router)
app.include_router(property_router)

# ==================== Root Endpoints ====================
@app.get("/api")
async def root():
    """Root endpoint"""
    return {
        "message": "Real Estate Vector Search API with Authentication",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/api/docs",
            "health": "/api/health",
            "auth": "/api/auth/*",
            "search": "/api/search/*",
            "favorites": "/api/favorites/*",
            "properties": "/api/hybrid_search, /api/property/{id}, /api/recommendations"
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    db_status = "connected" if mongo_client is not None else "disconnected"
    return {
        "status": "healthy",
        "database": db_status
    }

# ==================== Vercel Handler ====================
# This is the key part for Vercel deployment
handler = Mangum(app, lifespan="off")

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)