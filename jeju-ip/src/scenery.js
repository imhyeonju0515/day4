import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// 3D 제주 경관: 섬 위의 장소들. 누르거나 목록에서 고르면 카메라가 날아가 이름을 보여 줘요.
export const PLACES = [
  { id: 'hallasan', emoji: '⛰️', name: '한라산', desc: '제주 한가운데 솟은, 남한에서 가장 높은 산이에요' },
  { id: 'oreum', emoji: '🌋', name: '오름', desc: '제주 곳곳에 봉긋 솟은 작은 화산이에요' },
  { id: 'windmill', emoji: '🌬️', name: '풍력발전기', desc: '바람의 섬, 바람으로 전기를 만들어요' },
  { id: 'lighthouse', emoji: '🗼', name: '등대', desc: '밤바다의 배를 지켜 주는 불빛이에요' },
  { id: 'dol', emoji: '🗿', name: '돌하르방', desc: '제주를 지켜 주는 돌할아버지예요' },
  { id: 'olle', emoji: '🥾', name: '올레길', desc: '파랑·주황 리본을 따라 걷는 바닷가 길이에요' },
  { id: 'harbor', emoji: '⛵', name: '항·포구', desc: '고깃배가 드나드는 서귀포항과 남원포구예요' },
  { id: 'orchard', emoji: '🍊', name: '감귤밭', desc: '제주 감귤이 주렁주렁 열리는 밭이에요' },
  { id: 'cheonjiyeon', emoji: '💧', name: '천지연폭포', desc: '서귀포 바다로 곧장 떨어지는 시원한 폭포예요' },
  { id: 'cheonjeyeon', emoji: '💦', name: '천제연폭포', desc: '중문 계곡에 3단으로 흐르는 폭포예요' },
  { id: 'jeongbang', emoji: '🌊', name: '정방폭포', desc: '바다 위로 물이 떨어지는 신기한 폭포예요' },
  { id: 'jusang', emoji: '🧱', name: '중문·대포 주상절리대', desc: '육각형 돌기둥이 파도 곁에 줄지어 서 있어요' },
  { id: 'sanbang', emoji: '🏔️', name: '산방산·용머리', desc: '둥근 종 모양 산과 용이 누운 듯한 해안이에요' },
  { id: 'museum', emoji: '🏛️', name: '감귤박물관', desc: '제주 감귤의 역사를 알려 주는 곳이에요' },
]

const FONT = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif'

function makeLabel(w, h) {
  const cv = document.createElement('canvas'); cv.width = w * 128; cv.height = h * 128
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }))
  mesh.renderOrder = 10
  mesh.userData.draw = (name, desc) => {
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height)
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.roundRect(2, 2, cv.width - 4, cv.height - 4, cv.height * 0.3); c.fill()
    c.textAlign = 'center'
    const fit = (text, size, color) => {
      let fs = cv.height * size; c.font = `bold ${fs}px ${FONT}`
      const tw = c.measureText(text).width, maxW = cv.width * 0.92
      if (tw > maxW) { fs *= maxW / tw; c.font = `bold ${fs}px ${FONT}` }
      c.fillStyle = color
    }
    fit(name, 0.36, '#6b3a0a'); c.fillText(name, cv.width / 2, cv.height * 0.42)
    fit(desc, 0.25, '#169c8e'); c.fillText(desc, cv.width / 2, cv.height * 0.78)
    tex.needsUpdate = true
  }
  return mesh
}

