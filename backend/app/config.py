"""アプリケーション設定"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """環境変数から読み込む設定"""
    SD_WEBUI_HOST: str = os.getenv("SD_WEBUI_HOST", "127.0.0.1")
    SD_WEBUI_PORT: int = int(os.getenv("SD_WEBUI_PORT", "7860"))


settings = Settings()
