#!/bin/bash
# scripts/start-daemon.sh - LaunchAgent 守护进程专用启动脚本
# 解决问题：重启时子进程变孤儿占端口
#
# 核心机制：
# 1. 启动前清理残留进程和端口
# 2. 用 trap 确保退出时杀掉整个进程组
# 3. 使用 setsid 创建进程组，方便整组清理

cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

# ========== 清理函数 ==========
cleanup() {
    echo "[$(date)] Cleaning up child processes..."
    # 杀掉整个进程组
    kill -- -$$ 2>/dev/null
    # 再确保杀掉可能残留的子进程
    pkill -f "node.*keke-vocab" 2>/dev/null
    pkill -f "vite.*keke-vocab" 2>/dev/null
    exit 0
}

# 收到 TERM/INT/HUP 信号时执行清理
trap cleanup SIGTERM SIGINT SIGHUP EXIT

# ========== 启动前清理残留 ==========
echo "[$(date)] Cleaning up stale processes..."

# 杀掉旧的 keke-vocab 相关进程
pkill -f "node.*keke-vocab" 2>/dev/null
pkill -f "concurrently.*keke-vocab" 2>/dev/null

# 等待端口释放
sleep 2

# 强制释放端口（如果还被占）
for PORT in 3001 5173; do
    PID=$(lsof -ti :$PORT 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "[$(date)] Port $PORT still occupied by PID $PID, killing..."
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
done

# ========== 检查依赖 ==========
for DIR in "$PROJECT_DIR" "$PROJECT_DIR/server" "$PROJECT_DIR/client"; do
    if [ ! -d "$DIR/node_modules" ]; then
        echo "[$(date)] Installing dependencies in $DIR..."
        cd "$DIR" && npm install
    fi
done

cd "$PROJECT_DIR"

# ========== 启动服务 ==========
echo "[$(date)] Starting keke-vocab..."
npm run dev &
MAIN_PID=$!

echo "[$(date)] Main process PID: $MAIN_PID"

# 等待主进程结束
wait $MAIN_PID
