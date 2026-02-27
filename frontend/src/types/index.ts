/** SD Custom WebUI の型定義 */

/** 接続状態 */
export interface ConnectionStatus {
    status: 'connected' | 'disconnected' | 'no_api';
    host: string;
    port: number;
    samplers: string[];
    models: string[];
    error?: string;
}

/** txt2img リクエスト */
export interface Txt2ImgRequest {
    prompt: string;
    negative_prompt: string;
    steps: number;
    cfg_scale: number;
    width: number;
    height: number;
    seed: number;
    sampler_name: string;
}

/** txt2img レスポンス */
export interface Txt2ImgResponse {
    images: string[];
    parameters: Record<string, unknown>;
    info: string;
}

/** Checkpoint モデル */
export interface Checkpoint {
    title: string;
    model_name: string;
    hash: string;
    filename: string;
}

/** LoRA モデル */
export interface LoRAModel {
    name: string;
    alias: string;
    path: string;
}

/** プロンプトプリセット */
export interface PromptPreset {
    id: string;
    name: string;
    prompt: string;
    negative_prompt: string;
    checkpoint?: string; // 追加: モデル名
    params?: {           // 追加: 詳細パラメータ
        steps: number;
        cfg_scale: number;
        width: number;
        height: number;
        seed: number;
        sampler_name: string;
    };
    created_at: string;
    updated_at: string;
}

/** XY Plot レスポンス */
export interface XYPlotImage {
    image: string; // Base64 (data:URI)
    axis_value: number | string;
}

export interface XYPlotResponse {
    results: XYPlotImage[];
    parameters: {
        axis: string;
        values: (number | string)[];
    };
    info: string;
}

/** ギャラリー作成（手動保存用） */
export interface GalleryItemCreate {
    image_base64: string;
    metadata: {
        prompt: string;
        negative_prompt: string;
        checkpoint: string;
        params: {
            steps: number;
            cfg_scale: number;
            width: number;
            height: number;
            seed: number;
            sampler_name: string;
        };
    };
}

/** ギャラリー項目 */
export interface GalleryItem {
    id: string;
    filename: string;
    prompt: string;
    negative_prompt: string;
    checkpoint: string;
    params: {
        steps: number;
        cfg_scale: number;
        width: number;
        height: number;
        seed: number;
        sampler_name: string;
    };
    created_at: string;
}
