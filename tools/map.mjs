// Carte statique du quartier (tuiles OpenStreetMap, zoom 17) + position du salon et de Schuman en %
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const Z = 17, n = 2 ** Z, tx = (lon) => (lon + 180) / 360 * n, ty = (lat) => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n }
const salon = [50.844692, 4.3847811], COLS = 6, ROWS = 3
const cx = Math.floor(tx(salon[1])) - 3, cy = Math.floor(ty(salon[0])) - 1
const UA = { 'User-Agent': 'DeAngelisMaquette/1.0 (site vitrine, carte statique unique)' }
let i = 0
for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const r = await fetch(`https://tile.openstreetmap.org/${Z}/${cx + x}/${cy + y}.png`, { headers: UA, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new Error(r.status); writeFileSync(`_client/tiles/${String(i++).padStart(2, '0')}.png`, Buffer.from(await r.arrayBuffer())) }
execFileSync('ffmpeg', ['-v', 'error', '-y', '-start_number', '0', '-i', '_client/tiles/%02d.png', '-vf', `format=rgb24,tile=${COLS}x${ROWS},hue=s=.18,eq=brightness=.015:contrast=.93`, '-frames:v', '1', '-update', '1', '-c:v', 'libwebp', '-quality', '82', 'public/img/map.webp'])
const pct = (lat, lon) => [((tx(lon) - cx) / COLS * 100).toFixed(2), ((ty(lat) - cy) / ROWS * 100).toFixed(2)]
console.log('salon', pct(...salon))
const q = await (await fetch('https://nominatim.openstreetmap.org/search?q=Schuman,+Bruxelles,+Belgique&format=json&limit=3', { headers: UA, signal: AbortSignal.timeout(20000) })).json()
q.forEach((s) => console.log(s.display_name.slice(0, 70), s.lat, s.lon, 'pct', pct(+s.lat, +s.lon)))
const s0 = q[0]; const o = await (await fetch(`https://router.project-osrm.org/route/v1/foot/${s0.lon},${s0.lat};${salon[1]},${salon[0]}?overview=false`, { signal: AbortSignal.timeout(20000) })).json()
console.log('itinéraire à pied', o.routes?.[0]?.distance, 'm', o.routes?.[0]?.duration, 's')
