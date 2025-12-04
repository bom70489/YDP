from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
import json
import asyncio
from functools import lru_cache
import numpy as np

router = APIRouter(tags=["Property Search"])

# This will be set by main.py
_db = None
_assets_collection = None
_gemini_client = None
_EMBEDDING_MODEL = "text-embedding-004"
_VECTOR_SEARCH_INDEX_NAME = "vector_index"

_ASSET_TYPES = {
    "บ้านเดี่ยว": [4, 15],
    "คอนโด": [3],
    "อาคารชุด": [3],
    "ทาวน์เฮ้าส์": [5, 16],
    "ตึก": [6, 17],
    "ที่ดิน": [1, 2],
}

def set_database(database, collection, gemini_client):
    """Set database instance from main.py"""
    global _db, _assets_collection, _gemini_client
    _db = database
    _assets_collection = collection
    _gemini_client = gemini_client

def get_db():
    """Get database instance"""
    return _db

def get_collection():
    """Get assets collection"""
    return _assets_collection


# ==================== Pydantic Models ====================
class FavoriteItem(BaseModel):
    propertyId: str

class UserInteraction(BaseModel):
    searchHistory: List[str] = []
    favorites: List[FavoriteItem] = []


# ==================== Helper Functions ====================
def safe_float(value, default=0.0):
    """Convert value to float safely"""
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.replace(',', '').strip())
        except:
            return default
    return default

def safe_int(value, default=0):
    """Convert value to int safely"""
    if value is None:
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(value.strip())
        except:
            return default
    return default

@lru_cache(maxsize=1024)
def _embed_text_sync(text: str):
    """Embed text using Gemini (cached)"""
    resp = _gemini_client.models.embed_content(model=_EMBEDDING_MODEL, contents=[text])
    embedding = resp.embeddings[0].values
    norm = sum(x * x for x in embedding) ** 0.5
    if norm == 0:
        return tuple(embedding)
    return tuple(x / norm for x in embedding)

async def embed_text(text: str) -> List[float]:
    """Async wrapper for text embedding"""
    if not text:
        text = ""
    emb = await asyncio.to_thread(_embed_text_sync, text)
    return list(emb)

def extract_query_filters(query: str):
    """Extract asset type filters from query"""
    selected = []
    for term, ids in _ASSET_TYPES.items():
        if term in query:
            selected.extend(ids)
            query = query.replace(term, "")
    remaining = " ".join(query.split())
    return remaining, list(set(selected))

async def _gemini_rerank(prompt: str) -> str:
    """Rerank results using Gemini"""
    return await asyncio.to_thread(
        lambda: _gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[prompt],
            config={
                "response_mime_type": "application/json",
                "response_schema": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "id": {"type": "INTEGER"},
                            "score": {"type": "NUMBER"}
                        },
                        "required": ["id", "score"]
                    }
                },
                "temperature": 0.0
            }
        ).text
    )

async def get_user_persona_vector(payload: UserInteraction) -> Optional[List[float]]:
    """Create user persona vector from search history and favorites"""
    vectors = []
    weights = []
    collection = get_collection()

    # Handle Search History
    recent_searches = payload.searchHistory[-5:][::-1]
    
    for i, text in enumerate(recent_searches):
        if not text.strip():
            continue
        vec = await embed_text(text)
        vectors.append(vec)
        weights.append(max(0.1, 0.5 - (i * 0.05)))

    # Handle Favorites
    if payload.favorites:
        fav_ids = []
        for item in payload.favorites:
            try:
                fav_ids.append(ObjectId(item.propertyId))
            except:
                continue
        
        if fav_ids:
            cursor = collection.find(
                {"_id": {"$in": fav_ids}},
                {"name_th": 1, "ai_description_th": 1, "asset_details_selling_price": 1}
            )
            fav_items = await cursor.to_list(length=None)

            for item in fav_items:
                desc = f"{item.get('name_th', '')} ราคา {item.get('asset_details_selling_price', '')}"
                if 'ai_description_th' in item:
                    desc += f" {item['ai_description_th'][:100]}"
                
                vec = await embed_text(desc)
                vectors.append(vec)
                weights.append(1.5)

    if not vectors:
        return None
        
    weighted_avg = np.average(vectors, axis=0, weights=weights)
    return weighted_avg.tolist()


