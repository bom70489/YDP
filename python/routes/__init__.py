from routes.auth_routes import router as auth_router
from routes.search_routes import router as search_router
from routes.favorite_routes import router as favorite_router
from routes.property_routes import router as property_router

__all__ = ["auth_router", "search_router", "favorite_router", "property_router"]