import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// 제주 3D 히어로: 일렁이는 바다 + 한라산/오름 + 둥둥 떠 있는 감귤들
export default function Hero3D() {
  const box = useRef(null)

  useEffect(() => {
    const el = box.current
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return // WebGL을 못 쓰면 CSS 배경만 보여 줌
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 2.2, 10)
    camera.lookAt(0, 0.4, 0)

    scene.add(new THREE.HemisphereLight(0xfff4dc, 0x2a8f94, 1.2))
    const sun = new THREE.DirectionalLight(0xfff0cc, 2.2)
    sun.position.set(5, 8, 6)
    scene.add(sun)

    // 바다
    const seaGeo = new THREE.PlaneGeometry(50, 24, 70, 34)
    seaGeo.rotateX(-Math.PI / 2)
    const base = seaGeo.attributes.position.array.slice()
    const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: 0x2bb3a6, roughness: 0.35, flatShading: true, transparent: true, opacity: 0.92 }))
    sea.position.set(0, -1.3, -2)
    scene.add(sea)

    // 한라산 + 오름
    const isle = new THREE.Group(); isle.position.set(0, -1.3, -6.5); scene.add(isle)
    const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, flatShading: true })
    const hall = new THREE.Mesh(new THREE.ConeGeometry(4.2, 3.2, 9), mat(0x5f9a62)); hall.position.y = 1.5; isle.add(hall)
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.7, 9), mat(0x9a8f7a)); cap.position.y = 3.0; isle.add(cap)
    ;[[-5.5, 0.55, 1.2], [5.2, 0.45, 1.0], [-2.6, 0.4, 1.8], [3, 0.38, 2.1]].forEach(([x, h, r]) => {
      const o = new THREE.Mesh(new THREE.ConeGeometry(r, h * 2, 8), mat(0x78b36b)); o.position.set(x, h * 0.75, 0.8); isle.add(o)
    })

    // 감귤
    const peel = new THREE.MeshStandardMaterial({ color: 0xff8a1f, roughness: 0.55 })
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3fa34d, roughness: 0.6, side: THREE.DoubleSide })
    function tangerine(size) {
      const g = new THREE.Group()
      const geo = new THREE.IcosahedronGeometry(1, 4)
      const p = geo.attributes.position, v = new THREE.Vector3()
      for (let i = 0; i < p.count; i++) { // 귤 껍질의 오돌토돌한 느낌
        v.fromBufferAttribute(p, i)
        const n = 1 + 0.022 * Math.sin(v.x * 18) * Math.sin(v.y * 18) * Math.sin(v.z * 18)
        v.multiplyScalar(n); v.y *= 0.88; p.setXYZ(i, v.x, v.y, v.z)
      }
      geo.computeVertexNormals()
      g.add(new THREE.Mesh(geo, peel))
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0x5a3b1a }))
      stem.position.y = 0.9; g.add(stem)
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), leafMat)
      leaf.scale.set(1, 0.08, 0.5); leaf.position.set(0.32, 0.93, 0); leaf.rotation.z = 0.25; g.add(leaf)
      g.scale.setScalar(size)
      return g
    }
    const narrow = innerWidth < 640
    let lookY = 0.9
    const spots = [[-4.6, 0.8, 0.5, 0.8], [-2.6, 1.5, -1, 0.55], [-1.2, 0.7, 2, 0.6], [1.4, 1.5, 0.5, 0.7], [3.1, 0.9, 1.4, 0.9], [4.8, 1.6, -0.8, 0.6], [0.2, 1.4, -2.5, 0.5]]
    const fruits = (narrow ? spots.slice(0, 5).map(([x, y, z, s]) => [x * 0.7, Math.min(y, 1.5) - 0.3, z, s * 0.9]) : spots).map(([x, y, z, s], i) => {
      const t = tangerine(s); t.position.set(x, y, z); t.userData = { y0: y, ph: i * 1.7, sp: 0.6 + (i % 3) * 0.25 }
      scene.add(t); return t
    })

    // 크기 / 마우스
    function resize() {
      const w = el.clientWidth, h = el.clientHeight
      renderer.setSize(w, h); camera.aspect = w / h
      camera.position.z = w / h < 1.2 ? 10 + (1.2 - w / h) * 9 : 10
      lookY = w / h < 1 ? 1.3 : 0.9; camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize); ro.observe(el); resize()
    let mx = 0
    const onMove = e => { mx = (e.clientX / innerWidth - 0.5) * 2 }
    addEventListener('pointermove', onMove)

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf, visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(el)
    const clock = new THREE.Clock()
    function frame() {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const t = clock.getElapsedTime()
      const pos = seaGeo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2]
        pos.setY(i, Math.sin(x * 0.5 + t * 1.2) * 0.12 + Math.cos(z * 0.7 + t * 0.9) * 0.1)
      }
      pos.needsUpdate = true; seaGeo.computeVertexNormals()
      fruits.forEach(f => {
        const d = f.userData
        f.position.y = d.y0 + Math.sin(t * d.sp + d.ph) * 0.25
        f.rotation.y = t * 0.4 * d.sp + d.ph; f.rotation.z = Math.sin(t * 0.5 + d.ph) * 0.12
      })
      camera.position.x += (mx * 1.2 - camera.position.x) * 0.04
      camera.lookAt(0, lookY, 0)
      renderer.render(scene, camera)
    }
    if (reduce) { renderer.render(scene, camera) } else frame()

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove)
      scene.traverse(o => { o.geometry?.dispose() })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [])

  return <div ref={box} className="hero3d" aria-hidden="true" />
}