# ==================== API Endpoints ====================
@router.get("/hybrid_search")
async def hybrid_search(
    query: str = Query("ทรัพย์สินทั้งหมด", description="คำค้นหา"),
    top_k: int = 10,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None
):
    """
    Hybrid search with vector similarity and filters
    
    Args:
        query: Search query
        top_k: Number of results to return
        min_price: Minimum price filter
        max_price: Maximum price filter
        min_area: Minimum area filter
        max_area: Maximum area filter
        
    Returns:
        Search results with property details
    """
    collection = get_collection()
    text_query, asset_type_ids = extract_query_filters(query)
    query_text_for_embedding = text_query.strip() if text_query.strip() else "ทรัพย์สินทั้งหมด"
    query_emb = await embed_text(query_text_for_embedding)

    has_price_filter = min_price is not None or max_price is not None
    has_area_filter = min_area is not None or max_area is not None
    num_candidates = 500 if (has_price_filter or has_area_filter) else 100

    pipeline_params = {
        "index": _VECTOR_SEARCH_INDEX_NAME,
        "path": "asset_vector",
        "queryVector": query_emb,
        "numCandidates": num_candidates,
        "limit": num_candidates,
    }

    if asset_type_ids:
        pipeline_params["filter"] = {"asset_type_id": {"$in": asset_type_ids}}

    try:
        cursor = collection.aggregate([
            {"$vectorSearch": pipeline_params},
            {"$project": {
                "score": {"$meta": "vectorSearchScore"},
                "_id": 1,
                "name_th": 1,
                "asset_details_selling_price": 1,
                "ai_description_th": 1,
                "asset_details_number_of_bedrooms": 1,
                "asset_details_number_of_bathrooms": 1,
                "asset_details_land_size": 1,
                "asset_type_id": 1,
                "location_village_th": 1,
                "location_geo": 1,
                "image": 1,
                "images_main_id": 1
            }}
        ])
        
        candidates = await cursor.to_list(length=num_candidates)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"query": query, "results": [], "error": str(e)}

    # Apply price filter
    if has_price_filter:
        filtered = []
        for doc in candidates:
            price = safe_float(doc.get("asset_details_selling_price", 0))
            doc["asset_details_selling_price"] = price
            
            if min_price is not None and price < min_price:
                continue
            if max_price is not None and price > max_price:
                continue
            
            filtered.append(doc)
        candidates = filtered

    # Apply area filter
    if has_area_filter:
        filtered_area = []
        for doc in candidates:
            area = safe_float(doc.get("asset_details_land_size", 0))
            doc["asset_details_land_size"] = area
            
            if min_area is not None and area < min_area:
                continue
            if max_area is not None and area > max_area:
                continue
            
            filtered_area.append(doc)
        candidates = filtered_area

    if not candidates:
        return {"query": query, "results": []}

    # Rerank with Gemini
    rerank_count = min(max(3 * top_k, 10), len(candidates))
    to_rerank = candidates[:rerank_count]

    prompt = "You are an expert search relevancy judge. Respond with JSON array only.\n"
    prompt += f"User query: \"{query}\"\nCandidates:\n"
    for idx, doc in enumerate(to_rerank):
        desc = doc.get("ai_description_th", "")[:1000]
        prompt += f"{idx+1}. {doc.get('name_th','N/A')} – {desc}\n"
    prompt += "Score each document between 0.0 and 1.0 and output JSON array like: [{\"id\":1,\"score\":0.92}, ...]"

    scores_map = {}
    try:
        text = await _gemini_rerank(prompt)
        parsed = json.loads(text)
        scores_map = {item["id"]: item["score"] for item in parsed}
    except Exception:
        for idx, doc in enumerate(to_rerank):
            scores_map[idx + 1] = doc.get("score", 0.0)

    # Prepare results
    for idx, doc in enumerate(candidates):
        doc["_rerank_score"] = scores_map.get(idx + 1, doc.get("score", 0.0))
        doc["_id"] = str(doc["_id"])
        doc["title"] = str(doc.get("name_th", "ไม่มีชื่อ"))
        doc["bedrooms"] = safe_int(doc.get("asset_details_number_of_bedrooms"))
        doc["bathrooms"] = safe_int(doc.get("asset_details_number_of_bathrooms"))
        doc["description"] = doc.get("ai_description_th", "")
        doc["area"] = safe_float(doc.get("asset_details_land_size"))
        doc["location"] = doc.get("location_village_th", "ไม่มีที่อยู่")
        doc["price"] = safe_float(doc.get("asset_details_selling_price"))
        
        # Handle image
        image_value = doc.get("image") or doc.get("images_main_id")
        if isinstance(image_value, (int, float)) or not image_value:
            doc["image"] = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        else:
            doc["image"] = image_value

        # Handle coordinates
        if "location_geo" in doc and doc["location_geo"]:
            geo = doc["location_geo"]
            coords = geo.get("coordinates") if isinstance(geo, dict) else geo if isinstance(geo, list) else []
            
            if len(coords) == 2:
                doc["coordinates"] = {"lng": float(coords[0]), "lat": float(coords[1])}

    results_sorted = sorted(candidates, key=lambda d: d["_rerank_score"], reverse=True)
    final_results = results_sorted[:top_k]
    
    return {"query": query, "results": final_results}


