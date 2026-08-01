// PM2 进程定义 —— Strapi 生产进程的唯一权威来源
//
// 用法（root）：
//   cd /home/deploy/abl_website
//   pm2 delete strapi-main            # 删掉旧的、命令行临时创建的那个
//   pm2 start ecosystem.config.js
//   pm2 save                          # 写进开机自启
//
// 为什么要这个文件：
//   原来的进程是 `pm2 start npm --name strapi-main --cwd ... -- run start`
//   这样临时创建的，进程定义只存在于服务器的 pm2 dump 里，不在 git 中——
//   谁也说不清它到底带着什么环境变量。2026-08-01 就因此踩了坑：
//   NODE_ENV 从没被设置过，生产一直跑在 development 模式下，
//   Content-Type Builder 在生产后台是开着的（在那里改结构会写回服务器的
//   src/，下次 git pull 必然冲突）。
module.exports = {
  apps: [
    {
      name: 'strapi-main',
      cwd: '/home/deploy/abl_website/strapi-backend',
      script: 'npm',
      args: 'run start',

      // ↓ 这就是以前缺的。production 模式会禁用 Content-Type Builder，
      //   数据结构只能从代码走（本地 develop 改 → 提交 → update-strapi.sh）。
      //
      //   注意：本项目没有 config/env/production/ 目录，所以切换 NODE_ENV
      //   不会改变数据库或服务器配置——那些全部来自 .env，与 NODE_ENV 无关。
      env: {
        NODE_ENV: 'production',
      },

      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      // Strapi 启动要跑 schema 迁移，给足时间再判定为启动失败
      min_uptime: '30s',
      kill_timeout: 10000,
      max_memory_restart: '1G',

      merge_logs: true,
      time: true,
    },
  ],
}
