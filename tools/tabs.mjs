// Clique chaque catégorie de tarifs et vérifie panneau + photo ; teste aussi survol et flèches (FR, EN, mobile)
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
const dir = `_raw/tabs_${Date.now()}`; mkdirSync(dir)
for (const [u, w, h] of [['/', 1440, 827], ['/en/', 1440, 827], ['/', 390, 844]]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h }); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.goto('http://localhost:5980' + u, { waitUntil: 'networkidle2' }); await new Promise((r) => setTimeout(r, 1500))
  await p.evaluate(() => { const e = document.querySelector('.science'); scrollTo(0, e.getBoundingClientRect().top + scrollY) }); await new Promise((r) => setTimeout(r, 1300))
  const out = []
  for (let i = 0; i < 6; i++) { await p.evaluate((i) => document.querySelectorAll('.steps li')[i].click(), i); await new Promise((r) => setTimeout(r, w > 800 ? 650 : 120)); out.push(await p.evaluate(() => { const on = document.querySelectorAll('.pt.on'), im = document.querySelectorAll('.pr-ph img.on'); return `${on.length}:${on[0].querySelector('h3').textContent}/${on[0].querySelectorAll('li').length}/${im[0].src.split('/').pop().replace('.webp', '')}` })); if (w > 800 && u === '/' ) await p.screenshot({ path: `${dir}/s${i}.jpg`, type: 'jpeg', quality: 70 }) }
  await p.evaluate(() => document.querySelector('#sci-next').click()); const nx = await p.evaluate(() => document.querySelector('.pt.on h3').textContent)
  console.log(u, w, out.join(' | '), '| flèche →', nx, '| erreurs', errs.length ? errs : 0); await p.close()
}
await b.close()
