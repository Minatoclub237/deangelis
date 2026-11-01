// node tools/shot.mjs W H out.jpg 0 1200 2400 … : capture la page à plusieurs positions de scroll puis assemble une planche
// node tools/shot.mjs W H out.jpg sel:.selecteur:0.5 … : position relative à un élément (0 = haut d'écran, 1 = bas de l'élément)
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const [W, H, out, ...pos] = process.argv.slice(2)
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', `--window-size=${+W + 20},${+H + 140}`] })
const p = await b.newPage(); await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 })
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await p.goto('http://localhost:5980' + (process.env.U || '/'), { waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 2600))
const dir = `_raw/shots_${Date.now()}`; mkdirSync(dir, { recursive: true })
let i = 0
for (const q of pos) {
  const y = await p.evaluate((q) => { if (!q.startsWith('sel:')) return +q; const [, s, f] = q.split(':'), e = document.querySelector(s), r = e.getBoundingClientRect(), t = r.top + scrollY; return t + (r.height - innerHeight) * +f }, q)
  await p.evaluate((y) => { window.scrollTo(0, y) }, y)
  await new Promise((r) => setTimeout(r, 1500))
  await p.screenshot({ path: `${dir}/s${String(i).padStart(2, '0')}.jpg`, quality: 70, type: 'jpeg' }); i++
}
console.log('errors:', errs.length ? errs.slice(0, 6) : 'aucune', '| hauteur', await p.evaluate(() => document.documentElement.scrollHeight), '| dépassement x', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth))
await b.close()
const cols = +process.env.COLS || Math.min(3, i), tw = Math.floor(1460 / cols)
execFileSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', `${dir}/s%02d.jpg`, '-vf', `scale=${tw - 4}:-1,tile=${cols}x${Math.ceil(i / cols)}:padding=4:color=magenta`, '-frames:v', '1', '-update', '1', '-q:v', '3', out])
