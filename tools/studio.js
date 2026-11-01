// Rendus 3D procéduraux des visuels du site : /tools/studio.html?s=blob&w=900&h=1320
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const q = new URLSearchParams(location.search), W = +q.get('w'), H = +q.get('h'), S = q.get('s')
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
r.setSize(W, H); r.setPixelRatio(1); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05
const scene = new THREE.Scene()
scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.03).texture
const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); cam.position.set(0, 0, 8)
let seed = 7; const R = (a = 1, b) => { seed = (seed * 16807) % 2147483647; const v = (seed - 1) / 2147483646; return b === undefined ? v * a : a + v * (b - a) }
const Vec = (x, y, z) => new THREE.Vector3(x, y, z), C = (c) => new THREE.Color(c)
const grad = (stops, radial) => {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d')
  const g = radial ? x.createRadialGradient(256, 256, 0, 256, 256, 256) : x.createLinearGradient(0, 0, 512, 512)
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); x.fillStyle = g; x.fillRect(0, 0, 512, 512)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}
const key = (i, p, c = '#fff') => { const l = new THREE.DirectionalLight(c, i); l.position.copy(p); scene.add(l) }
const glass = (o = {}) => new THREE.MeshPhysicalMaterial({ color: '#fff', roughness: 0.04, transmission: 1, thickness: 0.5, ior: 1.42, attenuationColor: C('#cfd9ff'), attenuationDistance: 3, envMapIntensity: 1.4, ...o })
let post = null // profondeur de champ : { blur, mask(ctx) }

