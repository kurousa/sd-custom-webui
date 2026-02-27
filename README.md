# Stable Diffusion Custom WebUI

React + FastAPI で構築した Stable Diffusion WebUI のカスタムフロントエンド。

## 前提条件

- Python 3.12+
- Node.js 18+
- Stable Diffusion WebUI (A1111/Forge) が `--api` フラグ付きで起動していること

```bash
# SD WebUI の起動例
python launch.py --api
```

## セットアップ

### バックエンド

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### フロントエンド

```bash
cd frontend
npm install
```

## 起動方法

### バックエンド (ターミナル 1)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### フロントエンド (ターミナル 2)

```bash
cd frontend
npm run dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

## プロジェクト構成

```
sd-custom-webui/
├── backend/                    # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py             # FastAPI アプリケーション
│   │   ├── config.py           # 環境設定
│   │   ├── schemas.py          # Pydantic スキーマ
│   │   ├── sd_client.py        # SD WebUI API クライアント
│   │   └── routers/
│   │       ├── health.py       # 接続チェック API
│   │       └── generate.py     # 画像生成 API
│   ├── .env                    # 環境変数
│   └── requirements.txt
├── frontend/                   # React フロントエンド
│   ├── src/
│   │   ├── App.tsx             # メインアプリケーション
│   │   ├── api/client.ts       # API クライアント
│   │   ├── types/index.ts      # 型定義
│   │   ├── components/
│   │   │   ├── Header.tsx      # ヘッダー + 接続ステータス
│   │   │   ├── ParameterPanel.tsx  # パラメータ調整
│   │   │   ├── PromptPanel.tsx     # プロンプト入力
│   │   │   └── PreviewPanel.tsx    # 画像プレビュー
│   │   └── index.css           # デザインシステム
│   └── vite.config.ts
└── docs/
    └── requirements.md         # 要件定義
```
