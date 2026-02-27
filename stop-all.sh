#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# stop-all.sh
# StableDiffusion Forge WebUI / sd-custom-webui backend / frontend を一括停止
#
# 使い方:
#   chmod +x stop-all.sh
#   ./stop-all.sh
###############################################################################

# ─── カラー定義 ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ─── プロセス停止関数 ────────────────────────────────────────────────────────
# 指定パターンにマッチするプロセスを検索し、停止する
kill_by_pattern() {
    local label="$1"
    local pattern="$2"
    local pids

    pids=$(pgrep -f "$pattern" 2>/dev/null || true)

    if [[ -z "$pids" ]]; then
        log_warn "${CYAN}[$label]${NC} 実行中のプロセスが見つかりません"
        return
    fi

    echo "$pids" | while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            log_info "${CYAN}[$label]${NC} PID $pid を停止します..."
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    # SIGTERM 後、最大5秒待って生き残っていれば SIGKILL
    local waited=0
    while [[ $waited -lt 5 ]]; do
        local still_alive=false
        for pid in $pids; do
            if kill -0 "$pid" 2>/dev/null; then
                still_alive=true
                break
            fi
        done
        if ! $still_alive; then
            break
        fi
        sleep 1
        waited=$((waited + 1))
    done

    for pid in $pids; do
        if kill -0 "$pid" 2>/dev/null; then
            log_warn "${CYAN}[$label]${NC} PID $pid が応答しないため強制終了します"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done

    log_info "${CYAN}[$label]${NC} 停止完了"
}

# ─── 各サービスの停止 ────────────────────────────────────────────────────────
echo ""
echo -e "=========================================="
echo -e " ${YELLOW}🛑 サービスを停止しています...${NC}"
echo -e "=========================================="
echo ""

# 1. SD WebUI Forge (launch.py / webui.py)
kill_by_pattern "SD WebUI" "python.*launch\.py"

# 2. sd-custom-webui Backend (uvicorn)
kill_by_pattern "Backend"  "uvicorn app\.main:app"

# 3. sd-custom-webui Frontend (vite dev server)
kill_by_pattern "Frontend" "vite.*--port"
# npm run dev が node プロセスとして残る場合もカバー
kill_by_pattern "Frontend" "node.*vite"

echo ""
echo -e "=========================================="
echo -e " ${GREEN}✅ すべてのサービスを停止しました${NC}"
echo -e "=========================================="
echo ""
