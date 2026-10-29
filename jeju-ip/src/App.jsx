import { useEffect, useState } from 'react'
import { supabase, supabaseReady } from './supabase.js'
import Auth from './Auth.jsx'
import Gallery from './Gallery.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!supabaseReady)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (!supabaseReady) return
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <>
      <header className="top">
        <div className="brand">🍊 제주 IP 갤러리</div>
        <div className="who">
          {!ready ? null : user ? (
            <>
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
          <h1>바람·돌·바다의 섬,<br />제주의 이야기를 모아요</h1>
          <p>돌하르방, 해녀, 감귤, 한라산… 제주 IP(이야기 자산)를 사진으로 둘러보고, 로그인하면 마음에 드는 사진을 즐겨찾기할 수 있어요.</p>
        </section>

        {!supabaseReady && (
          <p className="status err">Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 아직 없어서 로그인 기능이 꺼져 있어요. README의 설정 순서를 따라 해 주세요.</p>
        )}
        <Gallery user={user} onNeedLogin={() => (supabaseReady ? setShowAuth(true) : alert('로그인 설정이 아직 안 되어 있어요.'))} />
      </main>

      <footer>사진 출처: <a href="https://pixabay.com" target="_blank" rel="noreferrer">Pixabay</a></footer>
      {showAuth && !user && <Auth onClose={() => setShowAuth(false)} />}
    </>
  )
}
