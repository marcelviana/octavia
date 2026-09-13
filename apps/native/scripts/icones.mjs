#!/usr/bin/env node
/**
 * `gate:icones` — o mapa de ícones contra as duas fontes (V1-PR4, commit 1).
 *
 * Na V1-PR3 esta checagem rodou como script de scratch (`checa-dados.mjs`,
 * anexo F; div. 52: `vitest.config.mts` exclui `apps/**`, então não pode ser
 * teste da suíte). Aqui ela vira gate versionado, com exit code e controle
 * negativo — e entra ANTES do commit que põe ícone novo em tela, pela regra
 * que a PR3 deixou (anexos README, regra 1): o gate vem antes do que ele mede.
 *
 * O que confere, em `src/icones/dados.ts`:
 *
 *  1. NOMES — as chaves do mapa são exatamente os nomes da tabela §6.4 do
 *     `DESIGN-V1/README.md` (lida do arquivo, não copiada para cá; `voltar`
 *     aparece duas vezes na tabela e uma no mapa) mais o `log-in`, que a §6.4
 *     declara "fora do catálogo" (E8). Nem a menos, nem a mais.
 *  2. DESENHOS — todo `d`, `circle` e `rect` dos 34 registros do anexo D do
 *     V1-PR3-PRECHECK (o markup do `icones.html`, extraído por script) existe
 *     no mapa; e todo elemento `normal` do mapa está no anexo, com a única
 *     exceção do `log-in`, cujo `d` vem do `telas.html` (E8). Os estados
 *     `ativo`/`inerte`/`em20` vêm da folha de estados e do `telas.html`, não
 *     do catálogo, e por isso não são cobrados contra o anexo D.
 *  3. TINTA — nenhum hex cravado (`#rrggbb`) no mapa, e todo `tinta:` é um
 *     dos três tokens do `TintaIcone` — cor é do tema, nunca do desenho.
 *
 * Uso:  node scripts/icones.mjs src/icones/dados.ts          → exit 0
 *       node scripts/icones.mjs scripts/__cn__/IconesFalso.ts → o controle
 *                                  negativo: exit 1, 9 acusações
 * Como comando: `pnpm --filter native gate:icones` e `gate:icones:cn`.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const README = join(RAIZ, 'docs/native/DESIGN-V1/README.md')
const ANEXO_D = join(RAIZ, 'docs/native/V1-PR3-PRECHECK-anexos/V1-PR3-D-icones-34.txt')
const MAPA = process.argv[2] ?? 'src/icones/dados.ts'

/** §6.4, "Fora do catálogo": o `log-in` do S0, transcrito do `telas.html` (E8). */
const LOG_IN = 'log-in'
const LOG_IN_D = 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l4 4-4 4M15 12H4'
const TINTAS = ['lineInfo', 'offlineInk', 'accentInk']

/** "última sincronização" → `ultima-sincronizacao`; "zoom −" → `zoom-menos`; "n.º de músicas" → `n-de-musicas`. */
function chave(nomeDaTabela) {
  return nomeDaTabela
    .replace(/n\.\u00BA/g, 'n')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\u2212/g, 'menos').replace(/\+/g, 'mais')
    .replace(/\(avulsa\)/g, '').replace(/\u2026/g, '').replace(/[()]/g, '')
    .trim().replace(/\s+/g, '-')
}

/** As linhas da tabela §6.4 (entre o cabeçalho "### 6.4" e "Fora do catálogo"). */
function nomesDa64() {
  const md = readFileSync(README, 'utf8')
  const ini = md.indexOf('### 6.4')
  const fim = md.indexOf('Fora do catálogo', ini)
  const linhas = md.slice(ini, fim).split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| ícone') && !l.startsWith('| ---'))
  return linhas.map((l) => chave(l.split('|')[1].trim()))
}

/** Assinaturas dos elementos de um trecho de markup SVG (anexo D). */
function assinaturasSvg(svg) {
  const out = new Set()
  for (const m of svg.matchAll(/ d="([^"]+)"/g)) out.add(`d ${m[1]}`)
  for (const m of svg.matchAll(/<circle ([^>]*)>/g)) {
    const a = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]))
    out.add(`circle ${+a.cx} ${+a.cy} ${+a.r}`)
  }
  for (const m of svg.matchAll(/<rect ([^>]*)>/g)) {
    const a = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((x) => [x[1], x[2]]))
    out.add(`rect ${+a.x} ${+a.y} ${+a.width} ${+a.height} ${+a.rx}`)
  }
  return out
}

