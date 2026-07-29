#!/bin/bash
# ABL Website Docker 化 — 镜像拉取 + 构建 + 启动
# 运行方式: cd /home/deploy/abl_website && bash setup.sh
set -e

echo "========================================="
echo "Step 1/4: 拉取基础镜像 (走 docker.1ms.run 代理)"
echo "========================================="

# 检查是否已有本地 tag，没有才拉
if ! docker image inspect node:20-bookworm-slim &>/dev/null; then
  echo "  拉取 node:20-bookworm-slim ..."
  docker pull docker.1ms.run/library/node:20-bookworm-slim
  docker tag docker.1ms.run/library/node:20-bookworm-slim node:20-bookworm-slim
else
  echo "  node:20-bookworm-slim 已存在，跳过"
fi

if ! docker image inspect nginx:alpine &>/dev/null; then
  echo "  拉取 nginx:alpine ..."
  docker pull docker.1ms.run/library/nginx:alpine
  docker tag docker.1ms.run/library/nginx:alpine nginx:alpine
else
  echo "  nginx:alpine 已存在，跳过"
fi

echo ""
echo "========================================="
echo "Step 2/4: 构建 strapi + frontend 镜像"
echo "========================================="
docker compose build strapi frontend

echo ""
echo "========================================="
echo "Step 3/4: 启动 Postgres (等 healthy)"
echo "========================================="
docker compose up -d postgres

echo "  等待 postgres healthy..."
for i in $(seq 1 30); do
  if docker compose exec postgres pg_isready -U strapi &>/dev/null; then
    echo "  Postgres is healthy!"
    break
  fi
  echo "  ... waiting ($i/30)"
  sleep 2
done

echo ""
echo "========================================="
echo "Step 4/4: 导入数据 + 启动全部服务"
echo "========================================="

# 导入 Strapi 数据到新 Postgres
echo "  导入 Strapi export 数据..."
docker compose run --rm -v "$PWD/backups:/backups" strapi \
  npx strapi import -f /backups/abl-export.tar.gz --force

# 启动 strapi + frontend
echo "  启动 strapi + frontend..."
docker compose up -d strapi frontend

echo ""
echo "========================================="
echo "全部完成！检查状态："
echo "========================================="
docker compose ps

echo ""
echo "下一步: 更新宿主机 nginx 配置后 reload"
echo "  api.abl.secret-sealing.club 块保持不变"
echo "  abl.secret-sealing.club 前端块: root /root/abl_website/frontend/dist"
echo "    → proxy_pass http://127.0.0.1:8080"
echo "  /uploads/ alias: /root/abl_website/... → /home/deploy/abl_website/..."
