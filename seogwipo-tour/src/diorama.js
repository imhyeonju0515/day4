import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// 서귀포 해안을 따라 서쪽 → 동쪽으로 놓은 관광지 위치 (x: 동쪽 +, z: 남쪽 +)
const POS = [[0.2, 2.7], [-1.8, 1.7], [1.7, 2.9], [-3.2, 2.9], [-5.2, 2.4], [4.0, 1.9]]
const MAX_H = 4
const FONT = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif'

function makeLabel(w, h) {
  const cv = document.createElement('canvas')
  cv.width = w * 128; cv.height = h * 128
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }))
  mesh.userData.draw = (name, value, hot) => {
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height)
    c.fillStyle = 'rgba(255,255,255,.93)'; c.beginPath(); c.roundRect(2, 2, cv.width - 4, cv.height - 4, cv.height * 0.3); c.fill()
    c.textAlign = 'center'; c.fillStyle = '#6b3a0a'
    let fs = cv.height * 0.34
    c.font = `bold ${fs}px ${FONT}`
    const tw = c.measureText(name).width, maxW = cv.width * 0.92
    if (tw > maxW) { fs *= maxW / tw; c.font = `bold ${fs}px ${FONT}` } // 이름이 길면 글자를 줄여 맞춤
    c.fillText(name, cv.width / 2, cv.height * 0.4)
    c.fillStyle = hot ? '#d6451f' : '#169c8e'
    let vs = cv.height * 0.3
    c.font = `bold ${vs}px ${FONT}`
    const vw = c.measureText(value).width
    if (vw > maxW) { vs *= maxW / vw; c.font = `bold ${vs}px ${FONT}` }
    c.fillText(value, cv.width / 2, cv.height * 0.78)
    tex.needsUpdate = true
  }
  return mesh
}

// 한적(청록) → 보통(주황) → 붐빔(빨강)
function heat(r) { return new THREE.Color().setHSL(0.48 - 0.48 * Math.min(1, Math.max(0, r)), 0.78, 0.52) }

