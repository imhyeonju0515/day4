// 관람객 데이터 불러오기 (?demo=1 이면 가짜 샘플로 화면만 미리보기)
export const SPOT_LABELS = ['천지연폭포', '천제연폭포', '정방폭포', '중문대포 주상절리대', '산방산·용머리', '감귤박물관']

export async function loadData() {
  if (new URLSearchParams(location.search).has('demo')) return demoData()
  const r = await fetch('/api/visitors')
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || `불러오기 실패 (${r.status})`)
  if (!j.rows?.length) throw new Error('받아온 데이터가 비어 있어요.')
  return { rows: j.rows, updated: j.updated, demo: false }
}

// 계절 패턴(봄·여름휴가·가을 성수기)과 코로나 감소를 흉내 낸 샘플
function demoData() {
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const base = [60000, 40000, 45000, 70000, 35000, 12000]
  const season = [0.7, 0.75, 0.95, 1.1, 1.0, 0.85, 1.05, 1.35, 1.0, 1.25, 0.9, 0.75]
  const rows = []
  for (let y = 2019; y <= 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2025 && m > 8) break
      const covid = y === 2020 ? 0.55 : y === 2021 ? 0.7 : 1
      rows.push({ y, m, v: base.map((b, i) => Math.round(b * season[m - 1] * covid * (0.85 + rnd() * 0.3) * (i === 4 && m === 1 ? 0.5 : 1))) })
    }
  }
  return { rows, updated: '샘플', demo: true }
}
