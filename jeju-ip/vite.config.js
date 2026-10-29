import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 로컬 개발(npm run dev)에서도 배포 환경과 똑같이 /api/pixabay 를 쓸 수 있게 해 주는 작은 플러그인
function pixabayDevApi(env) {
  return {
    name: 'pixabay-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/pixabay', async (req, res) => {
        if (env.PIXABAY_API_KEY) process.env.PIXABAY_API_KEY = env.PIXABAY_API_KEY
        const { default: handler } = await import('./api/pixabay.js')
        await handler(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), pixabayDevApi(env)] }
})
