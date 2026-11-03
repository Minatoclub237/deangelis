import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { LOGO_FULL, LOGO_SHORT } from './logo.js'
import { initBooking } from './booking.js'

gsap.registerPlugin(ScrollTrigger, SplitText)
document.querySelector('.logo').innerHTML = LOGO_FULL
document.querySelector('.cel-t').innerHTML = LOGO_SHORT
document.querySelector('.ft-logo').innerHTML = LOGO_SHORT
document.querySelector('.bk-logo').innerHTML = LOGO_SHORT
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)]
const EN = document.documentElement.lang === 'en'
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const MOBILE = matchMedia('(max-width: 820px)').matches
const rem = (n) => n * parseFloat(getComputedStyle(document.documentElement).fontSize)

/* ---------- Titres : les derniers mots (data-em) passent en accent, quelle que soit la langue ---------- */
$$('[data-em]').forEach((el) => {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let last, n
  while ((n = tw.nextNode())) if (n.textContent.trim()) last = n
  const words = last.textContent.trim().split(/\s+/), k = el.dataset.em === '*' ? words.length : +el.dataset.em
  const accent = document.createElement('em'); accent.textContent = words.slice(-k).join(' ')
  last.replaceWith(...(k < words.length ? [words.slice(0, -k).join(' ') + ' '] : []), accent)
})
const splitWords = (el) => SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'w' }).words

/* ---------- Scroll natif lissé ---------- */
const lenis = RM ? null : new Lenis({ lerp: .09 })
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0)
}
const goTo = (el) => lenis ? lenis.scrollTo(el, { duration: 1.4 }) : el.scrollIntoView()
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return
  e.preventDefault(); const t = a.getAttribute('href').slice(1)
  if (t === 'rendez-vous') openBooking(a.dataset.book); else if (t) goTo(document.getElementById(t))
  closeMenu()
})

