import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 로컬 개발(npm run dev)에서도 배포 환경과 똑같이 /api/* 를 쓸 수 있게 해 주는 작은 플러그인
const API_ROUTES = ['pixabay', 'weather', 'visitors']
const API_KEYS = ['PIXABAY_API_KEY', 'DATA_GO_KR_KEY']

function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      for (const name of API_ROUTES) {
        server.middlewares.use(`/api/${name}`, async (req, res) => {
          for (const k of API_KEYS) if (env[k]) process.env[k] = env[k]
          const { default: handler } = await import(`./api/${name}.js`)
          await handler(req, res)
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), devApi(env)] }
})
