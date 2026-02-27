/** SD Custom WebUI - メインアプリケーション (比較・XY Plot 対応) */
import { useEffect, useState, useCallback } from 'react';
import { Sparkles, ImageIcon, LayoutDashboard, Sliders } from 'lucide-react';
import { Header } from './components/Header';
import { ParameterPanel } from './components/ParameterPanel';
import { ModelPanel } from './components/ModelPanel';
import { PromptPanel } from './components/PromptPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { GalleryView } from './components/GalleryView';
import { ComparisonView } from './components/ComparisonView';
import { checkHealth, generateTxt2Img, getCurrentCheckpoint, switchCheckpoint } from './api/client';
import type { ConnectionStatus, Txt2ImgRequest, PromptPreset, GalleryItem } from './types';

type ViewMode = 'generate' | 'gallery';

const DEFAULT_PARAMS: Txt2ImgRequest = {
  prompt: '',
  negative_prompt: '',
  steps: 20,
  cfg_scale: 7,
  width: 512,
  height: 512,
  seed: -1,
  sampler_name: 'Euler a',
};

export default function App() {
  /* --- UI 状態 --- */
  const [viewMode, setViewMode] = useState<ViewMode>('generate');
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);

  /* --- 生成パラメータ --- */
  const [params, setParams] = useState<Txt2ImgRequest>(DEFAULT_PARAMS);
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [currentCheckpoint, setCurrentCheckpoint] = useState('');

  /* --- 生成結果 --- */
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* --- 比較機能 --- */
  const [compareItems, setCompareItems] = useState<[GalleryItem, GalleryItem] | null>(null);

  /* --- 接続確認 --- */
  const fetchHealth = useCallback(async () => {
    setConnectionLoading(true);
    try {
      const result = await checkHealth();
      setConnection(result);
      const cp = await getCurrentCheckpoint();
      setCurrentCheckpoint(cp);
    } catch {
      setConnection({
        status: 'disconnected', host: '127.0.0.1', port: 7860,
        samplers: [], models: [], error: 'バックエンドに接続できません',
      });
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleLoraInsert = (loraTag: string) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, ${loraTag}` : loraTag;
    });
  };

  const handleApplyFullPreset = async (preset: PromptPreset) => {
    setPrompt(preset.prompt);
    setNegativePrompt(preset.negative_prompt);
    if (preset.params) setParams((prev) => ({ ...prev, ...preset.params }));
    if (preset.checkpoint && preset.checkpoint !== currentCheckpoint) {
      try {
        await switchCheckpoint(preset.checkpoint);
        setCurrentCheckpoint(preset.checkpoint);
      } catch (e) {
        setError('Checkpointの切り替えに失敗しました');
      }
    }
  };

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await generateTxt2Img({
        ...params,
        prompt,
        negative_prompt: negativePrompt,
        checkpoint: currentCheckpoint
      });
      if (result.images.length > 0) setGeneratedImage(result.images[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header connection={connection} loading={connectionLoading} />

      {/* ナビゲーションタブ */}
      <nav style={{
        display: 'flex', gap: 24, padding: '0 24px',
        background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)',
        zIndex: 50
      }}>
        <button
          onClick={() => setViewMode('generate')}
          style={{ ...tabStyle, borderBottomColor: viewMode === 'generate' ? 'var(--color-accent)' : 'transparent', color: viewMode === 'generate' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
        >
          <Sparkles size={16} /> 生成 (Generate)
        </button>
        <button
          onClick={() => setViewMode('gallery')}
          style={{ ...tabStyle, borderBottomColor: viewMode === 'gallery' ? 'var(--color-accent)' : 'transparent', color: viewMode === 'gallery' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
        >
          <ImageIcon size={16} /> ギャラリー (Gallery)
        </button>
      </nav>

      {/* メインコンテンツ */}
      {viewMode === 'generate' ? (
        <main style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: 12, padding: 12, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto', paddingRight: 4 }}>
            <ModelPanel currentCheckpoint={currentCheckpoint} onCheckpointChange={setCurrentCheckpoint} onLoraInsert={handleLoraInsert} />
            <ParameterPanel params={params} samplers={connection?.samplers ?? []} onChange={setParams} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            <PreviewPanel image={generatedImage} generating={generating} />
            {error && (
              <div className="animate-fade-in" style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: 13 }}>
                ⚠ {error}
              </div>
            )}
          </div>
          <PromptPanel
            prompt={prompt}
            negativePrompt={negativePrompt}
            checkpoint={currentCheckpoint}
            params={params}
            onPromptChange={setPrompt}
            onNegativePromptChange={setNegativePrompt}
            onApplyFullPreset={handleApplyFullPreset}
            onGenerate={handleGenerate}
            onImagesGenerated={(imgs) => {
              if (imgs.length > 0) setGeneratedImage(imgs[imgs.length - 1]);
            }}
            generating={generating}
            onError={setError}
          />
        </main>
      ) : (
        <GalleryView onCompare={setCompareItems} />
      )}

      {/* 比較オーバーレイ */}
      {compareItems && (
        <ComparisonView items={compareItems} onClose={() => setCompareItems(null)} />
      )}
    </div>
  );
}

const tabStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '12px 4px',
  background: 'transparent', border: 'none', borderBottom: '2px solid transparent',
  fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease'
};
