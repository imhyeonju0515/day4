import { defineConfig, loadEnv } from 'vite'

// 로컬 개발(npm run dev)에서도 배포 환경과 똑같이 /api/visitors 를 쓰게 해 주는 작은 플러그인
function devApi(env) {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/visitors', async (req, res) => {
        if (env.DATA_GO_KR_KEY) process.env.DATA_GO_KR_KEY = env.DATA_GO_KR_KEY
        const { default: handler } = await import('./api/visitors.js')
        await handler(req, res)
      })
    },
  }
}

export default defineConfig(({ mode }) => ({ plugins: [devApi(loadEnv(mode, process.cwd(), ''))] }))
