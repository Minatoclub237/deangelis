// Chargement réel : où passe le temps, ce qui est appelé hors du site, cookies et stockage
import puppeteer from 'puppeteer-core'
import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const url = process.env.U || 'https://deangelis.vercel.app/', mobile = process.env.M === '1'
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const run = async (label, cached) => {
  const c = await b.createBrowserContext(); const p = await c.newPage()
  await p.setViewport(mobile ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1440, height: 827 })
  const hosts = new Set(); p.on('request', (r) => { const h = new URL(r.url()).host; if (h) hosts.add(h) })
  if (cached) { await p.goto(url, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 1200)) }
  await p.evaluateOnNewDocument(() => {
    window.__m = {}
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__m[e.name] = Math.round(e.startTime) })).observe({ type: 'paint', buffered: true })
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__m.lcp = Math.round(e.startTime); window.__m.lcpEl = e.element?.tagName + '.' + (e.element?.className || '') })).observe({ type: 'largest-contentful-paint', buffered: true })
    const tick = () => { if (document.documentElement && !document.documentElement.classList.contains('wait') && document.body && !window.__m.pret) window.__m.pret = Math.round(performance.now()); requestAnimationFrame(tick) }; requestAnimationFrame(tick)
  })
  await (cached ? p.reload({ waitUntil: 'networkidle2' }) : p.goto(url, { waitUntil: 'networkidle2' }))
  await new Promise((r) => setTimeout(r, 1500))
  const d = await p.evaluate(() => ({ m: window.__m, res: performance.getEntriesByType('resource').filter((r) => r.startTime < 2500).map((r) => `${r.name.split('/').pop().split('?')[0].slice(0, 34)} ${Math.round(r.startTime)}→${Math.round(r.responseEnd)} ms ${Math.round(r.transferSize / 1024)} Ko`), doc: Math.round(performance.getEntriesByType('navigation')[0].responseEnd), cookie: document.cookie, ls: Object.keys(localStorage).length, ss: Object.keys(sessionStorage).length }))
  const ck = await c.cookies?.() ?? []
  console.log(`\n== ${label} | HTML ${d.doc} ms | peinture ${d.m['first-contentful-paint']} ms | page prête ${d.m.pret} ms | plus grand élément ${d.m.lcp} ms (${d.m.lcpEl})`)
  if (process.env.V) console.log(d.res.join('\n'))
  console.log('hôtes appelés', [...hosts].join(', '), '| cookies', ck.length, JSON.stringify(d.cookie), '| stockage', d.ls, d.ss)
  await c.close()
}
await run('première visite', false); await run('rechargement', true)
await b.close()
