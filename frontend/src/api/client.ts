/** SD Custom WebUI - API クライアント */
import type {
    ConnectionStatus,
    Txt2ImgRequest,
    Txt2ImgResponse,
    Checkpoint,
    LoRAModel,
    PromptPreset,
    GalleryItem,
    XYPlotResponse,
    GalleryItemCreate
} from '../types';

const API_BASE = '/api';

/** サーバー接続確認 */
export async function checkHealth(): Promise<ConnectionStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend link failed');
    return res.json();
}

// ─── 生成 ──────────────────────────────────────────────────

/** txt2img 画像生成 */
export async function generateTxt2Img(params: Txt2ImgRequest & { checkpoint?: string }): Promise<Txt2ImgResponse> {
    const res = await fetch(`${API_BASE}/generate/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(detail.detail || `API Error: ${res.status}`);
    }
    return res.json();
}

/** XY Plot 生成 (プレビュー用) */
export async function generateXYPlot(params: Txt2ImgRequest & { checkpoint?: string; axis: string; values: (string | number)[] }): Promise<XYPlotResponse> {
    const res = await fetch(`${API_BASE}/generate/xyplot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(detail.detail || `API Error: ${res.status}`);
    }
    return res.json();
}

// ─── Checkpoint ─────────────────────────────────────────────

/** Checkpoint 一覧を取得 */
export async function listCheckpoints(): Promise<Checkpoint[]> {
    const res = await fetch(`${API_BASE}/models/checkpoints`);
    const data = await res.json();
    return data.checkpoints || [];
}

/** 現在選択されている Checkpoint を取得 */
export async function getCurrentCheckpoint(): Promise<string> {
    const res = await fetch(`${API_BASE}/models/checkpoints/current`);
    const data = await res.json();
    return data.current || data.current_checkpoint; // Handle both potential field names
}

/** Checkpoint を切り替える */
export async function switchCheckpoint(title: string): Promise<void> {
    const res = await fetch(`${API_BASE}/models/checkpoints/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkpoint: title }), // Backend expects 'checkpoint' key
    });
    if (!res.ok) throw new Error('Failed to switch checkpoint');
}

// ─── LoRA ──────────────────────────────────────────────────

/** LoRA 一覧を取得 */
export async function listLoras(): Promise<LoRAModel[]> {
    const res = await fetch(`${API_BASE}/models/loras`);
    const data = await res.json();
    return data.loras || [];
}

/** LoRA 一覧をリフレッシュ */
export async function refreshLoras(): Promise<void> {
    const res = await fetch(`${API_BASE}/models/loras/refresh`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to refresh LoRAs');
}

// ─── プリセット ──────────────────────────────────────────────

/** プリセット一覧を取得 */
export async function listPresets(): Promise<PromptPreset[]> {
    const res = await fetch(`${API_BASE}/presets/`);
    return res.json();
}

/** プリセットを作成 */
export async function createPreset(data: Partial<PromptPreset>): Promise<PromptPreset> {
    const res = await fetch(`${API_BASE}/presets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

/** プリセットを削除 */
export async function deletePreset(id: string): Promise<void> {
    await fetch(`${API_BASE}/presets/${id}`, { method: 'DELETE' });
}

// ─── ギャラリー ──────────────────────────────────────────────

/** ギャラリー一覧を取得 */
export async function listGallery(): Promise<GalleryItem[]> {
    const res = await fetch(`${API_BASE}/gallery/`);
    return res.json();
}

/** 手動でギャラリーに保存 */
export async function createGalleryItem(item: GalleryItemCreate): Promise<any> {
    const res = await fetch(`${API_BASE}/gallery/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error('Failed to save to gallery');
    return res.json();
}

/** ギャラリー項目を削除 */
export async function deleteGalleryItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/gallery/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete gallery item');
}
