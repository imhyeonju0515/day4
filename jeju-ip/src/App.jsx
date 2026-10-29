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

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!supabaseReady)
  const [showAuth, setShowAuth] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [text, setText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const cart = useCart(user)
  const needLogin = () => (supabaseReady ? setShowAuth(true) : alert('로그인 설정이 아직 안 되어 있어요.'))

  useEffect(() => {
    if (!supabaseReady) return
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  function search(e) {
    e.preventDefault()
    const q = text.trim()
    if (!q) return
    setSearchTerm(q)
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <header className="top">
        <div className="brand"><span>🍊</span> 제주 IP 갤러리</div>
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
        <section className="hero">
          <Suspense fallback={null}><Hero3D /></Suspense>
          <div className="hero-text">
            <h1>바람·돌·바다의 섬,<br />제주의 이야기를 모아요</h1>
            <p>돌하르방, 해녀, 감귤, 한라산… 제주의 모습을 사진으로 둘러보고 마음에 드는 건 ❤️ 담아 가세요.</p>
          </div>
          <form className="hero-search" onSubmit={search} role="search">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="검색: 일출봉, 유채꽃, 해녀…" aria-label="사진 검색" maxLength={60} />
            <button className="primary">검색</button>
          </form>
        </section>

        {!supabaseReady && (
          <p className="status err">Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 아직 없어서 로그인 기능이 꺼져 있어요.</p>
        )}
        <Weather />
        <Suspense fallback={null}><Visitors /></Suspense>
        {supabaseReady && <Shop user={user} cart={cart} onNeedLogin={needLogin} />}
        <Gallery user={user} searchTerm={searchTerm} onNeedLogin={needLogin} />
      </main>

      <footer>
        <div className="foot-wave" aria-hidden="true" />
        <p>🍊 제주의 바람과 귤향을 담아 · 사진 출처 <a href="https://pixabay.com" target="_blank" rel="noreferrer">Pixabay</a></p>
      </footer>
      {showAuth && !user && <Auth onClose={() => setShowAuth(false)} />}
      {showCart && user && <CartDrawer cart={cart} onClose={() => setShowCart(false)} />}
    </>
  )
}
