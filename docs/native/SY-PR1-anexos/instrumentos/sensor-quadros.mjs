#!/usr/bin/env node
/**
 * O SENSOR DE QUADROS (SY-PR1, commit 5; SY-D6, SY-D20; `SY-PRECHECK.md` A3) — instrumento de anexo (fora de CI, lint e
 * typecheck, N4-D117). Mede o que o `dumpsys gfxinfo` não mede: o passo da THREAD DE JS. A rolagem automática do palco é
 * um `requestAnimationFrame` nessa thread (`StageScreen.tsx`, `passo`): uma tarefa de JS mais longa que um quadro faz o
 * quadro seguinte não andar. O sensor é outro laço de `requestAnimationFrame`, posto no Hermes do app pelo inspetor do
 * Metro (o CDP da QL-PR3, `custo-hermes.mjs`), que grava o instante de cada quadro; o intervalo entre dois quadros é o
 * que a rolagem sofreu. **Nenhuma linha do app muda.** Só no dev client (o release não tem inspetor, QL-D61).
 *
 * Os instantes vão em milissegundos de ÉPOCA (`Date.now()` na instalação + o `performance.now()` de cada quadro), para
 * casar com o `logcat -v epoch` do mesmo aparelho.
 *
 *   node sensor-quadros.mjs instalar            liga o laço (e zera o que havia)
 *   node sensor-quadros.mjs ler <arquivo.json>  grava os instantes em JSON e zera o buffer (o laço segue)
 *   node sensor-quadros.mjs travar <ms>         o CONTROLE (a): uma tarefa que ocupa o JS por <ms> (um laço ocupado)
 *   node sensor-quadros.mjs desligar            para o laço
 *
 * O proxy do inspetor exige `Origin` (sem ele, 401), por `127.0.0.1` (por `localhost`, 1006); o cliente é o `ws` do
 * `node_modules` (nenhuma dependência nova) — o APARATO, "O leitor que quebra (QL-PR3)".
 */
import { readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'

const [acao, arg] = process.argv.slice(2)
const PORTA = process.env.METRO ?? '8081'
const base = `http://127.0.0.1:${PORTA}`

const programas = {
  instalar: `(() => {
    const g = globalThis
    if (g.__sySensor) g.__sySensor.ligado = false
    const s = { ligado: true, base: Date.now() - performance.now(), t: [] }
    g.__sySensor = s
    const tick = () => { if (!s.ligado) return; s.t.push(performance.now()); requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
    return JSON.stringify({ instalado: true, base: s.base })
  })()`,
  ler: `(() => {
    const s = globalThis.__sySensor
    if (!s) return JSON.stringify({ erro: 'sensor não instalado' })
    const t = s.t.map((p) => Math.round((s.base + p) * 1000) / 1000)
    s.t = []
    return JSON.stringify({ ligado: s.ligado, n: t.length, t })
  })()`,
  travar: `(() => { const t0 = performance.now(); let n = 0; while (performance.now() - t0 < ${Number(arg ?? 0)}) n++; return JSON.stringify({ travou: performance.now() - t0, em: Date.now() }) })()`,
  desligar: `(() => { const s = globalThis.__sySensor; if (s) s.ligado = false; return JSON.stringify({ desligado: true }) })()`,
}
if (!(acao in programas)) throw new Error('uso: sensor-quadros.mjs instalar | ler <arquivo.json> | travar <ms> | desligar')

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
const valor = resposta.result.result.value
if (acao === 'ler') {
  if (arg === undefined) throw new Error('ler <arquivo.json>')
  writeFileSync(arg, valor)
  const r = JSON.parse(valor)
  console.log(`sensor: ${r.n} quadros → ${arg}`)
} else {
  console.log(valor)
}