/* ---------- Rubans : défilent au temps, accélèrent au scroll ---------- */
const mqs = $$('.mq').map((el) => {
  const items = el.dataset.items.split('|')
  const group = (hidden) => `<div class="mq-g"${hidden ? ' aria-hidden="true"' : ''}>${items.map((w, i) => `<span${i % 2 ? ' class="alt"' : ''}>${w}</span><svg class="mq-ic${i % 2 ? ' alt' : ''}"><use href="#i-plus"/></svg><i class="mq-sl">/</i>`).join('')}</div>`
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
let lastY = scrollY
if (!RM) gsap.ticker.add((_, dt) => {
  const y = scrollY, boost = Math.abs(y - lastY) * .3, base = dt * .054 * (innerWidth / 1000)
  lastY = y
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

/* ---------- Intro hero : démarre quand la page est prête, la vidéo ne tourne que si elle est visible ---------- */
const heroV = $('.hero-v')
const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
if (RM) { heroV.removeAttribute('autoplay'); heroV.pause() }
else {
  new IntersectionObserver(([e]) => { if (e.isIntersecting) heroV.play().catch(() => {}); else heroV.pause() }).observe(heroV)
  intro.from('.hero-m', { autoAlpha: 0, scale: 1.05, duration: 1.5 }, 0)
    .from('.logo path', { x: () => -rem(.5), autoAlpha: 0, stagger: .025, duration: .6 }, .1)
    .from('.nav-m, .nav-r', { autoAlpha: 0, duration: .7 }, .3)
    .from(splitWords('.hero h1'), { yPercent: 118, rotation: 6, transformOrigin: '0 100%', color: '#b8733f', stagger: .07, duration: 1.1, ease: 'power4.out' }, .15)
    .from('.hero-txt .p', { y: 16, autoAlpha: 0, duration: .8 }, .55)
    .from('.hero-cta > *', { y: 14, autoAlpha: 0, stagger: .09, duration: .7 }, .7)
    .from('.hero .btn-d', { autoAlpha: 0, x: () => rem(1.6), duration: .7 }, .85)
    .from('.hero-card', { yPercent: 75, autoAlpha: .15, duration: 1.05 }, .45)
    .call(() => scramble($('.hero .scr'), .8), null, .1)
  gsap.to('.hero-m', { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
}

/* ---------- Apparitions pilotées par le scroll (réversibles) ---------- */
const rv = (target, vars, st = {}) => gsap.from(target, { ease: 'none', stagger: .12, ...vars, scrollTrigger: { trigger: target, start: 'top 96%', end: 'top 56%', scrub: .6, invalidateOnRefresh: true, ...st } })
const wordIn = { yPercent: 118, rotation: 6, transformOrigin: '0 100%', color: '#b8733f', stagger: .07 }

if (!RM) {
  $$('.rv').forEach((h) => rv(splitWords(h), wordIn, { trigger: h, start: 'top 94%', end: 'top 58%' }))
  // Phrases : les mots se remplissent au fil du scroll
  const fill = (el, st) => gsap.from(SplitText.create(el, { type: 'words', wordsClass: 'w' }).words, { opacity: .14, stagger: .06, ease: 'none', scrollTrigger: { scrub: .6, ...st } })
  fill('.d-lead', { trigger: '.d-lead', start: 'top 96%', end: 'top 60%' })
  // Les cartes montent de loin sur ordinateur : leur position de départ fausserait un repère posé sur le titre
  $$('.ad h3').forEach((el) => fill(el, MOBILE ? { trigger: el, start: 'top 100%', end: 'top 60%' } : { trigger: '.adv-g', start: 'top 78%', end: 'top 38%' }))

  // Mission : compteurs + orbites qui s'ouvrent
  ScrollTrigger.create({ trigger: '.stats', start: 'top 92%', once: true, onEnter() {
    $$('.cnt').forEach((c, i) => gsap.to({ v: +c.dataset.from || 0 }, { v: +c.dataset.to, duration: 1.7 + i * .12, ease: 'power1.out', onUpdate() { c.textContent = this.targets()[0].v.toFixed(+c.dataset.d || 0).replace('.', EN ? '.' : ',') + (c.dataset.s || '') } }))
  } })
  rv($$('.stats > div'), { yPercent: 28, autoAlpha: 0, filter: 'blur(8px)', stagger: .1 }, { trigger: '.stats', start: 'top 104%', end: 'top 62%' })

  // Portés par… : blocs qui montent, nets en arrivant, parallaxe interne
  rv('.d-tall', { y: () => rem(11), scale: .93, autoAlpha: .2, filter: 'blur(14px)' }, { trigger: '.driven', start: 'top 100%', end: 'top 10%' })
  rv('.d-wide', { y: () => rem(15), autoAlpha: .15, filter: 'blur(12px)' }, { trigger: '.driven', start: 'top 96%', end: 'top 14%' })
  rv('.d-intro', { y: () => rem(5), autoAlpha: 0 }, { trigger: '.driven', start: 'top 84%', end: 'top 28%' })
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
  rv('.pr-g', { autoAlpha: 0, y: () => rem(3), filter: 'blur(8px)' }, { trigger: '.science', start: 'top 64%', end: 'top 14%' })
  rv($$('.steps li'), { autoAlpha: 0, y: () => rem(1.6), stagger: .08 }, { trigger: '.science', start: 'top 62%', end: 'top 6%' })

  // Avantages
  $$('.ad').forEach((c, i) => rv(c, { y: () => rem(9 + i * 6), autoAlpha: .05, filter: 'blur(10px)' }, { trigger: '.adv-g', start: 'top 112%', end: `top ${58 - i * 5}%` }))

  // Machine : le cadre s'ouvre, la carte de verre traverse l'image
  const mb = $('.mach-box'), gl = $('.m-gl')
  gsap.from(mb, { scale: .76, autoAlpha: .35, ease: 'none', scrollTrigger: { trigger: '.mach', start: 'top 92%', end: 'top 8%', scrub: .5 } })
  gsap.set('.m-bl h2 .ln, .m-ch .chip', { autoAlpha: 0 })
  const mtl = gsap.timeline({ scrollTrigger: { trigger: '.mach', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }, defaults: { ease: 'none' } })
  mtl.fromTo('.m-top', { autoAlpha: 0 }, { autoAlpha: 1, duration: .12 }, .05)
    .fromTo('.flare', { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1.1, duration: .3 }, .05).to('.flare', { autoAlpha: .15, scale: .8, duration: .35 }, .4)
    .fromTo(gl, { x: 0 }, { x: () => Math.max(0, mb.offsetWidth - gl.offsetWidth - rem(2.8)), duration: .55, ease: 'power1.inOut' }, .22)
    .fromTo('.m-ch .chip', { autoAlpha: 0, y: () => rem(.8) }, { autoAlpha: 1, y: 0, stagger: .04, duration: .12 }, .5)
    .fromTo('.m-bl h2 .ln', { autoAlpha: 0, yPercent: 60, filter: 'blur(10px)' }, { autoAlpha: 1, yPercent: 0, filter: 'blur(0px)', stagger: .06, duration: .16 }, .54)
    .to({}, { duration: .2 }, .8)

  // Galerie : les cartes montent puis la bande glisse avec le scroll
  rv($$('.gt'), { autoAlpha: 0, y: () => rem(7), filter: 'blur(10px)', stagger: .1 }, { trigger: '.gal-w', start: 'top 104%', end: 'top 58%' })
  { const t = $('.gal-t'); gsap.fromTo(t, { x: () => rem(4) }, { x: () => -(t.scrollWidth - innerWidth + rem(3)), ease: 'none', scrollTrigger: { trigger: '.gal-w', start: 'top bottom', end: 'bottom top', scrub: .7, invalidateOnRefresh: true } }) }

  // Nous trouver : la carte s'ouvre, les repères se posent
  gsap.from('.acc-map', { scale: .84, autoAlpha: .3, ease: 'none', scrollTrigger: { trigger: '.acc-wrap', start: 'top 100%', end: 'top 44%', scrub: .5 } })
  gsap.from('.acc-c', { x: () => rem(9), autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.acc-wrap', start: 'top 72%', end: 'top 34%', scrub: .5, invalidateOnRefresh: true } })
  gsap.from('.pin-s > *, .acc-rt, .pin-d > *', { scale: 0, autoAlpha: 0, ease: 'none', stagger: .2, scrollTrigger: { trigger: '.acc-wrap', start: 'top 60%', end: 'top 26%', scrub: .5 } })

  // Équipe
  rv($$('.tm'), { autoAlpha: 0, y: () => rem(4), filter: 'blur(9px)', stagger: .08 }, { trigger: '.tm-g', start: 'top 112%', end: 'top 70%' })
}

/* ---------- Tarifs : la frise choisit la catégorie ---------- */
const steps = $$('.steps li'); let sI = 0
const pts = $$('.pt'), phs = $$('.pr-ph img')
const setStep = (i) => { sI = (i + steps.length) % steps.length; [steps, pts, phs].forEach((l) => l.forEach((s, k) => s.classList.toggle('on', k === sI))); if (!RM) gsap.fromTo($$('.pt.on li'), { autoAlpha: 0, x: () => -rem(.8) }, { autoAlpha: 1, x: 0, stagger: .025, duration: .5, ease: 'power3.out', overwrite: true, clearProps: 'all' }) }
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
if (MOBILE && !RM) tms.forEach((t, i) => ScrollTrigger.create({ trigger: t, start: 'top 60%', end: 'bottom 30%', onToggle: (s) => { if (s.isActive) setTm(i); else if (tI === i) setTm(-1) } }))
$('#tm-prev').onclick = () => setTm(((tI < 0 ? 0 : tI) - 1 + tms.length) % tms.length); $('#tm-next').onclick = () => setTm((tI + 1) % tms.length)

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
const ctMix = gsap.utils.interpolate('#16303a', '#b8733f')
$$('span', ctT).forEach((s, i, a) => { s.style.color = ctMix(i / (a.length - 1)) })
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
  location.href = `mailto:deangeliscoiffure@gmail.com?subject=${encodeURIComponent(d.get('objet') || (EN ? 'Question from the website' : 'Question depuis le site'))}&body=${encodeURIComponent(body)}`
  $('.ct-m').textContent = EN ? 'Your email app opens with your message ready to send.' : 'Votre messagerie s\'ouvre avec votre message prêt à envoyer.'
})

/* ---------- Avis : les cartes montent, pivotent et se distribuent ---------- */
if (!RM) {
  // Sur téléphone, le paquet reste groupé : trois cartes ne tiennent pas côte à côte
  const tc = $$('.tc'), dx = () => rem(MOBILE ? 1 : 20.9), gap = MOBILE ? .85 : .55, fan = .65 + gap * 2, tRot = [[-16, -4.5], [11, 1.5], [-9, 4.5]]
  gsap.set('.ts-mq', { autoAlpha: 0 })
  const ttl = gsap.timeline({ scrollTrigger: { trigger: '.ts', start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true }, defaults: { ease: 'none' } })
  ttl.to('.ts-mq', { autoAlpha: 1, duration: .25 }, 0)
  tc.forEach((c, i) => {
    gsap.set(c, { y: () => innerHeight, rotation: tRot[i][0] })
    ttl.to(c, { y: () => rem(i === 1 ? -.8 : .4), rotation: i === 1 ? -2 : (i ? 5 : -6), duration: .8, ease: 'power2.out' }, .1 + i * gap)
    ttl.to(c, { x: () => (i - 1) * dx(), rotation: tRot[i][1], ...(MOBILE ? { y: () => -(2 - i) * rem(1.8) } : {}), duration: .7, ease: 'power2.inOut' }, fan)
  })
  if (!MOBILE) ttl.to('.tc-sign', { y: () => -rem(1), duration: .7 }, fan)
  ttl.to({}, { duration: .4 }, fan + .7)
  rv('.ts-sc', { autoAlpha: 0, y: () => rem(2) }, { trigger: '.ts', start: 'top 70%', end: 'top 10%' })
}

/* ---------- Mur d'avis : trois vitesses, en colonnes sur ordinateur, en bandes sur téléphone ---------- */
if (!RM) {
  $$('.tw-c').forEach((c, i) => {
    const d = [2.5, 8, 4.5][i], st = { start: 'top bottom', end: 'bottom top', scrub: .6, invalidateOnRefresh: true }
    if (MOBILE) {
      const left = () => -(c.scrollWidth - innerWidth + rem(1.6)), right = () => rem(1.6)
      gsap.fromTo(c, { x: i % 2 ? left : right }, { x: i % 2 ? right : left, ease: 'none', scrollTrigger: { trigger: c, ...st } })
    } else gsap.fromTo(c, { y: () => rem(d) }, { y: () => -rem(d), ease: 'none', scrollTrigger: { trigger: '.tw-g', ...st } })
    $$('.tq', c).forEach((q, k) => gsap.from(q, { autoAlpha: 0, rotation: (i + k) % 2 ? 3 : -3, scale: .94, ease: 'none', scrollTrigger: { trigger: q, start: 'top 98%', end: 'top 74%', scrub: .6 } }))
  })
}

ScrollTrigger.create({ trigger: '.ft', start: 'top 5%', end: 'bottom top', toggleClass: { targets: '.nav', className: 'on-dark' } })

/* ---------- Pied de page : le panneau s'ouvre, le logo s'écrit lettre par lettre ---------- */
if (!RM) {
  const box = $('.ft-box'), glyphs = $$('.ft-logo path')
  gsap.from(box, { scale: .84, y: () => rem(6), borderRadius: '6rem', ease: 'none', scrollTrigger: { trigger: '.ft', start: 'top 98%', end: 'top 18%', scrub: .5, invalidateOnRefresh: true } })
  rv(splitWords('.ft-h'), wordIn, { trigger: '.ft', start: 'top 62%', end: 'top 22%' })
  rv('.ft-cta', { autoAlpha: 0, x: () => rem(3) }, { trigger: '.ft', start: 'top 54%', end: 'top 18%' })
  rv($$('.ft-cols > div'), { autoAlpha: 0, y: () => rem(3), filter: 'blur(6px)', stagger: .08 }, { trigger: '.ft', start: 'top 46%', end: 'top 10%' })
  gsap.from(glyphs, { yPercent: 60, autoAlpha: 0, transformOrigin: '50% 100%', stagger: .03, ease: 'none', scrollTrigger: { trigger: '.ft', start: 'top 34%', end: () => `+=${Math.max(innerHeight * .24, ScrollTrigger.maxScroll(window) - $('.ft').offsetTop + innerHeight * .34 - 4)}`, scrub: .5, invalidateOnRefresh: true } })
}

/* ---------- Curseur point ---------- */
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !RM) {
  document.documentElement.classList.add('has-cursor')
  const cur = $('.cursor'), qx = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' }), qy = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' })
  addEventListener('pointermove', (e) => { qx(e.clientX); qy(e.clientY); gsap.set(cur, { opacity: 1 }) })
  document.addEventListener('pointerover', (e) => gsap.to(cur, { scale: e.target.closest('a,button,input,textarea,.tm,.steps li') ? 1.5 : 1, duration: .25 }))
}

/* ---------- Vidéos : chargées à l'approche, jouées seulement quand elles sont visibles ---------- */
if (!RM) {
  const vIO = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target
    if (e.isIntersecting) { if (!v.src) v.src = (MOBILE && v.dataset.srcM) || v.dataset.src; v.play().catch(() => {}) } else if (v.src) v.pause()
  }), { rootMargin: '25% 0px' })
  $$('.vid').forEach((v) => vIO.observe(v))
}

