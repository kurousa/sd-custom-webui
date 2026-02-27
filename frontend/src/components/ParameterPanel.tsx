/** パラメータ調整パネル (左カラム) */
import { useState, useEffect } from 'react';
import { SlidersHorizontal, Settings2 } from 'lucide-react';
import type { Txt2ImgRequest } from '../types';

const SIZE_PRESETS = [
    { label: '1:1 (512)', w: 512, h: 512 },
    { label: '2:3 (Port)', w: 512, h: 768 },
    { label: '3:2 (Land)', w: 768, h: 512 },
    { label: '1:1 (1024)', w: 1024, h: 1024 },
    { label: 'SDXL Wide', w: 1216, h: 832 },
    { label: 'SDXL Port', w: 832, h: 1216 },
];

interface Props {
    params: Txt2ImgRequest;
    samplers: string[];
    onChange: (params: Txt2ImgRequest) => void;
}

export function ParameterPanel({ params, samplers, onChange }: Props) {
    const [showCustom, setShowCustom] = useState(false);

    // 現在の設定がいずれかのプリセットと完全に一致するか確認
    const matchedPreset = SIZE_PRESETS.find(p => p.w === params.width && p.h === params.height);

    // プリセット外の解像度になった瞬間に、自動的に Custom パネルを開く
    useEffect(() => {
        if (!matchedPreset && !showCustom) {
            setShowCustom(true);
        }
    }, [params.width, params.height, !!matchedPreset]);

    const update = <K extends keyof Txt2ImgRequest>(key: K, value: Txt2ImgRequest[K]) => {
        onChange({ ...params, [key]: value });
    };

    return (
        <aside
            className="glass-panel"
            style={{
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={16} color="var(--color-accent)" />
                <h2 style={{ fontSize: 14, fontWeight: 600 }}>パラメータ</h2>
            </div>

            <FieldGroup label="Sampler">
                <select
                    value={params.sampler_name}
                    onChange={(e) => update('sampler_name', e.target.value)}
                    style={selectStyle}
                >
                    {samplers.length > 0
                        ? samplers.map((s) => <option key={s} value={s}>{s}</option>)
                        : <option value={params.sampler_name}>{params.sampler_name}</option>}
                </select>
            </FieldGroup>

            <SliderField
                label="Steps"
                value={params.steps}
                min={1}
                max={150}
                onChange={(v) => update('steps', v)}
            />

            <SliderField
                label="CFG Scale"
                value={params.cfg_scale}
                min={1}
                max={30}
                step={0.5}
                onChange={(v) => update('cfg_scale', v)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Resolution
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {SIZE_PRESETS.map((p) => {
                        // パネルを閉じており、かつ値が一致しているボタンを光らせる
                        const isActive = !showCustom && params.width === p.w && params.height === p.h;
                        return (
                            <button
                                key={p.label}
                                onClick={() => {
                                    setShowCustom(false);
                                    // 2回 update を呼ぶとステートの更新が競合するため、直接セットする
                                    onChange({ ...params, width: p.w, height: p.h });
                                }}
                                style={getPresetButtonStyle(isActive)}
                            >
                                {p.label}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setShowCustom(!showCustom)}
                        style={getPresetButtonStyle(showCustom)}
                    >
                        <Settings2 size={10} style={{ marginRight: 4 }} /> Custom
                    </button>
                </div>

                {showCustom && (
                    <div className="animate-fade-in" style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
                        marginTop: 4, padding: '10px', background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8, border: '1px solid var(--color-border)'
                    }}>
                        <FieldGroup label="Width">
                            <NumberInput value={params.width} min={64} max={2048} step={64} onChange={(v) => update('width', v)} />
                        </FieldGroup>
                        <FieldGroup label="Height">
                            <NumberInput value={params.height} min={64} max={2048} step={64} onChange={(v) => update('height', v)} />
                        </FieldGroup>
                    </div>
                )}
            </div>

            <FieldGroup label="Seed">
                <NumberInput value={params.seed} min={-1} max={999999999} step={1} onChange={(v) => update('seed', v)} />
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    -1 = ランダム
                </p>
            </FieldGroup>
        </aside>
    );
}

function getPresetButtonStyle(active: boolean): React.CSSProperties {
    return {
        padding: '6px 4px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
        background: active ? 'var(--color-accent-glow)' : 'transparent',
        color: active ? 'var(--color-accent-hover)' : 'var(--color-text-muted)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </label>
            {children}
        </div>
    );
}

function SliderField({ label, value, min, max, step = 1, onChange }: {
    label: string; value: number; min: number; max: number; step?: number;
    onChange: (v: number) => void;
}) {
    return (
        <FieldGroup label={`${label}: ${value}`}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
            />
        </FieldGroup>
    );
}

function NumberInput({ value, min, max, step, onChange }: {
    value: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
}) {
    return (
        <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            style={inputStyle}
        />
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)',
    background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none',
};

const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
