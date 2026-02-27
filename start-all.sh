#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# start-all.sh
# StableDiffusion Forge WebUI / sd-custom-webui backend / frontend を一括起動
#
# 使い方:
#   chmod +x start-all.sh
#   ./start-all.sh
#
# 停止:
#   Ctrl+C で全プロセスを一括停止
###############################################################################

# ─── パス設定 ────────────────────────────────────────────────────────────────
# 各プロジェクトのルートディレクトリ（必要に応じて変更してください）
SD_WEBUI_DIR="${SD_WEBUI_DIR:-/home/takaryo/stable-diffusion-forge}"
CUSTOM_WEBUI_DIR="${CUSTOM_WEBUI_DIR:-/home/takaryo/sd-custom-webui}"

# SD WebUI の install_dir 環境変数（webui.sh 内部で参照される）
export install_dir="$(dirname "$SD_WEBUI_DIR")"

# ─── カラー定義 ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─── ログ出力用関数 ──────────────────────────────────────────────────────────
log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── 子プロセス管理 ──────────────────────────────────────────────────────────
PIDS=()

cleanup() {
    echo ""
    log_warn "シャットダウン中... すべてのプロセスを停止します"
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -TERM "$pid" 2>/dev/null
            log_info "PID $pid を停止しました"
        fi
    done
    wait 2>/dev/null
    log_info "すべてのプロセスが停止しました"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ─── 事前チェック ────────────────────────────────────────────────────────────
check_requirements() {
    local has_error=false

    if [[ ! -d "$SD_WEBUI_DIR" ]]; then
        log_error "SD WebUI ディレクトリが見つかりません: $SD_WEBUI_DIR"
        has_error=true
    fi

    if [[ ! -f "$SD_WEBUI_DIR/launch.py" ]]; then
        log_error "launch.py が見つかりません: $SD_WEBUI_DIR/launch.py"
        has_error=true
    fi

    if [[ ! -d "$CUSTOM_WEBUI_DIR/backend" ]]; then
        log_error "backend ディレクトリが見つかりません: $CUSTOM_WEBUI_DIR/backend"
        has_error=true
    fi

    if [[ ! -d "$CUSTOM_WEBUI_DIR/frontend" ]]; then
        log_error "frontend ディレクトリが見つかりません: $CUSTOM_WEBUI_DIR/frontend"
        has_error=true
    fi

    if $has_error; then
        exit 1
    fi
}

check_requirements

# ─── 1. StableDiffusion Forge WebUI ─────────────────────────────────────────
log_info "${CYAN}[SD WebUI]${NC} 起動中... (install_dir=$install_dir)"
(
    cd "$SD_WEBUI_DIR"
    # venv が存在すればアクティベート
    if [[ -f "venv/bin/activate" ]]; then
        source venv/bin/activate
    fi
    python launch.py --api 2>&1 | sed "s/^/[SD WebUI]  /"
) &
PIDS+=($!)
log_info "${CYAN}[SD WebUI]${NC} バックグラウンドで起動しました (PID: ${PIDS[-1]})"

# SD WebUI の起動を少し待ってからカスタム WebUI を起動
log_info "SD WebUI の初期化を待機中... (10秒)"
sleep 10

# ─── 2. sd-custom-webui バックエンド (FastAPI) ───────────────────────────────
log_info "${CYAN}[Backend]${NC}  起動中..."
(
    cd "$CUSTOM_WEBUI_DIR/backend"
    if [[ -f "venv/bin/activate" ]]; then
        source venv/bin/activate
    fi
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | sed "s/^/[Backend]   /"
) &
PIDS+=($!)
log_info "${CYAN}[Backend]${NC}  バックグラウンドで起動しました (PID: ${PIDS[-1]})"

# ─── 3. sd-custom-webui フロントエンド (Vite) ────────────────────────────────
log_info "${CYAN}[Frontend]${NC} 起動中..."
(
    cd "$CUSTOM_WEBUI_DIR/frontend"
    npm run dev 2>&1 | sed "s/^/[Frontend]  /"
) &
PIDS+=($!)
log_info "${CYAN}[Frontend]${NC} バックグラウンドで起動しました (PID: ${PIDS[-1]})"

# ─── 起動完了メッセージ ─────────────────────────────────────────────────────
echo ""
echo -e "=========================================="
echo -e " ${GREEN}✅ すべてのサービスが起動しました${NC}"
echo -e "=========================================="
echo -e " SD WebUI:   ${CYAN}http://localhost:7860${NC}"
echo -e " Backend:    ${CYAN}http://localhost:8000${NC}"
echo -e " Frontend:   ${CYAN}http://localhost:5173${NC}"
echo -e "=========================================="
echo -e " 停止するには ${YELLOW}Ctrl+C${NC} を押してください"
echo -e "=========================================="
echo ""

# ─── 全プロセスの終了を待機 ──────────────────────────────────────────────────
wait
