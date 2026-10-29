import { useEffect, useState } from 'react'

const PLACES = [['jeju', '제주시'], ['seogwipo', '서귀포시']]
const icon = w => (w.pty === 0 ? '🌤️' : w.pty === 3 || w.pty === 7 ? '❄️' : w.pty === 2 ? '🌨️' : '🌧️')

// 지금 제주 날씨 (기상청 초단기실황)
export default function Weather() {
  const [place, setPlace] = useState('jeju')
  const [w, setW] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    setW(null); setErr('')
    fetch('/api/weather?place=' + place)
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error); return j })
      .then(j => alive && setW(j))
      .catch(e => alive && setErr(e.message))
    return () => { alive = false }
  }, [place])

  return (
    <section className="weather" aria-label="제주 날씨">
      <div className="w-tabs">
        {PLACES.map(([id, name]) => (
          <button key={id} className={id === place ? 'on' : ''} onClick={() => setPlace(id)}>{name}</button>
        ))}
      </div>
      {err ? <p className="w-msg" title={err}>날씨를 불러오지 못했어요</p>
        : !w ? <p className="w-msg">날씨 불러오는 중…</p>
        : (
          <div className="w-now">
            <span className="w-icon">{icon(w)}</span>
            <b>{w.temp}°</b>
            <span>{w.sky}</span>
            <small>습도 {w.humidity}% · 바람 {w.wind}m/s{w.rain > 0 ? ` · 강수 ${w.rain}mm` : ''}</small>
          </div>
        )}
    </section>
  )
}
