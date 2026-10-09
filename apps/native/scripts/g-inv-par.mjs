#!/usr/bin/env node
/**
 * `g-inv-par` — a ERRATA EM PAR DA BASE DO G-INV (N4-PR4; decisão do Marcel, 2026-10-04).
 *
 * O G-inv (`g-inv.sh`) compara a árvore do dump nó a nó — e o `react-native-svg` dá um nó (`PathView`, `GroupView`)
 * por primitiva de cada ícone. **Ele vê o desenho**: um ícone trocado por engano numa tela congelada muda a contagem
 * de nós e reprova, e nenhum outro gate confere isso. Por isso ele NÃO se enfraquece. A troca de desenho DECIDIDA (a
 * N4-D69: os quatro ícones de tipo) se paga na BASE, em par, e este script é a prova de que o par é honesto:
 *
 *   para cada dump declarado em `PARES`, com os FILHOS dos `SvgView` dos ícones de tipo removidos dos dois lados
 *   (base e novo), os dois XML são BYTE A BYTE IGUAIS — e o número desses `SvgView` é o mesmo.
 *
 * Um `SvgView` "de tipo" é o que tem, logo depois da sua subárvore, um nó com o texto `Letra`, `Cifra`, `Tab` ou
 * `Partitura` na mesma altura (± 6 px no centro) — a palavra ao lado do ícone, como o app desenha (S2, S4). O
 * `SvgView` fica na comparação inteiro (a tag, com `bounds`): **um ícone de tipo que muda de caixa reprova**. Os
 * `SvgView` que não são de tipo ficam com os filhos: **um ícone que não é de tipo com o desenho trocado reprova**.
 * O formato do `SvgView` podado é um só (aberto, um comentário, fechado), tenha ele vindo com filhos ou com `/>`.
 *
 * Provado o par, a base desses dumps passa a ser o dump novo — os dois só diferem dentro daqueles `SvgView`, então
 * copiar o novo É atualizar só esses nós. A razão de cada par fica aqui; o `SHA256SUMS.txt` da base muda junto.
 *
 * QL-PR3 — O SEGUNDO TIPO DE PAR: O CORPO QUEBRADO (QL-R11; regra 33). Com a quebra de linha, a Letra de 110 colunas da
 * fixture do N3 quebra em 80 colunas no palco deitado (a Letra de até 80 não muda). Nos dumps declarados em
 * `PARES_CORPO`, o que muda é SÓ o nó `corpo` (o `TextView` de `resource-id="corpo"`): o `text` passa a ter as linhas
 * visuais e a caixa encolhe à direita (a linha mais longa deixa de passar da coluna). A prova do par:
 *   - com o `text` e o `bounds` do `corpo` podados dos dois lados (forma única) — e o `bounds` dos ancestrais que o
 *     ABRAÇAM (a mesma caixa dele: o conteúdo da rolagem horizontal, que tem a largura do texto; o mesmo número de
 *     ancestrais nos dois lados) —, os dois XML são BYTE A BYTE IGUAIS: nenhum outro nó mudou, nem de caixa nem de
 *     contagem;
 *   - o texto novo é uma QUEBRA do velho (`ehQuebraDe`, `texto-logico.mjs`: só o recuo de 2 e espaço entre os pedaços
 *     mudam; uma letra trocada, uma palavra a menos ou uma linha fora de ordem reprovam) — o texto lógico é o mesmo;
 *   - a caixa: o mesmo canto esquerdo e a mesma altura (`x0`, `y0`, `y1`), e a direita igual ou menor (`x1`).
 * Depois de a base passar a ser o dump novo, o mesmo par segue fechando com 0 continuações (a quebra é ela mesma).
 *
 * Uso (da raiz):  node apps/native/scripts/g-inv-par.mjs <dir-da-base> <dir-dos-novos>
 *   pareia pelo nome como o `g-inv.sh` (`<PREFIXO>-<resto>.xml`, a chave é `<resto>`), só para as chaves de `PARES`.
 *   Exit 0 = todo par provado; 1 = um par não fecha (imprime onde); 2 = chamada que não mede nada.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ehQuebraDe } from './texto-logico.mjs'

/**
 * Os dumps da base que mudam em par, com a razão. Lista FECHADA (regra 14): quem acrescenta uma chave declara aqui
 * por quê. N4-PR4: os quatro dumps de S2 e S4 com ícone de tipo, nos dois aparelhos.
 */