/* ---------- Menu ---------- */
const mBtn = $('.nav-m'), menu = $('#menu')
function closeMenu() { menu.hidden = true; mBtn.setAttribute('aria-expanded', 'false') }
mBtn.onclick = () => { if (!menu.hidden) return closeMenu(); menu.hidden = false; mBtn.setAttribute('aria-expanded', 'true'); gsap.from(menu, { y: -12, autoAlpha: 0, duration: .35, ease: 'power3.out', clearProps: 'all' }) }
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu() })

/* ---------- Fermetures annoncées : visibles 14 jours avant et pendant (à mettre à jour chaque année) ---------- */
const closures = [{ from: '2026-08-09', to: '2026-08-31', fr: 'Le salon est fermé du 9 au 31 août 2026.', en: 'The salon is closed from 9 to 31 August 2026.' }]
const now = Date.now(), closure = closures.find((c) => now >= new Date(c.from).getTime() - 14 * 864e5 && now <= new Date(c.to + 'T23:59:59').getTime())
if (closure) { const n = $('.notice'); $('span', n).textContent = closure[document.documentElement.lang]; n.hidden = false; $('button', n).onclick = () => { n.hidden = true } }

addEventListener('load', () => ScrollTrigger.refresh())
document.fonts?.ready.then(() => ScrollTrigger.refresh())

/* ---------- Rendez-vous ---------- */
const openBooking = initBooking({ EN, RM, lenis, closures })
if (location.hash === '#rendez-vous') openBooking()

/* ---------- La page n'apparaît qu'une fois prête : styles, polices et états de départ posés ---------- */
const fontsReady = Promise.all(["400 1em 'Inter Tight Variable'", "italic 400 1em 'Instrument Serif'"].map((f) => document.fonts.load(f)))
Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).catch(() => {}).then(() => {
  document.documentElement.classList.remove('wait'); ScrollTrigger.refresh(); intro.play()
})
