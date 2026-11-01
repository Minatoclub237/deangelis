// node tools/pages.mjs url… : ouvre chaque page publique en Chrome, écrit texte + images + liens dans _client/page_N.txt
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--lang=fr-BE'] })
let n = 0
for (const u of process.argv.slice(2)) {
  const p = await b.newPage(); await p.setViewport({ width: 1366, height: 900 }); n++
  try {
    await p.goto(u, { waitUntil: 'networkidle2', timeout: 45000 }); await new Promise((r) => setTimeout(r, 2500))
    const d = await p.evaluate(() => ({ title: document.title, og: document.querySelector('meta[property="og:description"]')?.content || '', text: document.body.innerText, imgs: [...new Set([...document.images].map((i) => `${i.naturalWidth}x${i.naturalHeight} ${i.currentSrc || i.src} | ${i.alt}`))], links: [...new Set([...document.links].map((a) => a.href))] }))
    writeFileSync(`_client/page_${n}.txt`, `${u}\n${d.title}\n${d.og}\n\n${d.text}\n\n== IMAGES\n${d.imgs.join('\n')}\n\n== LIENS\n${d.links.join('\n')}`)
    console.log(n, u, '→', d.title.slice(0, 70), '| texte', d.text.length, '| images', d.imgs.length, '| og:', d.og.slice(0, 160))
  } catch (e) { console.log(n, u, 'ÉCHEC', e.message.slice(0, 80)) }
  await p.close()
}
await b.close()
