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
 * Acréscimo da V1-PR6 (declarado): a posição de CHAVE DE OBJETO passa de
 * `titulo:`/`apoio:` para `titulo|apoio|texto|rotulo|motivo`. A varredura já
 * lia `rotulo=` e `motivo=` como PROPS de JSX e não como chaves de objeto, e
 * desde a V1-PR5 o app põe texto de UI exatamente aí — `rotulo: 'Letra'`,
 * `motivo: 'nada para mostrar…'` (`IndexScreen`), e agora `texto:` na régua de
 * seção do S4. Tudo isso passava sem ser lido. É a mesma regra 1 que a PR5
 * aplicou ao `gate:icones`: o gate vem antes do que ele mede.
 *
 * Acréscimo da W2 (declarado) — O ESCOPO, div. 123: a raiz passa de `src` para
 * `.`, porque o `App.tsx` mora um nível acima de `src/` e era invisível para
 * esta varredura como era para todas as outras. O motor NÃO muda: o controle
 * negativo do pre-check injetou `accessibilityLabel="Loading, please wait"`
 * numa cópia do `App.tsx` e esta mesma máquina acusou assim que a recebeu como
 * raiz — o que falhava era a raiz, não o vocabulário. Com a raiz `.` vêm as
 * EXCLUSÕES declaradas abaixo, senão a varredura entra no próprio `__cn__` e
 * reprova sempre.
 *
 * Acréscimo da N2-PR3 (declarado) — O ALCANCE, div. 229: a varredura passa a
 * ler também `packages/core/src/frases.ts`, que é onde mora, desde a N2-PR2,
 * **todo** o texto de UI da tela 2 — as onze frases do T2-R15 e as fixas do
 * desenho congelado. A raiz deste gate é `apps/native`, e o `frases.ts` mora
 * em `packages/core`: o conjunto fechado de frases nasceu FORA do alcance do
 * único gate que lê texto de UI, e quem o cobria era só o
 * `frases.test.ts` (registrado na div. 229 e no `PRD-TELA-2.md` T2-R15).
 *
 * **Com uma posição de texto a mais, e ela é o ponto.** Posto na lista sem
 * mais nada, o `frases.ts` era lido e examinava ZERO literais (`[medido]`:
 * "arquivos varridos: 24 · literais examinados: **72**", o mesmo número de
 * antes): as posições desta varredura são as do JSX e a chave de objeto dela
 * é a lista `titulo|apoio|texto|rotulo|motivo`, e o `FRASES` é chaveado por
 * `rede`, `auth`, `criando`… Um gate que lê o arquivo e não examina nada
 * dentro dele é instrumento quebrado — ele diria "0 acusações" sobre um
 * arquivo que nunca leu de verdade. Entra a posição `EXTRAS: valor de chave`,
 * que vale **só** nos arquivos da lista `EXTRAS` e onde **todo** valor de
 * string de uma chave de objeto é texto de UI — o que no `frases.ts` é
 * verdade por construção: o arquivo inteiro É o conjunto fechado de frases.
 *
 * O motor não muda: é a mesma máquina, com um arquivo a mais na lista. A
 * lista é FECHADA e declarada (`EXTRAS`), e só entra quando a raiz é a do
 * app — passar `scripts/__cn__` como raiz continua varrendo só o controle
 * negativo, senão os 4 acusados dele virariam outro número e o instrumento
 * deixaria de medir o que mede.
 *
 * E a ressalva que anda junto (div. 130): este gate acusa LITERAL em posição de
 * texto, e o aceite A20 é maior do que ele. O que chega à tela do músico pela
 * div. 125 é texto de UI em inglês que NÃO é literal — é valor de tempo de
 * execução, vindo da biblioteca. **Nenhum escopo o alcança**, nem este. Quem o
 * alcança é o teste `files-mensagem.test.ts`, do commit 4.
 *
 * Uso:  node scripts/a20.mjs .              → exit 0 se nenhuma acusação (com os EXTRAS)
 *       node scripts/a20.mjs scripts/__cn__ → o controle negativo: exit 1,
 *                                             4 acusações (A20Falso.tsx)
 * Como comando: `pnpm --filter native gate:a20` e `gate:a20:cn`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = process.argv[2] ?? '.'
