#!/usr/bin/env node
/**
 * O CUSTO de `quebrar` NO HERMES DO APARELHO (QL-PR3; o aval da QL-PR2, `QL-REQUISITOS.md` §3, a PR-3, item (3)) —
 * instrumento de anexo (fora de CI, lint e typecheck, N4-D117).
 *
 * O `custo.ts` da PR-2 mediu no Node do Mac. Aqui a MESMA função roda DENTRO DO APP, no runtime do Hermes do aparelho,
 * sem uma linha de código do app mudar: o instrumento abre o inspetor que o Metro expõe (`/json/list`, o CDP do React
 * Native) e manda um `Runtime.evaluate` que pega o módulo `packages/core/src/quebra.ts` do registro do Metro (`__r(id)`,
 * o id lido do bundle SERVIDO) e roda, para cada (texto, colunas), 100 rodadas com `performance.now()`.
 *
 * As fixtures são as do `custo.ts`, o MESMO gerador copiado abaixo — a Letra de 50 linhas (maior 77, p95 46) e a Cifra
 * de 20 pares (maior 50); a prova de que o texto é o mesmo é o `sha12` de cada uma, que o instrumento imprime e que tem
 * de ser o do `custo.ts` (6aa6914ce90f · 2355a509052d). As colunas: 80, 48, 26 e 14.
 *
 * O que ele mede, declarado: o Hermes do DEV CLIENT (o bundle de desenvolvimento, compilado no aparelho), não o do
 * release (o bytecode pré-compilado); a primeira rodada de cada par inclui a compilação preguiçosa da função — o máximo
 * a conta, como no `custo.ts` (o JIT frio do Node). Nenhuma requisição: o inspetor é o do Metro local.
 *
 * O proxy do inspetor exige o cabeçalho `Origin` (sem ele: `401 Unauthorized`), e o `WebSocket` do Node não o deixa pôr:
 * o cliente é o pacote `ws` que já está no `node_modules` do repositório (nenhuma dependência nova).
 *
 * Uso (da raiz):  node custo-hermes.mjs [porta-do-metro]      (com o app aberto no aparelho e o túnel da 8081)
 */
import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const PORTA = process.argv[2] ?? '8081'
// `127.0.0.1`, não `localhost`: com `localhost` o socket do inspetor é fechado no mesmo milissegundo em que abre (1006,
// medido nesta sessão); o proxy anuncia e aceita `http://127.0.0.1:<porta>` como origem
const base = `http://127.0.0.1:${PORTA}`

const bundle = await (await fetch(`${base}/apps/native/index.bundle?platform=android&dev=true`)).text()
const m = /\},(\d+),\[[0-9,]*\],"[^"]*packages\/core\/src\/quebra\.ts"/.exec(bundle)
if (m === null) throw new Error('o módulo quebra.ts não está no bundle servido')
const id = Number(m[1])
const alvos = await (await fetch(`${base}/json/list`)).json()
const alvo = alvos.find((t) => t.title?.startsWith('rocks.octavia.app'))
if (alvo === undefined) throw new Error(`nenhum alvo do app no inspetor: ${JSON.stringify(alvos.map((t) => t.title))}`)
console.log(`alvo: ${alvo.title} · ${alvo.description} · módulo quebra.ts = __r(${id})`)

