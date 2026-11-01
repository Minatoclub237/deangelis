// Repère les éléments restés flous ou transparents une fois la section au repos
import puppeteer from 'puppeteer-core'
import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
for (const [w, h] of [[1440, 827], [1366, 650], [1920, 1080], [390, 844]]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h }); await p.goto('http://localhost:5980/', { waitUntil: 'networkidle2' }); await new Promise((r) => setTimeout(r, 2500)); const out = []
  for (const [s, f] of [['.mission', 0], ['.driven', 0], ['.svc', 1], ['.science', 0], ['.adv', 0], ['.mach', 1], ['.gal-h', 0], ['.team', 0], ['.ts', 1], ['.contact', 0], ['.acc', 0], ['.ft', 1]]) {
    await p.evaluate((s, f) => { const e = document.querySelector(s), r = e.getBoundingClientRect(); scrollTo(0, r.top + scrollY + (r.height - innerHeight) * f) }, s, f); await new Promise((r) => setTimeout(r, 1300))
    const bad = await p.evaluate(() => [...document.querySelectorAll('main *, footer *')].filter((e) => { const r = e.getBoundingClientRect(); if (r.width < 8 || r.bottom < innerHeight * .08 || r.top > innerHeight * .92 || e.closest('.sc,.tm-ph,.tm-gl,.gt-i>img')) return false; const c = getComputedStyle(e), m = c.filter.match(/blur\(([\d.]+)px/), op = +c.opacity; return (m && +m[1] > .6) || (op < .9 && (e.style.opacity !== '' || e.style.visibility === 'inherit')) }).slice(0, 4).map((e) => (e.className?.baseVal ?? e.className) + '/' + e.tagName.toLowerCase()))
    if (bad.length) out.push(`${s}:${bad.join(',')}`)
  }
  console.log(w + 'x' + h, out.length ? out.join(' | ') : 'rien de bloqué'); await p.close()
}
await b.close()
