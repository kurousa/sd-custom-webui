/** フル設定 プリセット管理パネル */
import { useState, useEffect, useCallback } from 'react';
import { BookMarked, Plus, Trash2, Download, X, Layers, Sliders } from 'lucide-react';
import { listPresets, createPreset, deletePreset } from '../api/client';
import type { PromptPreset, Txt2ImgRequest } from '../types';

interface Props {
    prompt: string;
    negativePrompt: string;
    checkpoint: string;
    params: Txt2ImgRequest;
    onApply: (preset: PromptPreset) => void;
}

export function PresetPanel({ prompt, negativePrompt, checkpoint, params, onApply }: Props) {
    const [presets, setPresets] = useState<PromptPreset[]>([]);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPresets = useCallback(async () => {
        try {
            const data = await listPresets();
            setPresets(data);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : '取得に失敗');
        }
    }, []);

    useEffect(() => {
        fetchPresets();
    }, [fetchPresets]);

    const handleSave = async () => {
        if (!saveName.trim() || saving) return;
        setSaving(true);
        try {
            await createPreset({
                name: saveName.trim(),
                prompt,
                negative_prompt: negativePrompt,
                checkpoint,
                params: {
                    steps: params.steps,
                    cfg_scale: params.cfg_scale,
                    width: params.width,
                    height: params.height,
                    seed: params.seed,
                    sampler_name: params.sampler_name,
                }
            });
            setSaveName('');
            setShowSaveForm(false);
            await fetchPresets();
        } catch (e) {
            setError(e instanceof Error ? e.message : '保存に失敗');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deletePreset(id);
            setPresets((prev) => prev.filter((p) => p.id !== id));
        } catch (e) {
            setError(e instanceof Error ? e.message : '削除に失敗');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookMarked size={14} color="var(--color-accent)" />
                <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    flex: 1,
                }}>
                    フル設定プリセット
                </span>
                <button
                    onClick={() => setShowSaveForm(!showSaveForm)}
                    style={iconBtnStyle}
                    title="現在の全設定を保存"
                >
                    {showSaveForm ? <X size={13} /> : <Plus size={13} />}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '5px 8px', borderRadius: 6, fontSize: 10,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171',
                }}>
                    ⚠ {error}
                </div>
            )}

            {showSaveForm && (
                <div
                    className="animate-fade-in"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: 10,
                        borderRadius: 8,
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-border)',
                    }}
                >
                    <input
                        type="text"
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        placeholder="プリセット名を入力..."
                        autoFocus
                        style={inputStyle}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6, fontSize: 10 }}>
                        <Layers size={10} /> {checkpoint.split(' [')[0]}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6, fontSize: 10 }}>
                        <Sliders size={10} /> {params.steps}s / {params.cfg_scale}cfg / {params.width}x{params.height}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !saveName.trim()}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'var(--color-accent)',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: saving || !saveName.trim() ? 'not-allowed' : 'pointer',
                            opacity: saving || !saveName.trim() ? 0.5 : 1,
                        }}
                    >
                        {saving ? '保存中...' : '全設定を保存'}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                {presets.length > 0 ? (
                    presets.map((p) => (
                        <div
                            key={p.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--color-border)',
                                background: 'transparent',
                            }}
                        >
                            <button
                                onClick={() => onApply(p)}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    padding: 0,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    overflow: 'hidden',
                                }}
                                title={`Checkpoint: ${p.checkpoint}\nSteps: ${p.params?.steps}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Download size={11} color="var(--color-accent)" />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                        {p.name}
                                    </span>
                                </div>
                                <div style={{ fontSize: 9, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                                    {p.checkpoint?.split(' [')[0]} | {p.params?.steps}s / {p.params?.cfg_scale}cf
                                </div>
                            </button>
                            <button
                                onClick={() => handleDelete(p.id)}
                                style={{ ...iconBtnStyle, padding: 3, color: 'var(--color-text-muted)' }}
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                    ))
                ) : (
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: 8 }}>
                        保存済みプリセットなし
                    </p>
                )}
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    fontSize: 12,
    outline: 'none',
};

const iconBtnStyle: React.CSSProperties = {
    padding: 4,
    borderRadius: 6,
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
