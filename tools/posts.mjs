// Ouvre les publications publiques du salon et garde les images servies (sans connexion)
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--lang=fr-BE'] })
const seen = new Set()
for (const id of process.argv.slice(2)) {
  const p = await b.newPage(); await p.setViewport({ width: 1366, height: 1000 }); let n = 0
  p.on('response', async (r) => { try { if (!/cdninstagram|fbcdn/.test(r.url()) || !(r.headers()['content-type'] || '').startsWith('image/')) return; const buf = await r.buffer(); if (buf.length < 30000) return; const h = createHash('md5').update(buf).digest('hex').slice(0, 8); if (seen.has(h)) return; seen.add(h); writeFileSync(`_client/posts/${id}_${h}.jpg`, buf); n++ } catch {} })
  await p.goto(`https://www.instagram.com/deangeliscoiffure/p/${id}/`, { waitUntil: 'networkidle2', timeout: 40000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 2500))
  const d = await p.evaluate(() => ({ t: document.title.slice(0, 110), og: document.querySelector('meta[property="og:description"]')?.content?.slice(0, 200) || '', login: /accounts\/login/.test(location.href) }))
  console.log(id, n, d.login ? 'LOGIN' : '', '|', d.og); await p.close()
}
await b.close()
