#!/bin/bash
# apps/portal/scripts/start-daemon.sh - LaunchAgent 守护进程启动脚本
# Safety: uses pidfile for process management, kills only our own process

cd "$(dirname "$0")/.."
APP_DIR="$(pwd)"
PROJECT_DIR="$(cd "$APP_DIR/../.." && pwd)"
PORT="${PORTAL_PORT:-3010}"
LOG_DIR="$APP_DIR/logs"
PIDFILE="$APP_DIR/logs/portal-server.pid"
mkdir -p "$LOG_DIR"

# ========== 清理函数 ==========
cleanup() {
    echo "[$(date)] [portal] Cleaning up..."
    if [ -f "$PIDFILE" ]; then
        PID=$(cat "$PIDFILE" 2>/dev/null)
        if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
            kill "$PID" 2>/dev/null
        fi
        rm -f "$PIDFILE"
    fi
    exit 0
}

trap cleanup SIGTERM SIGINT SIGHUP EXIT

# ========== 启动前清理残留 ==========
echo "[$(date)] [portal] Checking for stale processes..."
if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        OLD_CMD=$(ps -p "$OLD_PID" -o command= 2>/dev/null || true)
        if echo "$OLD_CMD" | grep -q "node.*portal/server"; then
            echo "[$(date)] [portal] Stopping stale process PID $OLD_PID..."
            kill "$OLD_PID" 2>/dev/null
            sleep 1
        fi
    fi
    rm -f "$PIDFILE"
fi

# Check if port is occupied
PID=$(lsof -ti :$PORT 2>/dev/null)
if [ -n "$PID" ]; then
    PORT_CMD=$(ps -p "$PID" -o command= 2>/dev/null || true)
    if echo "$PORT_CMD" | grep -q "node.*portal/server"; then
        echo "[$(date)] [portal] Port $PORT occupied by our old process PID $PID, stopping..."
        kill "$PID" 2>/dev/null
        sleep 1
    else
        echo "[$(date)] [portal] WARNING: Port $PORT occupied by foreign process PID $PID ($PORT_CMD). Not killing it."
        echo "[$(date)] [portal] Please free port $PORT manually and retry."
        exit 1
    fi
fi

# ========== 检查依赖 ==========
for DIR in "$APP_DIR/server" "$APP_DIR/client"; do
    if [ -d "$DIR" ] && [ ! -d "$DIR/node_modules" ]; then
        echo "[$(date)] [portal] Installing dependencies in $DIR..."
        cd "$DIR" && npm install
    fi
done

# ========== 构建前端 ==========
if [ ! -d "$APP_DIR/client/dist" ]; then
    echo "[$(date)] [portal] Building portal client..."
    cd "$APP_DIR/client" && npm run build
fi

# ========== 启动服务 ==========
cd "$APP_DIR/server"
echo "[$(date)] [portal] Starting portal server on port $PORT..."
node index.js &
MAIN_PID=$!

echo "$MAIN_PID" > "$PIDFILE"
echo "[$(date)] [portal] Main process PID: $MAIN_PID (pidfile: $PIDFILE)"
wait $MAIN_PID
