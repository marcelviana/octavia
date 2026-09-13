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
 *  5. FORA DO CATÁLOGO — os desenhos que existem no `telas.html` e em nenhuma
 *     tabela do README (§6.4, "Fora do catálogo"). Eram **um** — o `log-in`
 *     do S0, cujo `d` esta regra 2 exemplava por constante — e a V1-PR6 os
 *     leva a **quatro**: as molduras `S0` e `S4b` trazem `email`, `senha` e
 *     `nada-encontrado`, que nenhuma linha da §6.4 nomeia. Cada um é cobrado
 *     contra o `telas.html`, **por forma**: o conjunto de elementos do seu
 *     `normal` tem de ser EXATAMENTE o de um `<svg>` do arquivo congelado, e
 *     de um só. Achar por forma, e não por posição, é o que a regra 4 já fazia
 *     com a tab de 20 dp — e é mais forte do que a constante de antes, porque
 *     a constante era uma transcrição e o `telas.html` é o original.
 *     Acréscimo da V1-PR6, pela mesma regra que a PR3 deixou e a PR4 e a PR5
 *     repetiram — **o gate vem antes do que ele mede**: o S0 é a primeira tela
 *     a pôr desenho fora do catálogo em campo, e até aqui só o `log-in` tinha
 *     quem o cobrasse.
 *
 *  4. EM20 — a exceção da §6.3 (a tab tem QUATRO cordas em 20 dp e seis nos
 *     outros tamanhos), MEDIDA e não afirmada: o `em20` do `tab` é verbatim o
 *     `<svg width="20">` da tab no `telas.html` (o único markup congelado que
 *     tem esse desenho: o catálogo do anexo D só traz a de seis), e a
 *     contagem de cordas é 4 contra 6. Acréscimo da V1-PR5, pela regra que a
 *     PR3 deixou e a PR4 repetiu — **o gate vem antes do que ele mede**: o
 *     chip de tipo do S2 é o primeiro lugar do app que renderiza `tab` em 20
 *     dp, logo o primeiro que exercita o ramo `em20` do `Icone.tsx`, e até
 *     aqui nada cobrava esse ramo (a nota da regra 2 o diz: os estados
 *     `ativo`/`inerte`/`em20` não são cobrados contra o anexo D).
 *
 * Uso:  node scripts/icones.mjs src/icones/dados.ts          → exit 0
 *       node scripts/icones.mjs scripts/__cn__/IconesFalso.ts → o controle
 *                                  negativo: exit 1, 18 acusações
 * Como comando: `pnpm --filter native gate:icones` e `gate:icones:cn`.
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const README = join(RAIZ, 'docs/native/DESIGN-V1/README.md')
const ANEXO_D = join(RAIZ, 'docs/native/V1-PR3-PRECHECK-anexos/V1-PR3-D-icones-34.txt')
const TELAS = join(RAIZ, 'docs/native/DESIGN-V1/telas.html')
const MAPA = process.argv[2] ?? 'src/icones/dados.ts'

/**
 * §6.4, "Fora do catálogo": os desenhos que o `telas.html` tem e o catálogo
 * não. Era um (`log-in` do S0, E8) e a V1-PR6 o levou a quatro, com as
 * molduras `S0` (`email`, `senha`) e `S4b` (`nada-encontrado`). Lista
 * FECHADA: acrescentar um nome aqui é decisão declarada, como a de lá.
 */
const FORA_DO_CATALOGO = ['log-in', 'email', 'senha', 'nada-encontrado']
const TINTAS = ['lineInfo', 'offlineInk', 'accentInk']

/** §6.3 — cordas da tab por tamanho: quatro em 20 dp, seis nos outros. */
const CORDAS = { em20: 4, normal: 6 }

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

/**
 * O `telas.html` é um arquivo único: as 22 molduras vivem dentro de um
 * `<script type="__bundler/template">` como STRING JSON escapada. Decodificar
 * é o único jeito de ler o markup congelado sem abrir o arquivo no navegador.
 */
function telas() {
  const bruto = readFileSync(TELAS, 'utf8')
  const m = /<script type="__bundler\/template">\s*([\s\S]*?)\s*<\/script>/.exec(bruto)
  if (m === null) throw new Error(`sem __bundler/template em ${TELAS}`)
  return JSON.parse(m[1])
}

/**
 * As cordas de um desenho de tab: as linhas HORIZONTAIS do `d`, contadas por
 * y DISTINTO — a corda partida pelo traste são dois comandos `h` no mesmo y,
 * e é uma corda só (§6.3, "traço interrompido": o vão se mede na forma).
 */
