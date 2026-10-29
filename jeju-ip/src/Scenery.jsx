import { useEffect, useRef, useState } from 'react'
import { createScenery, PLACES } from './scenery.js'

// 3D 제주 경관: 돌려 보고, 누르면 이름이 나오고, 목록에서 고르면 그곳으로 날아가요
export default function Scenery() {
  const el = useRef(null), api = useRef(null)
  const [cur, setCur] = useState(null)

  useEffect(() => {
    api.current = createScenery(el.current, { onInfo: setCur })
    return () => { api.current?.dispose(); api.current = null; if (el.current) el.current.innerHTML = '' }
  }, [])

  return (
    <section className="sc" id="scenery">
      <div className="sec-head">
        <h2>🗺️ 3D 제주 경관</h2>
        <p>한라산·오름·바다·폭포… 제주의 모습을 돌려 보고, 눌러 보세요.</p>
      </div>

      <div className="sc-stage">
        <div ref={el} className="sc-three" />
        <button className="sc-home" onClick={() => api.current?.home()}>🏝️ 전체 보기</button>
        <p className="sc-hint">드래그: 돌리기 · 휠/두 손가락: 확대 · 풍경을 누르면 이름이 나와요</p>
      </div>

      <div className="sc-info" aria-live="polite">
        {cur ? <><span>{cur.emoji}</span><div><b>{cur.name}</b><p>{cur.desc}</p></div></> : <p>아래 버튼을 누르면 그곳으로 날아가요 ✈️</p>}
      </div>

      <div className="sc-chips" role="group" aria-label="장소 고르기">
        {PLACES.map(p => (
          <button key={p.id} className={cur?.id === p.id ? 'on' : ''} onClick={() => api.current?.focus(p.id)}>{p.emoji} {p.name}</button>
        ))}
      </div>
    </section>
  )
}
