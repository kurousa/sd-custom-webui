/** モデル管理パネル (外部制御対応版) */
import { useState, useEffect, useCallback } from 'react';
import { Box, RefreshCw, Loader2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { listCheckpoints, switchCheckpoint, listLoras, refreshLoras } from '../api/client';
import type { Checkpoint, LoRAModel } from '../types';

interface Props {
    currentCheckpoint: string;
    onCheckpointChange: (title: string) => void;
    onLoraInsert: (loraTag: string) => void;
}

export function ModelPanel({ currentCheckpoint, onCheckpointChange, onLoraInsert }: Props) {
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [switching, setSwitching] = useState(false);
    const [cpError, setCpError] = useState<string | null>(null);

    const [loras, setLoras] = useState<LoRAModel[]>([]);
    const [loraSearch, setLoraSearch] = useState('');
    const [loraExpanded, setLoraExpanded] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loraError, setLoraError] = useState<string | null>(null);

    const fetchCheckpoints = useCallback(async () => {
        try {
            const cps = await listCheckpoints();
            setCheckpoints(cps);
            setCpError(null);
        } catch (e) {
            setCpError(e instanceof Error ? e.message : '取得に失敗');
        }
    }, []);

    const handleSwitch = async (title: string) => {
        if (switching || title === currentCheckpoint) return;
        setSwitching(true);
        setCpError(null);
        try {
            await switchCheckpoint(title);
            onCheckpointChange(title);
        } catch (e) {
            setCpError(e instanceof Error ? e.message : '切り替えに失敗');
        } finally {
            setSwitching(false);
        }
    };

    const fetchLoras = useCallback(async () => {
        try {
            const data = await listLoras();
            setLoras(data);
            setLoraError(null);
        } catch (e) {
            setLoraError(e instanceof Error ? e.message : '取得に失敗');
        }
    }, []);

    const handleRefreshLoras = async () => {
        setRefreshing(true);
        try {
            await refreshLoras();
            await fetchLoras();
        } catch (e) {
            setLoraError(e instanceof Error ? e.message : 'リフレッシュに失敗');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCheckpoints();
        fetchLoras();
    }, [fetchCheckpoints, fetchLoras]);

    const filteredLoras = loras.filter(
        (l) =>
            l.name.toLowerCase().includes(loraSearch.toLowerCase()) ||
            l.alias.toLowerCase().includes(loraSearch.toLowerCase())
    );

    return (
        <div className="glass-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Box size={16} color="var(--color-accent)" />
                    <h2 style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>Checkpoint</h2>
                    <button onClick={fetchCheckpoints} style={iconBtnStyle} title="再読み込み">
                        <RefreshCw size={13} />
                    </button>
                </div>
                {cpError && <ErrorMsg msg={cpError} />}
                <select
                    value={currentCheckpoint}
                    onChange={(e) => handleSwitch(e.target.value)}
                    disabled={switching}
                    style={{ ...selectStyle, opacity: switching ? 0.5 : 1 }}
                >
                    {checkpoints.length > 0 ? (
                        checkpoints.map((cp) => (
                            <option key={cp.title} value={cp.title}>{cp.title}</option>
                        ))
                    ) : (
                        <option value="">{currentCheckpoint || '-- 未取得 --'}</option>
                    )}
                </select>
                {switching && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'var(--color-accent)' }}>
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        モデルを読み込み中...
                    </div>
                )}
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <div>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}
                    onClick={() => setLoraExpanded(!loraExpanded)}
                >
                    <Box size={16} color="#f59e0b" />
                    <h2 style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
                        LoRA
                        <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>({loras.length})</span>
                    </h2>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleRefreshLoras(); }}
                        style={iconBtnStyle}
                        disabled={refreshing}
                    >
                        <RefreshCw size={13} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} />
                    </button>
                    {loraExpanded ? <ChevronUp size={14} color="var(--color-text-muted)" /> : <ChevronDown size={14} color="var(--color-text-muted)" />}
                </div>
                {loraError && <ErrorMsg msg={loraError} />}
                {loraExpanded && (
                    <>
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                value={loraSearch}
                                onChange={(e) => setLoraSearch(e.target.value)}
                                placeholder="LoRA を検索..."
                                style={{ ...inputStyle, paddingLeft: 30 }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto' }}>
                            {filteredLoras.length > 0 ? (
                                filteredLoras.map((l) => (
                                    <button
                                        key={l.name}
                                        onClick={() => onLoraInsert(`<lora:${l.alias}:0.7>`)}
                                        style={loraItemStyle}
                                    >
                                        <span style={{ fontSize: 12, fontWeight: 500 }}>{l.name}</span>
                                        {l.alias !== l.name && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{l.alias}</span>}
                                    </button>
                                ))
                            ) : (
                                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: 16 }}>
                                    {loras.length === 0 ? 'LoRA が見つかりません' : '検索結果なし'}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function ErrorMsg({ msg }: { msg: string }) {
    return <div style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', marginBottom: 8 }}>⚠ {msg}</div>;
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 12, outline: 'none' };
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
const iconBtnStyle: React.CSSProperties = { padding: 4, borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const loraItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', textAlign: 'left' };
