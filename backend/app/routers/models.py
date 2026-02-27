"""モデル管理ルーター (Checkpoint / LoRA の取得・切り替え)"""
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api/models", tags=["models"])


def _base_url() -> str:
    return f"http://{settings.SD_WEBUI_HOST}:{settings.SD_WEBUI_PORT}"


# ───────────────────────── Checkpoint ─────────────────────────


@router.get("/checkpoints")
async def list_checkpoints():
    """SD WebUI から利用可能な Checkpoint 一覧を取得する"""
    try:
        resp = requests.get(f"{_base_url()}/sdapi/v1/sd-models", timeout=10)
        resp.raise_for_status()
        models = resp.json()
        return {
            "checkpoints": [
                {
                    "title": m.get("title", ""),
                    "model_name": m.get("model_name", ""),
                    "hash": m.get("hash", ""),
                    "filename": m.get("filename", ""),
                }
                for m in models
            ]
        }
    except requests.ConnectionError:
        raise HTTPException(status_code=503, detail="SD WebUI に接続できません")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/checkpoints/current")
async def get_current_checkpoint():
    """現在選択されている Checkpoint を取得する"""
    try:
        resp = requests.get(f"{_base_url()}/sdapi/v1/options", timeout=10)
        resp.raise_for_status()
        options = resp.json()
        return {"current": options.get("sd_model_checkpoint", "")}
    except requests.ConnectionError:
        raise HTTPException(status_code=503, detail="SD WebUI に接続できません")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CheckpointSwitch(BaseModel):
    checkpoint: str


@router.post("/checkpoints/switch")
async def switch_checkpoint(body: CheckpointSwitch):
    """Checkpoint を切り替える"""
    try:
        resp = requests.post(
            f"{_base_url()}/sdapi/v1/options",
            json={"sd_model_checkpoint": body.checkpoint},
            timeout=120,  # モデル読み込みに時間がかかる
        )
        resp.raise_for_status()
        return {"status": "ok", "checkpoint": body.checkpoint}
    except requests.ConnectionError:
        raise HTTPException(status_code=503, detail="SD WebUI に接続できません")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ───────────────────────── LoRA ─────────────────────────


@router.get("/loras")
async def list_loras():
    """SD WebUI から利用可能な LoRA 一覧を取得する"""
    try:
        resp = requests.get(f"{_base_url()}/sdapi/v1/loras", timeout=10)
        resp.raise_for_status()
        loras = resp.json()
        return {
            "loras": [
                {
                    "name": l.get("name", ""),
                    "alias": l.get("alias", l.get("name", "")),
                    "path": l.get("path", ""),
                }
                for l in loras
            ]
        }
    except requests.ConnectionError:
        raise HTTPException(status_code=503, detail="SD WebUI に接続できません")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/loras/refresh")
async def refresh_loras():
    """LoRA 一覧をリフレッシュする"""
    try:
        resp = requests.post(f"{_base_url()}/sdapi/v1/refresh-loras", timeout=30)
        resp.raise_for_status()
        return {"status": "ok"}
    except requests.ConnectionError:
        raise HTTPException(status_code=503, detail="SD WebUI に接続できません")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
