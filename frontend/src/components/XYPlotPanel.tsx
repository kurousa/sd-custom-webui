/** 簡易 XY Plot パネル (プレビュー & 選択保存対応) */
import { useState } from 'react';
import { Layers, Play, Loader2, X, Check, Save, Trash2 } from 'lucide-react';
import { generateXYPlot, createGalleryItem } from '../api/client';
import type { Txt2ImgRequest, XYPlotImage } from '../types';

interface Props {
    params: Txt2ImgRequest;
    prompt: string;
    negativePrompt: string;
    checkpoint: string;
    onGenerating: (v: boolean) => void;
    onImagesGenerated: (images: string[]) => void;
    onError: (err: string) => void;
}

const AXIS_OPTIONS = [
    { label: 'CFG Scale', value: 'cfg_scale' },
    { label: 'Steps', value: 'steps' },
    { label: 'Seed', value: 'seed' },
];

export function XYPlotPanel({ params, prompt, negativePrompt, checkpoint, onGenerating, onImagesGenerated, onError }: Props) {
    const [active, setActive] = useState(false);
    const [axis, setAxis] = useState('cfg_scale');
    const [values, setValues] = useState<string>('5, 7, 9');
    const [loading, setLoading] = useState(false);

    // プレビュー結果の状態
    const [previewImages, setPreviewImages] = useState<XYPlotImage[] | null>(null);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [saving, setSaving] = useState(false);

    const handleRun = async () => {
        const valList = values.split(',').map(v => v.trim()).filter(v => v !== '');
        if (valList.length === 0) return;

        const parsedValues = valList.map(v => isNaN(Number(v)) ? v : Number(v));

        setLoading(true);
        onGenerating(true);
        try {
            const result = await generateXYPlot({
                ...params,
                prompt,
                negative_prompt: negativePrompt,
                checkpoint,
                axis,
                values: parsedValues
            });
            setPreviewImages(result.results);
            setSelectedIndices(new Set(result.results.map((_, i) => i))); // 初期状態は全選択
        } catch (e) {
            onError(e instanceof Error ? e.message : 'XY Plot 生成に失敗しました');
        } finally {
            setLoading(false);
            onGenerating(false);
        }
    };

    const toggleSelect = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setSelectedIndices(next);
    };

    const handleSaveSelected = async () => {
        if (!previewImages) return;
        setSaving(true);
        try {
            const toSave = previewImages.filter((_, i) => selectedIndices.has(i));
            for (const item of toSave) {
                // 各画像の個別のパラメータを作成
                const imageParams = { ...params, seed: params.seed }; // デフォルト
                if (axis === 'seed' && typeof item.axis_value === 'number') imageParams.seed = item.axis_value;
                if (axis === 'cfg_scale' && typeof item.axis_value === 'number') imageParams.cfg_scale = item.axis_value;
                if (axis === 'steps' && typeof item.axis_value === 'number') imageParams.steps = item.axis_value;

                await createGalleryItem({
                    image_base64: item.image,
                    metadata: {
                        prompt,
                        negative_prompt: negativePrompt,
                        checkpoint,
                        params: {
                            ...imageParams,
                            sampler_name: params.sampler_name
                        }
                    }
                });
            }
            alert(`${selectedIndices.size} 枚をギャラリーに保存しました`);
            setPreviewImages(null);
            setSelectedIndices(new Set());
        } catch (e) {
            onError('保存に失敗しました');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => {
        if (confirm('プレビュー結果を破棄しますか？')) {
            setPreviewImages(null);
            setSelectedIndices(new Set());
        }
    };

    if (previewImages) {
        return (
            <div className="glass-panel animate-fade-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={14} color="var(--color-accent)" />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>XY Plot プレビュー ({selectedIndices.size} / {previewImages.length})</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxHeight: 400, overflowY: 'auto', padding: 4 }}>
                    {previewImages.map((item, i) => {
                        const isSelected = selectedIndices.has(i);
                        return (
                            <div
                                key={i}
                                onClick={() => toggleSelect(i)}
                                style={{
                                    position: 'relative', cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
                                    border: `2px solid ${isSelected ? 'var(--color-accent)' : 'transparent'}`,
                                    aspectRatio: '1/1'
                                }}
                            >
                                <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{
                                    position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%',
                                    background: isSelected ? 'var(--color-accent)' : 'rgba(0,0,0,0.5)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fff'
                                }}>
                                    {isSelected && <Check size={10} color="#fff" />}
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2px 4px',
                                    background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, textAlign: 'center'
                                }}>
                                    {axis}: {item.axis_value}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                        onClick={handleDiscard}
                        style={{ ...secondaryBtnStyle, flex: 1 }}
                    >
                        <Trash2 size={14} /> 破棄
                    </button>
                    <button
                        onClick={handleSaveSelected}
                        disabled={selectedIndices.size === 0 || saving}
                        style={{ ...primaryBtnStyle, flex: 2 }}
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        選択した画像を保存
                    </button>
                </div>
            </div>
        );
    }

    if (!active) {
        return (
            <button
                onClick={() => setActive(true)}
                className="glass-panel"
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', width: '100%', border: '1px dashed var(--color-border)',
                    fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer',
                    background: 'transparent', transition: 'all 0.2s'
                }}
            >
                <Layers size={14} /> XY Plot (パラメータ比較生成) を開始
            </button>
        );
    }

    return (
        <div className="glass-panel animate-fade-in" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Layers size={14} color="var(--color-accent)" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>XY Plot 設定</span>
                </div>
                <button onClick={() => setActive(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                    <X size={14} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>比較するパラメータ</label>
                <select
                    value={axis}
                    onChange={e => setAxis(e.target.value)}
                    style={selectStyle}
                >
                    {AXIS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>比較する値 (カンマ区切り)</label>
                <input
                    type="text"
                    value={values}
                    onChange={e => setValues(e.target.value)}
                    placeholder="5, 7, 9"
                    style={inputStyle}
                />
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    例: CFGなら 5, 7, 9 / Stepsなら 20, 30, 40
                </p>
            </div>

            <button
                onClick={handleRun}
                disabled={loading}
                style={{
                    padding: '10px', borderRadius: 8, border: 'none',
                    background: loading ? 'var(--color-bg-hover)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 4, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                }}
            >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                比較生成を実行 ({values.split(',').length}枚)
            </button>
        </div>
    );
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' };
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
    background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none'
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const primaryBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '10px', borderRadius: 8, border: 'none', background: 'var(--color-accent)',
    color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer'
};
const secondaryBtnStyle: React.CSSProperties = {
    ...primaryBtnStyle,
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text-primary)'
};
