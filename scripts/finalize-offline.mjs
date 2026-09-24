// Renomeia o arquivo gerado e confirma que ele não depende de nenhum recurso externo.
import { readFileSync, renameSync, writeFileSync } from 'node:fs'

const from = 'offline/index.html'
const to = 'offline/matriz-impacto-esforco.html'
let html = readFileSync(from, 'utf8')
// o favicon vira um data URI para o arquivo continuar autossuficiente
const favicon = readFileSync('public/favicon.svg', 'utf8')
html = html.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(favicon)}" />`)
writeFileSync(from, html)
renameSync(from, to)

const external = [...html.matchAll(/(?:src|href)=["'](https?:)?\/\/[^"']+["']/g)].map((m) => m[0])
const styles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
const cssUrls = [...styles.matchAll(/url\((?!["']?data:)["']?([^)"']+)/g)].map((m) => m[1])
if (external.length || cssUrls.length) {
  console.error('Recursos externos encontrados:', external, cssUrls)
  process.exit(1)
}
console.log(`OK: ${to} (${(html.length / 1024 / 1024).toFixed(2)} MB), sem dependências externas`)
