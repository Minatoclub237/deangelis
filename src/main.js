import '@fontsource-variable/inter-tight'
import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { initLock } from './lock.js'
import { LOGO_FULL, LOGO_SHORT } from './logo.js'

gsap.registerPlugin(ScrollTrigger)
document.querySelector('.logo').innerHTML = LOGO_FULL
document.querySelector('.cel-t').innerHTML = LOGO_SHORT
document.querySelector('.ft-logo').innerHTML = LOGO_SHORT
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)]
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const MOBILE = matchMedia('(max-width: 820px)').matches
const rem = (n) => n * parseFloat(getComputedStyle(document.documentElement).fontSize)

/* ---------- Scroll natif lissé ---------- */
const lenis = RM ? null : new Lenis({ lerp: .09 })
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)
}
const goTo = (el) => lenis ? lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView()
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return
  e.preventDefault(); const t = a.getAttribute('href').slice(1); if (t) goTo(document.getElementById(t)); closeMenu()
})

/* ---------- Rubans : défilent au temps, accélèrent au scroll ---------- */
const mqs = $$('.mq').map((el) => {
  const items = el.dataset.items.split('|'), alt = el.classList.contains('mq-alt')
  const group = (hidden) => `<div class="mq-g"${hidden ? ' aria-hidden="true"' : ''}>${items.map((w, i) => `<span${alt && i % 2 ? ' class="alt"' : ''}>${w}</span><svg class="mq-ic${alt && i % 2 ? ' alt' : ''}"><use href="#i-plus"/></svg><i class="mq-sl">/</i>`).join('')}</div>`
  el.innerHTML = `<div class="mq-t">${group()}${group(1)}</div>`
  return { t: $('.mq-t', el), el, x: -(+el.dataset.o || 0) * rem(.1), w: 0, on: true }
})
const measureMq = () => mqs.forEach((m) => {
  const t = m.t, base = $('.mq-g', t); while (t.children.length > 2) t.lastChild.remove()
  m.w = base.offsetWidth; const need = Math.ceil(innerWidth / m.w) + 1
  while (t.children.length < need + 1) t.append(base.cloneNode(true))
})
measureMq(); document.fonts?.ready.then(measureMq); addEventListener('resize', measureMq)
const mqIO = new IntersectionObserver((es) => es.forEach((e) => { const m = mqs.find((q) => q.el === e.target); if (m) m.on = e.isIntersecting }))
mqs.forEach((m) => mqIO.observe(m.el))
if (!RM) gsap.ticker.add((_, dt) => {
  const boost = Math.abs(lenis?.velocity || 0) * .3, base = dt * .054 * (innerWidth / 1000)
  mqs.forEach((m) => { if (!m.on || !m.w) return; m.x -= base + boost; if (-m.x >= m.w) m.x += m.w; m.t.style.transform = `translate3d(${m.x}px,0,0)` })
})

/* ---------- Texte « décodé » (chaque lettre = code + 1, comme dans la vidéo) ---------- */
const garble = (s) => [...s].map((c) => /\s/.test(c) ? c : String.fromCharCode(c.charCodeAt(0) + 1)).join('')
function scramble(el, d = .9) {
  const t = el.dataset.t, o = { p: 0 }
  gsap.to(o, { p: 1, duration: d, ease: 'none', onUpdate() { const n = Math.floor(o.p * t.length); el.textContent = t.slice(0, n) + garble(t.slice(n)) }, onComplete() { el.textContent = t } })
}
$$('.scr').forEach((el) => {
  el.dataset.t = el.textContent; el.setAttribute('aria-label', el.dataset.t)
  if (RM) return
  el.textContent = garble(el.dataset.t)
  if (!el.closest('.hero')) ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true, onEnter: () => scramble(el) })
})

