// Vercel 서버리스 함수: Pixabay API 키를 브라우저에 노출하지 않으려고 서버에서 대신 호출합니다.
// GET /api/pixabay?q=Hallasan&per_page=12
export default async function handler(req, res) {
  const send = (status, body) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
  }
  const key = process.env.PIXABAY_API_KEY
  if (!key) return send(500, { error: 'PIXABAY_API_KEY 환경변수가 설정되지 않았어요.' })

  const params = new URL(req.url, 'http://localhost').searchParams
  const q = (params.get('q') || 'Jeju Island').slice(0, 100)
  const perPage = Math.min(Math.max(Number(params.get('per_page')) || 12, 3), 40)

  const page = Math.min(Math.max(Number(params.get('page')) || 1, 1), 25)
  const url = new URL('https://pixabay.com/api/')
  url.search = new URLSearchParams({
    key, q, image_type: 'photo', safesearch: 'true', per_page: String(perPage), page: String(page),
    lang: /[가-힣]/.test(q) ? 'ko' : 'en', // 한글로 검색해도 되도록
  })

  try {
    const r = await fetch(url)
    if (!r.ok) return send(r.status, { error: `Pixabay 오류 (${r.status})` })
    const data = await r.json()
    const hits = (data.hits || []).map(h => ({
      id: h.id, url: h.webformatURL, large: h.largeImageURL, tags: h.tags,
      user: h.user, page: h.pageURL, w: h.webformatWidth, h: h.webformatHeight,
    }))
    // Pixabay 약관: 결과는 24시간 캐시 가능
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600')
    send(200, { hits })
  } catch (e) {
    send(502, { error: '사진을 가져오지 못했어요.' })
  }
}
