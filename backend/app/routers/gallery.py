"""生成履歴（ギャラリー）管理ルーター"""
import os
import json
import uuid
import base64
from pathlib import Path
from io import BytesIO
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from PIL import Image

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

# 保存場所
GALLERY_DIR = Path(__file__).resolve().parent.parent / "data" / "gallery"
IMAGES_DIR = GALLERY_DIR / "images"
METADATA_DIR = GALLERY_DIR / "metadata"

def _ensure_dirs():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

class GalleryItem(BaseModel):
    id: str
    filename: str
    prompt: str
    negative_prompt: str
    checkpoint: str
    params: dict
    created_at: str

class GalleryItemMetadata(BaseModel):
    prompt: str
    negative_prompt: str
    checkpoint: str
    params: dict
    created_at: str | None = None

class GalleryItemCreate(BaseModel):
    image_base64: str
    metadata: GalleryItemMetadata

def _save_raw(img_pil, meta: dict):
    _ensure_dirs()
    item_id = str(uuid.uuid4())
    
    # 画像保存
    img_path = IMAGES_DIR / f"{item_id}.png"
    img_pil.save(img_path, format="PNG")
    
    # メタデータ保存
    meta["id"] = item_id
    meta["filename"] = f"{item_id}.png"
    if "created_at" not in meta or not meta["created_at"]:
        meta["created_at"] = datetime.now().isoformat()
        
    with open(METADATA_DIR / f"{item_id}.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)
    
    return item_id

@router.get("/", response_model=list[GalleryItem])
async def list_gallery():
    """ギャラリーの画像一覧を取得（新しい順）"""
    _ensure_dirs()
    items = []
    for meta_file in METADATA_DIR.glob("*.json"):
        try:
            with open(meta_file, "r", encoding="utf-8") as f:
                items.append(json.load(f))
        except:
            continue
    
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items

@router.post("/", status_code=201)
async def create_gallery_item(item: GalleryItemCreate):
    """Base64画像とメタデータをギャラリーに保存する"""
    try:
        header, encoded = item.image_base64.split(",", 1) if "," in item.image_base64 else (None, item.image_base64)
        img_data = base64.b64decode(encoded)
        img_pil = Image.open(BytesIO(img_data))
        
        item_id = _save_raw(img_pil, item.metadata.dict())
        return {"id": item_id, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{image_id}")
async def get_image(image_id: str):
    """画像ファイルを返す"""
    path = IMAGES_DIR / f"{image_id}.png"
    if not path.exists():
        raise HTTPException(status_code=404, detail="画像が見見つかりません")
    return FileResponse(path)

@router.delete("/{image_id}")
async def delete_image(image_id: str):
    """画像を削除」"""
    (IMAGES_DIR / f"{image_id}.png").unlink(missing_ok=True)
    (METADATA_DIR / f"{image_id}.json").unlink(missing_ok=True)
    return {"status": "ok"}

def save_to_gallery(img_pil, prompt, negative_prompt, checkpoint, params):
    """画像をギャラリーに保存する（generateルーターから呼ばれる内部関数）"""
    meta = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "checkpoint": checkpoint,
        "params": params,
    }
    return _save_raw(img_pil, meta)
