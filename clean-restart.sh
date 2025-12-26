#!/bin/bash

echo "🧹 正在清理并重启 Electron 应用..."
echo ""

echo "步骤 1/4: 停止所有进程..."
pkill -9 node 2>/dev/null
pkill -9 Electron 2>/dev/null
sleep 3
echo "✅ 进程已停止"
echo ""

echo "步骤 2/4: 清理构建缓存..."
rm -rf .vite
rm -rf node_modules/.vite
sleep 2
echo "✅ 缓存已清理"
echo ""

echo "步骤 3/4: 验证进程..."
if ps aux | grep -E "node|Electron" | grep -v grep | grep -v "clean-restart.sh" > /dev/null; then
    echo "⚠️  警告: 仍有进程在运行"
    ps aux | grep -E "node|Electron" | grep -v grep | grep -v "clean-restart.sh"
else
    echo "✅ 所有进程已停止"
fi
echo ""

echo "步骤 4/4: 启动应用..."
echo "========================================="
npm start
