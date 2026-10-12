#!/usr/bin/env node
/**
 * SY-PR2 — O VOO NO APARELHO: dois pedidos durante um sync, pela MESMA função que o *Tentar novamente* chama.
 * Instrumento de anexo (fora de CI, lint e typecheck, N4-D117); só no dev client (o inspetor do Metro, QL-D61).
 *
 * O botão *Tentar novamente* só existe em estado de falha (`SetlistsScreen.tsx`: o banner de S1 com cache, `:612-628`, e
 * o `tentar` de S1 sem cache, `:656`): no instante em que ele é tocado, o `setSync({ fase: 'sincronizando' })` do
 * executor o tira da tela, e um segundo toque durante o sync não tem onde cair. O que prova o mesmo, sem mudar o app:
 * achar na árvore do React (pelo `__REACT_DEVTOOLS_GLOBAL_HOOK__` do dev client) a prop `onTentarNovamente` da tela S1 —
 * a função que o `onPress` do botão chama (o `tentarNovamente` do `App.tsx`, que chama o `rodarSync` com a raiz de
 * verdade) — e chamá-la, pelo inspetor do Metro (o CDP da QL-PR3; o cliente é o `ws` do `node_modules`), N vezes com
 * um intervalo, durante um sync segurado pelo mock. **Nenhuma linha do app muda.**
 *
 *   node pedir-pelo-botao.mjs achar              diz se achou a prop, e em que componente
 *   node pedir-pelo-botao.mjs pedir <n> <ms>     agenda n chamadas da função, com <ms> entre elas
 *   node pedir-pelo-botao.mjs ler                os instantes (época, ms) em que cada chamada aconteceu
 */
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const [acao, nArg, msArg] = process.argv.slice(2)
const base = `http://127.0.0.1:${process.env.METRO ?? '8081'}`

const achar = `(() => {
  const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__
  if (!hook || typeof hook.getFiberRoots !== 'function') return { erro: 'sem o hook do React DevTools (getFiberRoots)' }
  const ids = hook.renderers ? [...hook.renderers.keys()] : [1]
  for (const id of ids) {
    for (const raiz of hook.getFiberRoots(id)) {
      const pilha = [raiz.current]
      while (pilha.length > 0) {
        const f = pilha.pop()
        if (f === null || f === undefined) continue
        const p = f.memoizedProps
        if (p !== null && typeof p === 'object' && typeof p.onTentarNovamente === 'function' && 'sync' in p) {
          const nome = typeof f.type === 'function' ? (f.type.displayName || f.type.name) : String(f.type)
          return { fn: p.onTentarNovamente, nome, fase: p.sync && p.sync.fase }
        }
        if (f.sibling) pilha.push(f.sibling)
        if (f.child) pilha.push(f.child)
      }
    }
  }
  return { erro: 'nenhum componente com onTentarNovamente e sync nas props' }
})()`

const programas = {
  achar: `(() => { const r = ${achar}; return JSON.stringify(r.erro ? r : { achou: r.nome, fase: r.fase }) })()`,
  // as chamadas se AGENDAM (setTimeout) e cada uma grava o seu instante em `globalThis.__syPedidos`; o `ler` os devolve
  // (a primeira forma esperava uma promessa pelo CDP, e o Hermes devolveu a promessa serializada, sem os instantes)
  pedir: `(() => {
    const r = ${achar}
    if (r.erro) return JSON.stringify(r)
    const reg = (globalThis.__syPedidos = { componente: r.nome, faseAntes: r.fase, em: [] })
    for (let k = 0; k < ${Number(nArg ?? 1)}; k++) {
      setTimeout(() => { reg.em.push(Date.now()); r.fn() }, k * ${Number(msArg ?? 0)})
    }
    return JSON.stringify({ agendadas: ${Number(nArg ?? 1)}, componente: r.nome, faseAntes: r.fase })
  })()`,
  ler: `JSON.stringify(globalThis.__syPedidos ?? { erro: 'nada agendado' })`,
}
if (!(acao in programas)) throw new Error('uso: pedir-pelo-botao.mjs achar | pedir <n> <ms> | ler')

const alvos = await (await fetch(`${base}/json/list`)).json()
const alvo = alvos.find((t) => t.title?.startsWith('rocks.octavia.app'))
if (alvo === undefined) throw new Error(`nenhum alvo do app no inspetor: ${JSON.stringify(alvos.map((t) => t.title))}`)
const pnpm = resolve('node_modules/.pnpm')
const dirWs = readdirSync(pnpm).filter((d) => /^ws@8\./.test(d)).sort().pop()
if (dirWs === undefined) throw new Error('o pacote ws@8 não está no node_modules')
const WS = createRequire(import.meta.url)(join(pnpm, dirWs, 'node_modules/ws'))
const ws = new WS(alvo.webSocketDebuggerUrl.replace('localhost', '127.0.0.1'), { headers: { Origin: base } })
await new Promise((ok, erro) => {
  ws.on('open', ok)
  ws.on('error', erro)
})
const resposta = await new Promise((ok) => {
  ws.on('message', (dado) => {
    const msg = JSON.parse(String(dado))
    if (msg.id === 1) ok(msg)
  })
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: programas[acao], returnByValue: true } }))
})
ws.close()
if (resposta.result?.exceptionDetails) throw new Error(JSON.stringify(resposta.result.exceptionDetails).slice(0, 600))
console.log(resposta.result.result.value)
