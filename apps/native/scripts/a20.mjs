#!/usr/bin/env node
/**
 * G4 — a varredura A20 ESTENDIDA (V1-PR3, commit 5), versionada a partir do
 * desenho do `V1-PRECHECK-anexos/V1-A3-instrumento-a20.txt` §A3.3.
 *
 * O A20 do PRD: nenhum literal de UI em inglês. Três diferenças para a
 * varredura do N1:
 *
 *  1. cobre `accessibilityLabel` e `accessibilityHint` — com ícone, cada
 *     controle ganha um label, e é onde o inglês entra sem ninguém ver,
 *     porque o texto some da tela;
 *  2. cobre `Alert.alert(` — o RN mostra o título e o corpo;
 *  3. distingue NOME DE GLIFO de TEXTO DE UI: `name="zoom-in"` e qualquer
 *     literal em POSIÇÃO DE NOME DE GLIFO é ISENTO por construção.
 *
 * Acréscimo da V1-PR3 ao desenho (declarado): um `accessibilityLabel={…}`
 * cujo valor é uma EXPRESSÃO (ternário sobre o estado do controle, como os
 * sete do palco) tem TODOS os seus literais examinados, um a um — senão os
 * sete rótulos do S3 passariam sem serem lidos.
 *
 * Uso:  node scripts/a20.mjs src            → exit 0 se nenhuma acusação
 *       node scripts/a20.mjs scripts/__cn__ → o controle negativo: exit 1,
 *                                             3 acusações (A20Falso.tsx)
 * Como comando: `pnpm --filter native gate:a20` e `gate:a20:cn`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const RAIZ = process.argv[2] ?? 'src'
const VOCAB = ['loading','error','retry','search','no results','cancel','save','delete',
  'back','next','done','close','settings','offline','download','failed','submit','continue',
  'confirm','yes','try again','sign in','log in','log out','sign out','play','pause','home',
  'empty','not found','unknown','refresh','send','edit','add','remove','open','page','of',
  'song','theme','light','zoom in','zoom out','previous']

/**
 * ISENÇÃO DE VOCABULÁRIO — anglicismos do PRODUTO, todos ancorados no design
 * congelado (o A20 do N1 já os declarava: Auto-scroll, Zoom, SETLISTS, Email,
 * Tab). Não são "literal de UI em inglês": são o nome que o produto usa em
 * pt-BR. Lista FECHADA — acrescentar um item é errata declarada.
 */
const ANGLICISMOS_DO_PRODUTO = ['setlist','setlists','auto-scroll','zoom','email','tab','offline','pdf','online']

// POSIÇÕES DE TEXTO: o que o usuário lê ou o leitor de tela fala.
const POSICOES = [
  { nome: 'accessibilityLabel', re: /accessibilityLabel\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g },
  { nome: 'accessibilityHint',  re: /accessibilityHint\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g },
  // V1-PR3: o label como EXPRESSÃO — `accessibilityLabel={a ? 'x' : b ? 'y' : 'z'}`.
  // Cada literal entre aspas simples dentro das chaves é examinado (ver abaixo).
  { nome: 'accessibilityLabel{…}', re: /accessibility(?:Label|Hint)\s*=\s*\{([^}]*)\}/g, expressao: true },
  { nome: 'placeholder',        re: /placeholder\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g },
  { nome: 'rotulo',             re: /rotulo\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g },
  { nome: 'motivo',             re: /motivo\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g },
  { nome: 'titulo:/apoio:',     re: /(?:titulo|apoio)\s*:\s*(?:'([^']*)'|`([^`]*)`|"([^"]*)")/g },
  { nome: '<Text> literal',     re: /<Text[^>]*>\s*([A-Za-z][^<{]*?)\s*<\/Text>/g },
  { nome: 'Alert.alert',        re: /Alert\.alert\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/g },
]
// POSIÇÃO DE NOME DE GLIFO — isenta: é identificador de ícone, não texto.
const ISENTAS = [
  /(?:^|[^A-Za-z])name\s*=\s*(?:"[^"]*"|\{`[^`]*`\}|\{'[^']*'\})/g,   // <Icon name="zoom-in" />
  /\bglyph\s*[:=]/g, /\bicone\s*[:=]/g, /\bicon\s*[:=]/g,
]

const arquivos = []
;(function walk(d) { for (const e of readdirSync(d)) { const p = join(d, e)
  if (statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(p)) arquivos.push(p) } })(RAIZ)

let acusacoes = 0, examinados = 0
for (const f of arquivos.sort()) {
  const bruto = readFileSync(f, 'utf8')
  // tira comentários: comentário não é texto de UI
  const src = bruto.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
                   .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length))
  // marca os trechos ISENTOS (posição de nome de glifo) para não acusá-los
  const isento = new Array(src.length).fill(false)
  for (const re of ISENTAS) for (const m of src.matchAll(re))
    for (let i = m.index; i < m.index + m[0].length; i++) isento[i] = true

  for (const { nome, re, expressao } of POSICOES) {
    for (const m of src.matchAll(re)) {
      if (isento[m.index]) continue
      // Numa expressão, cada literal `'…'` conta como um texto examinado.
      const literais = expressao === true
        ? [...(m[1] ?? '').matchAll(/'([^']*)'/g)].map((x) => x[1])
        : [m[1] ?? m[2] ?? m[3] ?? '']
      for (const s0 of literais) {
      const s = s0.trim()
      if (!s) continue
      examinados++
      const baixo = s.toLowerCase()
      // Casa SEMPRE contra o literal ORIGINAL (o termo mais longo primeiro, para
      // que "zoom in" ganhe de "zoom"), e só então pergunta se o termo casado é
      // um anglicismo do produto. Apagar o anglicismo ANTES de casar engolia o
      // inglês de verdade: "Zoom in" virava " in" e passava — medido no
      // controle negativo do V1-PRECHECK A3.3.
      const hit = [...VOCAB].sort((a, b) => b.length - a.length)
        .find(v => new RegExp(`(^|[^a-zà-ÿ])${v}([^a-zà-ÿ]|$)`, 'i').test(baixo))
      const isentoPorProduto = hit !== undefined && ANGLICISMOS_DO_PRODUTO.includes(hit)
      if (hit && isentoPorProduto) continue
      if (hit) {
        const ln = src.slice(0, m.index).split('\n').length
        console.log(`  ACUSADO ${f}:${ln} [${nome}] ${JSON.stringify(s)} ← termo "${hit}"`)
        acusacoes++
      }
      }
    }
  }
}
console.log(`  escopo: ESTENDIDO (V1-A3 §A3.3 + labels em expressão, V1-PR3)`)
console.log(`  arquivos varridos: ${arquivos.length}`)
console.log(`  vocabulário: ${VOCAB.length} termos · isenções do produto: ${ANGLICISMOS_DO_PRODUTO.length}`)
console.log(`  literais em posição de texto examinados: ${examinados}`)
console.log(`  acusações: ${acusacoes}`)
process.exit(acusacoes > 0 ? 1 : 0)

