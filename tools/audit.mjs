// Audit FR + EN : ancres, images, erreurs, débordement, hauteur ; fermeture simulée
import puppeteer from 'puppeteer-core'
import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
for (const [url, w, h] of [['/', 1440, 827], ['/en/', 1440, 827], ['/', 390, 844], ['/en/', 390, 844]]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) }); p.on('requestfailed', (r) => errs.push('fail ' + r.url().slice(-40)))
  await p.goto('http://localhost:5980' + url, { waitUntil: 'networkidle2' })
  await p.evaluate(() => document.querySelectorAll('img').forEach((i) => { i.loading = 'eager' })); await new Promise((r) => setTimeout(r, 2500))
  const r = await p.evaluate(() => ({ dead: [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((x) => x.length > 1 && !document.querySelector(x)), broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src.split('/').pop()), H: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, notice: !document.querySelector('.notice').hidden, lang: document.documentElement.lang }))
  console.log(url, w, JSON.stringify(r), '| écrans', (r.H / h).toFixed(1), '| erreurs', errs.length ? errs.slice(0, 4) : 0); await p.close()
}
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 827 })
await p.evaluateOnNewDocument(() => { const D = Date, t = new D('2026-08-20T10:00').getTime(); Date.now = () => t })
await p.goto('http://localhost:5980/', { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 1500))
console.log('fermeture simulée :', await p.evaluate(() => { const n = document.querySelector('.notice'); return n.hidden ? 'cachée' : n.textContent }))
await b.close()
