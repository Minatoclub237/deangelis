// Défilement au clavier : chaque touche, régularité image par image, et les cas où la page ne doit pas bouger
import puppeteer from 'puppeteer-core'
import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 827 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto(process.env.U || 'http://localhost:5980/', { waitUntil: 'networkidle2' }); await wait(2200)
const y = () => p.evaluate(() => Math.round(scrollY))
const rec = () => p.evaluate(() => { window.__s = []; const f = () => { window.__s.push(scrollY); window.__r = requestAnimationFrame(f) }; f() })
const stats = () => p.evaluate(() => { cancelAnimationFrame(window.__r); const s = window.__s, d = s.slice(1).map((v, i) => Math.abs(v - s[i])), mv = d.filter((v) => v > .1), med = [...mv].sort((a, b) => a - b)[mv.length >> 1] || 0; return { images: s.length, mouvement: Math.round(Math.abs(s.at(-1) - s[0])), mediane: +med.toFixed(1), pasMax: +Math.max(0, ...d).toFixed(1) } })
const tap = async (k, shift) => { const a = await y(); if (shift) await p.keyboard.down('Shift'); await p.keyboard.press(k); if (shift) await p.keyboard.up('Shift'); await wait(900); return [a, await y()] }

await rec(); await p.keyboard.down('ArrowDown'); await wait(1500); await p.keyboard.up('ArrowDown'); await wait(700)
console.log('Flèche bas maintenue 1,5 s', JSON.stringify(await stats()))
const afterHold = await y(); await wait(500); console.log('s\'arrête au relâchement', afterHold === await y())
console.log('Flèche bas, une pression', await tap('ArrowDown'))
console.log('Flèche haut, une pression', await tap('ArrowUp'))
await rec(); const pd = await tap('PageDown'); console.log('Page suivante', pd, JSON.stringify(await stats()))
console.log('Page précédente', await tap('PageUp'))
console.log('Espace', await tap('Space'))
console.log('Maj + Espace', await tap('Space', true))
await rec(); await p.keyboard.press('End'); await wait(2200); console.log('Fin', await y(), 'max', await p.evaluate(() => document.documentElement.scrollHeight - innerHeight), JSON.stringify(await stats()))
await rec(); await p.keyboard.press('Home'); await wait(2200); console.log('Début', await y(), JSON.stringify(await stats()))

// Galerie épinglée : la flèche droite fait avancer les cartes
await p.evaluate(() => { const s = document.querySelector('.gal-sc'); scrollTo(0, s.getBoundingClientRect().top + scrollY + 300) }); await wait(1400)
const x0 = await p.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('.gal-t')).transform).e)
await p.keyboard.down('ArrowRight'); await wait(900); await p.keyboard.up('ArrowRight'); await wait(900)
console.log('Galerie, flèche droite : la bande passe de', Math.round(x0), 'à', await p.evaluate(() => Math.round(new DOMMatrix(getComputedStyle(document.querySelector('.gal-t')).transform).e)))

// La page ne doit pas bouger quand on écrit, ni quand le panneau de réservation est ouvert (page neuve : plus aucun glissé en cours)
await p.reload({ waitUntil: 'networkidle2' }); await wait(2000)
await p.evaluate(() => { const f = document.querySelector('.ct-f input'); scrollTo(0, f.getBoundingClientRect().top + scrollY - 300) }); await wait(1400)
await p.focus('.ct-f textarea'); const y1 = await y(); await p.keyboard.type('a b'); await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowDown'); await wait(700); console.log('Dans un champ : espace et flèches ne font pas défiler', y1 === await y(), '| texte', JSON.stringify(await p.$eval('.ct-f textarea', (t) => t.value)))
await p.evaluate(() => { document.activeElement.blur(); document.querySelector('.nav-book').click() }); await wait(1300); const y2 = await y(); await p.keyboard.press('PageDown'); await p.keyboard.press('ArrowDown'); await wait(700); console.log('Réservation ouverte : la page reste en place', y2 === await y())
await p.keyboard.press('Escape'); await wait(800); console.log('Après fermeture, les touches remarchent', (await tap('PageDown'))[1] > y2, '| erreurs', errs.length ? errs : 0)
await b.close()
