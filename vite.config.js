import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 薄代理：前端只请求 /api/llm，key 只存在于 .env / dev server 进程里，永不进前端包
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5174,
      strictPort: true,
      proxy: {
        '/api/llm': {
          target: 'https://open.bigmodel.cn',
          changeOrigin: true,
          rewrite: () => '/api/paas/v4/chat/completions',
          headers: { Authorization: `Bearer ${env.HJ_LLM_KEY || ''}` },
        },
      },
    },
  }
})
