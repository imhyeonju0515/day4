import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { CATEGORIES } from './jejuData.js'

const PER = 20
const tagList = t => (t || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)

export default function Gallery({ user, onNeedLogin, searchTerm }) {
  const [req, setReq] = useState({ cat: CATEGORIES[0], page: 1 })
  const { cat, page } = req
  const [hits, setHits] = useState([])
  const [state, setState] = useState('loading') // loading | ok | error
  const [error, setError] = useState('')
  const [more, setMore] = useState(false)
  const [favs, setFavs] = useState(new Map())
  const [favList, setFavList] = useState([])
  const [view, setView] = useState('gallery') // gallery | favs
  const [light, setLight] = useState(null)

  const pick = c => { setView('gallery'); setHits([]); setReq({ cat: c, page: 1 }) }

  useEffect(() => {
    if (!searchTerm) return
    pick({ id: 'search', name: searchTerm, emoji: '🔍', query: searchTerm, desc: `"${searchTerm}" 검색 결과` })
  }, [searchTerm])

  useEffect(() => {
    let alive = true
    setState('loading')
    fetch(`/api/pixabay?per_page=${PER}&page=${page}&q=` + encodeURIComponent(cat.query))
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || '오류'); return j })
      .then(j => {
        if (!alive) return
        setHits(prev => {
          const seen = new Set(page === 1 ? [] : prev.map(p => p.id))
          return (page === 1 ? [] : prev).concat(j.hits.filter(h => !seen.has(h.id)))
        })
        setMore(j.hits.length >= PER); setState('ok')
      })
      .catch(e => { if (alive) { setError(e.message); setState('error') } })
    return () => { alive = false }
  }, [req])

  async function loadFavs() {
    if (!user || !supabase) { setFavs(new Map()); setFavList([]); return }
    const { data } = await supabase.from('favorites').select('*').order('created_at', { ascending: false })
    setFavs(new Map((data || []).map(f => [f.image_id, true])))
    setFavList(data || [])
  }
  useEffect(() => { loadFavs(); if (!user) setView('gallery') }, [user])

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && setLight(null)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  async function toggle(h) {
    if (!user) return onNeedLogin()
    if (favs.get(h.id)) await supabase.from('favorites').delete().eq('image_id', h.id)
    else await supabase.from('favorites').insert({ image_id: h.id, image_url: h.url, tags: h.tags, category: cat.name })
    loadFavs()
  }

  const items = view === 'favs'
    ? favList.map(f => ({ id: f.image_id, url: f.image_url, tags: f.tags, user: '', page: `https://pixabay.com/photos/id-${f.image_id}/` }))
    : hits

  return (
    <section className="gallery" id="gallery">
      <div className="chips">
        {cat.id === 'search' && <button className={view === 'gallery' ? 'on' : ''} onClick={() => setView('gallery')}>🔍 {cat.name}</button>}
        {CATEGORIES.map(c => (
          <button key={c.id} className={view === 'gallery' && c.id === cat.id ? 'on' : ''} onClick={() => pick(c)}>{c.emoji} {c.name}</button>
        ))}
        {user && <button className={'fav-tab ' + (view === 'favs' ? 'on' : '')} onClick={() => setView('favs')}>❤️ 즐겨찾기 {favList.length}</button>}
      </div>

      <div className="sec-head">
        <h2>{view === 'favs' ? '❤️ 내 즐겨찾기' : `${cat.emoji} ${cat.id === 'search' ? `“${cat.name}”` : cat.name}`}</h2>
        <p>{view === 'favs' ? '하트를 누른 사진들이에요' : cat.desc}</p>
      </div>

      {view === 'gallery' && state === 'error' && <p className="status err">{error}</p>}
      {view === 'favs' && !items.length && <p className="status">아직 즐겨찾기한 사진이 없어요. 사진의 하트를 눌러 보세요!</p>}
      {view === 'gallery' && state === 'ok' && !items.length && <p className="status">“{cat.name}” 사진을 찾지 못했어요. 다른 말로 검색해 보세요 🍊</p>}

      <div className="grid">
        {view === 'gallery' && state === 'loading' && !hits.length && Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="photo skel" style={{ aspectRatio: [1.4, 0.8, 1.1, 1.6][i % 4] }} />
        ))}
        {items.map(h => (
          <figure key={h.id} className="photo">
            <button className="pic" onClick={() => setLight(h)} aria-label="크게 보기">
              <img src={h.url} alt={h.tags} loading="lazy" />
            </button>
            <button className={'heart ' + (favs.get(h.id) ? 'on' : '')} onClick={() => toggle(h)}
              aria-label="즐겨찾기" title={user ? '즐겨찾기' : '로그인하면 즐겨찾기할 수 있어요'}>
              {favs.get(h.id) ? '❤️' : '🤍'}
            </button>
            <figcaption>
              <span className="tags">{tagList(h.tags).slice(0, 2).map(t => '#' + t).join(' ')}</span>
              {h.user && <span className="by">📷 {h.user}</span>}
            </figcaption>
          </figure>
        ))}
      </div>

      {view === 'gallery' && more && state !== 'error' && (
        <div className="more"><button className="primary" disabled={state === 'loading'} onClick={() => setReq({ cat, page: page + 1 })}>
          {state === 'loading' ? '불러오는 중…' : '사진 더 보기 🍊'}</button></div>
      )}

      {light && (
        <div className="modal lb" onClick={() => setLight(null)}>
          <div className="lb-card" onClick={e => e.stopPropagation()}>
            <button className="x" onClick={() => setLight(null)} aria-label="닫기">✕</button>
            <img src={light.large || light.url} alt={light.tags} />
            <div className="lb-bar">
              <div>
                <b>{tagList(light.tags).map(t => '#' + t).join(' ')}</b>
                <a href={light.page} target="_blank" rel="noreferrer">{light.user ? `📷 ${light.user} · Pixabay에서 보기` : 'Pixabay에서 보기'}</a>
              </div>
              <button className="primary" onClick={() => toggle(light)}>{favs.get(light.id) ? '❤️ 담았어요' : '🤍 즐겨찾기'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
