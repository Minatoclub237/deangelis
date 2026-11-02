// Parcours complet de la demande de rendez-vous : règles du calendrier, prix selon le jour, e-mail produit
import puppeteer from 'puppeteer-core'
import { readdirSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const out = process.env.OUT || '_raw/book'; mkdirSync(out, { recursive: true })
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
for (const [url, w, h, tag] of [['/', 1440, 827, 'fr'], ['/en/', 1440, 827, 'en'], ['/', 390, 844, 'fr-m']]) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 })
  const errs = []; p.on('pageerror', (e) => errs.push(e.message))
  await p.goto('http://localhost:5980' + url, { waitUntil: 'networkidle2' }); await wait(1200)
  const shot = async (n) => { await wait(900); await p.screenshot({ path: `${out}/${tag}-${n}.png` }) }
  const txt = (s) => p.$eval(s, (e) => e.textContent.trim().replace(/\s+/g, ' '))
  const next = async () => { await p.evaluate(() => document.querySelector('.bk-next').click()); await wait(150) }
  await p.evaluate(() => document.querySelector(innerWidth < 821 ? '.mbar a[href="#rendez-vous"]' : '.nav-book').click())
  await wait(1300)
  console.log(`\n== ${tag} : ouverte`, await p.$eval('#rendez-vous', (d) => d.open))
  await next(); console.log('sans prestation :', await txt('.bk-e'), '| étape', await p.$$eval('.bk-st', (s) => s.findIndex((x) => !x.hidden)))
  await p.click('input[data-w="37"] ~ span'); console.log('prix sans date :', await txt('input[data-w="37"] ~ .pr'))
  await p.evaluate(() => document.querySelector('.bk-tab[data-t="couleur"]').click()); await p.click('input[data-p="50-80"] ~ span')
  await p.evaluate(() => document.querySelector('.bk-tab[data-t="lissage"]').click()); await p.click('.bk-ol[data-t="lissage"] li:last-child span')
  await shot('1'); console.log('total :', await txt('.bk-tot b'), '| résumé :', await txt('.bk-sum'))
  await next(); await next(); console.log('sans date :', await txt('.bk-e'))
  // Règles du calendrier : dimanche, fériés, passé
  const off = (k) => p.$eval(`[data-d="${k}"]`, (e) => e.disabled)
  console.log('2 nov (passé)', await off('2026-11-02'), '| 8 nov (dimanche)', await off('2026-11-08'), '| 11 nov (férié)', await off('2026-11-11'), '| 9 nov (lundi)', await off('2026-11-09'))
  const pick = async (k) => { await p.evaluate((x) => document.querySelector(`[data-d="${x}"]`).click(), k); await wait(50); return txt('.bk-sv li:first-child b') }
  console.log('prix coupe : lundi 9 =', await pick('2026-11-09'), '| ven 13 =', await pick('2026-11-13'), '| mar 10, veille de férié =', await pick('2026-11-10'), '| mer 18 =', await pick('2026-11-18'))
  await p.evaluate(() => { for (let i = 0; i < 1; i++) document.querySelector('.bk-mn').click() }); console.log('mois suivant :', await txt('.bk-mt'), '| 25 déc', await off('2026-12-25'))
  await p.evaluate(() => document.querySelector('.bk-mp').click()); await pick('2026-11-18')
  await p.evaluate(() => { document.querySelector('[data-h="10:30"]').click(); [...document.querySelectorAll('.bk-c')].find((l) => l.textContent.trim() === 'Katarina').querySelector('input').click() })
  await shot('2'); await next()
  await next(); console.log('sans nom :', await txt('.bk-e'))
  await p.type('.bk [name="nom"]', 'Test Client'); await next(); console.log('sans tél :', await txt('.bk-e'))
  await p.type('.bk [name="tel"]', '0470 12 34 56'); await p.type('.bk [name="email"]', 'pas-un-mail'); await next(); console.log('mail faux :', await txt('.bk-e'))
  await p.$eval('.bk [name="email"]', (e) => { e.value = 'client@example.com' }); await p.type('.bk [name="note"]', 'Première visite & cheveux longs')
  await shot('3'); await next(); await shot('4')
  const href = await p.$eval('.bk-again', (a) => a.href)
  console.log('e-mail :', decodeURIComponent(href).replace(/\r\n/g, ' / '))
  const d = await p.evaluate(() => { const m = document.querySelector('.bk-m'), q = document.querySelector('.bk-b'); return { scroll: q.scrollHeight - q.clientHeight, over: document.documentElement.scrollWidth - innerWidth, mw: m.scrollWidth - m.clientWidth } })
  console.log('mesures', JSON.stringify(d), '| texte visible FR restant :', tag === 'en' ? await p.evaluate(() => [...document.querySelectorAll('#rendez-vous *')].filter((e) => !e.children.length && /[éèàù]|Prestation|Coiffeur|Retour/.test(e.textContent)).map((e) => e.textContent.slice(0, 50))) : '-')
  // Fermeture et réouverture
  await p.keyboard.press('Escape'); await wait(800)
  console.log('fermée', !(await p.$eval('#rendez-vous', (x) => x.open)), '| curseur rendu', await p.evaluate(() => matchMedia('(hover:hover)').matches ? document.documentElement.classList.contains('has-cursor') : 'n/a'), '| erreurs', errs.length ? errs : 0)
  await p.close()
}
await b.close()
