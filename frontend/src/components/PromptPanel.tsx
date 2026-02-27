/** プロンプト入力パネル (フルプリセット対応) */
import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { PresetPanel } from './PresetPanel';
import { XYPlotPanel } from './XYPlotPanel';
import type { Txt2ImgRequest, PromptPreset } from '../types';

const QUALITY_TAGS = ['masterpiece', 'best quality', 'ultra-detailed', 'highres', 'absurdres', '8k', 'photorealistic', 'sharp focus'];
const NEGATIVE_PRESETS = ['worst quality', 'low quality', 'blurry', 'bad anatomy', 'extra limbs', 'deformed', 'watermark', 'text'];

interface Props {
    prompt: string;
    negativePrompt: string;
    checkpoint: string;
    params: Txt2ImgRequest;
    onPromptChange: (v: string) => void;
    onNegativePromptChange: (v: string) => void;
    onApplyFullPreset: (preset: PromptPreset) => void;
    onGenerate: () => void;
    onImagesGenerated?: (images: string[]) => void;
    generating: boolean;
    onError?: (err: string) => void;
}

export function PromptPanel({
    prompt, negativePrompt, checkpoint, params,
    onPromptChange, onNegativePromptChange, onApplyFullPreset,
    onGenerate, onImagesGenerated, generating, onError
}: Props) {
    const [activeNegChips, setActiveNegChips] = useState<Set<string>>(new Set());

    const toggleChip = (tag: string, current: string, setter: (v: string) => void) => {
        const tags = current.split(',').map((t) => t.trim()).filter(Boolean);
        if (tags.includes(tag)) setter(tags.filter((t) => t !== tag).join(', '));
        else setter([...tags, tag].join(', '));
    };

    const toggleNegChip = (tag: string) => {
        const next = new Set(activeNegChips);
        if (next.has(tag)) next.delete(tag); else next.add(tag);
        setActiveNegChips(next);
        toggleChip(tag, negativePrompt, onNegativePromptChange);
    };

    const promptTags = prompt.split(',').map((t) => t.trim()).filter(Boolean);

    return (
        <div className="glass-panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="var(--color-accent)" />
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>プロンプト</h2>
            </div>

            {/* ── フルプリセット管理 ── */}
            <PresetPanel
                prompt={prompt}
                negativePrompt={negativePrompt}
                checkpoint={checkpoint}
                params={params}
                onApply={onApplyFullPreset}
            />

            <div style={{ borderTop: '1px solid var(--color-border)' }} />

            <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>品質タグ</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {QUALITY_TAGS.map((tag) => {
                        const active = promptTags.includes(tag);
                        return (
                            <button key={tag} onClick={() => toggleChip(tag, prompt, onPromptChange)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`, background: active ? 'var(--color-accent-glow)' : 'transparent', color: active ? 'var(--color-accent-hover)' : 'var(--color-text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.15s ease' }}>{tag}</button>
                        );
                    })}
                </div>
            </div>

            <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Positive Prompt</label>
                <textarea value={prompt} onChange={(e) => onPromptChange(e.target.value)} placeholder="1girl, standing, blue sky, ..." rows={4} style={textareaStyle} />
            </div>

            <div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ネガティブ プリセット</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {NEGATIVE_PRESETS.map((tag) => {
                        const active = activeNegChips.has(tag);
                        return (
                            <button key={tag} onClick={() => toggleNegChip(tag)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${active ? 'var(--color-error)' : 'var(--color-border)'}`, background: active ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: active ? '#f87171' : 'var(--color-text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)', cursor: 'pointer', transition: 'all 0.15s ease' }}>{tag}</button>
                        );
                    })}
                </div>
            </div>

            <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Negative Prompt</label>
                <textarea value={negativePrompt} onChange={(e) => onNegativePromptChange(e.target.value)} placeholder="worst quality, low quality, ..." rows={3} style={textareaStyle} />
            </div>

            <button onClick={onGenerate} disabled={generating} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, border: 'none', background: generating ? 'var(--color-bg-hover)' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxShadow: generating ? 'none' : '0 4px 16px rgba(139, 92, 246, 0.3)' }}>
                {generating ? (<><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />生成中...</>) : (<><Send size={16} />Generate</>)}
            </button>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

            {/* ── XY Plot パネル ── */}
            <XYPlotPanel
                params={params}
                prompt={prompt}
                negativePrompt={negativePrompt}
                checkpoint={checkpoint}
                onGenerating={() => { /* 外部ローディングは App 側でも制御される */ }}
                onImagesGenerated={(imgs) => {
                    if (onImagesGenerated) onImagesGenerated(imgs);
                }}
                onError={(err) => {
                    if (onError) onError(err);
                }}
            />

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const textareaStyle: React.CSSProperties = { width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)', resize: 'vertical', outline: 'none', lineHeight: 1.6 };