/* ---------- Intro hero + mèche ---------- */
const lock = initLock($('#lock'))
if (RM) lock.uReveal.value = 1
else {
  gsap.to(lock.uReveal, { value: 1, duration: 2.1, ease: 'power1.inOut' })
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.logo path', { x: () => -rem(.5), autoAlpha: 0, stagger: .025, duration: .6 }, 0)
    .from('.nav-m, .nav-r', { autoAlpha: 0, duration: .7 }, .25)
    .from('.hero h1 .ln', { yPercent: 70, autoAlpha: 0, filter: 'blur(12px)', scaleX: 1.14, transformOrigin: '0 50%', stagger: .13, duration: .95 }, .05)
    .from('.hero-txt .p', { y: 16, autoAlpha: 0, filter: 'blur(7px)', duration: .8 }, .3)
    .from('.hero .btn-o', { autoAlpha: 0, filter: 'blur(6px)', duration: .7 }, .4)
    .from('.hero .btn-d', { autoAlpha: 0, x: () => rem(1.6), duration: .7 }, .55)
    .from('.hero-card', { yPercent: 75, autoAlpha: .15, duration: 1.05 }, .28)
    .call(() => scramble($('.hero .scr'), .8), null, .1)
}

/* ---------- Apparitions pilotées par le scroll (réversibles) ---------- */
const rv = (target, vars, st = {}) => gsap.from(target, { ease: 'none', stagger: .12, ...vars, scrollTrigger: { trigger: target, start: 'top 96%', end: 'top 56%', scrub: .6, invalidateOnRefresh: true, ...st } })
const blurIn = { yPercent: 75, autoAlpha: .05, filter: 'blur(14px)', scaleX: 1.12, transformOrigin: '0 50%' }

