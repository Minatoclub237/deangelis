// node tools/gmaps.mjs <cid> : texte de la fiche Google, avis visibles, lien du site, URL des photos
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--lang=fr-FR'] })
const page = await browser.newPage(); await page.setViewport({ width: 1400, height: 1000 })
await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR,fr;q=0.9' })
await page.goto(`https://www.google.com/maps?cid=${process.argv[2]}&hl=fr`, { waitUntil: 'networkidle2', timeout: 60000 })
const consent = await page.$('form[action*="consent"] button, button[aria-label*="Tout accepter"]')
if (consent) { await consent.click(); await sleep(4000) }
await sleep(3500)
const main = await page.evaluate(() => document.querySelector('div[role="main"]')?.innerText || document.body.innerText)
const links = await page.evaluate(() => [...document.querySelectorAll('a[data-item-id], button[data-item-id]')].map((a) => `${a.getAttribute('data-item-id')} | ${a.href || ''} | ${a.getAttribute('aria-label') || ''}`))
const hours = await page.evaluate(() => [...document.querySelectorAll('[aria-label*="Lundi"],[aria-label*="lundi"]')].map((e) => e.getAttribute('aria-label')).slice(0, 2))
const grab = () => page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.src).concat([...document.querySelectorAll('[style*="googleusercontent"]')].map((e) => (e.style.backgroundImage.match(/https[^"')]+/) || [])[0])).filter((s) => s && /googleusercontent|ggpht/.test(s) && !/\/a\/|\/a-\//.test(s)))
const imgs = new Set(await grab())
let reviews = ''
const tab = await page.$('button[role="tab"][aria-label*="Avis"]')
if (tab) { await tab.click(); await sleep(3000)
  for (const b of await page.$$('button[aria-label="Voir plus"], button.w8nwRe')) { await b.click().catch(() => {}); await sleep(150) }
  reviews = await page.evaluate(() => document.querySelector('div[role="main"]')?.innerText || '') }
// galerie : clic sur la photo principale, puis défilement
await page.goto(`https://www.google.com/maps?cid=${process.argv[2]}&hl=fr`, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000)
const hero = await page.$('button[jsaction*="heroHeaderImage"], button[aria-label^="Photo"]')
if (hero) { await hero.click(); await sleep(3500)
  for (let i = 0; i < 14; i++) { (await grab()).forEach((u) => imgs.add(u)); await page.evaluate(() => { const s = [...document.querySelectorAll('div')].find((d) => d.scrollHeight > d.clientHeight + 200 && d.querySelector('a[data-photo-index]')); if (s) s.scrollTop += 1400 }); await sleep(900) } }
writeFileSync('_client/gmaps.txt', `${main}\n\n===== LIENS =====\n${links.join('\n')}\n${hours.join('\n')}\n\n===== AVIS =====\n${reviews}\n\n===== IMAGES =====\n${[...imgs].join('\n')}`)
console.log(main.slice(0, 1500)); console.log('== LIENS\n' + links.join('\n') + '\n' + hours.join('\n')); console.log('== AVIS\n' + reviews.slice(0, 5200)); console.log('images:', imgs.size)
await browser.close()
