import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = mode === 'production' ? '/huaijin/' : '/'
  return {
    plugins: [react()],
    base,
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
