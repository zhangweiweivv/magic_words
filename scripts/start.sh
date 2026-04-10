#!/bin/bash
# scripts/start.sh - 启动可可单词网站

cd "$(dirname "$0")/.."

echo "🐬 启动可可单词魔法屋..."

# 检查 node_modules
if [ ! -d "node_modules" ]; then
  echo "📦 安装根依赖..."
  npm install
fi

if [ ! -d "server/node_modules" ]; then
  echo "📦 安装服务端依赖..."
  cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
  echo "📦 安装前端依赖..."
  cd client && npm install && cd ..
fi

# 获取局域网 IP
IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "✨ =================================="
echo "   可可的单词魔法屋 🐬"
echo "✨ =================================="
echo ""
echo "📱 本机访问: http://localhost:3000"
echo "📱 局域网访问: http://${IP}:3000"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

# 启动服务
npm run dev
