import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { CATEGORIES } from './jejuData.js'

export default function Gallery({ user, onNeedLogin }) {
  const [cat, setCat] = useState(CATEGORIES[0])
  const [hits, setHits] = useState([])
  const [state, setState] = useState('loading') // loading | ok | error
  const [error, setError] = useState('')
  const [favs, setFavs] = useState(new Map()) // image_id -> true
  const [view, setView] = useState('gallery') // gallery | favs
  const [favList, setFavList] = useState([])

  useEffect(() => {
    let alive = true
    setState('loading')
    fetch('/api/pixabay?per_page=15&q=' + encodeURIComponent(cat.query))
      .then(async r => { const j = await r.json(); if (!r.ok) throw new Error(j.error || '오류'); return j })
      .then(j => { if (alive) { setHits(j.hits); setState('ok') } })
      .catch(e => { if (alive) { setError(e.message); setState('error') } })
    return () => { alive = false }
  }, [cat])

  async function loadFavs() {
    if (!user || !supabase) { setFavs(new Map()); setFavList([]); return }
    const { data } = await supabase.from('favorites').select('*').order('created_at', { ascending: false })
    setFavs(new Map((data || []).map(f => [f.image_id, true])))
    setFavList(data || [])
  }
  useEffect(() => { loadFavs(); if (!user) setView('gallery') }, [user])

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
    <section>
      <div className="chips">
        {CATEGORIES.map(c => (
          <button key={c.id} className={view === 'gallery' && c.id === cat.id ? 'on' : ''}
            onClick={() => { setView('gallery'); setCat(c) }}>{c.emoji} {c.name}</button>
        ))}
        {user && <button className={'fav-tab ' + (view === 'favs' ? 'on' : '')} onClick={() => setView('favs')}>❤️ 내 즐겨찾기 {favList.length}</button>}
      </div>

      {view === 'gallery' && <p className="desc">{cat.emoji} {cat.desc}</p>}
      {view === 'gallery' && state === 'loading' && <p className="status">사진을 불러오는 중…</p>}
      {view === 'gallery' && state === 'error' && <p className="status err">{error}</p>}
      {view === 'favs' && !items.length && <p className="status">아직 즐겨찾기한 사진이 없어요. 하트를 눌러 보세요!</p>}
      {view === 'gallery' && state === 'ok' && !items.length && <p className="status">이 주제의 사진을 찾지 못했어요.</p>}

      <div className="grid">
        {items.map(h => (
          <figure key={h.id} className="photo">
            <img src={h.url} alt={h.tags} loading="lazy" />
            <button className={'heart ' + (favs.get(h.id) ? 'on' : '')} onClick={() => toggle(h)}
              aria-label="즐겨찾기" title={user ? '즐겨찾기' : '로그인하면 즐겨찾기할 수 있어요'}>
              {favs.get(h.id) ? '❤️' : '🤍'}
            </button>
            <figcaption>
              <a href={h.page} target="_blank" rel="noreferrer">{h.user ? `📷 ${h.user} · Pixabay` : 'Pixabay에서 보기'}</a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
