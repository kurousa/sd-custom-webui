/** ギャラリービュー (比較機能対応版) */
import { useState, useEffect, useCallback } from 'react';
import { ImageIcon, Trash2, Calendar, Clipboard, Download, ExternalLink, X, Box, Sliders, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { listGallery, deleteGalleryItem } from '../api/client';
import type { GalleryItem } from '../types';

interface Props {
    onCompare: (items: [GalleryItem, GalleryItem]) => void;
}

export function GalleryView({ onCompare }: Props) {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
    const [compareSelection, setCompareSelection] = useState<GalleryItem[]>([]);

    const fetchGallery = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listGallery();
            setItems(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : '取得に失敗');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    const toggleCompare = (item: GalleryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setCompareSelection(prev => {
            if (prev.find(p => p.id === item.id)) {
                return prev.filter(p => p.id !== item.id);
            }
            if (prev.length >= 2) {
                return [prev[1], item];
            }
            return [...prev, item];
        });
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('画像を削除しますか？')) return;
        try {
            await deleteGalleryItem(id);
            setItems((prev) => prev.filter((item) => item.id !== id));
            setCompareSelection(prev => prev.filter(p => p.id !== id));
            if (selectedItem?.id === id) setSelectedItem(null);
        } catch (e) {
            alert('削除に失敗しました');
        }
    };

    const handleCopyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        alert('プロンプトをコピーしました');
    };

    if (loading && items.length === 0) {
        return (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, padding: 20 }}>
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '1/1' }} />)}
            </div>
        );
    }

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 20, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ImageIcon size={24} color="var(--color-accent)" /> ギャラリー
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchGallery} className="glass-panel" style={actionBtnStyle}>
                        更新
                    </button>
                </div>
            </div>

            {items.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    <Box size={48} strokeWidth={1} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <p>生成された画像がありません</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, overflowY: 'auto', paddingBottom: 80 }}>
                    {items.map((item) => {
                        const isSelectedForCompare = compareSelection.find(p => p.id === item.id);
                        return (
                            <div
                                key={item.id}
                                className="glass-panel animate-fade-in"
                                onClick={() => setSelectedItem(item)}
                                style={{
                                    position: 'relative',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease',
                                    border: isSelectedForCompare ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                                    aspectRatio: '1 / 1',
                                }}
                            >
                                <img
                                    src={`/api/gallery/image/${item.id}`}
                                    alt={item.prompt}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />

                                {/* 比較選択ボタン */}
                                <button
                                    onClick={(e) => toggleCompare(item, e)}
                                    style={{
                                        position: 'absolute', top: 8, right: 8,
                                        width: 24, height: 24, borderRadius: 12,
                                        background: isSelectedForCompare ? 'var(--color-accent)' : 'rgba(0,0,0,0.4)',
                                        border: 'none', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', zIndex: 5, backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    {isSelectedForCompare ? <CheckCircle2 size={14} /> : <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #fff' }} />}
                                </button>

                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0,
                                    padding: '8px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    opacity: 0, transition: 'opacity 0.2s',
                                }} className="hover-info">
                                    <span style={{ fontSize: 11, color: '#fff', opacity: 0.8 }}>{item.params.steps}s / {item.params.cfg_scale}cf</span>
                                    <button onClick={(e) => handleDelete(item.id, e)} style={{ border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <style>{`.glass-panel:hover .hover-info { opacity: 1; }`}</style>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 比較実行フローティングボタン */}
            {compareSelection.length > 0 && (
                <div style={floatingBarStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{compareSelection.length} 枚選択中</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {compareSelection.map(p => (
                                <img key={p.id} src={`/api/gallery/image/${p.id}`} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => setCompareSelection([])} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13 }}>キャンセル</button>
                        <button
                            disabled={compareSelection.length < 2}
                            onClick={() => onCompare([compareSelection[0], compareSelection[1]])}
                            style={{
                                padding: '8px 20px', borderRadius: 8, border: 'none',
                                background: compareSelection.length === 2 ? 'var(--color-accent)' : 'var(--color-bg-hover)',
                                color: '#fff', fontSize: 13, fontWeight: 700, cursor: compareSelection.length === 2 ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', gap: 8
                            }}
                        >
                            <Sliders size={14} /> 比較を開始する
                        </button>
                    </div>
                </div>
            )}

            {/* 詳細モーダル (省略せず実装) */}
            {selectedItem && (
                <div style={modalOverlayStyle} onClick={() => setSelectedItem(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            <img src={`/api/gallery/image/${selectedItem.id}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: 20, right: 20, padding: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ width: 340, background: 'var(--color-bg-secondary)', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', minWidth: 340 }}>
                            <div style={{ padding: 20, borderBottom: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>画像詳細</h3>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Calendar size={12} /> {new Date(selectedItem.created_at).toLocaleString()}
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div style={infoGroupStyle}>
                                    <label style={labelStyle}>Prompt</label>
                                    <div style={{ ...contentStyle, position: 'relative' }}>
                                        {selectedItem.prompt}
                                        <button onClick={() => handleCopyPrompt(selectedItem.prompt)} style={copyBtnStyle} title="コピー"><Clipboard size={12} /></button>
                                    </div>
                                </div>
                                <div style={infoGroupStyle}>
                                    <label style={labelStyle}>Checkpoint</label>
                                    <div style={contentStyle}>{selectedItem.checkpoint}</div>
                                </div>
                                <div style={infoGroupStyle}>
                                    <label style={labelStyle}>Parameters</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <ParamItem label="Steps" value={selectedItem.params.steps} />
                                        <ParamItem label="CFG Scale" value={selectedItem.params.cfg_scale} />
                                        <ParamItem label="Size" value={`${selectedItem.params.width}x${selectedItem.params.height}`} />
                                        <ParamItem label="Sampler" value={selectedItem.params.sampler_name} />
                                        <ParamItem label="Seed" value={selectedItem.params.seed} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: 20, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10 }}>
                                <a href={`/api/gallery/image/${selectedItem.id}`} download={`${selectedItem.id}.png`} style={{ flex: 1, textDecoration: 'none' }}>
                                    <button style={{ ...actionBtnStyle, width: '100%', background: 'var(--color-accent)', color: '#fff', border: 'none' }}>
                                        <Download size={14} /> 画像を保存
                                    </button>
                                </a>
                                <button onClick={(e) => handleDelete(selectedItem.id, e)} style={{ ...actionBtnStyle, color: '#ff4d4f' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 補助コンポーネント & スタイル (前の実装をベースに復元・統合)
function ParamItem({ label, value }: { label: string, value: any }) {
    return (
        <div style={{ padding: '8px 10px', background: 'var(--color-bg-primary)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{value}</div>
        </div>
    );
}

const actionBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
    background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)',
    fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', cursor: 'pointer'
};

const floatingBarStyle: React.CSSProperties = {
    position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--color-bg-elevated)', border: '1px solid var(--color-accent)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)', borderRadius: 16, padding: '12px 20px',
    display: 'flex', alignItems: 'center', gap: 40, zIndex: 100, backdropFilter: 'blur(12px)'
};

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: 40
};

const modalContentStyle: React.CSSProperties = {
    width: '100%', maxWidth: 1200, height: '100%', maxHeight: 900,
    background: 'var(--color-bg-primary)', borderRadius: 20, overflow: 'hidden',
    display: 'flex', border: '1px solid var(--color-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
};

const infoGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const contentStyle: React.CSSProperties = { padding: '10px 14px', background: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)' };
const copyBtnStyle: React.CSSProperties = { position: 'absolute', top: 8, right: 8, padding: 4, borderRadius: 4, background: 'var(--color-bg-tertiary)', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' };
