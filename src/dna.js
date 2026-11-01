// Hélice d'ADN en particules : d'abord une ligne pâle, puis elle se densifie et se dissout vers le haut
import * as THREE from 'three'

const vert = /* glsl */`
attribute vec4 aRnd; attribute float aT; attribute float aKind;
uniform float uTime, uReveal, uPx;
varying vec4 vC;
vec3 pal(float t){
  vec3 a=vec3(.38,.10,.78), b=vec3(.66,.20,.78), c=vec3(.88,.62,.84), d=vec3(.42,.66,.98);
  float k=clamp((t-.2)/.58,0.,1.);
  return k<.34 ? mix(a,b,k/.34) : k<.66 ? mix(b,c,(k-.34)/.32) : mix(c,d,(k-.66)/.34);
}
void main(){
  vec3 p=position;
  float diss=smoothstep(.72,.18,aT);
  float breathe=sin(uTime*.35+aRnd.x*6.283)*.5+.5;
  vec3 dir=normalize(aRnd.xyz-.5+1e-3);
  p+=dir*(aKind>1.5 ? 16.*breathe*diss : 2.5*breathe*diss)*uReveal;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  float keep=aKind<1.5 ? .22 : .0;
  float a=smoothstep(aRnd.w-.08,aRnd.w+.08,uReveal*1.1+keep);
  float shade=aKind<.5 ? .72+.28*aRnd.x : 1.;
  vec3 col=mix(vec3(.74,.68,.90),pal(aT+(aRnd.y-.5)*.1)*shade,smoothstep(.15,.8,uReveal));
  if(aKind>1.5) col=mix(col,vec3(.93,.76,.93),aRnd.z*.55);
  float edge=smoothstep(0.,.05,aT)*smoothstep(1.,.93,aT);
  vC=vec4(col,a*edge*(aKind>1.5 ? .5+.4*aRnd.x : aKind>.5 ? .6 : .92));
  gl_PointSize=uPx*(aKind>1.5 ? .9+pow(aRnd.y,3.)*3.4 : aKind>.5 ? 1.05 : 1.5+aRnd.y*.9)*(1000./-mv.z);
}`
const frag = /* glsl */`
varying vec4 vC;
void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vC.rgb,vC.a*smoothstep(.5,.18,d)); }`

export function initDNA(canvas) {
  const mobile = innerWidth < 820, k = mobile ? .5 : 1
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 10, 4000); cam.position.z = 1000
  const nS = 44000 * k, nR = 15000 * k, nD = 40000 * k, N = nS + nR + nD
  const pos = new Float32Array(N * 3), rnd = new Float32Array(N * 4), ts = new Float32Array(N), kind = new Float32Array(N)
  const H = 640, Rad = 62, turns = 2.9, TAU = Math.PI * 2
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
  const helix = (t, side, out) => { const a = t * turns * TAU + side * Math.PI; out[0] = Math.cos(a) * Rad; out[1] = (.5 - t) * H; out[2] = Math.sin(a) * Rad; return a }
  const o = [0, 0, 0], o2 = [0, 0, 0]
  let i = 0
  const put = (x, y, z, t, kd) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; ts[i] = t; kind[i] = kd; rnd.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4); i++ }
  for (let n = 0; n < nS; n++) { // brins : rubans plats
    const t = Math.random(), side = n % 2; const a = helix(t, side, o), w = gauss() * 8.5, h = gauss() * 3.2
    put(o[0] + Math.cos(a) * h - Math.sin(a) * w * .35, o[1] + w * .55, o[2] + Math.sin(a) * h + Math.cos(a) * w * .35, t, 0)
  }
  const rungs = Math.floor(turns * 11)
  for (let n = 0; n < nR; n++) { // barreaux
    const t = (Math.floor(Math.random() * rungs) + .5) / rungs, s = Math.random(); helix(t, 0, o); helix(t, 1, o2)
    put(o[0] + (o2[0] - o[0]) * s + gauss() * 1.1, o[1] + gauss() * 1.6, o[2] + (o2[2] - o[2]) * s + gauss() * 1.1, t, 1)
  }
  for (let n = 0; n < nD; n++) { // poussière qui s'échappe, surtout vers le haut
    const t = Math.pow(Math.random(), 1.25), a = helix(t, n % 2, o), reach = Math.pow(Math.random(), 3.1) * (22 + 190 * Math.pow(1 - t, 1.4)), th = Math.random() * TAU, ph = Math.random() * Math.PI
    put(o[0] + reach * Math.sin(ph) * Math.cos(th) + 22 * (1 - t) * Math.random(), o[1] + reach * Math.cos(ph) * .8, o[2] + reach * Math.sin(ph) * Math.sin(th), t, 2)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4))
  g.setAttribute('aT', new THREE.BufferAttribute(ts, 1)); g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1))
  const u = { uTime: { value: 0 }, uReveal: { value: 0 }, uPx: { value: 1 } }
  const m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u, transparent: true, depthWrite: false })
  const pts = new THREE.Points(g, m); pts.frustumCulled = false
  const axis = new THREE.Group(); axis.add(pts); scene.add(axis); axis.rotation.z = .34

  let unit = 1, baseX = 0, baseY = 0, visible = true, raf = 0
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 10 // px par « px vidéo »
    r.setSize(w, h, false); cam.aspect = w / h; cam.fov = 2 * Math.atan((h / unit) / 2 / 1000) * 180 / Math.PI; cam.updateProjectionMatrix()
    u.uPx.value = unit * .55 * r.getPixelRatio()
    baseX = mobile ? w / unit * .16 : (w / unit) * (375 - 322) / 644
    baseY = (h / unit) / 2 - 190
    axis.position.set(baseX, baseY, 0)
  }
  size(); addEventListener('resize', size)
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop() }); io.observe(canvas)
  const t0 = performance.now()
  function loop() {
    raf = 0; if (!visible) return
    const s = scrollY, t = (performance.now() - t0) / 1000
    u.uTime.value = t; pts.rotation.y = t * .09 + s * .0011; axis.position.y = baseY + s * .05 / unit
    r.render(scene, cam); raf = requestAnimationFrame(loop)
  }
  loop()
  return u
}
