// node tools/render.mjs [scène…] — rend les visuels de tools/studio.js en WebP (dev server requis sur :5980)
import puppeteer from 'puppeteer-core'
import { readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const base = join(homedir(), '.cache/puppeteer/chrome'), exe = join(base, readdirSync(base).sort().pop(), 'chrome-win64/chrome.exe')
const all = { blob: [1000, 1460], molecule: [760, 820], dish: [800, 720], capsule: [800, 720], tray: [800, 720], orb: [320, 320], silk: [320, 320] }
const list = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(all)
const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] })
for (const s of list) {
  const p = await b.newPage(); p.on('pageerror', (e) => console.log(s, 'ERR', e.message)); const [w, h] = all[s]
  const t = Date.now(); await p.goto(`http://localhost:5980/tools/studio.html?s=${s}&w=${w}&h=${h}`, { waitUntil: 'load' })
  await p.waitForFunction('window.__done', { timeout: 120000 }).catch(() => console.log(s, 'timeout'))
  const d = await p.evaluate(() => window.__png)
  if (d) { writeFileSync(`_raw/${s}.png`, Buffer.from(d.split(',')[1], 'base64')); execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `_raw/${s}.png`, '-c:v', 'libwebp', '-quality', '86', `public/img/${s}.webp`]); console.log(s, 'ok', Date.now() - t, 'ms') }
  await p.close()
}
await b.close()
