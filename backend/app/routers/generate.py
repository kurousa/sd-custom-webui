"""テキストから画像生成を行うルーター"""
import base64
from io import BytesIO
from fastapi import APIRouter, HTTPException
from app.schemas import Txt2ImgRequest, Txt2ImgResponse, XYPlotResponse, XYPlotImage
from app.sd_client import get_sd_api
from app.routers.gallery import save_to_gallery

router = APIRouter(prefix="/api/generate", tags=["generate"])

class Txt2ImgRequestExtended(Txt2ImgRequest):
    checkpoint: str = ""

@router.post("/txt2img", response_model=Txt2ImgResponse)
async def txt2img(request: Txt2ImgRequestExtended):
    """テキストから画像を生成する"""
    try:
        api = get_sd_api()
        result = api.txt2img(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            steps=request.steps,
            cfg_scale=request.cfg_scale,
            width=request.width,
            height=request.height,
            seed=request.seed,
            sampler_name=request.sampler_name,
        )

        # PIL Image を Base64 に変換 & ギャラリーに自動保存
        images_base64 = []
        for img in result.images:
            # 通常生成は自動保存のままにする
            save_to_gallery(
                img,
                request.prompt,
                request.negative_prompt,
                request.checkpoint,
                {
                    "steps": request.steps,
                    "cfg_scale": request.cfg_scale,
                    "width": request.width,
                    "height": request.height,
                    "seed": result.info.get("seed", request.seed),
                    "sampler_name": request.sampler_name,
                }
            )

            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
            images_base64.append(img_base64)

        return Txt2ImgResponse(
            images=images_base64,
            parameters=result.parameters,
            info=str(result.info),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class XYPlotRequest(Txt2ImgRequestExtended):
    axis: str = "cfg_scale"  # "steps", "cfg_scale", "seed" など
    values: list[float | int | str] = []

@router.post("/xyplot", response_model=XYPlotResponse)
async def xyplot(request: XYPlotRequest):
    """パラメータを変化させながら連続で画像を生成する (自動保存なし)"""
    try:
        api = get_sd_api()
        results = []
        
        for val in request.values:
            # リクエストのコピーを作成
            current_params = request.dict()
            if request.axis in current_params:
                current_params[request.axis] = val
            
            # 生成実行
            result = api.txt2img(
                prompt=current_params["prompt"],
                negative_prompt=current_params["negative_prompt"],
                steps=current_params["steps"],
                cfg_scale=current_params["cfg_scale"],
                width=current_params["width"],
                height=current_params["height"],
                seed=current_params["seed"],
                sampler_name=current_params["sampler_name"],
            )

            # XY Plot では自動保存せず、Base64 とパラメータ情報を返却する
            for img in result.images:
                buffered = BytesIO()
                img.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
                
                results.append(XYPlotImage(
                    image=f"data:image/png;base64,{img_base64}",
                    axis_value=val
                ))

        return XYPlotResponse(
            results=results,
            parameters={"axis": request.axis, "values": request.values},
            info=f"XY Plot preview generated {len(results)} images",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
