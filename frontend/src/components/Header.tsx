/** ヘッダーコンポーネント + 接続ステータス表示 */
import { Cpu, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import type { ConnectionStatus } from '../types';

interface Props {
    connection: ConnectionStatus | null;
    loading: boolean;
}

export function Header({ connection, loading }: Props) {
    const isConnected = connection?.status === 'connected';
    const isNoApi = connection?.status === 'no_api';

    const statusColor = isConnected
        ? 'var(--color-success)'
        : isNoApi
            ? 'var(--color-warning)'
            : 'var(--color-error)';
    const statusBg = isConnected
        ? 'rgba(16, 185, 129, 0.08)'
        : isNoApi
            ? 'rgba(245, 158, 11, 0.08)'
            : 'rgba(239, 68, 68, 0.08)';
    const statusBorder = isConnected
        ? 'rgba(16, 185, 129, 0.2)'
        : isNoApi
            ? 'rgba(245, 158, 11, 0.2)'
            : 'rgba(239, 68, 68, 0.2)';

    const statusText = loading
        ? '接続中...'
        : isConnected
            ? `SD WebUI 接続済 — ${connection.host}:${connection.port}`
            : isNoApi
                ? 'API モード未有効 — --api フラグで再起動してください'
                : `未接続${connection?.error ? ` — ${connection.error}` : ''}`;

    const StatusIcon = isConnected ? Wifi : isNoApi ? AlertTriangle : WifiOff;

    return (
        <header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 24px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
            }}
        >
            {/* ロゴ・タイトル */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Cpu size={20} color="#fff" />
                </div>
                <div>
                    <h1
                        style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        SD Custom WebUI
                    </h1>
                    <p
                        style={{
                            fontSize: '11px',
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-mono)',
                        }}
                    >
                        v0.1.0 — Cockpit Mode
                    </p>
                </div>
            </div>

            {/* 接続ステータス */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: statusBg,
                    border: `1px solid ${statusBorder}`,
                }}
            >
                {loading ? (
                    <div
                        className="skeleton"
                        style={{ width: 16, height: 16, borderRadius: '50%' }}
                    />
                ) : (
                    <StatusIcon size={16} color={statusColor} />
                )}
                <span
                    style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: statusColor,
                        fontFamily: 'var(--font-mono)',
                    }}
                >
                    {statusText}
                </span>
            </div>
        </header>
    );
}
