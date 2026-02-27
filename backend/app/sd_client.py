"""SD WebUI API クライアントのラッパー"""
import requests
import webuiapi
from app.config import settings


def get_sd_api() -> webuiapi.WebUIApi:
    """SD WebUI API クライアントのインスタンスを返す"""
    return webuiapi.WebUIApi(
        host=settings.SD_WEBUI_HOST,
        port=settings.SD_WEBUI_PORT,
    )


def check_connection() -> dict:
    """SD WebUI への接続を確認する (堅牢版)

    1. まずホストに到達可能か確認
    2. /sdapi/v1/ エンドポイントが存在するか確認
    3. サンプラー・モデル情報を取得
    """
    base_url = f"http://{settings.SD_WEBUI_HOST}:{settings.SD_WEBUI_PORT}"

    # Step 1: ホストへの到達可能性
    try:
        resp = requests.get(f"{base_url}/internal/ping", timeout=5)
    except requests.ConnectionError:
        return {
            "status": "disconnected",
            "host": settings.SD_WEBUI_HOST,
            "port": settings.SD_WEBUI_PORT,
            "samplers": [],
            "models": [],
            "error": f"SD WebUI ({base_url}) に接続できません。SD WebUI が起動しているか確認してください。",
        }
    except Exception as e:
        return {
            "status": "disconnected",
            "host": settings.SD_WEBUI_HOST,
            "port": settings.SD_WEBUI_PORT,
            "samplers": [],
            "models": [],
            "error": str(e),
        }

    # Step 2: API モードの確認
    try:
        samplers_resp = requests.get(f"{base_url}/sdapi/v1/samplers", timeout=5)
        if samplers_resp.status_code == 404:
            return {
                "status": "no_api",
                "host": settings.SD_WEBUI_HOST,
                "port": settings.SD_WEBUI_PORT,
                "samplers": [],
                "models": [],
                "error": (
                    "SD WebUI は起動していますが、API モードが無効です。"
                    " --api フラグを付けて SD WebUI を再起動してください。"
                    " 例: python launch.py --api"
                ),
            }
        samplers_resp.raise_for_status()
    except requests.ConnectionError:
        return {
            "status": "disconnected",
            "host": settings.SD_WEBUI_HOST,
            "port": settings.SD_WEBUI_PORT,
            "samplers": [],
            "models": [],
            "error": "接続エラー",
        }

    # Step 3: サンプラー・モデル情報の取得
    try:
        samplers_data = samplers_resp.json()
        sampler_names = [s["name"] if isinstance(s, dict) else str(s) for s in samplers_data]

        models_resp = requests.get(f"{base_url}/sdapi/v1/sd-models", timeout=10)
        models_data = models_resp.json() if models_resp.status_code == 200 else []
        model_names = [m["title"] if isinstance(m, dict) else str(m) for m in models_data]

        return {
            "status": "connected",
            "host": settings.SD_WEBUI_HOST,
            "port": settings.SD_WEBUI_PORT,
            "samplers": sampler_names,
            "models": model_names,
        }
    except Exception as e:
        return {
            "status": "connected",
            "host": settings.SD_WEBUI_HOST,
            "port": settings.SD_WEBUI_PORT,
            "samplers": [],
            "models": [],
            "error": f"API情報の取得に失敗: {str(e)}",
        }
