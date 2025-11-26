import os
import json
import asyncio
from functools import lru_cache
from typing import List, Tuple
from fastapi import FastAPI, Query
from motor.motor_asyncio import AsyncIOMotorClient
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Real Estate Search API")

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

# Cache embeddings for repeated queries (simple LRU)
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
    query: str = Query(..., description="คำค้นหา"),
    top_k: int = 10,
    min_price: float | None = None,
    max_price: float | None = None
    ):
    text_query, asset_type_ids = extract_query_filters(query)
    
    query_text_for_embedding = text_query or query or "ทั้งหมด"
    query_emb = await embed_text(query_text_for_embedding)

    mongo_filter = {}

    # กรองตามประเภททรัพย์สิน
    if asset_type_ids:
        mongo_filter["asset_type_id"] = {"$in": asset_type_ids}

    # กรองตามราคาขาย
    price_filter = {}
    if min_price is not None:
        price_filter["$gte"] = float(min_price)
    if max_price is not None:
        price_filter["$lte"] = float(max_price)
    if price_filter:
        mongo_filter["asset_details_selling_price"] = price_filter

    num_candidates = max(top_k * 5, 50)
    pipeline_params = {
        "index": VECTOR_SEARCH_INDEX_NAME,
        "path": "asset_vector",
        "queryVector": query_emb,
        "numCandidates": num_candidates,
        "limit": num_candidates,
        "filter": mongo_filter,
    }

    if mongo_filter:
        pipeline_params["filter"] = mongo_filter

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
        }}
    ])
    candidates = await cursor.to_list(length=num_candidates)

    if min_price is not None or max_price is not None:
        filtered = []
        for doc in candidates:
            price = doc.get("asset_details_selling_price", 0)
            if min_price is not None and price < min_price:
                continue
            if max_price is not None and price > max_price:
                continue
            filtered.append(doc)
        candidates = filtered

    if not candidates:
        return {"query": query, "results": []}

    # Rerank ด้วย Gemini (เหมือนเดิม)
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
    except Exception as e:
        for idx, doc in enumerate(to_rerank):
            scores_map[idx + 1] = doc.get("score", 0.0)

    for idx, doc in enumerate(candidates):
        doc["_rerank_score"] = scores_map.get(idx + 1, doc.get("score", 0.0))
        doc["_id"] = str(doc["_id"])
        doc["bedrooms"] = doc.get("asset_details_number_of_bedrooms", 0)
        doc["bathrooms"] = doc.get("asset_details_number_of_bathrooms", 0)
        doc["description"] = doc.get("ai_description_th", 0)
        doc["area"] = doc.get("asset_details_land_size", 0)
        doc["location"] = doc.get("location_village_th", "ไม่มีที่อยู่")
        doc["image"] = doc.get("image", "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")

    results_sorted = sorted(candidates, key=lambda d: d["_rerank_score"], reverse=True)
    return {"query": query, "results": results_sorted[:top_k]}

@app.get("/")
async def root():
    return {"message": "Real Estate Vector Search API"}