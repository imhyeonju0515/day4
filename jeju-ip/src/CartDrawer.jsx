import { won } from './useCart.js'
import ProductImg from './ProductImg.jsx'

export default function CartDrawer({ cart, onClose }) {
  const { items, total, count, setQty, remove } = cart
  return (
    <div className="modal drawer-bg" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()} aria-label="장바구니">
        <header>
          <h2>🛒 장바구니 <small>{count}개</small></h2>
          <button className="x2" onClick={onClose} aria-label="닫기">✕</button>
        </header>

        {!items.length ? (
          <div className="cart-empty"><span>🍊</span><p>장바구니가 비었어요.<br />제주 장터에서 마음에 드는 걸 담아 보세요!</p></div>
        ) : (
          <ul className="cart-list">
            {items.map(i => (
              <li key={i.id}>
                <span className="c-emoji"><ProductImg name={i.product.name} emoji={i.product.emoji} /></span>
                <div className="c-info">
                  <b>{i.product.name}</b>
                  <small>{i.product.unit} · {won(i.product.price)}</small>
                  <div className="qty">
                    <button onClick={() => setQty(i.id, i.quantity - 1)} aria-label="하나 빼기">−</button>
                    <span>{i.quantity}</span>
                    <button onClick={() => setQty(i.id, i.quantity + 1)} aria-label="하나 더">＋</button>
                  </div>
                </div>
                <div className="c-right">
                  <b>{won(i.product.price * i.quantity)}</b>
                  <button className="del" onClick={() => remove(i.id)}>삭제</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer>
          <div className="total"><span>합계</span><b>{won(total)}</b></div>
          <button className="primary" disabled={!items.length} onClick={() => alert('결제 기능은 아직 준비 중이에요 🍊')}>주문하기</button>
        </footer>
      </aside>
    </div>
  )
}
