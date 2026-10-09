#!/usr/bin/env node
/**
 * O CORPO DO DUMP, PELO TEXTO LÓGICO — comprimento e `sha12` — bloco QL, PR-1 (QL-D16; A-QL-5; A-QL-16).
 *
 * Até aqui o comprimento com `sha12` do nó `corpo` era um passo de sessão, escrito de novo a cada prova (o M2 da D-0,
 * `D0-ENCERRAMENTO-anexos/m2/README.md`; `N4-BRIEF-anexos/instrumentos/prova7.py`; `N4-ENCERRAMENTO-anexos/
 * instrumentos/prova-dado-real.py`): o texto do nó, `len` e `sha256[:12]`, comparados com os do cache. Com a quebra
 * (QL) o nó deixa de ter o texto — tem as linhas visuais —, e os números do nó deixam de ser os da música. Este é o
 * instrumento versionado, e compara o TEXTO LÓGICO: o desenho vale como a referência quando é uma QUEBRA dela
 * (`texto-logico.mjs`, `ehQuebraDe`).
 *
 * Uso (da raiz):
 *   node apps/native/scripts/corpo-logico.mjs <dump.xml> [--referencia <arquivo>]
 *
 *   <dump.xml>     um `uiautomator dump` com o nó `corpo` (o palco ou V)
 *   --referencia   o texto da música (o `bodyOf` do item no cache), num arquivo — FORA do repositório: é a letra.
 *
 * Saída — **só números, nunca o texto** (regra 10): as linhas desenhadas, o `len` e o `sha12` do desenho (`\n` entre
 * as linhas); com a referência, os dela, e o veredito: `= referência` com o número de continuações, ou ✗. Sem a
 * referência o instrumento não afirma texto lógico nenhum — o texto não se reconstrói só do desenho (div. 1199) — e
 * diz isso. Exit 1 se o desenho não é quebra da referência; 2 se a chamada não mede nada (sem dump, sem `corpo`).
 */
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { ehQuebraDe } from './texto-logico.mjs'

function uso(msg) {
  console.error(`corpo-logico.mjs: ${msg}`)
  console.error('uso: node apps/native/scripts/corpo-logico.mjs <dump.xml> [--referencia <arquivo>]')
  process.exit(2)
}
const args = process.argv.slice(2)
let dump = null
let ref = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--referencia' && args[i + 1]) ref = args[++i]
  else if (dump === null && !args[i].startsWith('--')) dump = args[i]
  else uso(`argumento desconhecido: ${args[i]}`)
}
if (dump === null) uso('falta o <dump.xml>')
for (const f of [dump, ...(ref ? [ref] : [])]) if (!existsSync(f)) uso(`não existe: ${f}`)

const ent = (t) => t.replace(/&#10;/g, '\n').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const sha12 = (t) => createHash('sha256').update(t, 'utf8').digest('hex').slice(0, 12)

// As linhas desenhadas sob o `resource-id` corpo: cada TextView sob ele é um bloco de texto, partido no `\n` (a mesma
// leitura do G-N3). Uma pilha de ids acima, como o `idAcima` do G-N3.
const xml = readFileSync(dump, 'utf8')
const pilha = []
const linhas = []
let nos = 0
for (const m of xml.matchAll(/<node\b([^>]*?)(\/?)>|<\/node>/g)) {
  if (m[0] === '</node>') { pilha.pop(); continue }
  const a = {}
  for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]] = x[2]
  const id = (a['resource-id'] ?? '').replace(/^.*:id\//, '')
  const sob = id === 'corpo' || pilha.some((p) => p === 'corpo')
  if (sob && (a.class ?? '').endsWith('TextView')) {
    nos++
    linhas.push(...ent(a.text ?? '').split('\n'))
  }
  if (m[2] !== '/') pilha.push(id)
}
if (nos === 0) uso(`nenhum TextView sob o id corpo em ${dump}`)

const desenho = linhas.join('\n')
console.log(`corpo: ${nos} nó(s) · ${linhas.length} linhas desenhadas · desenho len=${desenho.length} sha12=${sha12(desenho)}`)
if (ref === null) {
  console.log('sem --referencia: o texto lógico não se afirma só do desenho (div. 1199) — os números acima são do DESENHO')
  process.exit(0)
}
const texto = readFileSync(ref, 'utf8')
console.log(`referência: ${texto.split('\n').length} linhas lógicas · len=${texto.length} sha12=${sha12(texto)}`)
const r = ehQuebraDe(linhas, texto)
if (r.ok) {
  console.log(`corpo-logico: o desenho é ${r.continuacoes === 0 ? 'o próprio texto' : 'uma quebra do texto'} — texto lógico len=${texto.length} sha12=${sha12(texto)} = referência · ${r.continuacoes} continuações ✓`)
} else {
  console.log(`corpo-logico: ✗ ${r.motivo}`)
  process.exitCode = 1
}
