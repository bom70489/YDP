import os
import json
import asyncio
from functools import lru_cache
from typing import List, Tuple
from fastapi import FastAPI, Query , HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from google import genai
from dotenv import load_dotenv
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from math import radians, sin, cos, sqrt, atan2

load_dotenv()

app = FastAPI(title="Real Estate Search API")

origins = [
    "http://localhost:5173",  
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "real_estate_db"
COLLECTION_NAME = "assets"
EMBEDDING_MODEL = "text-embedding-004"
VECTOR_SEARCH_INDEX_NAME = "vector_index"

if not GEMINI_API_KEY or not MONGO_URI:
    raise ValueError("GEMINI_API_KEY and MONGO_URI must be set in the .env file.")

# Clients
gemini_client = genai.Client(api_key=GEMINI_API_KEY)
mongo_client = AsyncIOMotorClient(MONGO_URI)
db = mongo_client[DB_NAME]
assets_collection = db[COLLECTION_NAME]

_ASSET_TYPES = {
    "บ้านเดี่ยว": [4, 15],
    "คอนโด": [3],
    "อาคารชุด": [3],
    "ทาวน์เฮ้าส์": [5, 16],
    "ตึก": [6, 17],
    "ที่ดิน": [1, 2],
}

def safe_float(value, default=0.0):
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


def calculate_distance(lat1, lng1, lat2, lng2):
    R = 6371  
    lat1_rad, lon1_rad = radians(lat1), radians(lng1)
    lat2_rad, lon2_rad = radians(lat2), radians(lng2)
    
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = sin(dlat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

def serialize_doc(doc):
    """แปลง MongoDB document เป็น JSON-serializable dict"""
    # ลองหา image จากหลาย fields ที่เป็นไปได้
    image_url = (
        doc.get("image") or 
        doc.get("images_main_id") or 
        doc.get("main_image") or 
        doc.get("image_url") or
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    )
    
    serialized = {
        "_id": str(doc["_id"]),
        "title": doc.get("name_th") or "ไม่มีชื่อ",
        "price": safe_float(doc.get("asset_details_selling_price")),
        "asset_type_id": doc.get("asset_type_id"),
        "location": doc.get("location_village_th") or "ไม่มีที่อยู่",
        "bedrooms": doc.get("asset_details_number_of_bedrooms", 0),
        "bathrooms": doc.get("asset_details_number_of_bathrooms", 0),
        "area": safe_float(doc.get("asset_details_land_size")),
        "image": image_url,
    }
    
    # เพิ่ม coordinates ถ้ามี location_geo
    if "location_geo" in doc and doc["location_geo"]:
        geo = doc["location_geo"]
        
        # รองรับทั้ง GeoJSON object และ array
        if isinstance(geo, dict) and "coordinates" in geo:
            coords = geo["coordinates"]
        elif isinstance(geo, list):
            coords = geo
        else:
            coords = []
        
        if len(coords) == 2:
            serialized["coordinates"] = {
                "lng": coords[0],
                "lat": coords[1]
            }
    
    return serialized

@lru_cache(maxsize=1024)
def _embed_text_sync(text: str) -> Tuple[float, ...]:
    resp = gemini_client.models.embed_content(model=EMBEDDING_MODEL, contents=[text])
    embedding = resp.embeddings[0].values
    norm = sum(x * x for x in embedding) ** 0.5
    if norm == 0:
        return tuple(embedding)
    return tuple(x / norm for x in embedding)

async def embed_text(text: str) -> List[float]:
    if not text:
        text = ""
    emb = await asyncio.to_thread(_embed_text_sync, text)
    return list(emb)

def extract_query_filters(query: str) -> Tuple[str, List[int]]:    
    selected = []
    for term, ids in _ASSET_TYPES.items():
        if term in query:
            selected.extend(ids)
            query = query.replace(term, "")
    remaining = " ".join(query.split())
    return remaining, list(set(selected))

async def _gemini_rerank(prompt: str) -> str:
    return await asyncio.to_thread(
        lambda: gemini_client.models.generate_content(
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

@app.get("/hybrid_search")
async def hybrid_search(
    query: str = Query("ทรัพย์สินทั้งหมด", description="คำค้นหา"),
    top_k: int = 10,
    min_price: float | None = None,
    max_price: float | None = None,
    min_area: float | None = None,
    max_area: float | None = None
):
    print("\n" + "="*50)
    print("=== FASTAPI DEBUG START ===")
    print("="*50)
    print(f"Query: '{query}'")
    print(f"Min Price: {min_price} (type: {type(min_price).__name__})")
    print(f"Max Price: {max_price} (type: {type(max_price).__name__})")
    print(f"Min Area: {min_area} (type: {type(min_area).__name__ if min_area else 'None'})")
    print(f"Max Area: {max_area} (type: {type(max_area).__name__ if max_area else 'None'})")
    
    text_query, asset_type_ids = extract_query_filters(query)
    print(f"After extraction - Text: '{text_query}' | Asset Types: {asset_type_ids}")
    
    query_text_for_embedding = text_query.strip() if text_query.strip() else "ทรัพย์สินทั้งหมด"
    print(f"Embedding text: '{query_text_for_embedding}'")
    
    query_emb = await embed_text(query_text_for_embedding)
    print(f"Embedding dimension: {len(query_emb)}")

    mongo_filter = {}
    if asset_type_ids:
        mongo_filter["asset_type_id"] = {"$in": asset_type_ids}
        print(f"Asset type filter added: {asset_type_ids}")

    has_price_filter = min_price is not None or max_price is not None
    has_area_filter = min_area is not None or max_area is not None
    num_candidates = 500 if (has_price_filter or has_area_filter) else 100
    
    print(f"\n--- Vector Search Setup ---")
    print(f"Num candidates: {num_candidates}")
    print(f"Has price filter: {has_price_filter}")
    print(f"Has area filter: {has_area_filter}")
    
    pipeline_params = {
        "index": VECTOR_SEARCH_INDEX_NAME,
        "path": "asset_vector",
        "queryVector": query_emb,
        "numCandidates": num_candidates,
        "limit": num_candidates,
    }

    # ใส่เฉพาะ asset_type filter ใน vectorSearch
    if asset_type_ids:
        pipeline_params["filter"] = {"asset_type_id": {"$in": asset_type_ids}}

    try:
        cursor = assets_collection.aggregate([
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
            }}
        ])
        
        candidates = await cursor.to_list(length=num_candidates)
        print(f"\n--- Vector Search Results ---")
        print(f"Found {len(candidates)} documents from vector search")
        
        # แสดงตัวอย่าง 3 รายการแรก
        if candidates:
            print("\nSample results:")
            for i, doc in enumerate(candidates[:3]):
                price = doc.get("asset_details_selling_price", 0)
                area = doc.get("asset_details_land_size", 0)
                print(f"  {i+1}. {doc.get('name_th', 'N/A')} - Price: {price} type: {type(price).__name__},\n Area: {area} (type: {type(area).__name__})")
        
    except Exception as e:
        print(f"\n!!! MONGODB ERROR !!!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return {"query": query, "results": [], "error": str(e)}

    # Filter ราคาหลัง vector search
    if has_price_filter:
        print(f"\n--- Price Filtering ---")
        print(f"Min: {min_price}, Max: {max_price}")
        
        filtered = []
        for doc in candidates:
            price = doc.get("asset_details_selling_price", 0)
            
            # แปลงเป็น float
            if isinstance(price, str):
                try:
                    # ลบ comma และแปลงเป็น float
                    price = float(price.replace(',', '').strip())
                    doc["asset_details_selling_price"] = price  # อัพเดทค่าใน doc
                except:
                    print(f"Warning: Cannot convert price '{price}' to float")
                    price = 0
            elif price is None:
                price = 0
            
            # ตรวจสอบช่วงราคา
            if min_price is not None and price < min_price:
                continue
            if max_price is not None and price > max_price:
                continue
            
            filtered.append(doc)
        
        print(f"Before filter: {len(candidates)} | After filter: {len(filtered)}")
    
    
        if filtered and len(filtered) < 5:
            print("Filtered results:")
            for doc in filtered:
                p = doc.get('asset_details_selling_price', 0)
                print(f"  - {doc.get('name_th', 'N/A')} - {p} บาท")
        
        candidates = filtered
    
    
    if has_area_filter:
        print(f"\n--- Area Filtering ---")
        print(f"Min area: {min_area}, Max area: {max_area}")

        before_count = len(candidates)  
        filtered_area = []
        
        for doc in candidates:
            area = doc.get("asset_details_land_size", 0)

            if isinstance(area, str):
                try:
                    area = float(area.replace(',', '').strip())
                    doc["asset_details_land_size"] = area  
                except:
                    print(f"Warning: Cannot convert area '{area}' to float")
                    area = 0
            elif area is None:
                area = 0

            if min_area is not None and area < min_area:
                continue
            if max_area is not None and area > max_area:
                continue

            filtered_area.append(doc)

    
        print(f"Before area filter: {before_count} | After: {len(filtered_area)}")
        candidates = filtered_area

    if not candidates:
        print("\n!!! NO RESULTS FOUND !!!")
        print("="*50)
        return {"query": query, "results": []}

    # Rerank ด้วย Gemini
    print(f"\n--- Reranking ---")
    rerank_count = min(max(3 * top_k, 10), len(candidates))
    to_rerank = candidates[:rerank_count]
    print(f"Reranking top {rerank_count} candidates")

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
        print("Reranking successful")
    except Exception as e:
        print(f"Reranking error: {e}")
        for idx, doc in enumerate(to_rerank):
            scores_map[idx + 1] = doc.get("score", 0.0)

    # จัดเตรียมผลลัพธ์
    for idx, doc in enumerate(candidates):
        doc["_rerank_score"] = scores_map.get(idx + 1, doc.get("score", 0.0))
        doc["_id"] = str(doc["_id"])
        doc["bedrooms"] = doc.get("asset_details_number_of_bedrooms", 0)
        doc["bathrooms"] = doc.get("asset_details_number_of_bathrooms", 0)
        doc["description"] = doc.get("ai_description_th", "")
        doc["area"] = doc.get("asset_details_land_size", 0)
        doc["location"] = doc.get("location_village_th", "ไม่มีที่อยู่")
        doc["image"] = doc.get("image", "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")
        doc["price"] = doc.get("asset_details_selling_price", 0)


        if "location_geo" in doc and doc["location_geo"]:
            geo = doc["location_geo"]
            
            # รองรับทั้ง GeoJSON object และ array
            if isinstance(geo, dict) and "coordinates" in geo:
                coords = geo["coordinates"]
            elif isinstance(geo, list):
                coords = geo
            else:
                coords = []
            
            if len(coords) == 2:
                doc["coordinates"] = {
                    "lng": coords[0],
                    "lat": coords[1]
                }
                print(f"✅ Added coordinates for {doc.get('name_th', 'N/A')}: {coords}")
            else:
                print(f"⚠️ Invalid coordinates for {doc.get('name_th', 'N/A')}: {coords}")
        else:
            print(f"❌ No location_geo for {doc.get('name_th', 'N/A')}")
            
    results_sorted = sorted(candidates, key=lambda d: d["_rerank_score"], reverse=True)
    final_results = results_sorted[:top_k]
    
    print(f"\n--- Final Results ---")
    print(f"Returning {len(final_results)} results")
    print("="*50)
    print()
    
    return {"query": query, "results": final_results}

@app.get("/property/{property_id}")
async def get_property(property_id: str):
    print(f"\n=== Fetching property ID: {property_id} ===")
    
    try:
        obj_id = ObjectId(property_id)
    except Exception as e:
        print(f"[ERROR] Invalid ObjectId: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid property ID: {str(e)}")

    try:
        property_doc = await assets_collection.find_one({"_id": obj_id})
        
        if not property_doc:
            print(f"[INFO] Property not found: {property_id}")
            raise HTTPException(status_code=404, detail="Property not found")

        print("[DEBUG] Raw document from MongoDB:")
        for k, v in property_doc.items():
            print(f"  {k}: {v}")

        # map field ให้ตรงกับ frontend
        property_mapped = {
            "_id": str(property_doc["_id"]),
            "title": property_doc.get("name_th") or "ไม่มีชื่อ",
            "location": property_doc.get("location_village_th") or "ไม่มีที่อยู่",
            "price": safe_float(property_doc.get("asset_details_selling_price")), 
            "bedrooms": property_doc.get("asset_details_number_of_bedrooms") or 0,
            "bathrooms": property_doc.get("asset_details_number_of_bathrooms") or 0,
            "area": safe_float(property_doc.get("asset_details_land_size")), 
            "rating": 5,
            "description": property_doc.get("ai_description_th") or "-",
            "type": "ขาย" if property_doc.get("announcement_status_status_id", 1) == 1 else "ไม่ขาย",
            "image": property_doc.get("image") or "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170"
        }

        # Debug coordinate
        print("[DEBUG] location_geo field:")
        print(property_doc.get("location_geo"))

        if "location_geo" in property_doc and property_doc["location_geo"]:
            geo = property_doc["location_geo"]
            
            # รองรับทั้ง GeoJSON object และ array
            if isinstance(geo, dict) and "coordinates" in geo:
                coords = geo["coordinates"]
            elif isinstance(geo, list):
                coords = geo
            else:
                coords = []
            
            if len(coords) == 2:
                property_mapped["coordinates"] = {
                    "lng": coords[0],
                    "lat": coords[1]
                }
                print(f"[DEBUG] coordinates mapped: {property_mapped['coordinates']}")
            else:
                print("[WARN] coordinates missing or incomplete")
        else:
            print("[WARN] location_geo not found")

        print("[DEBUG] Mapped property object:")
        for k, v in property_mapped.items():
            print(f"  {k}: {v}")

        return property_mapped
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Database error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/")
async def root():
    return {"message": "Real Estate Vector Search API"}