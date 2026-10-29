import { useState } from 'react'
import { supabase } from './supabase.js'

// Supabase 영어 오류를 쉬운 한국어로
function friendly(msg = '') {
  if (/Invalid login credentials/i.test(msg)) return '이메일이나 비밀번호가 맞지 않아요.'
  if (/already registered/i.test(msg)) return '이미 가입된 이메일이에요. 로그인해 보세요.'
  if (/at least 6/i.test(msg)) return '비밀번호는 6자 이상이어야 해요.'
  if (/Email not confirmed/i.test(msg)) return '메일함에서 확인 메일의 링크를 먼저 눌러 주세요.'
  if (/rate limit/i.test(msg)) return '요청이 너무 많아요. 잠시 후 다시 해 주세요.'
  return msg
}

export default function Auth({ onClose }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // {type:'error'|'ok', text}

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password: pw })
      if (error) setMsg({ type: 'error', text: friendly(error.message) })
      else if (!data.session) setMsg({ type: 'ok', text: '가입 완료! 메일함의 확인 링크를 누르면 로그인할 수 있어요 📬' })
      else onClose()
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
      if (error) setMsg({ type: 'error', text: friendly(error.message) })
      else onClose()
    }
    setBusy(false)
  }

  return (
    <div className="modal" onClick={onClose}>
      <form className="card auth" onClick={e => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="x" onClick={onClose} aria-label="닫기">✕</button>
        <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>로그인</button>
          <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>회원가입</button>
        </div>
        <label>이메일
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label>비밀번호
          <input type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={pw} onChange={e => setPw(e.target.value)} placeholder="6자 이상" />
        </label>
        {msg && <p className={'msg ' + msg.type}>{msg.text}</p>}
        <button className="primary" disabled={busy}>{busy ? '잠깐만요…' : mode === 'login' ? '로그인' : '가입하기'}</button>
      </form>
    </div>
  )
}