function cordas(d) {
  const ys = new Set()
  for (const m of d.matchAll(/M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)) ys.add(+m[2])
  return ys.size
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
const esperados = new Set([...tabela, ...FORA_DO_CATALOGO])
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
/** `${nome}:${estado}` → a lista literal, para a regra 4 (que compara markup, não só assinatura). */
const listas = new Map()
for (const [, nome, corpo] of blocos) {
  for (const linha of corpo.split('\n')) {
    const m = /^\s+(normal|ativo|inerte|em20): (\[.*\]),?$/.exec(linha)
    if (m === null) continue
    const ass = assinaturasMapa(m[2])
    listas.set(`${nome}:${m[1]}`, m[2])
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
for (const [nome, ass] of normalDoMapa) {
  // Fora do catálogo não tem o que estar no anexo D — quem o cobra é a regra 5.
  if (FORA_DO_CATALOGO.includes(nome)) continue
  for (const a of ass) {
    if (!doAnexo.has(a)) acusar(`${MAPA} [desenho] 'normal' de "${nome}" não está no anexo D: ${a}`)
  }
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

// ---- 4. em20: a exceção da §6.3, contra o telas.html e contada
const tabEm20 = listas.get('tab:em20')
const tabNormal = listas.get('tab:normal')
let svgTab20 = null
let n20 = 0
let n6 = 0
if (tabEm20 === undefined) {
  acusar(`${MAPA} [em20] "tab" não tem 'em20' — a §6.3 exige a de QUATRO cordas em 20 dp`)
} else {
  // O markup congelado: o único <svg width="20"> do telas.html com DOIS rects
  // de rx 1.7 é a tab (os trastes) — os outros 20 dp são letra, cifra,
  // partitura, data, local, n-de-musicas, sem-conexao e ultima-sincronizacao.
  const candidatos = [...telas().matchAll(/<svg width="20"[\s\S]*?<\/svg>/g)]
    .map((m) => m[0])
    .filter((svg) => (svg.match(/rx="1\.7"/g) ?? []).length === 2)
  const distintos = new Set(candidatos)
  if (distintos.size !== 1) {
    acusar(`${MAPA} [em20] o telas.html tem ${distintos.size} desenhos distintos de tab@20 (esperado 1)`)
  } else {
    svgTab20 = [...distintos][0]
    const doFrame = assinaturasSvg(svgTab20)
    const doMapaEm20 = assinaturasMapa(tabEm20)
    for (const a of doFrame) if (!doMapaEm20.has(a)) acusar(`${MAPA} [em20] do telas.html ausente do 'em20' da tab: ${a}`)
    for (const a of doMapaEm20) if (!doFrame.has(a)) acusar(`${MAPA} [em20] no 'em20' da tab e não no telas.html: ${a}`)
  }
  // A contagem de cordas — o que a §6.3 declara, medido nos dois desenhos.
  n20 = [...tabEm20.matchAll(/d: '([^']+)'/g)].reduce((a, m) => a + cordas(m[1]), 0)
  n6 = [...(tabNormal ?? '').matchAll(/d: '([^']+)'/g)].reduce((a, m) => a + cordas(m[1]), 0)
  if (n20 !== CORDAS.em20) acusar(`${MAPA} [em20] a tab de 20 dp tem ${n20} cordas, e a §6.3 declara ${CORDAS.em20}`)
  if (n6 !== CORDAS.normal) acusar(`${MAPA} [em20] a tab de 24/28 dp tem ${n6} cordas, e a §6.3 declara ${CORDAS.normal}`)
}

// ---- 5. fora do catálogo: cada um verbatim de UM <svg> do telas.html, por forma
const porAssinatura = new Map()
for (const svg of [...telas().matchAll(/<svg [\s\S]*?<\/svg>/g)].map((m) => m[0])) {
  const k = [...assinaturasSvg(svg)].sort().join(' | ')
  porAssinatura.set(k, (porAssinatura.get(k) ?? 0) + 1)
}
let foraOk = 0
for (const nome of FORA_DO_CATALOGO) {
  const lista = listas.get(`${nome}:normal`)
  if (lista === undefined) {
    acusar(`${MAPA} [fora-do-catálogo] "${nome}" não tem 'normal' no mapa`)
    continue
  }
  const k = [...assinaturasMapa(lista)].sort().join(' | ')
  if (porAssinatura.has(k)) foraOk++
  else acusar(`${MAPA} [fora-do-catálogo] o 'normal' de "${nome}" não é, elemento a elemento, nenhum <svg> do telas.html`)
}

console.log(`  §6.4: ${tabela.length} linhas → ${new Set(tabela).size} nomes distintos, + ${FORA_DO_CATALOGO.length} fora do catálogo = ${esperados.size} esperados`)
console.log(`  anexo D: ${registros.length} registros · ${doAnexo.size} elementos distintos`)
console.log(`  mapa: ${nomes.length} nomes · ${doMapa.size} elementos distintos · ${normalDoMapa.size} com 'normal'`)
console.log(`  hex cravado: ${(src.match(/#[0-9A-Fa-f]{6}\b/g) ?? []).length} · tinta por token: ${(src.match(/tinta: '/g) ?? []).length}`)
console.log(`  §6.3 tab: em20 ${n20} cordas · normal ${n6} cordas · markup de 20 dp no telas.html: ${svgTab20 === null ? 'NÃO ACHADO' : 'idêntico'}`)
console.log(`  fora do catálogo: ${foraOk}/${FORA_DO_CATALOGO.length} idênticos a um <svg> do telas.html (${porAssinatura.size} assinaturas distintas no arquivo)`)
console.log(`  acusações: ${acusacoes.length}`)
process.exit(acusacoes.length > 0 ? 1 : 0)
