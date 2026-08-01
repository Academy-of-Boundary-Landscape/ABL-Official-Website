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
//   谁也说不清它到底带着什么环境变量、cwd 是什么、重启策略如何。
//   2026-08-01 排障时就因此绕了弯路：日志里写着 Environment: development，
//   而没有任何地方能查到这个进程是怎么被创建的。
module.exports = {
  apps: [
    {
      name: 'strapi-main',
      cwd: '/home/deploy/abl_website/strapi-backend',
      script: 'npm',
      args: 'run start',

      // NODE_ENV 在本项目里是整洁项，不是安全边界——2026-08-01 实测：
      //   · Content-Type Builder 的开关是 strapi develop vs strapi start
      //     （autoReload），不是 NODE_ENV。两种 NODE_ENV 下 CTB 路由都注册。
      //   · 校验错误的响应体两种模式逐字节相同。
      //   · 本项目没有 config/env/production/，所有配置来自 .env。
      // 设成 production 的实际收益：排障时不会被"生产写着 development"误导，
      // 以及将来若真加了 config/env/production/ 不至于静默失效。
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
