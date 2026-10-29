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
    c.fillStyle = hot ? '#d6451f' : '#169c8e'; c.font = `bold ${cv.height * 0.3}px ${FONT}`
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
    return ray.intersectObjects(pillars.map(p => p.mesh))[0]?.object.userData.i
  }
  renderer.domElement.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY] })
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return // 드래그는 클릭이 아님
    const i = pick(e); if (i !== undefined) onPick(i)
  })
  renderer.domElement.addEventListener('pointermove', e => { renderer.domElement.style.cursor = pick(e) !== undefined ? 'pointer' : 'grab' })

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
