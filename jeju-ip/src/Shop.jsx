import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { won } from './useCart.js'
import ProductImg from './ProductImg.jsx'

// 제주 장터: 상품 목록 + 장바구니 담기
export default function Shop({ user, cart, onNeedLogin }) {
  const [products, setProducts] = useState([])
  const [state, setState] = useState('loading') // loading | ok | error
  const [done, setDone] = useState(null) // 방금 담은 상품 id

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).order('id')
      .then(({ data, error }) => { if (error) setState('error'); else { setProducts(data); setState('ok') } })
  }, [])

  async function put(p) {
    if (!user) return onNeedLogin()
    if (await cart.add(p.id)) { setDone(p.id); setTimeout(() => setDone(d => (d === p.id ? null : d)), 1200) }
  }

  return (
    <section className="shop" id="shop">
      <div className="sec-head">
        <h2>🛍️ 제주 장터</h2>
        <p>제주의 맛과 멋을 장바구니에 담아 보세요</p>
      </div>
      {state === 'error' && <p className="status err">상품을 불러오지 못했어요. Supabase에서 <code>supabase/cart.sql</code>을 실행했는지 확인해 주세요.</p>}
      {state === 'ok' && !products.length && <p className="status">아직 등록된 상품이 없어요.</p>}
      <div className="products">
        {products.map(p => (
          <article key={p.id} className="product">
            <div className="p-emoji"><ProductImg name={p.name} emoji={p.emoji} /></div>
            <h3>{p.name}</h3>
            <p className="p-desc">{p.description}</p>
            <div className="p-foot">
              <div><b>{won(p.price)}</b><small>{p.unit}</small></div>
              <button className={done === p.id ? 'ok' : 'primary'} onClick={() => put(p)}>{done === p.id ? '담았어요 ✓' : '🛒 담기'}</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
