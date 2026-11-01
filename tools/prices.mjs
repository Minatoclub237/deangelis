// Contrôle des onglets de tarifs : FR ordinateur, EN ordinateur, mobile + vidéos réellement jouées
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const dir = `_raw/pr_${Date.now()}`; mkdirSync(dir); let n = 0; const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const open = async (u, w, h) => { const p = await b.newPage(); await p.setViewport({ width: w, height: h }); await p.goto('http://localhost:5980' + u, { waitUntil: 'networkidle2' }); await wait(2000); return p }
const to = async (p, s, f = 0) => { await p.evaluate((s, f) => { const e = document.querySelector(s), r = e.getBoundingClientRect(); scrollTo(0, r.top + scrollY + (r.height - innerHeight) * f) }, s, f); await wait(1500) }
const snap = (p) => p.screenshot({ path: `${dir}/s${String(n++).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 72 })
const fit = (p) => p.evaluate(() => { const s = document.querySelector('.science').getBoundingClientRect(), st = document.querySelector('.steps').getBoundingClientRect(); return `section ${Math.round(s.height)} / écran ${innerHeight}, frise bas ${Math.round(st.bottom - s.top)}` })
for (const [w, h] of [[1440, 827], [1366, 650], [1920, 1080]]) { const p = await open('/', w, h); await to(p, '.science'); console.log(w, h, await fit(p)); if (w === 1440) { for (const i of [1, 3, 4]) { await p.evaluate((i) => document.querySelectorAll('.steps li')[i].click(), i); await wait(800); await snap(p) } await to(p, '.driven'); console.log('vidéo salon', await p.evaluate(() => { const v = document.querySelector('.d-tall video'); return { src: v.currentSrc.split('/').pop(), joue: !v.paused, pret: v.readyState, t: +v.currentTime.toFixed(1) } })); console.log('vidéos chargées hors écran', await p.evaluate(() => [...document.querySelectorAll('.vid')].filter((v) => v.src && !v.paused).length)) } await p.close() }
const e = await open('/en/', 1440, 827); await to(e, '.science'); await e.evaluate(() => document.querySelectorAll('.steps li')[1].click()); await wait(800); await snap(e); await e.close()
const m = await open('/', 390, 844); await to(m, '.science'); await snap(m); await to(m, '.pr-g'); await snap(m); await m.close()
await b.close()
execFileSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', `${dir}/s%02d.jpg`, '-vf', 'scale=726:430:force_original_aspect_ratio=decrease,pad=730:434:(ow-iw)/2:0:white,format=yuvj420p,tile=2x3:padding=3:color=magenta', '-frames:v', '1', '-update', '1', '-q:v', '3', process.argv[2]])
