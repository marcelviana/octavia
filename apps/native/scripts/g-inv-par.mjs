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
 * Uso (da raiz):  node apps/native/scripts/g-inv-par.mjs <dir-da-base> <dir-dos-novos>
 *   pareia pelo nome como o `g-inv.sh` (`<PREFIXO>-<resto>.xml`, a chave é `<resto>`), só para as chaves de `PARES`.
 *   Exit 0 = todo par provado; 1 = um par não fecha (imprime onde); 2 = chamada que não mede nada.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Os dumps da base que mudam em par, com a razão. Lista FECHADA (regra 14): quem acrescenta uma chave declara aqui
 * por quê. N4-PR4: os quatro dumps de S2 e S4 com ícone de tipo, nos dois aparelhos.
 */
const PARES = Object.fromEntries([
  'S2-com-edicao-avd-pai', 'S2-com-edicao-aviso-sem-rede-avd-pai', 'S2-sem-edicao-S2p-avd-pai', 'S4-resultados-avd-pai',
  'S2-com-edicao-tab-pai', 'S2-com-edicao-aviso-sem-rede-tab-pai', 'S2-sem-edicao-S2p-tab-pai', 'S4-resultados-tab-pai',
].map((k) => [k, 'N4-D69 — os quatro ícones de tipo trocam de desenho na mesma caixa (P-I9…P-I12)']))

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

function principal() {
  const [base, novos] = process.argv.slice(2)
  if (!base || !novos) { console.error('uso: node apps/native/scripts/g-inv-par.mjs <dir-da-base> <dir-dos-novos>'); process.exit(2) }
  const chave = (f) => f.replace(/\.xml$/, '').replace(/^[^-]+-/, '')
  const daBase = new Map(readdirSync(base).filter((f) => f.endsWith('.xml')).map((f) => [chave(f), f]))
  const dosNovos = new Map(readdirSync(novos).filter((f) => f.endsWith('.xml')).map((f) => [chave(f), f]))
  console.log(`g-inv-par — a errata em par da base do G-inv: ${Object.keys(PARES).length} dumps declarados`)
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
  if (medidos === 0) { console.log('g-inv-par: nenhum par medido — chamada que não mede nada'); process.exit(2) }
  console.log(`g-inv-par: ${medidos} medidos · ${falhas === 0 ? 'todo par provado ✓' : `${falhas} sem dump novo ou NÃO fecha ✗`}`)
  process.exit(falhas === 0 ? 0 : 1)
}

if (import.meta.url === `file://${process.argv[1]}`) principal()