// o gerador do custo.ts, verbatim (só sem os tipos), executado no Hermes
const programa = `(() => {
  const { quebrar } = __r(${id})
  const PALAVRAS = 'a lanterna da fixture acende o cais devagar e o vento leva o barco pela areia fria enquanto a cidade dorme sem pressa'.split(' ')
  function linha(n, semente) {
    let s = ''
    for (let k = semente; s.length < n; k++) s += (s ? ' ' : '') + PALAVRAS[k % PALAVRAS.length]
    s = s.slice(0, n)
    return s.endsWith(' ') ? s.slice(0, -1) + 'o' : s
  }
  const COMPRIMENTOS = [77, 72, 46, 46, 46, 45, 44, 44, 43, 42, 41, 40, 40, 39, 38, 38, 37, 36, 36, 35, 34, 34, 33, 32, 32,
    31, 30, 30, 29, 28, 28, 27, 26, 25, 24, 24, 23, 22, 21, 20, 18, 16, 14, 12]
  const letra = []
  COMPRIMENTOS.forEach((n, i) => {
    letra.push(linha(n, i * 3))
    if (i % 8 === 7 && letra.length < 50) letra.push('')
  })
  while (letra.length < 50) letra.push('')
  const LETRA = letra.join('\\n')
  const ACORDES = ['Am', 'F', 'C', 'G', 'Dm', 'E7', 'F#m7(11)', 'Bb']
  const cifra = []
  for (let p = 0; p < 20; p++) {
    const n = p === 0 ? 50 : 24 + ((p * 7) % 16)
    const l = linha(n, p * 5)
    let a = ''
    for (let col = 0, k = p; col < n - 2; col += 9 + (k % 5), k++) a = a.padEnd(col, ' ') + ACORDES[k % ACORDES.length]
    cifra.push(a, l)
  }
  const CIFRA = cifra.join('\\n')
  const out = { hermes: typeof HermesInternal === 'object' && HermesInternal !== null, props: null, letra: LETRA, cifra: CIFRA, linhas: [] }
  try { out.props = HermesInternal.getRuntimeProperties() } catch (e) {}
  for (const [nome, tipo, t] of [['Letra', 'Lyrics', LETRA], ['Cifra', 'Chords', CIFRA]]) {
    for (const c of [80, 48, 26, 14]) {
      const ms = []
      let n = 0
      for (let r = 0; r < 100; r++) {
        const t0 = performance.now()
        n = quebrar(t, tipo, c).length
        ms.push(performance.now() - t0)
      }
      const primeira = ms[0]
      ms.sort((x, y) => x - y)
      out.linhas.push({ nome, c, n, med: (ms[49] + ms[50]) / 2, max: ms[99], primeira })
    }
  }
  return JSON.stringify(out)
})()`

const pnpm = resolve('node_modules/.pnpm')
const dirWs = readdirSync(pnpm).filter((d) => /^ws@8\./.test(d)).sort().pop()
if (dirWs === undefined) throw new Error('o pacote ws@8 não está no node_modules')
const WS = createRequire(import.meta.url)(join(pnpm, dirWs, 'node_modules/ws'))
const ws = new WS(alvo.webSocketDebuggerUrl.replace('localhost', '127.0.0.1'), { headers: { Origin: base } })
await new Promise((ok, erro) => { ws.on('open', ok); ws.on('error', erro) })
const resposta = await new Promise((ok) => {
  ws.on('message', (dado) => {
    const msg = JSON.parse(String(dado))
    if (msg.id === 1) ok(msg)
  })
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: programa, returnByValue: true } }))
})
ws.close()
if (resposta.result?.exceptionDetails) throw new Error(JSON.stringify(resposta.result.exceptionDetails).slice(0, 600))
const r = JSON.parse(resposta.result.result.value)
const sha12 = (t) => createHash('sha256').update(t).digest('hex').slice(0, 12)
const props = r.props ?? {}
console.log(`Hermes: ${r.hermes} · ${props['OSS Release Version'] ?? '?'} · Bytecode ${props['Bytecode Version'] ?? '?'} · Build ${props.Build ?? '?'}`)
console.log(`fixtures: Letra sha12 ${sha12(r.letra)} · Cifra sha12 ${sha12(r.cifra)} (o custo.ts: 6aa6914ce90f · 2355a509052d)`)
console.log('')
console.log('texto  colunas  linhas visuais  mediana (ms)  máximo (ms)  1ª rodada (ms)  — 100 rodadas, no Hermes do aparelho')
for (const l of r.linhas) {
  console.log(`${l.nome.padEnd(6)} ${String(l.c).padStart(7)}  ${String(l.n).padStart(14)}  ${l.med.toFixed(3).padStart(12)}  ${l.max.toFixed(3).padStart(11)}  ${l.primeira.toFixed(3).padStart(14)}`)
}
const acima = r.linhas.filter((l) => l.max > 16)
console.log(acima.length === 0 ? 'nenhum número passa de 16 ms' : `PASSAM DE 16 ms: ${acima.map((l) => `${l.nome} ${l.c} (${l.max.toFixed(1)})`).join(', ')}`)