export function createDiorama(el, { names, onPick }) {
  let renderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { el.innerHTML = '<p class="no3d">이 브라우저에서는 3D를 쓸 수 없어요. 아래 차트를 봐 주세요 📈</p>'; return null }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x2a8f94, 1.15))
  const sun = new THREE.DirectionalLight(0xfff0cc, 2.1); sun.position.set(6, 10, 8); scene.add(sun)

  // 바다
  const seaGeo = new THREE.PlaneGeometry(60, 40, 60, 36); seaGeo.rotateX(-Math.PI / 2)
  const seaBase = seaGeo.attributes.position.array.slice()
  const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x2bb3a6, roughness: 0.35, flatShading: true, transparent: true, opacity: 0.94 }))
  sea.position.y = -0.45; scene.add(sea)

  // 섬 (모래 둘레 + 초록 들판) + 한라산 + 오름
  const isle = new THREE.Group(); scene.add(isle)
  const std = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.5, 0.9, 40), std(0xe9dba9)); sand.scale.set(1.15, 1, 0.78); isle.add(sand)
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.8, 0.4, 40), std(0x73b366)); grass.scale.set(1.15, 1, 0.78); grass.position.y = 0.5; isle.add(grass)
  const hall = new THREE.Mesh(new THREE.ConeGeometry(3.3, 3.4, 10), std(0x5f9a62)); hall.position.set(0, 2.3, -1.2); isle.add(hall)
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.7, 10), std(0x9a8f7a)); cap.position.set(0, 3.7, -1.2); isle.add(cap)
  ;[[-5.5, -0.5, 1.0, 0.8], [5.4, -0.2, 1.1, 0.9], [-2.8, -2.2, 0.9, 0.7], [3.2, -2.4, 1.0, 0.8]].forEach(([x, z, r, h]) => {
    const o = new THREE.Mesh(new THREE.ConeGeometry(r, h * 2, 8), std(0x80bb70)); o.position.set(x, 0.55 + h * 0.5, z); isle.add(o)
  })

  // ── 제주 랜드마크: 풍력발전기·등대·돌하르방·올레길·항·포구·감귤밭 (눌러 보면 이름이 나와요)
  const landmarks = [], spinners = [], bobbers = []
  const lm = (obj, name, desc) => { obj.traverse(o => { if (o.isMesh) o.userData.lm = { name, desc, root: obj } }); landmarks.push(obj); scene.add(obj); return obj }
  const hit = (w, h, d) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))

  // 풍력발전기: 날개가 바람에 빙글빙글
  ;[[-6.9, -1.7, 1], [-6.0, -2.7, 0.85], [-7.0, -0.5, 0.8]].forEach(([x, z, s], k) => {
    const g = new THREE.Group(); g.position.set(x, 0.7, z); g.scale.setScalar(s)
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 2.2, 8), std(0xf4f4f4)); tower.position.y = 1.1; g.add(tower)
    const rotor = new THREE.Group(); rotor.position.set(0, 2.25, 0.14); g.add(rotor)
    rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), std(0xffffff)))
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.95, 0.02), std(0xffffff)); blade.geometry.translate(0, 0.5, 0)
      const arm = new THREE.Group(); arm.rotation.z = (i * Math.PI * 2) / 3; arm.add(blade); rotor.add(arm)
    }
    spinners.push({ obj: rotor, axis: 'z', speed: 1.4 + k * 0.4 })
    lm(g, '풍력발전기', '바람의 섬, 바람으로 전기를 만들어요')
  })

  // 등대: 빙글 도는 불빛
  {
    const g = new THREE.Group(); g.position.set(7.2, 0.7, 0.8)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.5, 10), std(0xffffff)); body.position.y = 0.75; g.add(body)
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 0.22, 10), std(0xd6451f)); band.position.y = 0.7; g.add(band)
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 10), new THREE.MeshBasicMaterial({ color: 0xfff2a0 })); lamp.position.y = 1.63; g.add(lamp)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.3, 10), std(0xd6451f)); roof.position.y = 1.9; g.add(roof)
    const beamGeo = new THREE.ConeGeometry(0.55, 2.6, 16, 1, true); beamGeo.rotateZ(Math.PI / 2); beamGeo.translate(1.3, 0, 0)
    const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }))
    const pivot = new THREE.Group(); pivot.position.y = 1.63; pivot.add(beam); g.add(pivot)
    spinners.push({ obj: pivot, axis: 'y', speed: 1.1 })
    lm(g, '등대', '밤바다를 지켜 주는 불빛이에요')
  }

  // 돌하르방
  {
    const g = new THREE.Group(); g.position.set(3.0, 0.7, 0.9); g.scale.setScalar(0.62)
    const stone = std(0x8c8a86)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.95, 10), stone); body.position.y = 0.48; g.add(body)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), stone); head.position.y = 1.15; g.add(head)
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 12), stone); brim.position.y = 1.36; g.add(brim)
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.36, 10), stone); hat.position.y = 1.55; g.add(hat)
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.1), stone); nose.position.set(0, 1.12, 0.33); g.add(nose)
    ;[-0.13, 0.13].forEach(x => { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2a2a2a })); eye.position.set(x, 1.22, 0.31); g.add(eye) })
    ;[-0.2, 0.2].forEach(x => { const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), stone); hand.position.set(x, 0.78, 0.38); g.add(hand) })
    lm(g, '돌하르방', '제주를 지켜 주는 돌할아버지예요')
  }

  // 올레길: 바닷가를 따라 걷는 길 (파랑·주황 리본)
  {
    const pts = [[-6.4, 1.6], [-4.7, 1.3], [-3.0, 2.1], [-1.0, 1.5], [0.8, 2.0], [2.6, 2.3], [4.8, 1.3], [6.5, 0.4]].map(([x, z]) => new THREE.Vector3(x, 0.76, z))
    const curve = new THREE.CatmullRomCurve3(pts)
    const g = new THREE.Group()
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.045, 6), new THREE.MeshBasicMaterial({ color: 0xff8a1f })))
    for (let k = 0; k < 6; k++) {
      const p = curve.getPoint(0.08 + k * 0.17)
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), std(0x6b4a24)); post.position.set(p.x, p.y + 0.15, p.z); g.add(post)
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.03), new THREE.MeshBasicMaterial({ color: k % 2 ? 0xff8a1f : 0x2f7fe0 })); ribbon.position.set(p.x + 0.09, p.y + 0.27, p.z); g.add(ribbon)
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.32, 5), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))) // 누르기 쉽게 넓은 투명 길
    lm(g, '제주 올레길', '파랑·주황 리본을 따라 걷는 길이에요')
  }

  // 항·포구: 방파제와 둥실둥실 고깃배
  ;[[-0.5, 4.95, 1.7, '서귀포항', '배들이 드나드는 항구예요'], [4.6, 4.2, 1.3, '남원포구', '작은 배들이 쉬는 포구예요']].forEach(([x, z, len, name, desc], k) => {
    const g = new THREE.Group(); g.position.set(x, 0, z)
    const wall = std(0xd8d8d8)
    ;[-0.85, 0.85].forEach(dx => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, len), wall); arm.position.set(dx, 0.1, len / 2); g.add(arm) })
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 8), std(0xd6451f)); tip.position.set(0.85, 0.65, len - 0.05); g.add(tip)
    const boat = new THREE.Group(); boat.position.set(0, -0.3, len * 0.55)
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.62), std(k ? 0xe8517a : 0x3a7bd5)); hull.position.y = 0.08; boat.add(hull)
    const prow = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 4), std(k ? 0xe8517a : 0x3a7bd5)); prow.rotation.x = Math.PI / 2; prow.position.set(0, 0.08, 0.42); boat.add(prow)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.2), std(0xffffff)); cabin.position.set(0, 0.24, -0.1); boat.add(cabin)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 5), std(0x6b4a24)); mast.position.set(0, 0.4, 0.1); boat.add(mast)
    g.add(boat); bobbers.push({ obj: boat, y0: -0.3, ph: k * 2 })
    lm(g, name, desc)
  })

  // 감귤밭: 주렁주렁 열린 귤나무
  {
    const g = new THREE.Group(); g.position.set(-3.9, 0.7, 0.9)
    const patch = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 1.4), std(0x5e9f4f)); patch.position.y = 0.02; g.add(patch)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const tree = new THREE.Group(); tree.position.set((c - 1.5) * 0.5, 0.04, (r - 1) * 0.45)
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6), std(0x6b4a24)); trunk.position.y = 0.1; tree.add(trunk)
      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), std(0x3f9b46)); crown.position.y = 0.34; tree.add(crown)
      ;[[0.13, 0.4, 0.1], [-0.12, 0.3, 0.12], [0.02, 0.28, -0.17]].forEach(([x, y, z]) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.5 })); f.position.set(x, y, z); tree.add(f) })
      g.add(tree)
    }
    const h = hit(2.2, 0.7, 1.5); h.position.y = 0.3; g.add(h)
    lm(g, '감귤밭', '제주 감귤이 주렁주렁 열려요')
  }

  // 눌렀을 때 나오는 이름표
  const info = makeLabel(4, 1.05); info.visible = false; info.renderOrder = 10; info.material.depthTest = false; scene.add(info) // 다른 이름표 위에 보이게
  let infoTimer = 0
  const showInfo = (l) => {
    info.userData.draw(l.name, l.desc, false)
    const box = new THREE.Box3().setFromObject(l.root); const top = box.getCenter(new THREE.Vector3()); top.y = box.max.y + 0.8
    info.position.copy(top); info.visible = true
    clearTimeout(infoTimer); infoTimer = setTimeout(() => { info.visible = false }, 4500)
  }

  // 관광지 기둥 + 이름표
  const pillars = POS.map(([x, z], i) => {
    const geo = new THREE.BoxGeometry(0.8, 1, 0.8); geo.translate(0, 0.5, 0)
    const mat = new THREE.MeshStandardMaterial({ color: 0x2bb3a6, roughness: 0.4, emissive: 0x2bb3a6, emissiveIntensity: 0.25 })
    const m = new THREE.Mesh(geo, mat); m.position.set(x, 0.7, z); m.scale.y = 0.05; m.userData.i = i
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }))
    const label = makeLabel(3, 0.95); label.userData.draw(names[i], '–', false)
    scene.add(m, cap, label)
    return { mesh: m, cap, label, h: 0.05, target: 0.05, mat }
  })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.07, 8, 32), new THREE.MeshBasicMaterial({ color: 0xff8a1f }))
  ring.rotation.x = Math.PI / 2; ring.visible = false; scene.add(ring)

  // 카메라 / 조작
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enablePan = false; controls.enableDamping = true
  controls.minDistance = 8; controls.maxDistance = 26; controls.maxPolarAngle = Math.PI * 0.47
  controls.target.set(0, 1.2, 0.6)
  let dist = 14
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

  // 기둥 누르기
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2()
  let downAt = null
  const pick = e => {
    const b = renderer.domElement.getBoundingClientRect()
    pt.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1)
    ray.setFromCamera(pt, camera)
    const p = ray.intersectObjects(pillars.map(p => p.mesh))[0]
    const l = ray.intersectObjects(landmarks, true).find(h => h.object.userData.lm)
    if (p && (!l || p.distance <= l.distance)) return { pillar: p.object.userData.i }
    return l ? { lm: l.object.userData.lm } : null
  }
  renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY] })
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return // 드래그는 클릭이 아님
    const r = pick(e)
    if (r?.pillar !== undefined) onPick(r.pillar)
    else if (r?.lm) showInfo(r.lm)
    else info.visible = false
  })
  renderer.domElement.addEventListener('pointermove', e => { renderer.domElement.style.cursor = pick(e) ? 'pointer' : 'grab' })

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let visible = true, raf = 0, selected = -1
  new IntersectionObserver(([e]) => { visible = e.isIntersecting }).observe(el)
  const clock = new THREE.Clock()
  function frame() {
    raf = requestAnimationFrame(frame)
    if (!visible) return
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime
    if (!reduce) {
      const p = seaGeo.attributes.position
      for (let i = 0; i < p.count; i++) p.setY(i, Math.sin(seaBase[i * 3] * 0.45 + t * 1.1) * 0.1 + Math.cos(seaBase[i * 3 + 2] * 0.6 + t * 0.8) * 0.08)
      p.needsUpdate = true; seaGeo.computeVertexNormals()
    }
    if (!reduce) {
      spinners.forEach(s => { s.obj.rotation[s.axis] += s.speed * dt })
      bobbers.forEach(b => { b.obj.position.y = b.y0 + Math.sin(t * 1.4 + b.ph) * 0.05; b.obj.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.06 })
    }
    if (info.visible) info.quaternion.copy(camera.quaternion)
    pillars.forEach((p, i) => {
      p.h += (p.target - p.h) * (1 - Math.exp(-7 * dt))
      p.mesh.scale.y = Math.max(p.h, 0.05)
      p.cap.position.set(p.mesh.position.x, 0.7 + p.h + 0.3, p.mesh.position.z)
      p.label.position.set(p.mesh.position.x, 0.7 + p.h + 1.05, p.mesh.position.z)
      p.label.quaternion.copy(camera.quaternion)
    })
    if (selected >= 0) { ring.visible = true; ring.position.set(pillars[selected].mesh.position.x, 0.72 + Math.sin(t * 3) * 0.05, pillars[selected].mesh.position.z) } else ring.visible = false
    controls.update(); renderer.render(scene, camera)
  }
  if (reduce) { renderer.render(scene, camera) }
  frame()

  return {
    // values: 관광지별 관람객 수 (null 가능), max: 전체 기간 최대값(높이 기준)
    setValues(values, max) {
      const top = Math.max(...values.map(v => v ?? -1))
      values.forEach((v, i) => {
        const r = v == null ? 0 : v / max
        pillars[i].target = v == null ? 0.05 : Math.max(0.12, r * MAX_H)
        const c = heat(r); pillars[i].mat.color.copy(c); pillars[i].mat.emissive.copy(c)
        pillars[i].label.userData.draw(names[i], v == null ? '미집계' : v.toLocaleString('ko-KR') + '명', v != null && v === top)
      })
    },
    select(i) { selected = i },
    dispose() { cancelAnimationFrame(raf); renderer.dispose() },
  }
}