/** Assinaturas dos elementos de uma lista de primitivas do mapa (`[{ d: … }, { cx, cy, r }, { x, y, w, h, rx }]`). */
function assinaturasMapa(lista) {
  const out = new Set()
  for (const m of lista.matchAll(/d: '([^']+)'/g)) out.add(`d ${m[1]}`)
  for (const m of lista.matchAll(/cx: ([\d.]+), cy: ([\d.]+), r: ([\d.]+)/g)) out.add(`circle ${+m[1]} ${+m[2]} ${+m[3]}`)
  for (const m of lista.matchAll(/x: ([\d.]+), y: ([\d.]+), w: ([\d.]+), h: ([\d.]+), rx: ([\d.]+)/g))
    out.add(`rect ${+m[1]} ${+m[2]} ${+m[3]} ${+m[4]} ${+m[5]}`)
  return out
}

const acusacoes = []
const acusar = (s) => { acusacoes.push(s); console.log(`  ACUSADO ${s}`) }

// ---- as duas fontes
const tabela = nomesDa64()
const esperados = new Set([...tabela, LOG_IN])
const anexo = readFileSync(ANEXO_D, 'utf8')
const registros = [...anexo.matchAll(/^### (\S+)  ·  .+?  ·  \d+ dp\n(<svg[\s\S]*?<\/svg>)/gm)]
const doAnexo = new Set(registros.flatMap(([, , svg]) => [...assinaturasSvg(svg)]))

// ---- o mapa (sem os comentários: um hex num comentário não é hex cravado)
const src = readFileSync(MAPA, 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
const blocos = [...src.matchAll(/^  '([^']+)': \{\n([\s\S]*?)\n  \},$/gm)]
const nomes = blocos.map((m) => m[1])
const doMapa = new Set()
const normalDoMapa = new Map()
for (const [, nome, corpo] of blocos) {
  for (const linha of corpo.split('\n')) {
    const m = /^\s+(normal|ativo|inerte|em20): (\[.*\]),?$/.exec(linha)
    if (m === null) continue
    const ass = assinaturasMapa(m[2])
    for (const a of ass) doMapa.add(a)
    if (m[1] === 'normal') normalDoMapa.set(nome, ass)
  }
}

// ---- 1. nomes
for (const n of esperados) if (!nomes.includes(n)) acusar(`${MAPA} [nome] falta no mapa: "${n}" (§6.4)`)
for (const n of nomes) if (!esperados.has(n)) acusar(`${MAPA} [nome] sobra no mapa: "${n}" (não está na §6.4)`)
const repetidos = nomes.filter((n, i) => nomes.indexOf(n) !== i)
for (const n of repetidos) acusar(`${MAPA} [nome] repetido no mapa: "${n}"`)

// ---- 2. desenhos
for (const a of doAnexo) if (!doMapa.has(a)) acusar(`${MAPA} [desenho] do anexo D ausente do mapa: ${a}`)
for (const [nome, ass] of normalDoMapa)
  for (const a of ass) {
    if (nome === LOG_IN && a === `d ${LOG_IN_D}`) continue
    if (!doAnexo.has(a)) acusar(`${MAPA} [desenho] 'normal' de "${nome}" não está no anexo D: ${a}`)
  }

// ---- 3. tinta
for (const m of src.matchAll(/#[0-9A-Fa-f]{6}\b/g)) {
  const ln = src.slice(0, m.index).split('\n').length
  acusar(`${MAPA}:${ln} [tinta] hex cravado: ${m[0]}`)
}
for (const m of src.matchAll(/tinta: '([^']*)'/g)) {
  if (TINTAS.includes(m[1])) continue
  const ln = src.slice(0, m.index).split('\n').length
  acusar(`${MAPA}:${ln} [tinta] token desconhecido: '${m[1]}' (esperado: ${TINTAS.join(' | ')})`)
}

console.log(`  §6.4: ${tabela.length} linhas → ${new Set(tabela).size} nomes distintos, + ${LOG_IN} = ${esperados.size} esperados`)
console.log(`  anexo D: ${registros.length} registros · ${doAnexo.size} elementos distintos`)
console.log(`  mapa: ${nomes.length} nomes · ${doMapa.size} elementos distintos · ${normalDoMapa.size} com 'normal'`)
console.log(`  hex cravado: ${(src.match(/#[0-9A-Fa-f]{6}\b/g) ?? []).length} · tinta por token: ${(src.match(/tinta: '/g) ?? []).length}`)
console.log(`  acusações: ${acusacoes.length}`)
process.exit(acusacoes.length > 0 ? 1 : 0)
