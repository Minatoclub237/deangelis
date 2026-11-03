// Captures en plein mouvement : les mêmes moments sur téléphone et sur ordinateur
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const out = process.env.OUT || '_raw/parity', url = process.env.U || '/'; mkdirSync(out, { recursive: true })
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const at = (sel, k) => { const t = document.querySelector(sel); return t.getBoundingClientRect().top + scrollY + (t.offsetHeight - innerHeight) * k }
const POINTS = [['fan1', '.ts', .22], ['fan2', '.ts', .5], ['fan3', '.ts', .98], ['wall', '.tw', .35], ['gal', '.gal-w', .5], ['team', '.tm-g', .1], ['acc', '.acc-wrap', .35], ['tarifs', '.science', 0], ['mission', '.mission', 0], ['lead', '.d-intro', 0], ['ft', '.ft', 1]]
for (const [w, h, tag] of [[390, 844, 'm'], [1440, 827, 'd']]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto('http://localhost:5980' + url, { waitUntil: 'networkidle2' }); await wait(2600)
  await p.screenshot({ path: `${out}/${tag}-hero.png` })
  console.log(tag, 'hero', await p.evaluate(() => { const v = document.querySelector('.hero-v'); return { src: v.currentSrc.split('/').pop(), play: !v.paused, t: +v.currentTime.toFixed(2), dur: +v.duration.toFixed(2), w: v.videoWidth, h: v.videoHeight, dropped: v.getVideoPlaybackQuality?.().droppedVideoFrames, total: v.getVideoPlaybackQuality?.().totalVideoFrames } }))
  for (const [n, sel, k] of POINTS) {
    const y = await p.evaluate(at, sel, k)
    // on approche par paliers, comme un doigt ou une molette : le scrub a le temps de suivre
    for (let s = 0; s < 6; s++) { await p.evaluate((v) => scrollTo(0, v), y - (5 - s) * 60); await wait(90) }
    await wait(1100); await p.screenshot({ path: `${out}/${tag}-${n}.png` })
  }
  console.log(tag, 'erreurs', errs.length ? errs : 0, '| débordement', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), '| hauteur en écrans', await p.evaluate(() => +(document.documentElement.scrollHeight / innerHeight).toFixed(1)))
  await p.close()
}
await b.close()
