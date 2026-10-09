/**
 * Fabrica um dump com o CORPO QUEBRADO — instrumento do CN dos instrumentos da QL-PR1 (`cn-instrumentos.sh`).
 *
 * Lê o texto do nó `corpo` do dump da PAISAGEM (a base congelada, pré-QL: o texto lógico, a Letra da fixture do
 * projeto), quebra-o com a leitura de laboratório (`quebra-lab.ts`, `LAB_DEFEITO` vale) em `colunas`, e escreve uma
 * cópia do dump da FAIXA com o corpo trocado por essas linhas — num nó só (`\n` entre as linhas, como o `Text` de hoje)
 * ou, com `--multi`, um TextView por linha visual sob um ViewGroup `corpo` (uma forma que a PR-3 pode escolher).
 * Com `--referencia <arq>`, grava também o texto lógico (para o `corpo-logico.mjs`). Nada aqui sai do diretório
 * descartável do CN: o texto é da fixture, e a saída que entra no repositório é só a do gate.
 *
 * Uso: pnpm exec tsx dump-quebrado.ts <pai.xml> <faixa.xml> <saida.xml> <colunas> [--multi] [--referencia <arq>]
 */
import fs from 'node:fs'
import { quebrar } from './quebra-lab'

const [pai, faixa, saida, cols, ...resto] = process.argv.slice(2)
if (!pai || !faixa || !saida || !cols) throw new Error('uso: dump-quebrado.ts <pai.xml> <faixa.xml> <saida.xml> <colunas> [--multi] [--referencia <arq>]')
const multi = resto.includes('--multi')
const iRef = resto.indexOf('--referencia')

const des = (t: string): string => t.replace(/&#10;/g, '\n').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const esc = (t: string): string => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#10;')
const NO_CORPO = /<node\b[^>]*resource-id="[^"]*corpo"[^>]*\/>/

const xmlPai = fs.readFileSync(pai, 'utf8')
const noPai = NO_CORPO.exec(xmlPai)?.[0]
if (!noPai) throw new Error(`sem nó corpo em ${pai}`)
const texto = des(/ text="([^"]*)"/.exec(noPai)![1]!)
if (iRef >= 0) fs.writeFileSync(resto[iRef + 1]!, texto)

const linhas = quebrar(texto, 'Lyrics', Number(cols)).map((l) => l.texto)
const xmlFaixa = fs.readFileSync(faixa, 'utf8')
const noFaixa = NO_CORPO.exec(xmlFaixa)?.[0]
if (!noFaixa) throw new Error(`sem nó corpo em ${faixa}`)
let novo: string
if (!multi) {
  novo = noFaixa.replace(/ text="[^"]*"/, ` text="${esc(linhas.join('\n'))}"`)
} else {
  const filho = noFaixa.replace(/ resource-id="[^"]*"/, ' resource-id=""')
  const filhos = linhas.map((l, i) => filho.replace(/ index="\d+"/, ` index="${i}"`).replace(/ text="[^"]*"/, ` text="${esc(l)}"`)).join('')
  novo = noFaixa.replace('android.widget.TextView', 'android.view.ViewGroup').replace(/ text="[^"]*"/, ' text=""').replace(/\/>$/, '>') + filhos + '</node>'
}
fs.writeFileSync(saida, xmlFaixa.replace(noFaixa, novo))
console.log(`dump-quebrado: ${texto.split('\n').length} linhas lógicas → ${linhas.length} desenhadas em ${cols} colunas${multi ? ' (um TextView por linha)' : ''}${process.env.LAB_DEFEITO ? ` · LAB_DEFEITO=${process.env.LAB_DEFEITO}` : ''}`)
