"""API リクエスト/レスポンスのスキーマ定義"""
from pydantic import BaseModel, Field


class Txt2ImgRequest(BaseModel):
    """txt2img リクエストのスキーマ"""
    prompt: str = Field(default="", description="生成プロンプト")
    negative_prompt: str = Field(default="", description="ネガティブプロンプト")
    steps: int = Field(default=20, ge=1, le=150, description="サンプリングステップ数")
    cfg_scale: float = Field(default=7.0, ge=1.0, le=30.0, description="CFG スケール")
    width: int = Field(default=512, ge=64, le=2048, description="画像の幅")
    height: int = Field(default=512, ge=64, le=2048, description="画像の高さ")
    seed: int = Field(default=-1, description="シード値 (-1 でランダム)")
    sampler_name: str = Field(default="Euler a", description="サンプラー名")


class Txt2ImgResponse(BaseModel):
    """txt2img レスポンスのスキーマ"""
    images: list[str] = Field(description="Base64 エンコードされた画像データのリスト")
    parameters: dict = Field(default={}, description="使用されたパラメータ")
    info: str = Field(default="", description="生成情報")

class XYPlotImage(BaseModel):
    image: str
    axis_value: float | int | str

class XYPlotResponse(BaseModel):
    results: list[XYPlotImage]
    parameters: dict
    info: str


class ConnectionStatus(BaseModel):
    """接続状態のスキーマ"""
    status: str
    host: str
    port: int
    samplers: list[str] = Field(default=[])
    models: list[str] = Field(default=[])
    error: str | None = None
