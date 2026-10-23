# ABL 官网 Coolify 迁移记录

2026-10-23 实施。用户确认前端、Strapi、PostgreSQL 三服务统一管理，由生产机现场构建；之后确认 SSH 仓库只读部署密钥及组织部署密钥开关。

## 生产资源

- Coolify 项目：`eabgvirnboggajafwjwqvqg6`，production 环境 `3hugbxii2slv43ajiv9tvtp2`。
- 应用：`cqr0kb1qsapeb8zjojaacpui`，Git 仓库 main，Compose 文件 `docker-compose.coolify.yml`。
- PR #1 已合并，生产迁移提交 `7673a520dbc9acea52fcab383f3d18f17a538b0b`。
- 首次副本部署：`046tjerlmvy3vsud8xf1rmnj`；main 镜像准备：`oqrlavlftgn9oa4ek682a7hz`；正式切换部署：`qertapkfgszv4amildogwuqt`，均成功。
- GitHub 只读部署密钥 ID `167412065`，Coolify 密钥 UUID `zwrz8skblfyqiaav74rnhkst`。私钥只存 Coolify，临时本机文件已删除。
- 组织 `deploy_keys_enabled_for_repositories` 已获确认后从 false 改为 true，只新增本仓库密钥，不复用个人 SSH 私钥。

## 运行与发布

前端 Nginx、Node 22.23.4 Strapi、PostgreSQL 16.13 均为容器。Strapi 直接运行 `strapi start`，`TZ=Asia/Shanghai` 保持无时区数据库时间字段的原 API 输出。前端配置也提供 API 代理和媒体静态服务。

Coolify 开启 Preserve Repository、固定容器名；关闭 Inject Build Arguments、Include Source Commit in Build、预览部署及额外 gzip。构建命令 `sh deploy/coolify-build.sh`，启动命令 `docker compose up -d --wait --wait-timeout 180`。构建阶段使用占位值通过 Compose 校验，真实密钥均为 runtime-only。

正式应用跟踪 main，已开启自动部署。GitHub 仓库签名 push webhook `702062112` 指向 Coolify 原生 manual webhook 接口；不使用 Actions 或镜像仓库，不需要组织额外安装 GitHub App。其他开发分支不发布。副本 override 已从正式 start 命令移除。

数据库卷 `abl_website_pgdata` 为 external，原上传目录 `/home/deploy/abl_website/strapi-backend/public/uploads` 继续使用。Strapi 读写，Nginx 只读；无数据库/Strapi/前端宿主端口映射。旧 `abl-postgres` 与 `abl-frontend` 已停止且 restart=no，旧 PM2 仅移除 strapi-main，其余三个进程继续运行。

## 入口和证书

`abl.secret-sealing.club`、`www.abl.secret-sealing.club`、`able.secret-sealing.club`、`www.able.secret-sealing.club`、`api.abl.secret-sealing.club` 已移出 legacy HTTPS/ACME 规则，由 Traefik 路由 frontend 的 80 端口。HTTPS 正常，HTTP 保留 Host、路径与查询参数跳转到 HTTPS，实际状态 307。

Traefik 五域 SAN 证书有效至 2027-01-21 08:40:30 UTC。`/data/coolify/proxy/dynamic/abl-acme.yaml` 只提供 HTTP challenge 路由，绕过当前共享入口的跳转；不要提前给仍走 legacy TCP 的域名添加 HTTPS ACME 路由。不存在 token 的 HTTP challenge 实测 404。

旧 ABL Nginx 站点链接及三份专属 Certbot renewal 已归档。原证书文件、旧后端目录与编译产物保留，其他旧站 Certbot 和 Nginx 内部监听不变。图片域名继续使用 ESA，实际缓存 MISS 的回源图片与 API 域名字节相同。

## 备份、回退与检查

服务器私有记录目录 `/root/abl-coolify-20261023`：初始 `before.dump`、`uploads-before.tar.gz`，停写后 `at-cutover.dump`、`uploads-at-cutover.tar`，原环境/PM2/入口/证书配置及核对 JSON。数据库逻辑备份已恢复到隔离卷验证。未建立新定时或异机备份。

切换前后：works13、events20、products30、conventions18、pages4、projects10、files62、admin_users1、up_users0、up_permissions22；451 个上传文件（约659MB）清单和哈希完全一致。生产卷只有新 PostgreSQL 一个运行实例使用。

如需人工回退，先关闭本应用自动部署及 GitHub webhook，确认没有进行中的部署，并判断旧 Strapi 对当前 schema 的兼容性。只读检查 `python3 /root/abl-coolify-20261023/rollback.py --check`；确认后 `--execute` 停止本应用新容器，再恢复旧服务、入口及证书续期，继续使用当前数据。脚本不会把旧备份覆盖回正式库。存在不兼容 schema 或要恢复旧数据时，先另做当前备份并确认数据损失范围。未实际执行生产回退。

验证包括前端已有 `npm run test`（100 passed）、前后端镜像构建、`nginx -t`、真实副本/生产容器健康、挂载及只读模式、API JSON/日期、数据库计数、后台页面与脚本、SPA、API404、媒体哈希、CORS、HTTP跳转及TLS。没有浏览器自动交互、后台编辑、生产上传、压力测试、服务器重启或到期续期演练。

准备阶段曾因提前添加同域 HTTPS ACME 临时规则导致旧入口404，已撤回并恢复；旧数据和业务进程未切换。当时首次观测异常为10:06 UTC，10:07 UTC确认恢复，实际影响开始时间未连续测量。已在计划中记录禁止该组合。正式切换于10:33:59 UTC开始停写，独立的新业务路由验收后才归档旧入口。

## 自动发布验收

交付文档提交 `a7c3de829d37cbbc6d01d773aa244a586a03ff46` 已实测签名 push → Coolify SSH 拉取 → 构建 → 发布完整链路。GitHub 投递 HTTP200，部署 `mdfvgjw02jslmpqqmmj9kor0` 的 is_webhook=true、状态 finished；发布后所有容器健康，原数据卷唯一使用、表数量、文件哈希和公网验收再次通过。详细结果在服务器私有目录 `auto-deploy-check.json`。

这次仅补充验收结果的后续文档提交使用 `[skip cd]`，由 Coolify 原生识别，不再重复重启服务。最后运行 SHA 为上述自动发布提交；之后未带跳过标记的 main push 会继续正常部署。当前发布会重启整套 Compose 服务，期间 API 可能短暂不可用。
