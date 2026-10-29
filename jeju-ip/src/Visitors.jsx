import { useEffect, useRef, useState } from 'react'
import { loadData, SPOT_LABELS } from './visitors/data.js'
import { createDiorama } from './visitors/diorama.js'
import { createCharts, COLORS } from './visitors/charts.js'

const ALL = SPOT_LABELS.map((_, i) => i)
const fmt = n => n.toLocaleString('ko-KR')

// 서귀포 직영관광지 관람객 추이: 3D 디오라마 기둥 + 차트 (공공데이터포털 OpenAPI)
export default function Visitors() {
  const threeEl = useRef(null), lineEl = useRef(null), seasonEl = useRef(null)
  const dio = useRef(null), charts = useRef(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(() => new Set(ALL))
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [tip, setTip] = useState(null)

  // 1) 데이터 불러오기
  useEffect(() => {
    loadData().then(d => { setData(d); setIdx(d.rows.length - 1) }).catch(e => setError(e.message))
  }, [])

  // 2) 데이터가 오면 3D와 차트 만들기
  useEffect(() => {
    if (!data) return
    const max = Math.max(...data.rows.flatMap(r => r.v.filter(v => v != null)))
    charts.current = createCharts({ lineEl: lineEl.current, seasonEl: seasonEl.current, names: SPOT_LABELS, rows: data.rows })
    dio.current = createDiorama(threeEl.current, {
      names: SPOT_LABELS,
      onPick: i => setSelected(prev => (prev.size === 1 && prev.has(i) ? new Set(ALL) : new Set([i]))),
    })
    dio.current && (dio.current.max = max)
    return () => { dio.current?.dispose(); charts.current?.destroy(); dio.current = charts.current = null; threeEl.current && (threeEl.current.innerHTML = '') }
  }, [data])

  // 3) 선택한 관광지가 바뀌면
  useEffect(() => {
    if (!data || !charts.current) return
    charts.current.updateLine(selected, idx)
    setTip(charts.current.updateSeason(selected))
    dio.current?.select(selected.size === 1 ? [...selected][0] : -1)
  }, [data, selected])

  // 4) 보는 달이 바뀌면
  useEffect(() => {
    if (!data || !charts.current) return
    dio.current?.setValues(data.rows[idx].v, dio.current.max)
    charts.current.setCursor(idx)
  }, [data, idx])

  // 5) 재생
  useEffect(() => {
    if (!playing || !data) return
    const t = setInterval(() => setIdx(i => (i >= data.rows.length - 1 ? (setPlaying(false), i) : i + 1)), 450)
    return () => clearInterval(t)
  }, [playing, data])

  const row = data?.rows[idx]
  const top = row ? row.v.reduce((b, v, i) => (v != null && (b < 0 || v > row.v[b]) ? i : b), -1) : -1
  const toggle = i => setSelected(prev => {
    const n = new Set(prev)
    n.has(i) ? n.size > 1 && n.delete(i) : n.add(i)
    return n
  })

  return (
    <section className="vt" id="visitors">
      <div className="sec-head">
        <h2>📊 서귀포 관광지, 언제 가면 한적할까?</h2>
        <p>직영관광지 6곳의 월별 관람객 수예요. 기둥이 높고 붉을수록 사람이 많은 달이에요.</p>
      </div>

      {data?.demo && <p className="vt-notice">⚠️ 지금 숫자는 화면 미리보기용 가짜 샘플이에요. 실제 데이터가 아니에요.</p>}
      {error && (
        <p className="vt-notice err">관람객 데이터를 불러오지 못했어요 😢<br /><small>{error}<br />
          인증키(DATA_GO_KR_KEY)와 이 데이터의 활용신청을 확인해 주세요. 화면만 보려면 주소 끝에 <code>?demo=1</code> 을 붙여 보세요.</small></p>
      )}

      <div className="vt-stage">
        <div ref={threeEl} className="vt-three" />
        <div className="vt-hud">
          <div className="vt-when">{row ? `${row.y}년 ${row.m}월` : error ? '데이터 없음' : '불러오는 중…'}</div>
          {row && <div className="vt-peak">{top < 0 ? '이 달은 미집계예요' : <>가장 붐빈 곳 <b>{SPOT_LABELS[top]}</b> {fmt(row.v[top])}명</>}</div>}
        </div>
        <div className="vt-legend" aria-hidden="true"><span>한적</span><i /><span>붐빔</span></div>
        <div className="vt-player">
          <button disabled={!data} onClick={() => { if (idx >= data.rows.length - 1) setIdx(0); setPlaying(p => !p) }} aria-label={playing ? '멈춤' : '재생'}>{playing ? '⏸' : '▶'}</button>
          <input type="range" min="0" max={data ? data.rows.length - 1 : 0} value={idx} disabled={!data} onChange={e => setIdx(+e.target.value)} aria-label="기간 선택" />
        </div>
        <p className="vt-hint">드래그해서 돌리고, 기둥을 누르면 그 관광지만 차트로 봐요</p>
      </div>

      <div className="vt-chips" role="group" aria-label="관광지 선택">
        <button className={'all' + (selected.size === ALL.length ? ' on' : '')} onClick={() => setSelected(new Set(ALL))}>전체 보기</button>
        {SPOT_LABELS.map((n, i) => (
          <button key={n} className={selected.has(i) ? 'on' : ''} onClick={() => toggle(i)}><i style={{ background: COLORS[i] }} />{n}</button>
        ))}
      </div>

      <div className="vt-charts">
        <article className="vt-card">
          <h3>📈 월별 관람객 추이</h3>
          <div className="vt-chart-box"><canvas ref={lineEl} /></div>
        </article>
        <article className="vt-card">
          <h3>🗓️ 언제 가면 한적할까?</h3>
          <div className="vt-chart-box short"><canvas ref={seasonEl} /></div>
          <p className="vt-tip">
            {tip ? <>붐비는 달: <b className="busy">{tip.busy}</b><br />한적한 달: <b className="quiet">{tip.quiet}</b><small>(전체 기간 월별 평균 기준)</small></> : '데이터를 기다리는 중이에요.'}
          </p>
        </article>
      </div>
      <p className="vt-src">데이터 출처: 제주특별자치도 서귀포시 「직영관광지 관람객수 추이」 · 공공데이터포털{data?.updated && !data.demo ? ` · 기준일 ${data.updated}` : ''}</p>
    </section>
  )
}
