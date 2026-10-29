// Vercel 서버리스 함수: 공공데이터포털(odcloud) "서귀포시 직영관광지 관람객수 추이" 를 서버에서 대신 불러옵니다.
// GET /api/visitors  →  { spots: [...], rows: [{ y, m, v: [관람객수...] }], updated: '데이터기준일자' }
// 인증키(DATA_GO_KR_KEY)가 브라우저에 노출되지 않습니다.
const BASE = 'https://api.odcloud.kr/api/15125100/v1/uddi:32a1b877-af20-4505-a76a-fd389ebd30ca'

// 데이터의 칼럼 이름(관광지) 순서
const SPOTS = ['천지연폭포', '천제연폭포', '정방폭포', '중문대포 주상절리대', '산방산_용머리', '감귤박물관']

// 숫자("12,345"), 빈 값, 공란 → number | null
const toNum = v => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(String(v).replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

export default async function handler(req, res) {
  const send = (status, body) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(body))
  }
  let key = process.env.DATA_GO_KR_KEY
  if (!key) return send(500, { error: 'DATA_GO_KR_KEY 환경변수가 설정되지 않았어요.' })
  if (key.includes('%')) key = decodeURIComponent(key) // Encoding 키를 넣어도 이중 인코딩되지 않게

  try {
    const all = []
    for (let page = 1; page <= 5; page++) {
      const url = new URL(BASE)
      url.search = new URLSearchParams({ page: String(page), perPage: '1000', returnType: 'JSON', serviceKey: key })
      const r = await fetch(url)
      const text = await r.text()
      let json
      try { json = JSON.parse(text) } catch { return send(502, { error: '응답을 읽지 못했어요.' }) }
      if (typeof json.code === 'number' && json.code < 0) return send(502, { error: json.msg || `API 오류 (${json.code})` })
      all.push(...(json.data || []))
      if (all.length >= (json.totalCount || 0)) break
    }

    const rows = all
      .map(d => ({ y: toNum(d['기준연도']), m: toNum(d['기준월']), v: SPOTS.map(s => toNum(d[s])) }))
      .filter(d => d.y && d.m >= 1 && d.m <= 12)
      .sort((a, b) => a.y - b.y || a.m - b.m)
    const updated = all.map(d => d['데이터기준일자']).filter(Boolean).sort().pop() || ''

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400')
    send(200, { spots: SPOTS, rows, updated })
  } catch {
    send(502, { error: '관람객 데이터를 가져오지 못했어요.' })
  }
}
