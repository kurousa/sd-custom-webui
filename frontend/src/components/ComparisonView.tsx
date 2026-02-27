/** Side-by-Side 比較ビュー */
import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Maximize, Move, Info } from 'lucide-react';
import type { GalleryItem } from '../types';

interface Props {
    items: [GalleryItem, GalleryItem];
    onClose: () => void;
}

export function ComparisonView({ items, onClose }: Props) {
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // 同期ズーム（マウスホイール）
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(transform.scale * delta, 0.5), 10);
        setTransform(prev => ({ ...prev, scale: newScale }));
    };

    // 同期パン（ドラッグ）
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setTransform(prev => ({
            ...prev,
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        }));
    };

    const handleMouseUp = () => setIsDragging(false);

    const resetTransform = () => setTransform({ x: 0, y: 0, scale: 1 });

    // キーボードショートカット
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const imgStyle: React.CSSProperties = {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        transformOrigin: 'center center',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
    };

    return (
        <div style={overlayStyle}>
            {/* ヘッダー */}
            <header style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Maximize size={20} color="var(--color-accent)" />
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Side-by-Side 比較</h2>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)', background: 'var(--color-bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
                        同期ズーム・パン有効
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={resetTransform} style={toolBtnStyle} title="リセット"><Maximize size={14} /></button>
                    <button onClick={onClose} style={{ ...toolBtnStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}><X size={16} /></button>
                </div>
            </header>

            {/* 比較エリア */}
            <div
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={containerStyle}
            >
                {/* 左画像 */}
                <div style={paneStyle}>
                    <div style={labelTagStyle}>A: {items[0].prompt.slice(0, 30)}...</div>
                    <img src={`/api/gallery/image/${items[0].id}`} style={imgStyle} draggable={false} />
                    <div style={metadataBoxStyle}>
                        <div><span style={{ opacity: 0.5 }}>Steps:</span> {items[0].params.steps}</div>
                        <div><span style={{ opacity: 0.5 }}>CFG:</span> {items[0].params.cfg_scale}</div>
                        <div><span style={{ opacity: 0.5 }}>Seed:</span> {items[0].params.seed}</div>
                    </div>
                </div>

                {/* セパレーター */}
                <div style={{ width: 1, background: 'var(--color-border)', height: '80%' }} />

                {/* 右画像 */}
                <div style={paneStyle}>
                    <div style={labelTagStyle}>B: {items[1].prompt.slice(0, 30)}...</div>
                    <img src={`/api/gallery/image/${items[1].id}`} style={imgStyle} draggable={false} />
                    <div style={metadataBoxStyle}>
                        <div><span style={{ opacity: 0.5 }}>Steps:</span> {items[1].params.steps}</div>
                        <div><span style={{ opacity: 0.5 }}>CFG:</span> {items[1].params.cfg_scale}</div>
                        <div><span style={{ opacity: 0.5 }}>Seed:</span> {items[1].params.seed}</div>
                    </div>
                </div>
            </div>

            {/* インフォメーションバー */}
            <footer style={footerStyle}>
                <Info size={14} /> マウスホイールでズーム、ドラッグで移動。A/B両方の画像が同期して動きます。
            </footer>
        </div>
    );
}

const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'var(--color-bg-primary)',
    display: 'flex', flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
    padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)'
};

const containerStyle: React.CSSProperties = {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', padding: 20, gap: 20, position: 'relative'
};

const paneStyle: React.CSSProperties = {
    flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.1)', borderRadius: 12
};

const labelTagStyle: React.CSSProperties = {
    position: 'absolute', top: 12, left: 12, zIndex: 10,
    padding: '4px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    fontSize: 11, color: '#fff', border: '1px solid rgba(255,255,255,0.1)'
};

const metadataBoxStyle: React.CSSProperties = {
    position: 'absolute', bottom: 12, left: 12, zIndex: 10,
    padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    fontSize: 11, color: '#fff', display: 'flex', gap: 12, border: '1px solid rgba(255,255,255,0.1)'
};

const toolBtnStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
    background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const footerStyle: React.CSSProperties = {
    padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 10,
    fontSize: 12, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)'
};
