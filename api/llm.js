// Vercel Serverless Function —— 代理智谱 GLM。
// 密钥只存在于服务端环境变量 HJ_LLM_KEY，永不进入前端包或代码仓库。
// 本地开发仍走 vite.config.js 里对 /api/llm 的代理；线上由本函数处理同一路径，前端无需改动。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const key = process.env.HJ_LLM_KEY
  if (!key) {
    res.status(500).json({ error: 'HJ_LLM_KEY 未在服务器环境变量中配置' })
    return
  }
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
    const upstream = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body,
    })
    const text = await upstream.text()
    res.status(upstream.status)
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.send(text)
  } catch (e) {
    res.status(502).json({ error: 'upstream request failed' })
  }
}
