# ABL 官网 Coolify 部署

## 服务与发布

`docker-compose.coolify.yml` 管理前端 Nginx、Strapi 和 PostgreSQL。Coolify 从 Git 在生产机构建镜像；Strapi 容器直接运行 `strapi start`，不使用 PM2。前端构建公开地址来自 `frontend/.env.production`，后端秘密只作为运行变量提供。

Git 来源使用现有 GitHub App 读取公开仓库；push 通知通过仓库的 Coolify 原生签名 webhook，不需要组织额外安装 App。不要另开相同仓库的 App push 通知，避免重复触发。

首次迁移使用独立分支，关闭自动部署。验收并合并正式 main 后开启 GitHub push 自动部署；其他开发分支不发布。部署针对整套 Compose 应用，不承诺仅更新前端。数据库镜像固定，发布命令不得强制重建所有服务。

## 配置

Coolify 启用 Preserve Repository，关闭 Inject Build Arguments 和 Include Source Commit in Build。自定义构建命令为 `sh deploy/coolify-build.sh`，启动命令为 `docker compose up -d --wait --wait-timeout 180`。构建脚本仅用占位值满足 Compose 的运行变量校验，前后端串行构建；真实密钥仍为 runtime-only，不传入构建参数。

按 `.env.coolify.example` 配置变量。密钥必须沿用原生产值，禁止把真实 `.env` 或上传文件提交到 Git。Coolify 环境变量关闭 build-time 注入，保留 runtime 注入。PG_PASSWORD 必须与现有数据库密码一致；容器初始化变量不会修改已有数据库账号密码。

PostgreSQL 的 external 卷为 `abl_website_pgdata`。Strapi 和 Nginx 共用宿主上传路径 `/home/deploy/abl_website/strapi-backend/public/uploads`，Strapi 读写、Nginx 只读。容器 node 用户为 UID/GID 1000，与原 deploy 用户匹配。

Traefik 将五个前端/API 域名送至 frontend 服务的 80 端口，由 Nginx 按 Host 分流到静态前端或内部 Strapi。数据库和 Strapi 不发布宿主端口。Strapi 的 `TZ=Asia/Shanghai` 必须与原宿主一致，否则 PostgreSQL 无时区时间戳在 JSON 中会偏移八小时。frontend 接入 Coolify 代理网络，Nginx 仅信任 `coolify-proxy` 转发的客户端地址。API 的 404 保持 API 响应，不使用 SPA 回退。

## 检查与演练

使用占位变量运行 `docker compose -f docker-compose.coolify.yml config --quiet`。不要把携带秘密的完整配置输出到日志。前端运行已有 `npm ci`、`npm run test`；通过镜像构建验证 Vite 与 Strapi 编译。

演练必须覆盖 ABL_PG_VOLUME，并通过 Compose override 将 `/app/public/uploads` 和 `/srv/uploads` 两个挂载都替换为上传副本。Coolify 4.4.7 会把 bind source 中的 `${VAR:-default}` 固定成默认路径，不能依赖变量覆盖这些挂载。原生平台演练的自定义 start 命令需额外传 `-f` 指向副本 override，正式切换时移除此参数。启动数据库、恢复 pg_dump 自定义格式备份，再启动 Strapi 和 Nginx。前端演练服务接入 coolify 网络以解析受信代理，但不配置公网路由，仅通过回环端口和显式 Host 检查。副本不运行生产写入或发邮件。

## 正式切换与回退

按迁移计划先完成副本演练及镜像构建，再确认停机窗口。停止旧 Strapi 后执行最后 pg_dump 和上传备份，停止旧数据库，再启动新数据库；绝不让两个 PostgreSQL 同时使用正式卷。

切换前保存旧 Nginx、Traefik legacy-routing、Certbot renewal、PM2 定义及容器状态。新服务验证就绪后绑定正式域名并移除其旧 HostSNI/ACME 匹配；TLS 由 Traefik 接管。旧 TCP 透传仍在使用时，不提前添加同域 HTTPS ACME/证书申请路由；已实测该组合可使正常页面落到 Traefik 404。任何入口准备变更后立即检查正式首页与真实 API。确认新入口正常后停用旧前端和本项目旧证书续期。

创建 `/home/deploy/abl_website/.coolify-managed` 后，旧发布脚本拒绝运行。生产目录也须更新相应脚本，避免旧版本绕过检查。不要运行旧 compose，或重启旧 PM2 进程。

回退先停新应用和新数据库，再恢复原入口、旧数据库和 Strapi。继续使用当前数据，不能直接覆盖切换前备份。若 Strapi 启动改变 schema，先判断旧程序兼容性；需要恢复数据库时先保全新增数据并取得用户确认。

具体资源 UUID、正式提交、备份路径及切换结果在正式切换交付记录中补充。此次不新增定时异机备份、不自动删除旧资源。