const PARES = Object.fromEntries([
  'S2-com-edicao-avd-pai', 'S2-com-edicao-aviso-sem-rede-avd-pai', 'S2-sem-edicao-S2p-avd-pai', 'S4-resultados-avd-pai',
  'S2-com-edicao-tab-pai', 'S2-com-edicao-aviso-sem-rede-tab-pai', 'S2-sem-edicao-S2p-tab-pai', 'S4-resultados-tab-pai',
].map((k) => [k, 'N4-D69 — os quatro ícones de tipo trocam de desenho na mesma caixa (P-I9…P-I12)']))

/**
 * QL-PR3 — os dumps da B3 em que o `corpo` muda em par, com a razão (lista FECHADA, regra 14): os seis de Letra — a
 * 1ª música (`S3a-letra-1a`), o título longo e a última, nos dois aparelhos —, a Letra de 110 colunas da fixture.
 */
const PARES_CORPO = Object.fromEntries([
  'S3-S3a-letra-1a-avd-pai', 'S3-titulo-longo-avd-pai', 'S3-ultima-avd-pai',
  'S3-S3a-letra-1a-tab-pai', 'S3-titulo-longo-tab-pai', 'S3-ultima-tab-pai',
].map((k) => [k, 'QL-R11 — a Letra de 110 colunas da fixture quebra em 80 colunas no palco deitado, zoom 22 (QL-PR3)']))

const TIPOS = /<node [^>]*text="(Letra|Cifra|Tab|Partitura)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/

/** O XML com os filhos dos `SvgView` de tipo removidos (forma única) e quantos foram podados. */
export function podar(xml) {
  const toks = [...xml.matchAll(/<node [^>]*?\/?>|<\/node>/g)]
  let out = ''
  let pos = 0
  let n = 0
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    const s = t[0]
    if (!s.startsWith('<node') || !s.includes('class="com.horcrux.svg.SvgView"')) continue
    let j = i
    if (!s.endsWith('/>')) {
      let prof = 1
      while (prof > 0) {
        j++
        const u = toks[j][0]
        if (u === '</node>') prof--
        else if (!u.endsWith('/>')) prof++
      }
    }
    const fim = toks[j]
    const b = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(s).slice(1).map(Number)
    const m = TIPOS.exec(xml.slice(fim.index + fim[0].length, fim.index + fim[0].length + 900))
    if (m === null || Math.abs((Number(m[3]) + Number(m[5])) / 2 - (b[1] + b[3]) / 2) >= 6) continue
    const aberta = s.endsWith('/>') ? `${s.slice(0, -2).trimEnd()}>` : s
    out += xml.slice(pos, t.index) + `${aberta}<!--podado--></node>`
    pos = fim.index + fim[0].length
    n++
    i = j
  }
  return { xml: out + xml.slice(pos), n }
}

const ent = (t) => t.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

/**
 * O nó `corpo` e os seus ancestrais, de dentro para fora — os índices no XML e o `bounds` de cada um —, ou `null`.
 */
function arvoreDoCorpo(xml) {
  const toks = [...xml.matchAll(/<node [^>]*?\/?>|<\/node>/g)]
  const k = toks.findIndex((t) => t[0].startsWith('<node') && /resource-id="corpo"/.test(t[0]))
  if (k < 0) return null
  const pilha = []
  for (let i = 0; i < k; i++) {
    const t = toks[i][0]
    if (t === '</node>') pilha.pop()
    else if (!t.endsWith('/>')) pilha.push(i)
  }
  const caixa = (t) => /\bbounds="(\[[^"]*\])"/.exec(t)?.[1] ?? ''
  const texto = /\btext="([^"]*)"/.exec(toks[k][0])
  return {
    toks,
    k,
    ancestrais: pilha.reverse().map((i) => ({ i, caixa: caixa(toks[i][0]) })),
    caixa: caixa(toks[k][0]),
    texto: texto === null ? null : ent(texto[1]),
  }
}

