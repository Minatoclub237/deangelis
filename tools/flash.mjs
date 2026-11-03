// Rechargement image par image : rien ne doit s'afficher avant que styles, polices et états de départ soient prêts
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const url = process.env.U || 'http://localhost:5980/', out = process.env.OUT || '_raw/flash', mobile = process.env.M === '1'
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true })
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const p = await b.newPage(); await p.setViewport(mobile ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1440, height: 827 })
await p.goto(url, { waitUntil: 'load' }) // 1er passage : cache rempli, comme un vrai rechargement
await new Promise((r) => setTimeout(r, 800))
await p.evaluateOnNewDocument(() => {
  window.__log = []
  const tick = () => {
    const h = document.documentElement, body = document.body
    if (body) {
      const visible = getComputedStyle(body).opacity === '1', h1 = document.querySelector('.hero h1'), word = h1 && h1.querySelector('.w'), hero = document.querySelector('.hero')
      if (visible && !window.__first) window.__first = { t: Math.round(performance.now()), styles: hero && getComputedStyle(hero).position === 'relative', police: document.fonts.check("400 16px 'Inter Tight Variable'"), accent: document.fonts.check("italic 400 16px 'Instrument Serif'"), motsSepares: !!word, departPose: word && getComputedStyle(word).transform !== 'none' }
      window.__seen = (window.__seen || 0) + (visible ? 0 : 1)
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})
const cdp = await p.createCDPSession(); const frames = []; let n = 0
cdp.on('Page.screencastFrame', (f) => { frames.push(f.data); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); n++ })
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, maxWidth: mobile ? 260 : 480, everyNthFrame: 1 })
await p.reload({ waitUntil: 'networkidle2' }); await new Promise((r) => setTimeout(r, 1800))
await cdp.send('Page.stopScreencast')
console.log('images peintes', n, '| images cachées avant apparition', await p.evaluate(() => window.__seen), '| première image visible', JSON.stringify(await p.evaluate(() => window.__first)))
const pick = Array.from({ length: 12 }, (_, i) => frames[Math.min(frames.length - 1, Math.round(i * (frames.length - 1) / 11))])
pick.forEach((d, i) => writeFileSync(`${out}/${String(i).padStart(3, '0')}.jpg`, Buffer.from(d, 'base64')))
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', `${out}/%03d.jpg`, '-vf', 'tile=6x2', '-frames:v', '1', `${out}/sheet.jpg`])
await b.close()