/**
 * N2-PR3, div. 229 — os arquivos de FORA da raiz que esta varredura também
 * lê. Lista FECHADA: acrescentar um é decisão declarada, como a
 * `ANGLICISMOS_DO_PRODUTO` abaixo. Só valem quando a raiz é a do app.
 */
const EXTRAS = ['../../packages/core/src/frases.ts']
const RAIZ_DO_APP = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extras = resolve(RAIZ) === RAIZ_DO_APP ? EXTRAS.map((f) => join(RAIZ, f)) : []
/**
 * EXCLUSÕES DECLARADAS do escopo (W2). `test/` e `scripts/` não são texto que
 * o músico lê: são os testes e os próprios instrumentos — a mesma exclusão que
 * o `vitest.config.mts` e o `g2g3.sh` já declaram. O resto sai por construção.
 * Só vale para DIRETÓRIO DESCIDO: passar `scripts/__cn__` como raiz continua
 * funcionando, que é como o `gate:a20:cn` roda.
 */
const NAO_DESCER = new Set(['test', 'scripts', 'node_modules', 'android', 'ios', '.expo', '.git', 'assets'])
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
  // V1-PR6: texto de UI como VALOR de chave de objeto. `rotulo`/`motivo`
  // aparecem acima como prop de JSX (`rotulo=`); aqui são a outra metade.
  { nome: 'chave: literal',     re: /(?:titulo|apoio|texto|rotulo|motivo)\s*:\s*(?:'([^']*)'|`([^`]*)`|"([^"]*)")/g },
  { nome: '<Text> literal',     re: /<Text[^>]*>\s*([A-Za-z][^<{]*?)\s*<\/Text>/g },
  { nome: 'Alert.alert',        re: /Alert\.alert\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/g },
]
/**
 * N2-PR3, div. 229 — a posição que vale SÓ nos `EXTRAS`: todo valor de string
 * de uma chave de objeto. Casa a chave com e sem aspas (`rede:` e
 * `'limite-com-prazo':`) e a quebra de linha entre os dois-pontos e o valor
 * (o `\s` casa `\n`), que é como as frases longas do `frases.ts` estão
 * escritas. Não vale na raiz do app: lá `chave: literal` continua sendo a
 * lista fechada de cinco nomes da V1-PR6.
 */
const POSICOES_EXTRAS = [
  { nome: 'EXTRAS: valor de chave', re: /(?:^|[\s{,])'?[A-Za-z][\w-]*'?\s*:\s*(?:'((?:[^'\\]|\\.)*)'|`([^`]*)`)/gm },
]

// POSIÇÃO DE NOME DE GLIFO — isenta: é identificador de ícone, não texto.
const ISENTAS = [
  /(?:^|[^A-Za-z])name\s*=\s*(?:"[^"]*"|\{`[^`]*`\}|\{'[^']*'\})/g,   // <Icon name="zoom-in" />
  /\bglyph\s*[:=]/g, /\bicone\s*[:=]/g, /\bicon\s*[:=]/g,
]

const arquivos = []
;(function walk(d) { for (const e of readdirSync(d)) { const p = join(d, e)
  if (statSync(p).isDirectory()) { if (!NAO_DESCER.has(e)) walk(p) }
  else if (/\.tsx?$/.test(p)) arquivos.push(p) } })(RAIZ)
for (const f of extras) arquivos.push(f)

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

  for (const { nome, re, expressao } of extras.includes(f) ? [...POSICOES, ...POSICOES_EXTRAS] : POSICOES) {
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
console.log(`  escopo: ESTENDIDO (V1-A3 §A3.3 + labels em expressão, V1-PR3 + chave de objeto, V1-PR6)`)
console.log(`  raiz: ${RAIZ} · não descidos: ${[...NAO_DESCER].join(', ')} (W2, div. 123)`)
console.log(`  arquivos varridos: ${arquivos.length}` + (extras.length > 0 ? ` (inclui ${extras.length} de fora da raiz: ${EXTRAS.join(', ')} — N2-PR3, div. 229)` : ''))
console.log(`  vocabulário: ${VOCAB.length} termos · isenções do produto: ${ANGLICISMOS_DO_PRODUTO.length}`)
console.log(`  literais em posição de texto examinados: ${examinados}`)
console.log(`  acusações: ${acusacoes}`)
process.exit(acusacoes > 0 ? 1 : 0)

