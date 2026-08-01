#!/bin/bash
# ABL Website 部署脚本 — 混合架构
#   - PostgreSQL + Frontend → Docker Compose
#   - Strapi → 宿主机 PM2
#
# 用法: cd /home/deploy/abl_website && bash deploy.sh [command]
#
# Commands:
#   (无参数)    完整部署流程
#   build       仅构建前端 Docker 镜像
#   up          启动所有 Docker 服务
#   down        停止所有 Docker 服务
#   restart     重启前端容器
#   status      查看服务状态
#   logs        查看 Docker 服务日志
set -e

cd "$(dirname "$0")"

status() {
  echo ""
  echo "========================================="
  echo "  Docker 服务状态"
  echo "========================================="
  docker compose ps 2>/dev/null || echo "  (无运行中的容器)"
  echo ""
  echo "========================================="
  echo "  Strapi (PM2) 状态"
  echo "========================================="
  pm2 show strapi-main 2>/dev/null | grep -E 'status|restarts|cwd|uptime|mem' || echo "  strapi-main 未运行"
  echo ""
}

case "${1:-deploy}" in
  status)
    status
    ;;

  build)
    echo "构建前端 Docker 镜像..."
    docker compose build frontend
    echo "构建完成。"
    ;;

  up)
    echo "启动 Docker 服务..."
    docker compose up -d
    echo "启动完成。"
    status
    ;;

  down)
    echo "停止 Docker 服务..."
    docker compose down
    echo "已停止。"
    ;;

  restart)
    echo "重启前端容器..."
    docker compose restart frontend
    echo "前端已重启。"
    ;;

  logs)
    docker compose logs -f --tail=50
    ;;

  deploy)
    echo "========================================="
    echo "  ABL Website — 部署开始"
    echo "========================================="

    # 1. 构建前端镜像
    echo ""
    echo "[1/3] 构建前端 Docker 镜像..."
    docker compose build frontend

    # 2. 启动 PostgreSQL + Frontend
    echo ""
    echo "[2/3] 启动 PostgreSQL + Frontend..."
    docker compose up -d

    # 等待 PostgreSQL 健康检查通过
    echo "  等待 PostgreSQL 就绪..."
    for i in $(seq 1 30); do
      if docker compose exec postgres pg_isready -U strapi &>/dev/null; then
        echo "  PostgreSQL 已就绪!"
        break
      fi
      echo "  ... waiting ($i/30)"
      sleep 2
    done

    # 3. 重启 Strapi（确保连上新数据库）
    #
    # 注意：这里只是重启，不做 build——本步的目的是让 Strapi 重连刚起来的
    # PostgreSQL，不是发布后端代码改动。strapi start 加载的是编译产物 dist/，
    # 所以 strapi-backend/src/ 的改动必须走 update-strapi.sh 才会生效。
    echo ""
    echo "[3/3] 重启 Strapi (PM2)（仅重连数据库，不含 build）..."
    pm2 restart strapi-main 2>/dev/null || {
      echo "  strapi-main 未找到，创建新进程..."
      pm2 start npm --name strapi-main --cwd "$PWD/strapi-backend" -- run start
    }
    pm2 save

    echo ""
    echo "========================================="
    echo "  部署完成！"
    echo "========================================="
    status
    ;;

  *)
    echo "用法: bash deploy.sh [deploy|build|up|down|restart|status|logs]"
    ;;
esac