@router.get("/property/{property_id}")
async def get_property(property_id: str):
    """
    Get property details by ID
    
    Args:
        property_id: Property ID (MongoDB ObjectId)
        
    Returns:
        Property details
    """
    collection = get_collection()
    
    try:
        obj_id = ObjectId(property_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid property ID: {str(e)}")

    try:
        property_doc = await collection.find_one({"_id": obj_id})
        
        if not property_doc:
            raise HTTPException(status_code=404, detail="Property not found")

        property_mapped = {
            "_id": str(property_doc["_id"]),
            "title": property_doc.get("name_th") or "ไม่มีชื่อ",
            "location": property_doc.get("location_village_th") or "ไม่มีที่อยู่",
            "price": safe_float(property_doc.get("asset_details_selling_price")),
            "bedrooms": safe_int(property_doc.get("asset_details_number_of_bedrooms")),
            "bathrooms": safe_int(property_doc.get("asset_details_number_of_bathrooms")),
            "area": safe_float(property_doc.get("asset_details_land_size")),
            "rating": 5,
            "description": property_doc.get("ai_description_th") or "-",
            "type": "ขาย" if property_doc.get("announcement_status_status_id", 1) == 1 else "ไม่ขาย",
            "image": property_doc.get("image") or "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        }

        if "location_geo" in property_doc and property_doc["location_geo"]:
            geo = property_doc["location_geo"]
            coords = geo.get("coordinates") if isinstance(geo, dict) else geo if isinstance(geo, list) else []
            
            if len(coords) == 2:
                property_mapped["coordinates"] = {"lng": float(coords[0]), "lat": float(coords[1])}

        return property_mapped
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/recommendations")
async def get_recommendations(payload: UserInteraction, limit: int = 10):
    """
    Get personalized recommendations based on user history
    
    Args:
        payload: User interaction data (search history and favorites)
        limit: Number of recommendations to return
        
    Returns:
        Personalized property recommendations
    """
    collection = get_collection()
    user_vector = await get_user_persona_vector(payload)
    
    if not user_vector:
        return {"message": "No history provided", "results": []}

    exclude_ids = []
    for item in payload.favorites:
        try:
            exclude_ids.append(ObjectId(item.propertyId))
        except:
            pass

    pipeline = [
        {
            "$vectorSearch": {
                "index": _VECTOR_SEARCH_INDEX_NAME,
                "path": "asset_vector",
                "queryVector": user_vector,
                "numCandidates": limit * 10,
                "limit": limit * 5
            }
        },
        {
            "$project": {
                "score": {"$meta": "vectorSearchScore"},
                "_id": 1,
                "name_th": 1,
                "asset_details_selling_price": 1,
                "ai_description_th": 1,
                "asset_details_number_of_bedrooms": 1,
                "asset_details_number_of_bathrooms": 1,
                "asset_details_land_size": 1,
                "location_village_th": 1,
                "location_geo": 1,
                "image": 1,
                "images_main_id": 1
            }
        }
    ]

    try:
        cursor = collection.aggregate(pipeline)
        candidates = await cursor.to_list(length=limit * 5)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"count": 0, "results": []}

    if not candidates:
        return {"count": 0, "results": []}

    # Rerank
    rerank_count = min(max(3 * limit, 10), len(candidates))
    to_rerank = candidates[:rerank_count]

    search_context = ", ".join(payload.searchHistory[-3:]) if payload.searchHistory else "general preferences"
    
    prompt = "You are an expert at personalizing property recommendations. Respond with JSON array only.\n"
    prompt += f"User interests: \"{search_context}\"\nCandidates:\n"
    
    for idx, doc in enumerate(to_rerank):
        desc = doc.get("ai_description_th", "")[:1000]
        price = doc.get("asset_details_selling_price", "N/A")
        location = doc.get("location_village_th", "N/A")
        prompt += f"{idx+1}. {doc.get('name_th','N/A')} - ฿{price} - {location}\n{desc[:200]}\n"
    
    prompt += "\nScore each property between 0.0 and 1.0 based on relevance to user interests.\n"
    prompt += "Output JSON array: [{\"id\":1,\"score\":0.92}, ...]"

    scores_map = {}
    try:
        text = await _gemini_rerank(prompt)
        parsed = json.loads(text)
        scores_map = {item["id"]: item["score"] for item in parsed}
    except Exception:
        for idx, doc in enumerate(to_rerank):
            scores_map[idx + 1] = doc.get("score", 0.0)

    # Prepare results
    for idx, doc in enumerate(candidates):
        doc["_rerank_score"] = scores_map.get(idx + 1, doc.get("score", 0.0))
        doc["_id"] = str(doc["_id"])
        doc["title"] = str(doc.get("name_th", "ไม่มีชื่อ"))
        doc["bedrooms"] = safe_int(doc.get("asset_details_number_of_bedrooms"))
        doc["bathrooms"] = safe_int(doc.get("asset_details_number_of_bathrooms"))
        doc["description"] = doc.get("ai_description_th", "")
        doc["area"] = safe_float(doc.get("asset_details_land_size"))
        doc["location"] = doc.get("location_village_th", "ไม่มีที่อยู่")
        doc["price"] = safe_float(doc.get("asset_details_selling_price"))
        
        image_value = doc.get("image") or doc.get("images_main_id")
        if isinstance(image_value, (int, float)) or not image_value:
            doc["image"] = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        else:
            doc["image"] = image_value

        if "location_geo" in doc and doc["location_geo"]:
            geo = doc["location_geo"]
            coords = geo.get("coordinates") if isinstance(geo, dict) else geo if isinstance(geo, list) else []
            if len(coords) == 2:
                doc["coordinates"] = {"lng": float(coords[0]), "lat": float(coords[1])}

    results_sorted = sorted(candidates, key=lambda d: d["_rerank_score"], reverse=True)
    final_results = results_sorted[:limit]

    return {"count": len(final_results), "results": final_results}


@router.get("/debug/geo-check")
async def debug_geo_check(lat: float, lng: float, radius_km: float = 5.0):
    """
    Debug endpoint to check geospatial query results
    """
    collection = get_collection()
    
    # Check if geospatial index exists
    indexes = await collection.index_information()
    has_geo_index = any('2dsphere' in str(idx) for idx in indexes.values())
    
    # Run simple query
    try:
        pipeline = [
            {
                "$geoNear": {
                    "near": {"type": "Point", "coordinates": [lng, lat]},
                    "distanceField": "distance",
                    "maxDistance": radius_km * 1000,
                    "spherical": True
                }
            },
            {"$limit": 20},
            {
                "$project": {
                    "name_th": 1,
                    "location_geo": 1,
                    "distance": 1
                }
            }
        ]
        
        cursor = collection.aggregate(pipeline)
        results = await cursor.to_list(length=20)
        
        # Group by coordinates to find duplicates
        coord_groups = {}
        for doc in results:
            coords = doc.get("location_geo", {}).get("coordinates", [])
            if len(coords) == 2:
                key = f"{coords[0]:.5f},{coords[1]:.5f}"
                if key not in coord_groups:
                    coord_groups[key] = []
                coord_groups[key].append({
                    "id": str(doc["_id"]),
                    "title": doc.get("name_th"),
                    "distance": round(doc.get("distance", 0) / 1000, 2)
                })
        
        duplicates = {k: v for k, v in coord_groups.items() if len(v) > 1}
        
        return {
            "has_geospatial_index": has_geo_index,
            "total_results": len(results),
            "unique_coordinates": len(coord_groups),
            "duplicate_coordinates": len(duplicates),
            "duplicates_detail": duplicates,
            "all_results": [
                {
                    "id": str(doc["_id"]),
                    "title": doc.get("name_th"),
                    "coordinates": doc.get("location_geo", {}).get("coordinates"),
                    "distance_km": round(doc.get("distance", 0) / 1000, 2)
                }
                for doc in results
            ]
        }
        
    except Exception as e:
        return {
            "error": str(e),
            "has_geospatial_index": has_geo_index,
            "message": "Make sure you have a 2dsphere index on location_geo field"
        }


def serialize_doc(doc):
    """Serialize MongoDB document for JSON response"""
    # Get coordinates safely
    location_geo = doc.get("location_geo", {})
    coords = location_geo.get("coordinates", [0, 0]) if isinstance(location_geo, dict) else [0, 0]
    
    # Ensure coords is a list with 2 elements
    if not isinstance(coords, list) or len(coords) != 2:
        coords = [0, 0]
    
    # Create coordinates object (only if valid)
    coordinates = None
    if coords[0] != 0 and coords[1] != 0:
        coordinates = {
            "lng": float(coords[0]),
            "lat": float(coords[1])
        }
    
    return {
        "_id": str(doc["_id"]),
        "title": doc.get("name_th", "ไม่มีชื่อ"),
        "price": safe_float(doc.get("asset_details_selling_price")),
        "coordinates": coordinates,  # Will be None if invalid
        "image": doc.get("images_main_id") or "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170",
        "type_id": doc.get("asset_type_id")
    }


@router.get("/map_search")
async def map_search(
    lat: float,
    lng: float,
    radius_km: float = 5.0,
    limit: int = 50
):
    """
    Search properties within a radius from a point (for map display)
    
    Args:
        lat: Latitude of center point
        lng: Longitude of center point
        radius_km: Search radius in kilometers (default: 5km)
        limit: Maximum number of results (default: 50)
        
    Returns:
        Properties within the specified radius with essential map data
    """
    collection = get_collection()
    
    try:
        # Use aggregation pipeline for better control
        pipeline = [
            {
                "$geoNear": {
                    "near": {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    },
                    "distanceField": "distance",
                    "maxDistance": radius_km * 1000,  # meters
                    "spherical": True,
                    "query": {
                        "location_geo": {"$exists": True, "$ne": None}
                    }
                }
            },
            {
                "$project": {
                    "name_th": 1,
                    "asset_details_selling_price": 1,
                    "location_geo": 1,
                    "images_main_id": 1,
                    "asset_type_id": 1,
                    "distance": 1
                }
            },
            {
                "$limit": limit
            }
        ]
        
        cursor = collection.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        
        # Remove duplicates based on coordinates
        seen_coords = set()
        valid_results = []
        
        for doc in results:
            location_geo = doc.get("location_geo")
            
            if location_geo:
                coords = location_geo.get("coordinates") if isinstance(location_geo, dict) else None
                
                # Validate coordinates
                if (coords and 
                    isinstance(coords, list) and 
                    len(coords) == 2 and
                    coords[0] != 0 and 
                    coords[1] != 0):
                    
                    # Create a unique key for this coordinate (rounded to 5 decimals)
                    coord_key = (round(coords[0], 5), round(coords[1], 5))
                    
                    # Skip if we've seen this coordinate before
                    if coord_key not in seen_coords:
                        seen_coords.add(coord_key)
                        valid_results.append(doc)
        
        return {
            "count": len(valid_results),
            "center": {"lat": lat, "lng": lng},
            "radius_km": radius_km,
            "results": [serialize_doc(doc) for doc in valid_results],
            "debug": {
                "total_found": len(results),
                "duplicates_removed": len(results) - len(valid_results)
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Map search error: {str(e)}")