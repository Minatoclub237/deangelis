// Photos servies par la fiche Google (taille agrandie) + tableau des horaires
import puppeteer from 'puppeteer-core'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const urls = [...new Set(readFileSync('_client/gmaps.txt', 'utf8').split('===== IMAGES =====')[1].trim().split('\n'))]
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--lang=fr-BE'] })
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 1000 }); await p.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' })
let n = 0
p.on('response', async (r) => { try { if ((r.headers()['content-type'] || '').startsWith('image/') && /googleusercontent/.test(r.url()) && !/\/a\/|\/a-\//.test(r.url())) { const buf = await r.buffer(); if (buf.length > 12000) { writeFileSync(`_client/g/g${String(n++).padStart(2, '0')}.jpg`, buf); console.log('img', buf.length, r.url().slice(-40)) } } } catch {} })
for (const u of urls) { await p.goto(u.replace(/=.*$/, '') + '=w1600', { waitUntil: 'load', timeout: 30000 }).catch(() => {}); await sleep(600) }
await p.goto('https://www.google.com/maps?cid=17760924544134801058&hl=fr', { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000)
await p.evaluate(() => { const e = [...document.querySelectorAll('div[role="main"] *')].find((x) => x.children.length === 0 && /Ouvre à|Ouvert|Fermé/.test(x.textContent)); e?.click() }); await sleep(1800)
console.log('HORAIRES', await p.evaluate(() => [...document.querySelectorAll('table tr')].map((t) => t.innerText.replace(/\s+/g, ' ')).join(' | ')))
const hero = await p.$('button[jsaction*="heroHeaderImage"], button[aria-label^="Photo"], button[aria-label*="photos"]'); if (hero) { await hero.click(); await sleep(4000) }
await b.close(); console.log('google', n)
