#!/bin/bash
# apps/poetry/scripts/start-daemon.sh - LaunchAgent 守护进程启动脚本
# 安全机制：启动前清理残留进程和端口，退出时杀掉整个进程组

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
PROJECT_DIR="$(cd "$APP_DIR/../.." && pwd)"
PORT="${POETRY_PORT:-3002}"
LOG_DIR="$APP_DIR/logs"
mkdir -p "$LOG_DIR"

# ========== 清理函数 ==========
cleanup() {
    echo "[$(date)] [poetry] Cleaning up child processes..."
    kill -- -$$ 2>/dev/null
    pkill -f "node.*poetry/server" 2>/dev/null
    exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP EXIT

# ========== 启动前清理残留 ==========
echo "[$(date)] [poetry] Cleaning up stale processes..."
pkill -f "node.*poetry/server" 2>/dev/null
sleep 1

# 强制释放端口
PID=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PID" ]; then
    echo "[$(date)] [poetry] Port $PORT still occupied by PID $PID, killing..."
    kill -9 $PID 2>/dev/null
    sleep 1
fi

# ========== 检查依赖 ==========
for DIR in "$APP_DIR/server" "$APP_DIR/client"; do
    if [ -d "$DIR" ] && [ ! -d "$DIR/node_modules" ]; then
        echo "[$(date)] [poetry] Installing dependencies in $DIR..."
        cd "$DIR" && npm install
    fi
done

# ========== 构建前端 ==========
if [ ! -d "$APP_DIR/client/dist" ]; then
    echo "[$(date)] [poetry] Building poetry client..."
    cd "$APP_DIR/client" && npm run build
fi

# ========== 启动服务 ==========
cd "$APP_DIR/server"
echo "[$(date)] [poetry] Starting poetry server on port $PORT..."
node index.js &
MAIN_PID=$!

echo "[$(date)] [poetry] Main process PID: $MAIN_PID"
wait $MAIN_PID
