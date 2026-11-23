// Vite 开发服务器与构建配置。

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 部署到子路径时（M4），把 base 改成 '/easy-kanban/'。
 * src/api/client.ts 会跟随 import.meta.env.BASE_URL 拼出 API 地址，
 * 开发环境则通过下面的 proxy 转发到 Flask。
 */
export default defineConfig({
  base: '/',
  plugins: [vue()],
  server: {
    // 局域网 / 手机调试要能被外部访问；Vite 默认只绑 localhost。
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5003',
        changeOrigin: false,
      },
    },
  },
})
