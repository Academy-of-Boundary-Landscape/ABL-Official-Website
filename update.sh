#!/bin/bash
# ABL Website — 快速更新脚本
# 用法: ssh deploy@server 'bash /home/deploy/abl_website/update.sh'
# 或本地:  cd /home/deploy/abl_website && bash update.sh
set -e

cd "$(dirname "$0")"

echo "========================================="
echo "  ABL Website — 更新部署"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 1. 拉取最新代码
echo ""
echo "[1/3] git pull..."
git pull

# 2. 重建前端（Docker 层缓存: 没动依赖则 ~30s）
echo ""
echo "[2/3] docker compose build frontend..."
docker compose build frontend

# 3. 重启前端容器
echo ""
echo "[3/3] 重启前端..."
docker compose up -d frontend

# 4. 清理旧镜像（保留当前 + 上一个版本）
echo ""
echo "清理旧镜像..."
docker image prune -f --filter "until=24h" 2>/dev/null || true

echo ""
echo "========================================="
echo "  更新完成！"
echo "========================================="
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "如需更新 Strapi（内容类型变更等）:"
echo "  ssh root@server 'pm2 restart strapi-main'"
