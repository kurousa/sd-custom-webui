/** 画像プレビューエリア (中央カラム) */
import { ImageIcon, ZoomIn } from 'lucide-react';
import { useState } from 'react';

interface Props {
    image: string | null;
    generating: boolean;
}

export function PreviewPanel({ image, generating }: Props) {
    const [zoomed, setZoomed] = useState(false);

    return (
        <>
            <div
                className="glass-panel"
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 0,
                }}
            >
                {generating ? (
                    /* スケルトンローディング */
                    <div style={{ width: '100%', maxWidth: 512, aspectRatio: '1', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div className="skeleton" style={{ flex: 1, height: 12 }} />
                            <div className="skeleton" style={{ width: 80, height: 12 }} />
                        </div>
                    </div>
                ) : image ? (
                    /* 生成画像 */
                    <div
                        className="animate-fade-in"
                        style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}
                    >
                        <img
                            src={`data:image/png;base64,${image}`}
                            alt="Generated"
                            style={{
                                maxWidth: '100%',
                                maxHeight: 'calc(100vh - 200px)',
                                borderRadius: 12,
                                objectFit: 'contain',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                            }}
                            onClick={() => setZoomed(true)}
                        />
                        <button
                            onClick={() => setZoomed(true)}
                            style={{
                                position: 'absolute',
                                bottom: 12,
                                right: 12,
                                padding: '8px',
                                borderRadius: 8,
                                border: '1px solid var(--color-border)',
                                background: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                cursor: 'pointer',
                                backdropFilter: 'blur(8px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            title="拡大表示"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>
                ) : (
                    /* 空状態 */
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 20,
                                background: 'var(--color-bg-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ImageIcon size={32} strokeWidth={1.5} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                                画像プレビュー
                            </p>
                            <p style={{ fontSize: 12, marginTop: 4 }}>
                                プロンプトを入力して Generate をクリック
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* フルスクリーン拡大モーダル */}
            {zoomed && image && (
                <div
                    onClick={() => setZoomed(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out',
                        animation: 'fade-in 0.2s ease-out',
                    }}
                >
                    <img
                        src={`data:image/png;base64,${image}`}
                        alt="Zoomed"
                        style={{
                            maxWidth: '95vw',
                            maxHeight: '95vh',
                            objectFit: 'contain',
                            borderRadius: 8,
                        }}
                    />
                </div>
            )}
        </>
    );
}
