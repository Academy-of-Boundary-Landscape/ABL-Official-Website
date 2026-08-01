#!/bin/bash
# ABL Website — Strapi 更新脚本
#
# 用法: ssh root@server 'bash /home/deploy/abl_website/update-strapi.sh'
#
# 为什么需要这个脚本、为什么不能只 pm2 restart：
#
#   PM2 跑的是 `strapi start`，它加载编译产物 strapi-backend/dist/，不读 src/。
#   dist/ 是 git-ignored 的构建产物，所以 git pull 只能更新 src/ ——
#   不跑 `npm run build`，src/ 下的任何改动（新内容类型、新组件、改字段）
#   都等于没发生，而 pm2 restart 会照常报成功、Strapi 会照常打印
#   "started successfully"，全程没有任何报错。
#
#   2026-08-01 就是这么坏的：新增 work 内容类型后只 pm2 restart，
#   /api/works 一直 404，而所有信号都显示部署成功了。
#
# 必须以 root 运行：Strapi 由 root 的 pm2 托管，node_modules 与 dist 都是 root 所有。
set -e

cd "$(dirname "$0")"

echo "========================================="
echo "  ABL Website — Strapi 更新"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# ── 0. 启动前校验 ───────────────────────────────────────────────
# 与其让 Strapi 在 production 模式下因为缺密钥而崩在启动里，不如现在就报错。
echo ""
echo "[0/5] 校验 .env..."
ENV_FILE=strapi-backend/.env
[ -f "$ENV_FILE" ] || { echo "  ✗ $ENV_FILE 不存在（从 .env.dist 复制并逐项生成密钥）"; exit 1; }

if grep -q '__GENERATE_ME__' "$ENV_FILE"; then
  echo "  ✗ .env 里还留着 __GENERATE_ME__ 占位符——密钥没生成完"
  exit 1
fi
for k in APP_KEYS API_TOKEN_SALT ADMIN_JWT_SECRET ENCRYPTION_KEY JWT_SECRET \
         DATABASE_CLIENT DATABASE_PASSWORD; do
  grep -q "^$k=." "$ENV_FILE" || { echo "  ✗ .env 缺少 $k"; exit 1; }
done
echo "  ✓ .env 必需项齐全"

# ── 1. 清掉运行时生成物的本地改动 ────────────────────────────────
# openapi.json 与 full_documentation.json 被 git 跟踪，但 Strapi 一启动就重写。
# 不先丢弃，git pull 会以 "Your local changes would be overwritten by merge" 失败。
# 丢掉零损失：它们会在下次启动时按新 schema 重新生成。
echo ""
echo "[1/5] 清理运行时生成物的本地改动..."
git checkout -- strapi-backend/openapi.json 2>/dev/null || true
git checkout -- strapi-backend/src/extensions/documentation/ 2>/dev/null || true
rm -f strapi-backend/.strapi-updater.json

# ── 2. 拉代码 ───────────────────────────────────────────────────
echo ""
echo "[2/5] git pull..."
BEFORE=$(git rev-parse HEAD)
git pull
AFTER=$(git rev-parse HEAD)
echo "  $(git log --oneline -1)"

if [ "$BEFORE" = "$AFTER" ]; then
  echo "  (代码无变化，仍然继续构建——本地 dist/ 可能是旧的)"
fi

# ── 3. 依赖变了才重装 ───────────────────────────────────────────
echo ""
echo "[3/5] 检查依赖..."
if ! git diff --quiet "$BEFORE" "$AFTER" -- strapi-backend/package-lock.json 2>/dev/null; then
  echo "  package-lock.json 有变更，重新安装..."
  npm --prefix strapi-backend install
else
  echo "  依赖无变化，跳过。"
fi

# ── 4. 构建 —— 这一步就是以前缺的那一步 ─────────────────────────
# 同时做两件事：把 src/ 的 TypeScript 编译进 dist/，以及构建 admin 面板。
# 注意 admin 的产物写在 node_modules/@strapi/admin/ 里面，
# 所以任何一次 npm install 都会抹掉它，必须在安装之后重建。
echo ""
echo "[4/5] npm run build（编译 src → dist + 构建 admin 面板）..."
npm --prefix strapi-backend run build

# ── 5. 重启并验证 ───────────────────────────────────────────────
echo ""
echo "[5/5] 重启 Strapi..."
pm2 restart strapi-main --update-env
echo "  等待启动..."
sleep 10

# 进程必须跑在 production 模式：development 下 Content-Type Builder 是开的，
# 在生产后台改结构会写回服务器的 src/，下次 git pull 必然冲突。
NODE_ENV_RUNNING=$(pm2 jlist 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const a=JSON.parse(s).find(x=>x.name==="strapi-main");console.log(a?.pm2_env?.NODE_ENV??"")}catch(e){console.log("")}})' )
if [ "$NODE_ENV_RUNNING" != "production" ]; then
  echo ""
  echo "  ⚠️ strapi-main 的 NODE_ENV 是 '${NODE_ENV_RUNNING:-未设置}'，不是 production。"
  echo "     生产应由 ecosystem.config.js 定义进程。修复："
  echo "       cd /home/deploy/abl_website && pm2 delete strapi-main && \\"
  echo "         pm2 start ecosystem.config.js && pm2 save"
fi

echo ""
echo "验证 API 端点："
API=https://api.abl.secret-sealing.club/api
FAILED=0
for ep in works events products conventions; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$API/$ep" || echo "000")
  case "$code" in
    200) echo "  ✓ /api/$ep -> 200" ;;
    403) echo "  ✓ /api/$ep -> 403（路由已注册，Public 角色未授权——去 Admin 开 find/findOne）" ;;
    404) echo "  ✗ /api/$ep -> 404  内容类型未注册，构建没生效"; FAILED=1 ;;
    *)   echo "  ? /api/$ep -> $code"; FAILED=1 ;;
  esac
done

echo ""
if [ "$FAILED" = "1" ]; then
  echo "========================================="
  echo "  更新失败——有端点返回 404 或异常"
  echo "  查日志: pm2 logs strapi-main --lines 50"
  echo "========================================="
  exit 1
fi

echo "========================================="
echo "  Strapi 更新完成"
echo "========================================="
echo ""
echo "若本次新增了内容类型，别忘了在 Admin 给它开 Public 权限："
echo "  https://api.abl.secret-sealing.club/admin"
echo "  Settings → Users & Permissions → Roles → Public → 勾选 find / findOne"
