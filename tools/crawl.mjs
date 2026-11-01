// Parcourt les publications publiques liées entre elles (sans connexion) : légende + images haute définition
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--lang=fr-BE'] })
const queue = [...process.argv.slice(2)], done = new Set(), seen = new Set(), out = []
while (queue.length && done.size < 45) {
  const id = queue.shift(); if (done.has(id)) continue; done.add(id)
  const p = await b.newPage(); await p.setViewport({ width: 1366, height: 1000 }); const imgs = []
  p.on('response', async (r) => { try { if (!/cdninstagram|fbcdn/.test(r.url()) || !(r.headers()['content-type'] || '').startsWith('image/')) return; const buf = await r.buffer(); if (buf.length < 70000) return; const h = createHash('md5').update(buf).digest('hex').slice(0, 8); if (seen.has(h)) return; seen.add(h); const f = `_client/posts/${id}_${h}.jpg`; writeFileSync(f, buf); imgs.push(f) } catch {} })
  await p.goto(`https://www.instagram.com/deangeliscoiffure/p/${id}/`, { waitUntil: 'networkidle2', timeout: 40000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 2200))
  const d = await p.evaluate(() => ({ og: document.querySelector('meta[property="og:description"]')?.content || '', login: /accounts\/login/.test(location.href), links: [...new Set([...document.links].map((a) => (a.href.match(/\/deangeliscoiffure\/(?:p|reel)\/([\w-]+)/) || [])[1]).filter(Boolean))] }))
  d.links.forEach((l) => { if (!done.has(l) && !queue.includes(l)) queue.push(l) })
  out.push({ id, og: d.og, imgs, login: d.login }); await p.close(); if (d.login) break
}
await b.close()
writeFileSync('_client/posts.json', JSON.stringify(out, null, 1))
console.log('posts', out.length, 'nouvelles images', out.reduce((a, o) => a + o.imgs.length, 0))
out.forEach((o) => console.log(o.id, o.imgs.length, '|', o.og.replace(/^[\d,. ]+\w* ?likes?, [\d,. ]+ comments? - deangeliscoiffure (le|on)\s*/i, '').replace(/[\n•.]+/g, ' ').replace(/\s+/g, ' ').slice(0, 215)))
