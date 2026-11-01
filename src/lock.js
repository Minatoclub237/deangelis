// Mèche torsadée en particules : d'abord quelques fibres pâles, puis la mèche se densifie et s'effile vers le haut
import * as THREE from 'three'

const vert = /* glsl */`
attribute vec4 aRnd; attribute float aT; attribute float aKind; attribute float aTone;
uniform float uTime, uReveal, uPx;
varying vec4 vC;
vec3 pal(float t, float tone){
  vec3 root=vec3(.17,.08,.05), mid=vec3(.50,.23,.09), cop=vec3(.76,.42,.17), tip=vec3(.93,.72,.42);
  float k=clamp((t-.14)/.7+(tone-.5)*.34,0.,1.);
  return k<.34 ? mix(root,mid,k/.34) : k<.68 ? mix(mid,cop,(k-.34)/.34) : mix(cop,tip,(k-.68)/.32);
}
void main(){
  vec3 p=position;
  float loose=smoothstep(.62,.08,aT)*.75+smoothstep(.8,1.,aT);
  float breathe=sin(uTime*.42+aT*7.+aRnd.x*2.)*.5+.5;
  vec3 dir=normalize(aRnd.xyz-.5+1e-3);
  p+=dir*(aKind>.5 ? 15.*breathe : 1.8*breathe*loose)*uReveal;
  p.x+=sin(uTime*.5+aT*9.)*2.2*uReveal;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  float keep=aKind<.5 ? .2 : 0.;
  float a=smoothstep(aRnd.w-.08,aRnd.w+.08,uReveal*1.1+keep);
  vec3 col=mix(vec3(.82,.72,.62),pal(aT,aTone),smoothstep(.15,.8,uReveal));
  float edge=smoothstep(0.,.05,aT)*smoothstep(1.,.92,aT);
  vC=vec4(col,a*edge*(aKind>.5 ? .38+.4*aRnd.x : .9));
  gl_PointSize=uPx*(aKind>.5 ? .8+pow(aRnd.y,3.)*1.5 : 1.15+aRnd.y*.65)*(1000./-mv.z);
}`
const frag = /* glsl */`
varying vec4 vC;
void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vC.rgb,vC.a*smoothstep(.5,.15,d)); }`

export function initLock(canvas) {
  const mobile = innerWidth < 820, k = mobile ? .5 : 1
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
  r.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 10, 4000); cam.position.z = 1000
  const fibres = 520 * k, perFibre = 190, nF = fibres * perFibre, nD = 26000 * k, N = nF + nD
  const pos = new Float32Array(N * 3), rnd = new Float32Array(N * 4), ts = new Float32Array(N), kind = new Float32Array(N), tone = new Float32Array(N)
  const H = 640, Rad = 58, turns = 2.7, TAU = Math.PI * 2
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
  let i = 0
  const put = (x, y, z, t, kd, tn) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; ts[i] = t; kind[i] = kd; tone[i] = tn; rnd.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4); i++ }
  // Deux torons enroulés : chaque fibre suit le toron avec un décalage propre, plus large au milieu, effilée aux pointes
  const strand = (t, side, ox, oz) => {
    const a = t * turns * TAU + side * Math.PI, taper = Math.pow(Math.sin(Math.PI * Math.min(1, t * .96 + .03)), .45)
    const wob = 1 + .18 * Math.sin(t * 22 + ox)
    return [Math.cos(a) * Rad * taper + (Math.cos(a) * oz - Math.sin(a) * ox) * taper * wob, (.5 - t) * H + ox * .55, Math.sin(a) * Rad * taper + (Math.sin(a) * oz + Math.cos(a) * ox) * taper * wob]
  }
  for (let f = 0; f < fibres; f++) {
    const side = f % 2, ox = gauss() * 20, oz = gauss() * 8, tn = Math.random(), t0 = Math.random() * .03, t1 = 1 - Math.random() * .08
    for (let n = 0; n < perFibre; n++) { const t = t0 + (t1 - t0) * (n / perFibre) + Math.random() * .002, [x, y, z] = strand(t, side, ox, oz); put(x, y, z, t, 0, tn) }
  }
  for (let n = 0; n < nD; n++) { // cheveux échappés, surtout vers le haut et aux pointes
    const t = Math.random() ** 1.3, side = n % 2, reach = Math.pow(Math.random(), 3) * (18 + 150 * Math.pow(1 - t, 1.5)), th = Math.random() * TAU
    const [x, y, z] = strand(t, side, gauss() * 22, gauss() * 8); put(x + Math.cos(th) * reach, y + Math.sin(th) * reach * .6, z + Math.sin(th * 2) * reach * .5, t, 1, Math.random())
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4))
  g.setAttribute('aT', new THREE.BufferAttribute(ts, 1)); g.setAttribute('aKind', new THREE.BufferAttribute(kind, 1)); g.setAttribute('aTone', new THREE.BufferAttribute(tone, 1))
  const u = { uTime: { value: 0 }, uReveal: { value: 0 }, uPx: { value: 1 } }
  const m = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u, transparent: true, depthWrite: false })
  const pts = new THREE.Points(g, m); pts.frustumCulled = false
  const axis = new THREE.Group(); axis.add(pts); scene.add(axis); axis.rotation.z = .34

  let unit = 1, baseX = 0, baseY = 0, visible = true, raf = 0
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight
    unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 10
    r.setSize(w, h, false); cam.aspect = w / h; cam.fov = 2 * Math.atan((h / unit) / 2 / 1000) * 180 / Math.PI; cam.updateProjectionMatrix()
    u.uPx.value = unit * .55 * r.getPixelRatio()
    baseX = mobile ? w / unit * .16 : (w / unit) * (375 - 322) / 644
    baseY = (h / unit) / 2 - 190
    axis.position.set(baseX, baseY, 0)
  }
  size(); addEventListener('resize', size)
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) loop() }).observe(canvas)
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
