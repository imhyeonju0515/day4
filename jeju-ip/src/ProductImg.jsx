import { useEffect, useState } from 'react'

// 상품 이름 → Pixabay 검색어 (여기에 없으면 상품 이름 그대로 검색)
const QUERY = {
  '제주 감귤': 'tangerine mandarin fruit',
  '한라봉': 'dekopon orange fruit',
  '천혜향': 'mandarin orange peeled',
  '돌하르방 키링': 'Dol hareubang statue Jeju',
  '제주 말 인형': 'Jeju pony horse',
  '유채꿀': 'honey jar honeycomb',
  '감귤 초콜릿': 'orange chocolate',
  '해녀 소라 과자': 'seashell conch beach',
}

const cache = new Map()
function loadImage(name) {
  const q = QUERY[name] || name
  if (!cache.has(q)) {
    cache.set(q, fetch(`/api/pixabay?per_page=3&q=${encodeURIComponent(q)}`)
      .then(r => (r.ok ? r.json() : { hits: [] }))
      .then(j => j.hits?.[0]?.url || null)
      .catch(() => null))
  }
  return cache.get(q)
}

// 실제 사진을 보여 주고, 아직 불러오는 중이거나 실패하면 이모지를 보여 줌
export default function ProductImg({ name, emoji }) {
  const [src, setSrc] = useState(null)
  const [bad, setBad] = useState(false)
  useEffect(() => {
    let alive = true
    loadImage(name).then(u => alive && setSrc(u))
    return () => { alive = false }
  }, [name])
  return src && !bad
    ? <img src={src} alt={name} loading="lazy" onError={() => setBad(true)} />
    : <span className="fallback" aria-hidden="true">{emoji}</span>
}
