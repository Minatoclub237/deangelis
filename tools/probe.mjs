// Vérifications ciblées : survol équipe, étapes, transitions à mi-scroll, mobile. node tools/probe.mjs out.jpg
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 827 })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://localhost:5980/', { waitUntil: 'networkidle2' })
const dir = `_raw/pr_${Date.now()}`; mkdirSync(dir)
const wait = (ms) => new Promise((r) => setTimeout(r, ms)); let n = 0
const snap = () => p.screenshot({ path: `${dir}/s${String(n++).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 72 })
const to = async (s, f = 0, d = 1400) => { await p.evaluate((s, f) => { const e = document.querySelector(s), r = e.getBoundingClientRect(); window.scrollTo(0, r.top + scrollY + (r.height - innerHeight) * f) }, s, f); await wait(d) }
await wait(350); await snap(); await wait(2300); await snap()
await to('.mission', 0); await snap()
await to('.team', 0); const r = await p.evaluate(() => { const b = document.querySelectorAll('.tm')[0].getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] }); await p.mouse.move(...r); await wait(1000); await snap()
const r2 = await p.evaluate(() => { const b = document.querySelectorAll('.tm')[1].getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] }); await p.mouse.move(...r2); await wait(220); await snap()
await to('.science', 0); const r3 = await p.evaluate(() => { const b = document.querySelectorAll('.steps li')[2].getBoundingClientRect(); return [b.x + 40, b.y + 30] }); await p.mouse.move(...r3); await wait(700); await snap()
await to('.mach', 1); await snap(); await to('.contact', 1, 2600); await snap()
console.log('erreurs', errs.length ? errs.slice(0, 5) : 'aucune')
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await p.reload({ waitUntil: 'networkidle2' }); await wait(2500); await snap()
console.log('mobile débordement x', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth))
await b.close()
execFileSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', `${dir}/s%02d.jpg`, '-vf', 'scale=724:-1,pad=724:420:(ow-iw)/2:0:white,tile=2x4:padding=4:color=magenta', '-frames:v', '1', '-update', '1', '-q:v', '3', process.argv[2]])
