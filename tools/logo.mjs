// Recrée le logo de l'enseigne en tracés vectoriels (un <path> par lettre) → src/logo.js
import opentype from 'opentype.js'
import { readFileSync, writeFileSync } from 'node:fs'
const load = (p) => { const b = readFileSync(`node_modules/@fontsource/${p}`); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)) }
const main = load('belleza/files/belleza-latin-400-normal.woff'), script = load('allura/files/allura-latin-400-normal.woff')
const build = (word, sub, subDx = 0) => {
  const size = 100, paths = main.getPaths(word, 0, 100, size), w = main.getAdvanceWidth(word, size)
  const sp = script.getPaths('for you', w - 148 + subDx, 148, 58)
  const out = [...paths, ...sp].map((p) => p.toPathData(1)).filter(Boolean).map((d, i, a) => `<path d="${d}"/>`).join('')
  return `<svg viewBox="0 18 ${Math.ceil(w + 6)} 148" fill="currentColor" role="img" aria-hidden="true">${out}</svg>`
}
writeFileSync('src/logo.js', `// généré par tools/logo.mjs\nexport const LOGO_FULL = ${JSON.stringify(build('De Angelis Coiffure'))}\nexport const LOGO_SHORT = ${JSON.stringify(build('De Angelis'))}\n`)
console.log('logo ok', readFileSync('src/logo.js').length)
