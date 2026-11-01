// node tools/grab.mjs : horaires Google + statut Mérode + images servies par Facebook / Instagram (pages publiques)
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--lang=fr-BE'] })
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 1000 }); await p.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' })
await p.goto('https://www.google.com/maps?cid=17760924544134801058&hl=fr', { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000)
const hb = await p.$('[data-item-id="oh"], button[aria-label*="horaires"], [jsaction*="openhours"]'); if (hb) { await hb.click().catch(() => {}); await sleep(1500) }
console.log('HORAIRES', await p.evaluate(() => [...document.querySelectorAll('table tr')].map((t) => t.innerText.replace(/\s+/g, ' ')).join(' | ') || [...document.querySelectorAll('[aria-label*="9 h"],[aria-label*="09:00"]')].map((e) => e.getAttribute('aria-label')).join(' | ')))
await p.goto('https://www.google.com/maps/search/De+Angelis+Coiffure+Esth%C3%A9tique+M%C3%A9rode+Galerie+du+Cinquantenaire?hl=fr', { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3500)
console.log('MERODE', (await p.evaluate(() => document.querySelector('div[role="main"]')?.innerText || '')).replace(/\s+/g, ' ').slice(0, 420))
let n = 0
for (const [pre, u] of [['fb', 'https://www.facebook.com/De-Angelis-Coiffure-921889347876480'], ['ig', 'https://www.instagram.com/deangeliscoiffure/']]) {
  const q = await b.newPage(); await q.setViewport({ width: 1366, height: 1000 })
  q.on('response', async (r) => { try { if (!(r.headers()['content-type'] || '').startsWith('image/') || !/scontent|cdninstagram/.test(r.url())) return; const buf = await r.buffer(); if (buf.length > 9000) writeFileSync(`_client/hi/${pre}_${String(n++).padStart(3, '0')}_${buf.length}.jpg`, buf) } catch {} })
  await q.goto(u, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}); await sleep(2500); await q.evaluate(() => scrollTo(0, 1500)); await sleep(2500); await q.close()
}
console.log('images', n); await b.close()