const scenes = {
  blob() {
    scene.background = grad(['#d3dadc', '#b4bfc3', '#a2adb2'])
    const m = new THREE.MeshPhysicalMaterial({ color: '#8299a3', roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.25, envMapIntensity: .62 })
    const mc = new MarchingCubes(110, m, false, false, 400000); mc.scale.setScalar(2.4); mc.isolation = 30; scene.add(mc)
    const path = new THREE.CatmullRomCurve3([Vec(.42, -.05, .5), Vec(.47, .16, .5), Vec(.52, .3, .5), Vec(.5, .44, .52), Vec(.62, .52, .5), Vec(.74, .68, .46), Vec(.66, .84, .5), Vec(.42, .88, .5), Vec(.26, .8, .55)])
    const pts = []
    for (let i = 0; i <= 150; i++) {
      const t = i / 150, p = path.getPoint(t)
      const bulge = Math.exp(-((t - .34) ** 2) / .014) * 1.25 + .45 * Math.exp(-((t - .72) ** 2) / .01), rad = .034 + .1 * bulge + .008 * Math.sin(t * 40)
      mc.addBall(p.x, p.y, p.z, 42 * rad * rad * .2, 12); pts.push([p, rad])
    }
    for (let i = 0; i < 60; i++) { const t = R(.22, .46), p = path.getPoint(t); mc.addBall(p.x + R(-.17, .17), p.y + R(-.13, .13), p.z + R(-.13, .13), R(.02, .07), 12) }
    mc.update()
    // bulles : microstructure accrochée à la surface + gouttes qui s'échappent
    const N = 2600, geo = new THREE.SphereGeometry(1, 14, 10)
    const bm = new THREE.MeshPhysicalMaterial({ roughness: .16, clearcoat: 1, envMapIntensity: 1.3 }), inst = new THREE.InstancedMesh(geo, bm, N), d = new THREE.Object3D()
    const toW = (p) => Vec((p.x - .5) * 4.8, (p.y - .5) * 4.8, (p.z - .5) * 4.8)
    for (let i = 0; i < N; i++) {
      const [p, rad] = pts[Math.floor(R(pts.length))], dir = Vec(R(-1, 1), R(-1, 1), R(.1, 1)).normalize(), wp = toW(p).add(dir.multiplyScalar(rad * 4.8 * R(.62, .86)))
      d.position.copy(wp); d.scale.setScalar(R(.014, .058) * (R() > .9 ? 2 : 1)); d.updateMatrix(); inst.setMatrixAt(i, d.matrix)
      inst.setColorAt(i, C().lerpColors(C('#4f9fc4'), C('#cfdde2'), R() ** 1.5))
    }
    scene.add(inst)
    const dm = glass({ thickness: .25, attenuationColor: C('#8cc8dc'), attenuationDistance: .5 })
    for (let i = 0; i < 44; i++) { const s = new THREE.Mesh(geo, dm), t = R(.55, 1), p = path.getPoint(t); s.position.copy(toW(p)).add(Vec(R(-.7, .7), R(-.5, .6), R(-.2, .5))); s.scale.setScalar(R(.03, .14)); scene.add(s) }
    key(1.15, Vec(2, 4, 5)); key(.6, Vec(-4, -1, 3), '#bfe6f5')
    cam.position.set(.15, .25, 8.2); cam.fov = 28; cam.updateProjectionMatrix()
    post = { blur: 7, mask: (x) => { const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#000'); g.addColorStop(.3, '#0009'); g.addColorStop(.5, 'transparent'); g.addColorStop(.72, 'transparent'); g.addColorStop(1, '#000'); return g } }
  },
  molecule() {
    scene.background = grad(['#dfe2e3', '#c5cacc', '#aeb4b7'])
    const m = new THREE.MeshPhysicalMaterial({ color: '#e7eaec', metalness: 1, roughness: .1, envMapIntensity: 1.5 }), g = new THREE.Group(); scene.add(g)
    const nodes = [[0, .1, 0, .62], [-1.05, .75, -.2, .46], [1.05, .85, .1, .5], [-.95, -.75, .2, .42], [1.15, -.62, -.1, .46], [.05, 1.42, -.4, .34], [.1, -1.25, .3, .32]]
    const hub = Vec(...nodes[0])
    nodes.forEach(([x, y, z, s], i) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(s, 64, 48), m); b.position.set(x, y, z); g.add(b)
      if (!i) return
      const p = Vec(x, y, z), len = p.distanceTo(hub), c = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, len, 24), m); c.position.copy(p).add(hub).multiplyScalar(.5); c.quaternion.setFromUnitVectors(Vec(0, 1, 0), p.clone().sub(hub).normalize()); g.add(c)
      for (const k of [.45, .62]) { const t = new THREE.Mesh(new THREE.TorusGeometry(.17, .045, 18, 48), m); t.position.copy(hub).lerp(p, k); t.quaternion.setFromUnitVectors(Vec(0, 0, 1), p.clone().sub(hub).normalize()); g.add(t) }
    })
    g.rotation.set(.35, -.5, .25); g.position.set(.72, .62, 0); key(2.4, Vec(3, 4, 6)); key(.6, Vec(-4, -2, 4), '#cfe3ff')
    cam.position.z = 9.2; post = { blur: 3, mask: (x) => { const g = x.createRadialGradient(W * .5, H * .42, H * .2, W * .5, H * .42, H * .65); g.addColorStop(0, 'transparent'); g.addColorStop(1, '#000'); return g } }
  },
  dish() {
    scene.background = grad(['#c6c2d3', '#aeaac2', '#a3a0bc'])
    const c = document.createElement('canvas'); c.width = c.height = 1024; const x = c.getContext('2d'); x.fillStyle = '#f6efe8'; x.fillRect(0, 0, 1024, 1024)
    for (const [px, py, rad, col] of [[300, 320, 420, '#ffd3c2'], [720, 280, 400, '#cfe6ff'], [760, 720, 420, '#ffc7d8'], [300, 760, 380, '#d8d2ff'], [512, 512, 300, '#fff4e2'], [520, 180, 240, '#baf2e6']]) { const g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, col); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, 1024, 1024) }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    const g = new THREE.Group(); scene.add(g)
    g.add(new THREE.Mesh(new THREE.CircleGeometry(1.75, 128), new THREE.MeshPhysicalMaterial({ map: t, roughness: .25, clearcoat: 1, envMapIntensity: .55 })))
    g.add(new THREE.Mesh(new THREE.TorusGeometry(1.76, .035, 24, 200), new THREE.MeshPhysicalMaterial({ color: '#fff', roughness: .1, clearcoat: 1 })))
    const cols = ['#3347b8', '#4c56cc', '#6a60d8', '#2c3cae', '#5365d8', '#8878e6']
    const add = (a, rad, s) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 48, 32), new THREE.MeshPhysicalMaterial({ color: cols[Math.floor(R(cols.length))], roughness: .22, clearcoat: 1, sheen: 1, sheenColor: C('#8f9cff'), envMapIntensity: .42 }))
      m.position.set(Math.cos(a) * rad, Math.sin(a) * rad, s * .55); g.add(m)
    }
    for (let i = 0; i < 40; i++) add(i / 40 * Math.PI * 2 + R(-.06, .06), R(1.38, 1.68), R(.06, .19))
    for (let i = 0; i < 26; i++) add(R(Math.PI * 2), R(.75, 1.32), R(.03, .085))
    g.rotation.set(-.32, .12, 0); key(2.2, Vec(-2, 3, 6)); key(.7, Vec(3, -2, 3), '#ffd9ec'); cam.position.z = 8.6
  },
  capsule() {
    scene.background = grad(['#f4f7fd', '#e3ebfa', '#ccd9f4'])
    const g = new THREE.Group(), glassM = glass({ thickness: 1.3, attenuationColor: C('#a6b6f4'), attenuationDistance: 3.2, envMapIntensity: 2.2 }); scene.add(g)
    g.add(new THREE.Mesh(new THREE.TorusGeometry(1.05, .24, 48, 160), glassM))
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.84, .84, .1, 96), glass({ thickness: .5, attenuationColor: C('#b9c2f8'), attenuationDistance: 2.2, envMapIntensity: 2 })); disc.rotation.x = Math.PI / 2; g.add(disc)
    const cm = new THREE.MeshPhysicalMaterial({ color: '#8c84e6', roughness: .35, clearcoat: 1 })
    for (let i = 0; i < 34; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(R(.02, .06), 20, 14), cm); const a = R(Math.PI * 2), d = R(.04, .3); s.position.set(Math.cos(a) * d, Math.sin(a) * d, .07); g.add(s) }
    const halo = new THREE.Mesh(new THREE.CircleGeometry(.42, 64), new THREE.MeshBasicMaterial({ map: grad(['#b9a9f8', '#c9c1ff99', '#ffffff00'], true), transparent: true })); halo.position.z = .03; g.add(halo)
    for (const [yo, l] of [[-.52, 2.6], [-1.02, 2.2]]) { const a = new THREE.Mesh(new RoundedBoxGeometry(l, .3, .22, 8, .1), glassM); a.position.set(l / 2 + .25, yo, -.05); a.rotation.z = -.5; g.add(a) }
    g.scale.setScalar(1.28); g.rotation.set(-.55, .55, .35); g.position.set(-.45, .3, 0); key(2, Vec(2, 5, 5)); key(1, Vec(-3, -2, 4), '#cbd6ff'); cam.position.z = 9
  },
  tray() {
    scene.background = grad(['#f6f8fe', '#eaf0fb', '#dbe4f8'])
    const g = new THREE.Group(); scene.add(g)
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: grad(['#c9efff', '#e3f4ffcc', '#ffffff00'], true), transparent: true, toneMapped: false })); glow.position.z = -.2; g.add(glow)
    const prof = [[0, 0], [.46, 0], [.54, .03], [.56, .25], [.5, .27], [.49, .07], [0, .05]].map(([a, b]) => new THREE.Vector2(a, b))
    const well = new THREE.LatheGeometry(prof, 64), gm = glass({ thickness: .8, attenuationColor: C('#b0a6f2'), attenuationDistance: 2.4, envMapIntensity: 1.9 })
    const liq = new THREE.MeshPhysicalMaterial({ color: '#b7adf6', roughness: .2, transparent: true, opacity: .7, clearcoat: 1 })
    const put = (x, y) => { const w = new THREE.Mesh(well, gm); w.rotation.x = Math.PI / 2; w.position.set(x, y, 0); g.add(w); const l = new THREE.Mesh(new THREE.CircleGeometry(.46, 48), liq); l.position.set(x, y, -.1); g.add(l) }
    const s = 1.5; for (let i = 0; i < 4; i++) { const k = -s + i * s * 2 / 3; put(k, s); put(k, -s); if (i && i < 3) { put(s, k); put(-s, k) } }
    g.rotation.set(-.42, .28, .12); key(2, Vec(1, 4, 6)); key(.8, Vec(-3, -3, 3), '#dcd6ff'); cam.position.z = 9.4
  },
  orb() {
    scene.background = grad(['#f7f8fc', '#e6ebf8', '#d7dff3'])
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.25, 96, 64), glass({ thickness: 1.2 })))
    const n = new THREE.Mesh(new THREE.SphereGeometry(.42, 64, 48), new THREE.MeshPhysicalMaterial({ color: '#a79cf0', roughness: .3, clearcoat: 1 })); n.position.set(.1, -.05, 0); scene.add(n)
    for (let i = 0; i < 18; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(R(.03, .1), 24, 16), new THREE.MeshPhysicalMaterial({ color: '#6d7be0', roughness: .3 })); const a = R(6.28), b = R(.5, 1); s.position.set(Math.cos(a) * b, Math.sin(a) * b, R(-.4, .4)); scene.add(s) }
    key(2, Vec(2, 4, 5)); cam.position.z = 6.4
  },
  silk() {
    scene.background = grad(['#f4f2fb', '#e6e0f8', '#d7cff4'])
    const geo = new THREE.PlaneGeometry(6, 6, 300, 300), p = geo.attributes.position
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, .42 * Math.sin(x * 1.8 + y * 2.6) + .18 * Math.sin(x * 4.4 - y * 2.2) + .07 * Math.sin((x + y) * 11)) }
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#a98ff0', roughness: .32, sheen: 1, sheenColor: C('#fff'), sheenRoughness: .3, clearcoat: .6, side: 2, transparent: true, opacity: .92 })); m.rotation.set(-.5, .3, .7); scene.add(m)
    key(2.2, Vec(3, 4, 4)); cam.position.z = 5.6
  },
}
scenes[S]()
r.render(scene, cam)
if (post) {
  const out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d')
  const b = document.createElement('canvas'); b.width = W; b.height = H; const y = b.getContext('2d')
  x.drawImage(r.domElement, 0, 0); y.filter = `blur(${post.blur * W / 500}px)`; y.drawImage(r.domElement, 0, 0); y.filter = 'none'
  y.globalCompositeOperation = 'destination-in'; y.fillStyle = post.mask(y); y.fillRect(0, 0, W, H); x.drawImage(b, 0, 0)
  window.__png = out.toDataURL('image/png')
} else window.__png = r.domElement.toDataURL('image/png')
window.__done = true