/** Quantos ancestrais, de dentro para fora, têm a MESMA caixa do `corpo` (o abraçam). */
const abracos = (a) => {
  let n = 0
  while (n < a.ancestrais.length && a.ancestrais[n].caixa === a.caixa) n++
  return n
}

/** O XML com o `text` e o `bounds` do `corpo` podados, e o `bounds` dos `n` ancestrais de dentro (forma única). */
function podarCorpo(a, xml, n) {
  const podar = new Map([[a.k, a.toks[a.k][0].replace(/\btext="[^"]*"/, 'text="(podado)"').replace(/\bbounds="[^"]*"/, 'bounds="(podado)"')]])
  for (const { i } of a.ancestrais.slice(0, n)) podar.set(i, a.toks[i][0].replace(/\bbounds="[^"]*"/, 'bounds="(podado: abraça o corpo)"'))
  let out = ''
  let pos = 0
  for (const [i, nova] of [...podar.entries()].sort((x, y) => x[0] - y[0])) {
    out += xml.slice(pos, a.toks[i].index) + nova
    pos = a.toks[i].index + a.toks[i][0].length
  }
  return out + xml.slice(pos)
}

const numeros = (c) => (/\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(c) ?? []).slice(1).map(Number)

/**
 * O par do corpo quebrado: `{ ok, linha }` — a linha que o relatório imprime. Os ancestrais podados são os que abraçam
 * o `corpo` na base OU no novo (o mesmo número dos dois lados); cada um, no novo, ou tem a caixa da base (a janela da
 * rolagem horizontal, que não muda) ou abraça o `corpo` novo (o conteúdo dela, que encolhe com o texto).
 */
export function parDoCorpo(xmlBase, xmlNovo) {
  const a = arvoreDoCorpo(xmlBase)
  const b = arvoreDoCorpo(xmlNovo)
  if (a === null || b === null || a.texto === null || b.texto === null) return { ok: false, linha: `sem nó corpo com texto (base ${a !== null} · novo ${b !== null})` }
  if (a.ancestrais.length !== b.ancestrais.length) return { ok: false, linha: `a profundidade do corpo mudou: base ${a.ancestrais.length} · novo ${b.ancestrais.length}` }
  const n = Math.max(abracos(a), abracos(b))
  for (let j = 0; j < n; j++) {
    const cb = b.ancestrais[j].caixa
    if (cb !== a.ancestrais[j].caixa && cb !== b.caixa) return { ok: false, linha: `o ${j + 1}º ancestral do corpo mudou de caixa sem abraçar o corpo novo: ${a.ancestrais[j].caixa} → ${cb}` }
  }
  const pa = podarCorpo(a, xmlBase, n)
  const pb = podarCorpo(b, xmlNovo, n)
  if (pa !== pb) {
    const la = pa.replace(/></g, '>\n<').split('\n')
    const lb = pb.replace(/></g, '>\n<').split('\n')
    const d = la.findIndex((l, i) => l !== lb[i])
    return { ok: false, linha: `DIFERENTES fora do corpo — 1ª diferença, linha ${d + 1}:\n      base: ${(la[d] ?? '(fim)').slice(0, 220)}\n      novo: ${(lb[d] ?? '(fim)').slice(0, 220)}` }
  }
  const q = ehQuebraDe(b.texto.split('\n'), a.texto)
  if (!q.ok) return { ok: false, linha: `o corpo novo NÃO é uma quebra do velho: ${q.motivo}` }
  const [x0, y0, x1, y1] = numeros(a.caixa)
  const [u0, v0, u1, v1] = numeros(b.caixa)
  const caixa = `caixa ${a.caixa} → ${b.caixa}`
  if (u0 !== x0 || v0 !== y0 || v1 !== y1 || u1 > x1) return { ok: false, linha: `a caixa do corpo mudou além da direita que encolhe: ${caixa}` }
  return {
    ok: true,
    linha: `fora do corpo (e de ${n} ancestral(is) que o abraça(m)) byte a byte iguais · o corpo é uma quebra do texto (${q.linhasLogicas} lógicas, ${q.continuacoes} continuações) · ${caixa}`,
  }
}

function principal() {
  const [base, novos] = process.argv.slice(2)
  if (!base || !novos) { console.error('uso: node apps/native/scripts/g-inv-par.mjs <dir-da-base> <dir-dos-novos>'); process.exit(2) }
  const chave = (f) => f.replace(/\.xml$/, '').replace(/^[^-]+-/, '')
  const daBase = new Map(readdirSync(base).filter((f) => f.endsWith('.xml')).map((f) => [chave(f), f]))
  const dosNovos = new Map(readdirSync(novos).filter((f) => f.endsWith('.xml')).map((f) => [chave(f), f]))
  console.log(`g-inv-par — a errata em par da base do G-inv: ${Object.keys(PARES).length + Object.keys(PARES_CORPO).length} dumps declarados (${Object.keys(PARES).length} de ícone de tipo · ${Object.keys(PARES_CORPO).length} de corpo quebrado)`)
  console.log(`  base:  ${base}\n  novos: ${novos}`)
  let falhas = 0
  let medidos = 0
  for (const [k, razao] of Object.entries(PARES)) {
    const fb = daBase.get(k)
    const fn = dosNovos.get(k)
    if (fb === undefined || fn === undefined) {
      console.log(`  · ${k}: ${fb === undefined ? 'fora desta base' : 'SEM DUMP NOVO'} (não medido)`)
      if (fb !== undefined) falhas++
      continue
    }
    medidos++
    const a = podar(readFileSync(join(base, fb), 'utf8'))
    const b = podar(readFileSync(join(novos, fn), 'utf8'))
    const igual = a.xml === b.xml && a.n === b.n
    if (!igual) falhas++
    console.log(`  ${igual ? '✓' : '✗'} ${k}: SvgView de tipo podados base ${a.n} · novo ${b.n} · ${igual ? 'byte a byte iguais' : 'DIFERENTES fora dos ícones de tipo'} — ${razao}`)
    if (!igual) {
      const la = a.xml.replace(/></g, '>\n<').split('\n')
      const lb = b.xml.replace(/></g, '>\n<').split('\n')
      const d = la.findIndex((l, i) => l !== lb[i])
      console.log(`      1ª diferença, linha ${d + 1}:\n      base: ${(la[d] ?? '(fim)').slice(0, 220)}\n      novo: ${(lb[d] ?? '(fim)').slice(0, 220)}`)
    }
  }
  for (const [k, razao] of Object.entries(PARES_CORPO)) {
    const fb = daBase.get(k)
    const fn = dosNovos.get(k)
    if (fb === undefined || fn === undefined) {
      console.log(`  · ${k}: ${fb === undefined ? 'fora desta base' : 'SEM DUMP NOVO'} (não medido)`)
      if (fb !== undefined) falhas++
      continue
    }
    medidos++
    const r = parDoCorpo(readFileSync(join(base, fb), 'utf8'), readFileSync(join(novos, fn), 'utf8'))
    if (!r.ok) falhas++
    console.log(`  ${r.ok ? '✓' : '✗'} ${k}: ${r.linha} — ${razao}`)
  }
  if (medidos === 0) { console.log('g-inv-par: nenhum par medido — chamada que não mede nada'); process.exit(2) }
  console.log(`g-inv-par: ${medidos} medidos · ${falhas === 0 ? 'todo par provado ✓' : `${falhas} sem dump novo ou NÃO fecha ✗`}`)
  process.exit(falhas === 0 ? 0 : 1)
}

if (import.meta.url === `file://${process.argv[1]}`) principal()
