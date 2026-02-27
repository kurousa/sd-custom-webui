# Stable Diffusion Custom UI (React + FastAPI)

1. プロジェクト概要
既存の Stable Diffusion WebUI (A1111/Forge) の煩雑な UI を解消し、エンジニアが直感的に、かつ高速に画像を生成・管理できる「自分専用のコックピット」を構築する。

2. システム構成
Frontend: React (Vite), Tailwind CSS, Lucide React (アイコン), Shadcn/UI

Backend: FastAPI (Python), sdwebuiapi

Target API: Stable Diffusion WebUI (API モードで動作しているローカル環境)

3. 主要機能要件
3.1 プロンプト入力補助 (Smart Prompting)
チップベースのタグ選択: 頻繁に使用する「品質タグ」「アーティスト名」「特定キャラクター設定」をワンクリックで追加・削除できる UI。

マルチライン入力: 正解プロンプトとネガティブプロンプトを個別に管理。

プロンプト合成機能: 選択したチップと自由入力を動的に結合して API へ送信。

3.2 リアルタイム・プレビュー (Instant Preview)
生成直後の自動表示: API から返却された Base64 データを即座に画面上に描画。

ヒストリー表示: 生成した画像の履歴をサイドバーまたはグリッドで保持。

拡大表示: プレビュー画像をクリックしてフルサイズで確認。

3.3 パラメータ調整 (Control Panel)
生成設定: Steps, CFG Scale, Sampler, Width/Height, Seed などをスライダーおよび入力フォームで調整。

環境認識: ローカル環境（GPU/VRAM）の状態を考慮したデフォルト値の設定。

プリセット保存: よく使うパラメータの組み合わせを保存し、瞬時に呼び出し可能。

4. 非機能要件
レイテンシ: API 通信中のローディング表示（Skeleton Screen等）を実装し、ユーザー体験を損なわない。

UI/UX: エンジニア・ゲーマー向けのダークモード基調。3カラム構成（左：パラメータ、中央：プレビュー、右：プロンプト履歴）。

拡張性: 今後 ControlNet や LoRA の個別調整機能を容易に追加できるコンポーネント設計。

5. Antigravity 用実装タスク（推奨ステップ）
Backend Setup: FastAPI の基本構造作成と sdwebuiapi による疎通テスト。

Frontend Setup: Vite + Tailwind + Shadcn/UI の導入とレイアウト作成。

API Integration: Frontend から Backend を経由して SD WebUI へ画像をリクエストするフローの実装。

Feature Implementation: プロンプトチップ機能とパラメータ調整パネルの実装。

Refinement: プレビュー画面のブラッシュアップと、エラーハンドリング（SD側が未起動の場合の通知など）の実装。