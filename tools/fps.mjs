// Fluidité : on maintient la flèche bas de haut en bas de la page, images par seconde section par section
import puppeteer from 'puppeteer-core'
import { readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 827 })
await p.goto(process.env.U || 'http://localhost:5980/', { waitUntil: 'networkidle2' }); await wait(2500)
await p.evaluate(() => { window.__f = []; const f = (t) => { window.__f.push([t, scrollY]); requestAnimationFrame(f) }; requestAnimationFrame(f) })
await p.keyboard.down('ArrowDown')
for (let i = 0; i < 60; i++) { await wait(500); if (await p.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 5)) break }
await p.keyboard.up('ArrowDown')
const rows = await p.evaluate(() => {
  const secs = [...document.querySelectorAll('main > *, body > footer')].map((s) => { const r = s.getBoundingClientRect(); return { n: (s.className || s.tagName).toString().split(' ').slice(0, 2).join('.'), a: r.top + scrollY, z: r.bottom + scrollY } })
  return secs.map((s) => {
    const f = window.__f.filter(([, y]) => y + innerHeight * .5 >= s.a && y + innerHeight * .5 < s.z); if (f.length < 3) return null
    const d = f.slice(1).map((v, i) => v[0] - f[i][0]), tot = f.at(-1)[0] - f[0][0]
    return `${s.n.padEnd(14)} ${String(Math.round(f.length / tot * 1000)).padStart(3)} i/s | pire image ${String(Math.round(Math.max(...d))).padStart(4)} ms | ${Math.round(d.filter((v) => v > 34).length / d.length * 100)} % d'images lentes`
  }).filter(Boolean)
})
console.log(rows.join('\n'))
const all = await p.evaluate(() => { const f = window.__f, d = f.slice(1).map((v, i) => v[0] - f[i][0]); return { secondes: Math.round((f.at(-1)[0] - f[0][0]) / 1000), moyenne: Math.round(f.length / (f.at(-1)[0] - f[0][0]) * 1000), lentes: Math.round(d.filter((v) => v > 34).length / d.length * 100) + ' %' } })
console.log('TOTAL', JSON.stringify(all)); await b.close()
