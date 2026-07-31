import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.js'],
    // Vitest 默认以 mode: 'test' 运行，仓库里没有 .env.test，
    // 所以 import.meta.env.VITE_* 在测试里默认是 undefined。
    // 复用 .env.development 的值，让测试环境与本地 dev 环境一致。
    env: loadEnv('development', process.cwd(), 'VITE_'),
  },
})
