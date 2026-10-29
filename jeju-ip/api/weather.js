// Vercel 서버리스 함수: 기상청 단기예보 "초단기실황조회"(getUltraSrtNcst) 를 서버에서 대신 호출합니다.
// GET /api/weather?place=jeju | seogwipo   → 현재 기온·습도·바람·강수
// 공공데이터포털 인증키(DATA_GO_KR_KEY)가 브라우저에 노출되지 않습니다.
const ENDPOINT = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst'

// 기상청 격자 좌표 (nx, ny)
const PLACES = {
  jeju: { name: '제주시', nx: 53, ny: 38 },
  seogwipo: { name: '서귀포시', nx: 52, ny: 33 },
}

const PTY = { 0: '강수 없음', 1: '비', 2: '비/눈', 3: '눈', 5: '빗방울', 6: '빗방울/눈날림', 7: '눈날림' }

const pad = n => String(n).padStart(2, '0')

// 실황 자료는 매시 정각 기준이고 40분 이후에 열립니다 → 40분 전이면 한 시간 전 자료를 요청
export function baseDateTime(now = Date.now()) {
  const d = new Date(now + 9 * 3600 * 1000) // UTC → 한국시간
  if (d.getUTCMinutes() < 40) d.setUTCHours(d.getUTCHours() - 1)
  return {
    base_date: `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`,
    base_time: `${pad(d.getUTCHours())}00`,
  }
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

  const place = PLACES[new URL(req.url, 'http://localhost').searchParams.get('place')] || PLACES.jeju
  const url = new URL(ENDPOINT)
  url.search = new URLSearchParams({
    serviceKey: key, pageNo: '1', numOfRows: '20', dataType: 'JSON',
    ...baseDateTime(), nx: String(place.nx), ny: String(place.ny),
  })

  try {
    const r = await fetch(url)
    const text = await r.text()
    let json
    try { json = JSON.parse(text) } catch {
      // 키 오류 등은 JSON이 아니라 XML 로 돌아옵니다
      const msg = text.match(/<returnAuthMsg>([^<]+)/)?.[1] || text.match(/<errMsg>([^<]+)/)?.[1] || '응답을 읽지 못했어요.'
      return send(502, { error: msg })
    }
    const head = json.response?.header
    if (head?.resultCode !== '00') return send(502, { error: `${head?.resultMsg || '기상청 오류'} (${head?.resultCode})` })

    const v = {}
    for (const it of json.response.body.items.item) v[it.category] = it.obsrValue
    const pty = Number(v.PTY ?? 0)
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=600')
    send(200, {
      place: place.name,
      temp: Number(v.T1H), humidity: Number(v.REH), wind: Number(v.WSD),
      rain: Number(v.RN1 || 0), pty, sky: PTY[pty] ?? '알 수 없음',
    })
  } catch {
    send(502, { error: '날씨를 가져오지 못했어요.' })
  }
}
