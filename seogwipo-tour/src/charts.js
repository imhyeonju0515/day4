import {
  Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale,
  BarController, BarElement, Tooltip, Legend,
} from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, BarController, BarElement, Tooltip, Legend)
Chart.defaults.font.family = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif'
Chart.defaults.color = '#6b4a24'

export const COLORS = ['#2bb3a6', '#4a90e2', '#ff8a1f', '#e8517a', '#8a63d2', '#7fb069']
const fmt = n => (n == null ? '미집계' : n.toLocaleString('ko-KR') + '명')

// 현재 보고 있는 달에 세로 선을 그어 주는 플러그인
const cursorLine = {
  id: 'cursorLine',
  afterDatasetsDraw(chart) {
    const idx = chart.options.cursorIndex
    const x = chart.scales.x.getPixelForValue(idx)
    if (idx == null || Number.isNaN(x)) return
    const { ctx, chartArea: a } = chart
    ctx.save(); ctx.strokeStyle = 'rgba(255,138,31,.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4])
    ctx.beginPath(); ctx.moveTo(x, a.top); ctx.lineTo(x, a.bottom); ctx.stroke(); ctx.restore()
  },
}

export function createCharts({ lineEl, seasonEl, names, rows }) {
  const labels = rows.map(r => `${r.y}.${String(r.m).padStart(2, '0')}`)
  const line = new Chart(lineEl, {
    type: 'line',
    data: { labels, datasets: names.map((n, i) => ({ label: n, data: rows.map(r => r.v[i]), borderColor: COLORS[i], backgroundColor: COLORS[i], borderWidth: 2.2, pointRadius: 0, pointHoverRadius: 4, tension: 0.25, spanGaps: false })) },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false, cursorIndex: 0,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmt(c.parsed.y)}` } } },
      scales: { x: { ticks: { maxTicksLimit: 8, maxRotation: 0 }, grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: v => (v >= 10000 ? v / 10000 + '만' : v) } } },
    },
    plugins: [cursorLine],
  })

  const season = new Chart(seasonEl, {
    type: 'bar',
    data: { labels: Array.from({ length: 12 }, (_, i) => `${i + 1}월`), datasets: [{ data: [], backgroundColor: [], borderRadius: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `평균 ${fmt(c.parsed.y)}` } } },
      scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: v => (v >= 10000 ? v / 10000 + '만' : v) } } },
    },
  })

  return {
    // 선택된 관광지만 보이게 + 현재 달 표시
    updateLine(selected, idx) {
      line.data.datasets.forEach((d, i) => { d.hidden = !selected.has(i) })
      line.options.cursorIndex = idx
      line.update('none')
    },
    setCursor(idx) { line.options.cursorIndex = idx; line.draw() },
    // 선택된 관광지 합계의 "달력 월별 평균" → 붐비는 달/한적한 달
    updateSeason(selected) {
      const sum = Array(12).fill(0), cnt = Array(12).fill(0)
      rows.forEach(r => {
        const vals = [...selected].map(i => r.v[i]).filter(v => v != null)
        if (!vals.length) return
        sum[r.m - 1] += vals.reduce((a, b) => a + b, 0); cnt[r.m - 1]++
      })
      const avg = sum.map((s, i) => (cnt[i] ? Math.round(s / cnt[i]) : null))
      const order = avg.map((v, i) => [v, i]).filter(([v]) => v != null).sort((a, b) => a[0] - b[0])
      const quiet = order.slice(0, 3).map(([, i]) => i), busy = order.slice(-3).map(([, i]) => i)
      season.data.datasets[0].data = avg
      season.data.datasets[0].backgroundColor = avg.map((_, i) => (quiet.includes(i) ? '#2bb3a6' : busy.includes(i) ? '#ef6a3a' : '#f3d9a8'))
      season.update()
      const m = a => a.map(i => i + 1 + '월').join(', ')
      return order.length >= 6
        ? { quiet: m([...quiet].sort((a, b) => a - b)), busy: m([...busy].sort((a, b) => a - b)) }
        : null
    },
  }
}