if (!RM) {
  $$('.rv').forEach((h) => rv($$('.ln', h), blurIn, { trigger: h }))

  // Mission : compteurs + orbites qui s'ouvrent
  ScrollTrigger.create({ trigger: '.stats', start: 'top 92%', once: true, onEnter() {
    $$('.cnt').forEach((c, i) => gsap.to({ v: 0 }, { v: +c.dataset.to, duration: 1.7 + i * .12, ease: 'power1.out', onUpdate() { c.textContent = this.targets()[0].v.toFixed(+c.dataset.d || 0).replace('.', ',') + (c.dataset.s || '') } }))
  } })
  const orb = gsap.timeline({ scrollTrigger: { trigger: '.mission', start: 'top 62%', end: 'top 12%', scrub: .7 } })
  orb.from('.orb-r', { rotation: -70, ease: 'none', duration: 1 }, 0).from('.o', { rotation: 70, ease: 'none', duration: 1 }, 0)
    .from('.c4', { scale: .15, transformOrigin: '50% 50%', autoAlpha: 0, ease: 'power1.out', duration: .5 }, 0)
    .from('.c3', { scale: .2, transformOrigin: '72% 18%', autoAlpha: 0, ease: 'power1.out', duration: .55 }, .1)
    .from('.c2', { scale: .2, transformOrigin: '76% 18%', autoAlpha: 0, ease: 'power1.out', duration: .6 }, .22)
    .from('.c1', { scale: .25, transformOrigin: '78% 22%', autoAlpha: 0, ease: 'power1.out', duration: .65 }, .35)
    .from('.o', { autoAlpha: 0, duration: .25, stagger: .12 }, .2)
  rv($$('.stats > div'), { yPercent: 28, autoAlpha: 0, filter: 'blur(8px)', stagger: .1 }, { trigger: '.stats', start: 'top 104%', end: 'top 62%' })

  // Portés par… : blocs qui montent, nets en arrivant, parallaxe interne
  rv('.d-tall', { y: () => rem(11), scale: .93, autoAlpha: .2, filter: 'blur(14px)' }, { start: 'top 118%', end: 'top 34%' })
  rv('.d-small', { y: () => rem(15), autoAlpha: .15, filter: 'blur(12px)' }, { start: 'top 125%', end: 'top 34%' })
  rv('.d-intro', { y: () => rem(5), autoAlpha: 0 }, { start: 'top 104%', end: 'top 60%' })
  rv($$('.d-list li'), { y: () => rem(4), autoAlpha: 0, stagger: .14 }, { trigger: '.d-list', start: 'top 104%', end: 'top 68%' })
  $$('.pxw').forEach((w) => gsap.fromTo(w, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: w.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }))

  // Services : chaque carte traverse le ruban en pivotant
  const sc = $$('.sc'), rots = [[-9, -2.5, 8], [-3, 5, 10], [1, 7, 13]], vh = () => innerHeight
  const stl = gsap.timeline({ scrollTrigger: { trigger: '.svc', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }, defaults: { ease: 'none' } })
  sc.forEach((c, i) => {
    const at = i * 1.32, [a, b, e] = rots[i]
    gsap.set(c, { y: () => vh() * 1.15, rotation: a })
    stl.fromTo(c, { y: () => vh() * 1.15, rotation: a, autoAlpha: 0 }, { y: () => rem(i ? .6 : 0), rotation: b, duration: 1, ease: 'power2.out' }, at)
      .to(c, { autoAlpha: 1, duration: .28 }, at)
      .to(c, { y: () => -vh() * 1.15, rotation: e, duration: 1, ease: 'power2.in' }, at + 1.32)
  })
  // Entrée de la 1re carte avant que le ruban se fixe
  gsap.from('.svc-st .mq', { autoAlpha: 0, scrollTrigger: { trigger: '.svc', start: 'top 92%', end: 'top 62%', scrub: true } })

  // Science
  rv('.sci-r', { autoAlpha: 0, filter: 'blur(8px)' }, { trigger: '.science' })
  rv('.science > .sci-nav', { autoAlpha: 0 }, { trigger: '.science', start: 'top 76%', end: 'top 40%' })
  rv($$('.steps li'), { autoAlpha: 0, y: () => rem(1.6), stagger: .08 }, { trigger: '.science', start: 'top 62%', end: 'top 6%' })

  // Avantages
  $$('.ad').forEach((c, i) => rv(c, { y: () => rem(9 + i * 6), autoAlpha: .05, filter: 'blur(10px)' }, { trigger: '.adv-g', start: 'top 112%', end: `top ${58 - i * 5}%` }))

  // Machine : le cadre s'ouvre, la carte de verre traverse l'image
  const mb = $('.mach-box'), gl = $('.m-gl')
  gsap.from(mb, { scale: .76, autoAlpha: .35, ease: 'none', scrollTrigger: { trigger: '.mach', start: 'top 92%', end: 'top 8%', scrub: .5 } })
  gsap.set('.m-bl h2 .ln, .m-ch .chip', { autoAlpha: 0 })
  const bpm = $('#bpm')
  const mtl = gsap.timeline({ scrollTrigger: { trigger: '.mach', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true, onUpdate(s) { bpm.textContent = (4 + Math.min(1, s.progress / .7) * .8).toFixed(1).replace('.', ',') } }, defaults: { ease: 'none' } })
  mtl.fromTo('.m-top', { autoAlpha: 0 }, { autoAlpha: 1, duration: .12 }, .05)
    .fromTo('.flare', { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1.1, duration: .3 }, .05).to('.flare', { autoAlpha: .15, scale: .8, duration: .35 }, .4)
    .fromTo(gl, { x: 0 }, { x: () => Math.max(0, mb.offsetWidth - gl.offsetWidth - rem(2.8)), duration: .55, ease: 'power1.inOut' }, .22)
    .fromTo('.m-ch .chip', { autoAlpha: 0, y: () => rem(.8) }, { autoAlpha: 1, y: 0, stagger: .04, duration: .12 }, .5)
    .fromTo('.m-bl h2 .ln', { autoAlpha: 0, yPercent: 60, filter: 'blur(10px)' }, { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', stagger: .06, duration: .16 }, .54)
    .to({}, { duration: .2 }, .8)

  // Instagram
  rv('.web-r', { autoAlpha: 0, y: () => rem(2.5), filter: 'blur(6px)' }, { trigger: '.web' })
  rv($$('.web-g article'), { autoAlpha: 0, y: () => rem(4.5), filter: 'blur(9px)', stagger: .12 }, { trigger: '.web-g', start: 'top 112%', end: 'top 74%' })

  // Équipe
  rv($$('.tm'), { autoAlpha: 0, y: () => rem(4), filter: 'blur(9px)', stagger: .08 }, { trigger: '.tm-g', start: 'top 112%', end: 'top 70%' })
}

/* ---------- Science : étapes ---------- */
const steps = $$('.steps li'); let sI = 0
const setStep = (i) => { sI = (i + steps.length) % steps.length; steps.forEach((s, k) => s.classList.toggle('on', k === sI)) }
steps.forEach((s, i) => { s.addEventListener('mouseenter', () => setStep(i)); s.addEventListener('click', () => setStep(i)) })
$('#sci-prev').onclick = () => setStep(sI - 1); $('#sci-next').onclick = () => setStep(sI + 1)

/* ---------- Équipe : photo + carte violette au survol ---------- */
const tms = $$('.tm'); let tI = -1
gsap.set('.tm-ph', { y: () => rem(5), rotation: 3 }); gsap.set('.tm-gl', { y: () => rem(8), rotation: -4 })
const tmAnim = (el, on) => {
  el.classList.toggle('is-on', on)
  gsap.to($('.tm-ph', el), { y: on ? 0 : rem(5), rotation: on ? -3 : 3, autoAlpha: on ? 1 : 0, duration: on ? .7 : .45, ease: 'power3.out', overwrite: true })
  gsap.to($('.tm-gl', el), { y: on ? 0 : rem(8), rotation: on ? 3 : -4, autoAlpha: on ? 1 : 0, duration: on ? .8 : .4, ease: 'power3.out', delay: on ? .05 : 0, overwrite: true })
  gsap.to($('.tm-b', el), { autoAlpha: on ? 0 : 1, duration: .3, overwrite: true })
}
const setTm = (i) => { if (i === tI) return; if (tI >= 0) tmAnim(tms[tI], false); tI = i; if (i >= 0) { tmAnim(tms[i], true); gsap.set(tms, { zIndex: 0 }); gsap.set(tms[i], { zIndex: 2 }) } }
tms.forEach((t, i) => { t.addEventListener('mouseenter', () => setTm(i)); t.addEventListener('focus', () => setTm(i)); t.addEventListener('click', () => setTm(i)) })
$('.tm-g').addEventListener('mouseleave', () => setTm(-1))
$('#tm-prev').onclick = () => setTm(((tI < 0 ? 0 : tI) - 1 + tms.length) % tms.length); $('#tm-next').onclick = () => setTm((tI + 1) % tms.length)

/* ---------- Histoire : roue des années, photos empilées ---------- */
const yrs = $$('.years span'), hTxt = $$('.his-t p'), hImg = $$('.his-im img')
const START = 2 // Ambiance
const renderYears = (p) => { // p = indice flottant de l'année courante
  const step = rem(MOBILE ? 2.5 : 1.95), gap = rem(MOBILE ? 3.6 : 2.9)
  yrs.forEach((y, i) => {
    const d = i - p, a = Math.min(Math.abs(d), 1), s = d < 0 ? -1 : 1
    const py = s * (a * gap + Math.max(Math.abs(d) - 1, 0) * step)
    y.style.transform = `translate3d(0,${py}px,0) scale(${1 - a * .74})`
    y.style.color = `rgb(${15 + a * 175},${15 + a * 175},${16 + a * 175})`
  })
}
renderYears(START)
gsap.set(hTxt.slice(1), { autoAlpha: 0 })
gsap.set(hImg.slice(1), { clipPath: 'inset(100% 0% 0% 0% round 1.8rem)', y: () => rem(4) })
if (!RM) {
  const yr = { p: START }
  const htl = gsap.timeline({ scrollTrigger: { trigger: '.his', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }, defaults: { ease: 'none' } })
  htl.to({}, { duration: .35 }, 0)
  ;[1, 2].forEach((n) => {
    const at = .35 + (n - 1) * 1.1
    htl.to(yr, { p: START + n, duration: .55, ease: 'power1.inOut', onUpdate: () => renderYears(yr.p) }, at)
      .to(hTxt[n - 1], { autoAlpha: 0, duration: .15 }, at).to(hTxt[n], { autoAlpha: 1, duration: .2 }, at + .3)
      .to(hImg[n - 1], { y: () => -rem(2.4), duration: .55 }, at)
      .to(hImg[n], { clipPath: 'inset(0% 0% 0% 0% round 1.8rem)', y: 0, duration: .55 }, at)
  })
  htl.to({}, { duration: .4 }, 2.2)
  gsap.from('.his-st .his-im, .his-pl', { y: () => rem(8), autoAlpha: 0, filter: 'blur(10px)', scrollTrigger: { trigger: '.his', start: 'top 74%', end: 'top 10%', scrub: .6 } })
  gsap.from('.years, .his-l, .his-q', { autoAlpha: 0, y: () => rem(4), scrollTrigger: { trigger: '.his', start: 'top 70%', end: 'top 12%', scrub: .6 } })
}

/* ---------- Cellules : boîte de Petri dessinée + vol au scroll ---------- */
;(() => {
  const c = $('#dish'), x = c.getContext('2d'), S = c.width, m = S / 2
  const g = x.createRadialGradient(m, m, m * .55, m, m, m); g.addColorStop(0, '#ffffff0d'); g.addColorStop(.8, '#ffffff26'); g.addColorStop(.95, '#ffffffb8'); g.addColorStop(1, '#ffffff00')
  x.fillStyle = g; x.beginPath(); x.arc(m, m, m * .98, 0, 7); x.fill()
  // Film de savon : reflets irisés sur le pourtour et fenêtre de lumière
  for (const [a0, a1, col] of [[.3, 1.5, '#f0c9a4cc'], [1.8, 3, '#9fd3dccc'], [3.4, 4.4, '#ffffffe6'], [4.8, 5.9, '#e8b98dcc']]) { x.strokeStyle = col; x.lineWidth = 5; x.beginPath(); x.arc(m, m, m * .92, a0, a1); x.stroke() }
  x.fillStyle = '#ffffffb3'; x.beginPath(); x.ellipse(m * .62, m * .52, m * .16, m * .07, -.7, 0, 7); x.fill()
  const box = $('.cel-box'), w = () => box.offsetWidth, h = () => box.offsetHeight
  // [x %, y %, échelle] sur quatre poses, relevées sur les images 27,6 s → 29,2 s de la vidéo
  const P = {
    '.b-cell': [[24, 2, 1], [48, -2, 1.05], [10, 3, 1.5], [62, 30, .9]],
    '.b-haze': [[34, 58, .9], [-16, 66, 1.2], [-14, 60, 1.5], [-22, 70, .9]],
    '.b-pink': [[58, 8, .55], [82, 8, .8], [86, 8, 1.15], [88, -2, .7]],
    '.b-line': [[48, 40, .8], [42, 22, 1.1], [52, 4, 1.25], [54, -6, 1.3]],
    '.b-dish': [[44, 18, 1.5], [7, 40, 1.05], [34, 12, .9], [37, 8, 1.35]],
    '.b-blue': [[30, 70, 1], [80, 12, 1.1], [24, 62, .8], [8, 26, 1.3]],
    '.b-vio': [[16, 18, 1], [50, 72, 1.25], [20, 34, 1.6], [66, 84, 1]],
    '.b-blue2': [[64, 78, 1.2], [58, 22, .8], [6, 18, 1.2], [84, 78, 1]],
    '.b-bigblue': [[72, 64, .85], [20, 86, .8], [20, 78, 1.3], [-4, 76, 1]],
  }
  const set = (el, v) => ({ x: () => v[0] / 100 * w(), y: () => v[1] / 100 * h(), scale: v[2] })
  Object.entries(P).forEach(([s, v]) => gsap.set(s, set(s, v[0])))
  gsap.set('.cel-t', { rotation: RM ? 0 : 20 })
  if (RM) return
  gsap.from(box, { scale: .62, y: () => rem(4), autoAlpha: .4, ease: 'none', scrollTrigger: { trigger: '.cel', start: 'top 95%', end: 'top 6%', scrub: .5 } })
  gsap.to('.cel-t', { rotation: 0, ease: 'power1.out', scrollTrigger: { trigger: '.cel', start: 'top 70%', end: 'top top', scrub: .5 } })
  const ctl = gsap.timeline({ scrollTrigger: { trigger: '.cel', start: 'top 40%', end: 'bottom top', scrub: .8, invalidateOnRefresh: true }, defaults: { ease: 'sine.inOut', duration: 1 } })
  Object.entries(P).forEach(([s, v]) => { for (let i = 1; i < 4; i++) ctl.to(s, set(s, v[i]), i - 1) })
})()

/* ---------- Contact ---------- */
const ctT = $('.ct-t'), letters = [...ctT.textContent]
ctT.innerHTML = letters.map((l) => `<span aria-hidden="true">${l}</span>`).join('')
if (!RM) {
  const sp = $$('span', ctT), n = sp.length
  gsap.from(sp, { autoAlpha: 0, filter: 'blur(9px)', x: (i) => (i - n * .3) * rem(.75), ease: 'none', stagger: .045, scrollTrigger: { trigger: '.contact', start: 'top 92%', end: 'top 42%', scrub: .6, invalidateOnRefresh: true } })
  gsap.from('.ct-c', { y: () => innerHeight * .68, rotation: -38, x: () => -rem(3), ease: 'power1.out', scrollTrigger: { trigger: '.contact', start: 'top 62%', end: 'top 16%', scrub: .6, invalidateOnRefresh: true } })
  gsap.from('.ct-f > *:not(.ct-m)', { autoAlpha: 0, scale: .72, filter: 'blur(7px)', ease: 'none', stagger: .05, scrollTrigger: { trigger: '.contact', start: 'top 42%', end: 'top 11%', scrub: .6 } })
}
const positionCard = () => { if (!MOBILE) ctT.parentElement.style.setProperty('--ct-top', `${ctT.offsetTop - rem(1)}px`) }
positionCard(); document.fonts?.ready.then(positionCard); addEventListener('resize', positionCard)
$('.ct-f').addEventListener('submit', (e) => {
  e.preventDefault(); const d = new FormData(e.target)
  const body = `${d.get('message') || ''}\n\n${d.get('nom') || ''}\n${d.get('email') || ''}`
  location.href = `mailto:deangeliscoiffure@gmail.com?subject=${encodeURIComponent(d.get('objet') || 'Demande de rendez-vous')}&body=${encodeURIComponent(body)}`
  $('.ct-m').textContent = 'Votre messagerie s\'ouvre avec votre message prêt à envoyer.'
})

/* ---------- Avis : les cartes montent, pivotent et se distribuent ---------- */
if (!RM && !MOBILE) {
  const tc = $$('.tc'), dx = () => rem(20.9), tRot = [[-16, -4.5], [11, 1.5], [-9, 4.5]]
  gsap.set('.ts-mq', { autoAlpha: 0 })
  const ttl = gsap.timeline({ scrollTrigger: { trigger: '.ts', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }, defaults: { ease: 'none' } })
  ttl.to('.ts-mq', { autoAlpha: 1, duration: .25 }, 0)
  tc.forEach((c, i) => {
    gsap.set(c, { y: () => innerHeight, rotation: tRot[i][0] })
    ttl.to(c, { y: () => rem(i === 1 ? -.8 : .4), rotation: i === 1 ? -2 : (i ? 5 : -6), duration: .8, ease: 'power2.out' }, .1 + i * .55)
    ttl.to(c, { x: () => (i - 1) * dx(), rotation: tRot[i][1], duration: .7, ease: 'power2.inOut' }, 1.75)
  })
  ttl.to('.tc-sign', { y: () => -rem(1), duration: .7 }, 1.75).to({}, { duration: .4 }, 2.45)
  rv('.ts-sc', { autoAlpha: 0, y: () => rem(2) }, { trigger: '.ts', start: 'top 70%', end: 'top 10%' })
}

ScrollTrigger.create({ trigger: '.ft', start: 'top 5%', end: 'bottom top', toggleClass: { targets: '.nav', className: 'on-dark' } })

/* ---------- Pied de page : le panneau s'ouvre, le logo s'écrit lettre par lettre ---------- */
if (!RM) {
  const box = $('.ft-box'), glyphs = $$('.ft-logo path')
  gsap.from(box, { scale: .84, y: () => rem(6), borderRadius: '6rem', ease: 'none', scrollTrigger: { trigger: '.ft', start: 'top 98%', end: 'top 18%', scrub: .5, invalidateOnRefresh: true } })
  rv($$('.ft-h .ln'), blurIn, { trigger: '.ft', start: 'top 62%', end: 'top 22%' })
  rv('.ft-cta', { autoAlpha: 0, x: () => rem(3) }, { trigger: '.ft', start: 'top 54%', end: 'top 18%' })
  rv($$('.ft-cols > div'), { autoAlpha: 0, y: () => rem(3), filter: 'blur(6px)', stagger: .08 }, { trigger: '.ft', start: 'top 46%', end: 'top 10%' })
  gsap.from(glyphs, { yPercent: 60, autoAlpha: 0, transformOrigin: '50% 100%', stagger: .03, ease: 'none', scrollTrigger: { trigger: '.ft', start: 'top 34%', end: () => `+=${Math.max(innerHeight * .24, ScrollTrigger.maxScroll(window) - $('.ft').offsetTop + innerHeight * .34 - 4)}`, scrub: .5, invalidateOnRefresh: true } })
}

/* ---------- Curseur point ---------- */
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !RM) {
  document.documentElement.classList.add('has-cursor')
  const cur = $('.cursor'), qx = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' })
  addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); gsap.set(cur, { opacity: 1 }) })
  document.addEventListener('pointerover', (e) => gsap.to(cur, { scale: e.target.closest('a,button,input,textarea,.tm,.steps li,.o') ? 1.5 : 1, duration: .25 }))
}

