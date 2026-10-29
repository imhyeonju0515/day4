import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// 로그인한 사용자의 장바구니 (Supabase cart_items + products)
export function useCart(user) {
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!user || !supabase) { setItems([]); return }
    const { data } = await supabase
      .from('cart_items')
      .select('id, quantity, product:products(id, name, emoji, price, unit)')
      .order('created_at')
    setItems((data || []).filter(i => i.product))
  }, [user])

  useEffect(() => { load() }, [load])

  async function add(productId) {
    const ex = items.find(i => i.product.id === productId)
    const { error } = ex
      ? await supabase.from('cart_items').update({ quantity: Math.min(99, ex.quantity + 1) }).eq('id', ex.id)
      : await supabase.from('cart_items').insert({ product_id: productId, quantity: 1 })
    await load()
    return !error
  }
  async function remove(id) {
    await supabase.from('cart_items').delete().eq('id', id)
    await load()
  }
  async function setQty(id, q) {
    if (q < 1) return remove(id)
    await supabase.from('cart_items').update({ quantity: Math.min(99, q) }).eq('id', id)
    await load()
  }

  const count = items.reduce((a, i) => a + i.quantity, 0)
  const total = items.reduce((a, i) => a + i.quantity * i.product.price, 0)
  return { items, count, total, add, remove, setQty }
}

export const won = n => n.toLocaleString('ko-KR') + '원'
