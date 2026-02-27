# Stable Diffusion Custom WebUI

React + FastAPI で構築した Stable Diffusion WebUI の高性能カスタムフロントエンド。
モダンな UI/UX と、分析・比較に特化した強力な機能を備えています。

## 主な機能

- **高度な生成ワークフロー**: 
    - **XY Plot**: パラメータを変化させた一括生成と、プレビューからの選択保存。
    - **解像度プリセット**: 1:1, 2:3, 3:2 などのワンクリック設定と、スマートなカスタム入力モード。
    - **モデル管理**: Checkpoint の高速切り替えと、LoRA タグの検索・ワンクリック挿入。
- **分析・比較ツール**:
    - **Side-by-Side 比較**: 2枚の画像を並べて比較。**同期ズーム・パン**機能により細部まで分析可能。
    - **プロンプトプリセット**: お気に入りの構成を保存・管理。
- **刷新されたギャラリー**:
    - 生成画像の自動/手動保存、詳細メタデータの表示、比較対象のクイック選択。
- **モダンなデザイン**: 
    - グラスモーフィズムを採用したプレミアムな外観。
    - スケルトンスクリーンやマイクロインタラクションによる快適な応答性。

## 前提条件

- Python 3.12+
- Node.js 18+
- Stable Diffusion WebUI (A1111/Forge) がインストールされていること
  - SD_WEBUI_DIRに対して、有効なStable Diffusion WebUIのパスをセットしてください

## セットアップ

### 1. リポジトリの準備

```bash
git clone <repository-url>
cd sd-custom-webui
chmod +x *.sh  # 起動スクリプトに実行権限を付与
```

### 2. バックエンドの設定

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env ファイルの作成（接続先がデフォルト 127.0.0.1:7860 以外の場合）
echo "SD_WEBUI_HOST=127.0.0.1" > .env
echo "SD_WEBUI_PORT=7860" >> .env
```

### 3. フロントエンドの設定

```bash
cd ../frontend
npm install
```

## 起動方法

### 方法 A: 一括起動スクリプト (推奨)

ルートディレクトリにある `start-all.sh` を実行すると、**SD WebUI 本体、カスタムバックエンド、フロントエンドのすべて**を自動で起動します。

```bash
./start-all.sh
```

> [!TIP]
> `start-all.sh` 内の `SD_WEBUI_DIR` 変数を、お使いの環境の SD WebUI (A1111/Forge) のパスに合わせて書き換えてください。

### 方法 B: 個別起動

1. **SD WebUI 本体**を `--api` フラグを付けて起動
   ```bash
   python launch.py --api
   ```

2. **Backend**:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn app.main:app --port 8000 --reload
   ```

3. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

## 停止方法

`start-all.sh` で起動した場合は、ターミナルで `Ctrl+C` を押すか、別のターミナルから `./stop-all.sh` を実行して安全に停止させてください。

## プロジェクト構成

```
sd-custom-webui/
├── backend/                    # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py             # メインエントリ
│   │   ├── routers/
│   │   │   ├── generate.py     # txt2img / XY Plot
│   │   │   ├── models.py       # Checkpoint / LoRA
│   │   │   └── gallery.py      # 画像管理・保存
│   │   └── config.py           # 環境変数による設定
├── frontend/                   # React (Vite / TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ParameterPanel.tsx # 解像度プリセット・UI
│   │   │   ├── ComparisonView.tsx # 同期ズーム比較
│   │   │   └── XYPlotPanel.tsx    # XY Plot プレビュー
│   │   └── api/client.ts       # API ラッパー
├── start-all.sh                # 全サービス一括起動スクリプト
└── stop-all.sh                 # プロセス停止・クリーンアップ
```
