import './style.css'
import { loadData, SPOT_LABELS } from './data.js'
import { createDiorama } from './diorama.js'
import { createCharts, COLORS } from './charts.js'

const $ = id => document.getElementById(id)

async function start() {
  const notice = $('notice')
  let data
  try {
    data = await loadData()
  } catch (e) {
    notice.hidden = false; notice.className = 'notice err'
    notice.innerHTML = `관람객 데이터를 불러오지 못했어요 😢<br><small>${e.message}<br>README의 환경변수(DATA_GO_KR_KEY) 설정을 확인해 주세요. 화면만 미리 보려면 주소 끝에 <code>?demo=1</code> 을 붙여 보세요.</small>`
    $('when').textContent = '데이터 없음'
    return
  }
  const { rows } = data
  if (data.demo) { notice.hidden = false; notice.className = 'notice'; notice.textContent = '⚠️ 지금 보이는 숫자는 화면 미리보기용 가짜 샘플이에요. 실제 데이터가 아니에요.' }
  $('updated').textContent = data.updated && !data.demo ? `데이터 기준일: ${data.updated}` : ''

  // 가장 큰 값 (기둥 높이 기준)
  const max = Math.max(...rows.flatMap(r => r.v.filter(v => v != null)))
  const all = new Set(SPOT_LABELS.keys())
  let selected = new Set(all)
  let idx = rows.length - 1
  let timer = null

  const charts = createCharts({ lineEl: $('lineChart'), seasonEl: $('seasonChart'), names: SPOT_LABELS, rows })
  const diorama = createDiorama($('three'), { names: SPOT_LABELS, onPick: i => { selected = selected.size === 1 && selected.has(i) ? new Set(all) : new Set([i]); refresh() } })

  // 칩(관광지 선택)
  const chips = $('chips')
  chips.innerHTML = ''
  const chipEls = SPOT_LABELS.map((n, i) => {
    const b = document.createElement('button')
    b.innerHTML = `<i style="background:${COLORS[i]}"></i>${n}`
    b.onclick = () => { selected.has(i) ? (selected.size > 1 && selected.delete(i)) : selected.add(i); refresh() }
    chips.appendChild(b); return b
  })
  const allBtn = document.createElement('button'); allBtn.className = 'all'; allBtn.textContent = '전체 보기'
  allBtn.onclick = () => { selected = new Set(all); refresh() }
  chips.prepend(allBtn)

  function refresh() {
    chipEls.forEach((b, i) => b.classList.toggle('on', selected.has(i)))
    allBtn.classList.toggle('on', selected.size === all.size)
    charts.updateLine(selected, idx)
    const tip = charts.updateSeason(selected)
    $('tip').innerHTML = tip ? `붐비는 달: <b class="busy">${tip.busy}</b><br>한적한 달: <b class="quiet">${tip.quiet}</b><small>(전체 기간 월별 평균 기준)</small>` : '데이터가 더 쌓이면 알려 드릴게요.'
    diorama?.select(selected.size === 1 ? [...selected][0] : -1)
  }

  function show() {
    const r = rows[idx]
    $('when').textContent = `${r.y}년 ${r.m}월`
    const top = r.v.reduce((b, v, i) => (v != null && (b < 0 || v > r.v[b]) ? i : b), -1)
    $('peak').innerHTML = top < 0 ? '이 달은 미집계예요' : `가장 붐빈 곳 <b>${SPOT_LABELS[top]}</b> ${r.v[top].toLocaleString('ko-KR')}명`
    $('slider').value = idx
    diorama?.setValues(r.v, max)
    charts.setCursor(idx)
  }

  const slider = $('slider')
  slider.max = rows.length - 1
  slider.oninput = () => { idx = +slider.value; show() }
  const play = $('play')
  const stop = () => { clearInterval(timer); timer = null; play.textContent = '▶'; play.setAttribute('aria-label', '재생') }
  play.onclick = () => {
    if (timer) return stop()
    if (idx >= rows.length - 1) idx = 0
    play.textContent = '⏸'; play.setAttribute('aria-label', '멈춤')
    timer = setInterval(() => { if (idx >= rows.length - 1) return stop(); idx++; show() }, 450)
  }

  refresh(); show()
}

start()