/* ---------- Menu + recherche ---------- */
const mBtn = $('.nav-m'), menu = $('#menu'), mq = $('#menu-q')
function closeMenu() { menu.hidden = true; mBtn.setAttribute('aria-expanded', 'false') }
const openMenu = (focus) => { menu.hidden = false; mBtn.setAttribute('aria-expanded', 'true'); gsap.from(menu, { y: -12, autoAlpha: 0, duration: .35, ease: 'power3.out', clearProps: 'all' }); if (focus) mq.focus() }
mBtn.onclick = () => menu.hidden ? openMenu() : closeMenu()
$('#b-search').onclick = () => menu.hidden ? openMenu(true) : mq.focus()
mq.oninput = () => $$('a', menu).forEach((a) => { a.hidden = !a.textContent.toLowerCase().includes(mq.value.trim().toLowerCase()) })
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu() })

/* ---------- Ambiance sonore (générée, aucun fichier) ---------- */
const sBtn = $('#b-sound'); let ac, master
sBtn.onclick = async () => {
  const on = sBtn.getAttribute('aria-pressed') !== 'true'
  if (!ac) {
    ac = new AudioContext(); master = ac.createGain(); master.gain.value = 0
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.connect(master); master.connect(ac.destination)
    ;[110, 164.8, 220.5].forEach((h) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = h; g.gain.value = .05; o.connect(g); g.connect(f); o.start() })
  }
  await ac.resume(); master.gain.linearRampToValueAtTime(on ? .5 : 0, ac.currentTime + .6)
  sBtn.setAttribute('aria-pressed', on)
}

addEventListener('load', () => ScrollTrigger.refresh())
document.fonts?.ready.then(() => ScrollTrigger.refresh())
