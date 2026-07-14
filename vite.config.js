import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 薄代理：前端只请求 /api/llm，key 只存在于 .env / dev server 进程里，永不进前端包
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 本地 dev 与 Vercel(根域名)用 '/';GitHub Pages 项目页(vibe-GIF.github.io/huaijin)构建用 '/huaijin/'
  const base = command === 'build' && !process.env.VERCEL ? '/huaijin/' : '/'
  return {
    base,
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