export function createScenery(el, { onInfo }) {
  let renderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { el.innerHTML = '<p class="no3d">이 브라우저에서는 3D를 쓸 수 없어요 😢</p>'; return null }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x2a8f94, 1.15))
  const sun = new THREE.DirectionalLight(0xfff0cc, 2.1); sun.position.set(6, 10, 8); scene.add(sun)

  const std = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })
  const basic = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, ...extra })
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m }

  // 바다
  const seaGeo = new THREE.PlaneGeometry(60, 40, 60, 36); seaGeo.rotateX(-Math.PI / 2)
  const seaBase = seaGeo.attributes.position.array.slice()
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x2bb3a6, roughness: 0.35, flatShading: true, transparent: true, opacity: 0.94 }))
  sea.position.y = -0.45; scene.add(sea)

  // 섬
  const sand = mesh(new THREE.CylinderGeometry(7, 7.5, 0.9, 40), std(0xe9dba9)); sand.scale.set(1.15, 1, 0.78); scene.add(sand)
  const grass = mesh(new THREE.CylinderGeometry(6.5, 6.8, 0.4, 40), std(0x73b366), 0, 0.5); grass.scale.set(1.15, 1, 0.78); scene.add(grass)
  const G = 0.7 // 풀밭 높이

  // ── 장소 등록
  const places = {}        // id → { root, focus }
  const spinners = [], bobbers = [], shimmers = []
  const reg = (id, root, focus = root) => {
    const meta = PLACES.find(p => p.id === id)
    root.traverse(o => { if (o.isMesh) o.userData.place = id })
    scene.add(root); places[id] = { root, focus, meta }
  }
  const hit = (w, h, d, y = 0) => { const m = mesh(new THREE.BoxGeometry(w, h, d), basic(0xffffff, { transparent: true, opacity: 0, depthWrite: false })); m.position.y = y; return m }

  // 한라산
  {
    const g = new THREE.Group()
    g.add(mesh(new THREE.ConeGeometry(3.3, 3.4, 10), std(0x5f9a62), 0, 2.3, -1.2))
    g.add(mesh(new THREE.ConeGeometry(1.0, 0.7, 10), std(0x9a8f7a), 0, 3.7, -1.2))
    reg('hallasan', g, g.children[0])
  }
  // 오름
  {
    const g = new THREE.Group()
    ;[[-5.5, -0.5, 1.0, 0.8], [5.4, -0.2, 1.1, 0.9], [-2.8, -2.2, 0.9, 0.7], [3.2, -2.4, 1.0, 0.8]].forEach(([x, z, r, h]) => g.add(mesh(new THREE.ConeGeometry(r, h * 2, 8), std(0x80bb70), x, 0.55 + h * 0.5, z)))
    reg('oreum', g, g.children[1])
  }
  // 풍력발전기
  {
    const g = new THREE.Group()
    ;[[-6.9, -1.7, 1], [-6.0, -2.7, 0.85], [-7.0, -0.5, 0.8]].forEach(([x, z, s], k) => {
      const t = new THREE.Group(); t.position.set(x, G, z); t.scale.setScalar(s)
      t.add(mesh(new THREE.CylinderGeometry(0.05, 0.1, 2.2, 8), std(0xf4f4f4), 0, 1.1, 0))
      const rotor = new THREE.Group(); rotor.position.set(0, 2.25, 0.14); t.add(rotor)
      rotor.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), std(0xffffff)))
      for (let i = 0; i < 3; i++) {
        const geo = new THREE.BoxGeometry(0.09, 0.95, 0.02); geo.translate(0, 0.5, 0)
        const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI * 2) / 3; arm.add(new THREE.Mesh(geo, std(0xffffff))); rotor.add(arm)
      }
      spinners.push({ obj: rotor, axis: 'z', speed: 1.4 + k * 0.4 }); g.add(t)
    })
    reg('windmill', g, g.children[0])
  }
  // 등대
  {
    const g = new THREE.Group(); g.position.set(7.2, G, 0.8)
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.5, 10), std(0xffffff), 0, 0.75, 0))
    g.add(mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.22, 10), std(0xd6451f), 0, 0.7, 0))
    g.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 10), basic(0xfff2a0), 0, 1.63, 0))
    g.add(mesh(new THREE.ConeGeometry(0.26, 0.3, 10), std(0xd6451f), 0, 1.9, 0))
    const beamGeo = new THREE.ConeGeometry(0.55, 2.6, 16, 1, true); beamGeo.rotateZ(Math.PI / 2); beamGeo.translate(1.3, 0, 0)
    const pivot = new THREE.Group(); pivot.position.y = 1.63
    pivot.add(new THREE.Mesh(beamGeo, basic(0xfff2a0, { transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })))
    g.add(pivot); spinners.push({ obj: pivot, axis: 'y', speed: 1.1 })
    reg('lighthouse', g)
  }
  // 돌하르방
  {
    const g = new THREE.Group(); g.position.set(3.0, G, 0.9); g.scale.setScalar(0.62)
    const stone = std(0x8c8a86)
    g.add(mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.95, 10), stone, 0, 0.48, 0))
    g.add(mesh(new THREE.SphereGeometry(0.34, 12, 10), stone, 0, 1.15, 0))
    g.add(mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 12), stone, 0, 1.36, 0))
    g.add(mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.36, 10), stone, 0, 1.55, 0))
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), stone, 0, 1.12, 0.33))
    ;[-0.13, 0.13].forEach(x => g.add(mesh(new THREE.SphereGeometry(0.04, 8, 6), basic(0x2a2a2a), x, 1.22, 0.31)))
    ;[-0.2, 0.2].forEach(x => g.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), stone, x, 0.78, 0.38)))
    reg('dol', g)
  }
  // 올레길
  {
    const pts = [[-6.4, 1.6], [-4.7, 1.3], [-3.0, 2.1], [-1.0, 1.5], [0.8, 2.0], [2.6, 2.3], [4.8, 1.3], [6.5, 0.4]].map(([x, z]) => new THREE.Vector3(x, 0.76, z))
    const curve = new THREE.CatmullRomCurve3(pts), g = new THREE.Group()
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.045, 6), basic(0xff8a1f)))
    for (let k = 0; k < 6; k++) {
      const p = curve.getPoint(0.08 + k * 0.17)
      g.add(mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), std(0x6b4a24), p.x, p.y + 0.15, p.z))
      g.add(mesh(new THREE.BoxGeometry(0.16, 0.07, 0.03), basic(k % 2 ? 0xff8a1f : 0x2f7fe0), p.x + 0.09, p.y + 0.27, p.z))
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.32, 5), basic(0xffffff, { transparent: true, opacity: 0, depthWrite: false }))) // 누르기 쉬운 넓은 투명 길
    reg('olle', g, mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), basic(0xffffff), 0.8, 0.76, 2.0))
  }
  // 항·포구
  {
    const root = new THREE.Group()
    ;[[-0.5, 4.95, 1.7], [4.6, 4.2, 1.3]].forEach(([x, z, len], k) => {
      const g = new THREE.Group(); g.position.set(x, 0, z)
      ;[-0.85, 0.85].forEach(dx => g.add(mesh(new THREE.BoxGeometry(0.22, 0.75, len), std(0xd8d8d8), dx, 0.1, len / 2)))
      g.add(mesh(new THREE.ConeGeometry(0.14, 0.34, 8), std(0xd6451f), 0.85, 0.65, len - 0.05))
      const boat = new THREE.Group(), hullC = k ? 0xe8517a : 0x3a7bd5
      boat.position.set(0, -0.3, len * 0.55)
      boat.add(mesh(new THREE.BoxGeometry(0.28, 0.16, 0.62), std(hullC), 0, 0.08, 0))
      const prow = mesh(new THREE.ConeGeometry(0.14, 0.24, 4), std(hullC), 0, 0.08, 0.42); prow.rotation.x = Math.PI / 2; boat.add(prow)
      boat.add(mesh(new THREE.BoxGeometry(0.2, 0.16, 0.2), std(0xffffff), 0, 0.24, -0.1))
      boat.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 5), std(0x6b4a24), 0, 0.4, 0.1))
      g.add(boat); bobbers.push({ obj: boat, y0: -0.3, ph: k * 2 }); root.add(g)
    })
    reg('harbor', root, root.children[0])
  }
  // 감귤밭
  {
    const g = new THREE.Group(); g.position.set(-3.9, G, 0.9)
    g.add(mesh(new THREE.BoxGeometry(2.1, 0.04, 1.4), std(0x5e9f4f), 0, 0.02, 0))
    const orange = new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.5 })
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const tree = new THREE.Group(); tree.position.set((c - 1.5) * 0.5, 0.04, (r - 1) * 0.45)
      tree.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6), std(0x6b4a24), 0, 0.1, 0))
      tree.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), std(0x3f9b46), 0, 0.34, 0))
      ;[[0.13, 0.4, 0.1], [-0.12, 0.3, 0.12], [0.02, 0.28, -0.17]].forEach(([x, y, z]) => tree.add(mesh(new THREE.SphereGeometry(0.055, 8, 6), orange, x, y, z)))
      g.add(tree)
    }
    g.add(hit(2.2, 0.7, 1.5, 0.3))
    reg('orchard', g)
  }
  // 폭포 3곳
  const waterfall = (id, x, z) => {
    const g = new THREE.Group(); g.position.set(x, G, z)
    g.add(mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), std(0x7b7468), 0, 0.55, 0))
    const water = mesh(new THREE.PlaneGeometry(0.28, 1.0), basic(0xa8e8ff, { transparent: true, opacity: 0.85, side: THREE.DoubleSide }), 0, 0.55, 0.26)
    shimmers.push(water); g.add(water)
    g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16), basic(0x4fc3e8), 0, 0.03, 0.7))
    reg(id, g)
  }
  waterfall('cheonjiyeon', 0.2, 2.7); waterfall('cheonjeyeon', -1.8, 1.7); waterfall('jeongbang', 1.7, 2.9)
  // 주상절리대
  {
    const g = new THREE.Group(); g.position.set(-3.2, G, 2.9)
    ;[[0, 0, 0.9], [0.3, 0.05, 0.6], [-0.3, 0.1, 0.75], [0.15, 0.32, 0.45], [-0.18, 0.34, 0.55], [0.5, -0.25, 0.4], [-0.5, -0.2, 0.35]].forEach(([x, z, h]) => g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, h, 6), std(0x6d6a66), x, h / 2, z)))
    reg('jusang', g)
  }
  // 산방산·용머리
  {
    const g = new THREE.Group(); g.position.set(-5.2, G, 2.4)
    const dome = mesh(new THREE.SphereGeometry(0.95, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x8a8f78)); dome.scale.y = 1.3; g.add(dome)
    const head = mesh(new THREE.SphereGeometry(0.6, 12, 8), std(0xb09a6a), 0.85, 0.05, 0.8); head.scale.set(1.5, 0.35, 0.7); g.add(head)
    reg('sanbang', g, dome)
  }
  // 감귤박물관
  {
    const g = new THREE.Group(); g.position.set(4.0, G, 1.9)
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), std(0xfff3dc), 0, 0.25, 0))
    const roof = mesh(new THREE.ConeGeometry(0.68, 0.36, 4), std(0xff8a1f), 0, 0.68, 0); roof.rotation.y = Math.PI / 4; g.add(roof)
    g.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.5 }), 0, 1.05, 0))
    g.add(mesh(new THREE.ConeGeometry(0.06, 0.1, 6), std(0x3f9b46), 0, 1.28, 0))
    reg('museum', g)
  }

  // 눌렀을 때 뜨는 이름표
  const info = makeLabel(4.4, 1.05); info.visible = false; scene.add(info)
  let infoTimer = 0
  const rootsAll = Object.values(places).map(p => p.root)
  function show(id) {
    const p = places[id]; if (!p) return
    info.userData.draw(p.meta.name, p.meta.desc)
    const box = new THREE.Box3().setFromObject(p.root)
    info.position.set((box.min.x + box.max.x) / 2, box.max.y + 0.9, (box.min.z + box.max.z) / 2); info.visible = true
    clearTimeout(infoTimer); infoTimer = setTimeout(() => { info.visible = false }, 5000)
    onInfo(p.meta)
  }

  // 카메라 / 조작
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = false; controls.enableDamping = true
  controls.minDistance = 5; controls.maxDistance = 26; controls.maxPolarAngle = Math.PI * 0.47
  const HOME = new THREE.Vector3(0, 1.2, 0.6)
  controls.target.copy(HOME)
  controls.autoRotateSpeed = 0.5
  let dist = 14, fly = null, idleTimer = 0
  controls.addEventListener('start', () => { controls.autoRotate = false; fly = null; clearTimeout(idleTimer) })
  controls.addEventListener('end', () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => { controls.autoRotate = true }, 6000) })
  function resize() {
    const w = el.clientWidth, h = el.clientHeight
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix()
    dist = 13 * Math.pow(1.35 / Math.min(1.35, w / h), 0.65) // 좁은 화면에서는 더 멀리
    const dir = camera.position.clone().sub(controls.target)
    if (dir.lengthSq() < 1e-3) dir.set(0, 0.55, 1)
    camera.position.copy(controls.target).add(dir.normalize().multiplyScalar(dist))
  }
  camera.position.set(0, 7, 13)
  new ResizeObserver(resize).observe(el); resize()

  // 누르기 (드래그는 클릭이 아님)
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2()
  let downAt = null
  const pick = e => {
    const b = renderer.domElement.getBoundingClientRect()
    pt.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
    ray.setFromCamera(pt, camera)
    return ray.intersectObjects(rootsAll, true).find(h => h.object.userData.place)?.object.userData.place
  }
  renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY] })
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return
    const id = pick(e)
    if (id) show(id); else info.visible = false
  })
  renderer.domElement.addEventListener('pointermove', e => { renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab' })

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  controls.autoRotate = !reduce
  let visible = true, raf = 0
  new IntersectionObserver(([e]) => { visible = e.isIntersecting }).observe(el)
  const clock = new THREE.Clock()
  const tmp = new THREE.Vector3()
  function frame() {
    raf = requestAnimationFrame(frame)
    if (!visible) return
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime
    if (!reduce) {
      const p = seaGeo.attributes.position
      for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(seaBase[i * 3] * 0.45 + t * 1.1) * 0.1 + Math.cos(seaBase[i * 3 + 2] * 0.6 + t * 0.8) * 0.08)
      p.needsUpdate = true; seaGeo.computeVertexNormals()
      spinners.forEach(s => { s.obj.rotation[s.axis] += s.speed * dt })
      bobbers.forEach(b => { b.obj.position.y = b.y0 + Math.sin(t * 1.4 + b.ph) * 0.05; b.obj.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.06 })
      shimmers.forEach((m, i) => { m.material.opacity = 0.65 + 0.25 * Math.sin(t * 5 + i) })
    }
    if (info.visible) info.quaternion.copy(camera.quaternion)
    if (fly) { // 선택한 곳으로 부드럽게 날아가기
      const k = 1 - Math.exp(-4 * dt)
      controls.target.lerp(fly.to, k)
      tmp.copy(camera.position).sub(controls.target)
      const d = tmp.length(), nd = d + (fly.dist - d) * k
      camera.position.copy(controls.target).add(tmp.normalize().multiplyScalar(nd))
      if (controls.target.distanceTo(fly.to) < 0.03 && Math.abs(nd - fly.dist) < 0.1) fly = null
    }
    controls.update(); renderer.render(scene, camera)
  }
  if (reduce) renderer.render(scene, camera)
  frame()

  return {
    focus(id) {
      const p = places[id]; if (!p) return
      const c = new THREE.Box3().setFromObject(p.focus).getCenter(new THREE.Vector3())
      fly = { to: c, dist: 8 }; controls.autoRotate = false; clearTimeout(idleTimer)
      idleTimer = setTimeout(() => { controls.autoRotate = !reduce }, 8000)
      show(id)
    },
    home() { fly = { to: HOME.clone(), dist }; info.visible = false; onInfo(null) },
    dispose() { cancelAnimationFrame(raf); clearTimeout(infoTimer); clearTimeout(idleTimer); renderer.dispose() },
  }
}
