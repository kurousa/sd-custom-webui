"""プロンプト プリセット管理ルーター (フル設定対応版)"""
import json
import uuid
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/presets", tags=["presets"])

PRESETS_DIR = Path(__file__).resolve().parent.parent / "data"
PRESETS_FILE = PRESETS_DIR / "presets.json"


def _ensure_file():
    PRESETS_DIR.mkdir(parents=True, exist_ok=True)
    if not PRESETS_FILE.exists():
        PRESETS_FILE.write_text("[]", encoding="utf-8")


def _load_presets() -> list[dict]:
    _ensure_file()
    return json.loads(PRESETS_FILE.read_text(encoding="utf-8"))


def _save_presets(presets: list[dict]):
    _ensure_file()
    PRESETS_FILE.write_text(
        json.dumps(presets, ensure_ascii=False, indent=2), encoding="utf-8"
    )


# ───────────────────────── スキーマ ─────────────────────────

class GenerationParams(BaseModel):
    steps: int
    cfg_scale: float
    width: int
    height: int
    seed: int
    sampler_name: str


class PresetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    prompt: str = ""
    negative_prompt: str = ""
    checkpoint: str | None = None  # Checkpoint名
    params: GenerationParams | None = None  # 各種パラメータ


class PresetOut(BaseModel):
    id: str
    name: str
    prompt: str
    negative_prompt: str
    checkpoint: str | None = None
    params: GenerationParams | None = None
    created_at: str
    updated_at: str


# ───────────────────────── エンドポイント ─────────────────────────

@router.get("/", response_model=list[PresetOut])
async def list_presets():
    return _load_presets()


@router.post("/", response_model=PresetOut, status_code=201)
async def create_preset(body: PresetCreate):
    presets = _load_presets()
    now = datetime.now(timezone.utc).isoformat()
    preset = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "prompt": body.prompt,
        "negative_prompt": body.negative_prompt,
        "checkpoint": body.checkpoint,
        "params": body.params.dict() if body.params else None,
        "created_at": now,
        "updated_at": now,
    }
    presets.append(preset)
    _save_presets(presets)
    return preset


@router.delete("/{preset_id}")
async def delete_preset(preset_id: str):
    presets = _load_presets()
    new_presets = [p for p in presets if p["id"] != preset_id]
    if len(new_presets) == len(presets):
        raise HTTPException(status_code=404, detail="プリセットが見つかりません")
    _save_presets(new_presets)
    return {"status": "ok"}
