// Télécharge les photos Pexels retenues (index de _raw/pexels.json) puis les convertit en WebP
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const a = JSON.parse(readFileSync('_raw/pexels.json', 'utf8'))
const m = { team1: [7, 800], team2: [2, 800], team3: [1, 800], team4: [23, 800], ava1: [6, 320], ava2: [27, 320], ava3: [29, 320], ava4: [3, 320], h17: [32, 1100], h18: [65, 1100], h19: [46, 1100], machine: [51, 2000], machine2: [71, 2000], web2: [18, 500] }
writeFileSync('_raw/urls2.txt', Object.entries(m).map(([k, [n, w]]) => `url = "${a[n].src}?auto=compress&w=${w}"\noutput = "_raw/p_${k}.jpg"`).join('\n'))
execFileSync('curl', ['-s', '-Z', '--parallel-max', '6', '-K', '_raw/urls2.txt'], { stdio: 'inherit' })
for (const k of Object.keys(m)) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `_raw/p_${k}.jpg`, '-c:v', 'libwebp', '-quality', '80', `public/img/${k}.webp`])
console.log(Object.keys(m).length, 'photos')
