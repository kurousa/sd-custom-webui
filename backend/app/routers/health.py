"""SD WebUI 接続状態の確認ルーター"""
from fastapi import APIRouter
from app.schemas import ConnectionStatus
from app.sd_client import check_connection

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=ConnectionStatus)
async def health_check():
    """SD WebUI への接続状態を返す"""
    result = check_connection()
    return ConnectionStatus(**result)
