import { lazy, Suspense, useEffect, useState } from 'react'
import { supabase, supabaseReady } from './supabase.js'
import Auth from './Auth.jsx'
import Gallery from './Gallery.jsx'
import Shop from './Shop.jsx'
import Weather from './Weather.jsx'
import CartDrawer from './CartDrawer.jsx'
import { useCart } from './useCart.js'

const Hero3D = lazy(() => import('./Hero3D.jsx'))
const Visitors = lazy(() => import('./Visitors.jsx'))

// 메뉴 (주소의 #/이름 으로 구분해요. 새로고침·뒤로가기도 잘 돼요)
const MENUS = [
  { id: '', icon: '🏠', name: '홈' },
  { id: 'gallery', icon: '📷', name: '사진 갤러리', desc: '돌하르방·한라산·해녀… 제주 사진을 둘러보고 ❤️ 담아 가세요' },
  { id: 'visitors', icon: '📊', name: '관광 추이', desc: '서귀포 관광지 6곳, 언제 가면 한적한지 3D로 알아봐요' },
  { id: 'shop', icon: '🛍️', name: '제주 장터', desc: '감귤·한라봉·돌하르방 키링을 장바구니에 담아 보세요' },
]
const getRoute = () => {
  const h = location.hash.replace(/^#\/?/, '')
  return MENUS.some(m => m.id === h) ? h : ''
}

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!supabaseReady)
  const [showAuth, setShowAuth] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [text, setText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [route, setRoute] = useState(getRoute)
  const cart = useCart(user)
  const needLogin = () => (supabaseReady ? setShowAuth(true) : alert('로그인 설정이 아직 안 되어 있어요.'))
  const menus = MENUS.filter(m => m.id !== 'shop' || supabaseReady)

  useEffect(() => {
    if (!supabaseReady) return
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onHash = () => {
      const r = getRoute()
      setRoute(r)
      if (r !== 'gallery') setSearchTerm('')
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => { document.title = route ? `${MENUS.find(m => m.id === route).name} · 제주 IP 갤러리` : '제주 IP 갤러리' }, [route])

  function search(e) {
    e.preventDefault()
    const q = text.trim()
    if (!q) return
    setSearchTerm(q)
    if (route !== 'gallery') location.hash = '/gallery' // 검색 결과는 갤러리 메뉴에서 보여 줘요
  }

  const searchForm = cls => (
    <form className={cls} onSubmit={search} role="search">
      <input value={text} onChange={e => setText(e.target.value)} placeholder="검색: 일출봉, 유채꽃, 해녀…" aria-label="사진 검색" maxLength={60} />
      <button className="primary">검색</button>
    </form>
  )

  return (
    <>
      <header className="top">
        <a className="brand" href="#/"><span>🍊</span> 제주 IP 갤러리</a>
        <nav className="menu" aria-label="메뉴">
          {menus.map(m => (
            <a key={m.id} href={'#/' + m.id} className={route === m.id ? 'on' : ''} aria-current={route === m.id ? 'page' : undefined}>
              <span>{m.icon}</span> {m.name}
            </a>
          ))}
        </nav>
        <div className="who">
          {!ready ? null : user ? (
            <>
              <button className="cart-btn" onClick={() => setShowCart(true)} aria-label="장바구니">
                🛒{cart.count > 0 && <i>{cart.count}</i>}
              </button>
              <span className="email">{user.email}</span>
              <button onClick={() => supabase.auth.signOut()}>로그아웃</button>
            </>
          ) : supabaseReady ? (
            <button className="primary" onClick={() => setShowAuth(true)}>로그인 / 회원가입</button>
          ) : null}
        </div>
      </header>

      <main>
        {!supabaseReady && (
          <p className="status err">Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 아직 없어서 로그인 기능이 꺼져 있어요.</p>
        )}

        {route === '' && (
          <>
            <section className="hero">
              <Suspense fallback={null}><Hero3D /></Suspense>
              <div className="hero-text">
                <h1>바람·돌·바다의 섬,<br />제주의 이야기를 모아요</h1>
                <p>돌하르방, 해녀, 감귤, 한라산… 제주의 모습을 사진으로 둘러보고 마음에 드는 건 ❤️ 담아 가세요.</p>
              </div>
              {searchForm('hero-search')}
            </section>
            <Weather />
            <section className="home-cards" aria-label="메뉴 바로가기">
              {menus.filter(m => m.id).map(m => (
                <a key={m.id} href={'#/' + m.id} className="hcard">
                  <span className="hc-icon">{m.icon}</span>
                  <h2>{m.name}</h2>
                  <p>{m.desc}</p>
                  <b>들어가기 →</b>
                </a>
              ))}
            </section>
          </>
        )}

        {route === 'gallery' && (
          <>
            {searchForm('page-search')}
            <Gallery user={user} searchTerm={searchTerm} onNeedLogin={needLogin} />
          </>
        )}
        {route === 'visitors' && <Suspense fallback={<p className="status">불러오는 중…</p>}><Visitors /></Suspense>}
        {route === 'shop' && (supabaseReady
          ? <Shop user={user} cart={cart} onNeedLogin={needLogin} />
          : <p className="status">로그인 설정이 끝나면 장터가 열려요.</p>)}
      </main>

      <footer>
        <div className="foot-wave" aria-hidden="true" />
        <p>🍊 제주의 바람과 귤향을 담아 · 사진 출처 <a href="https://pixabay.com" target="_blank" rel="noreferrer">Pixabay</a> · 관광 데이터 제주특별자치도 서귀포시</p>
      </footer>
      {showAuth && !user && <Auth onClose={() => setShowAuth(false)} />}
      {showCart && user && <CartDrawer cart={cart} onClose={() => setShowCart(false)} />}
    </>
  )
}
