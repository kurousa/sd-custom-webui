"""Stable Diffusion Custom WebUI - FastAPI バックエンド"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import generate, health, models, presets, gallery

app = FastAPI(
    title="SD Custom WebUI API",
    description="Stable Diffusion WebUI のカスタムフロントエンド用 API",
    version="0.3.0",
)

# CORS 設定 (フロントエンド開発用)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(health.router)
app.include_router(generate.router)
app.include_router(models.router)
app.include_router(presets.router)
app.include_router(gallery.router)


@app.get("/")
async def root():
    return {
        "name": "SD Custom WebUI API",
        "version": "0.1.0",
        "docs": "/docs",
    }
