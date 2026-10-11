/**
 * SY-PR2, commit 5 — A DIV. 1269 MEDIDA: o relógio do prazo de rede começa ANTES do token (SY-D41 (1)). Instrumento de
 * anexo (fora de CI, N4-D117), com o `api.ts` e o `sync.ts` DE VERDADE do app, no Node.
 *
 * O `get()` do `api.ts` liga o `AbortController` (`prazoDe`) e só então chama o `authFetch`, que pede o token
 * (`getIdToken`; a renovação, quando falta ≤ 5 min, vai ao Google) e faz o `fetch`. O `abort` só corta o `fetch`. Aqui
 * o duplo do Firebase ATRASA o `getIdToken` — o que uma renovação lenta faria (o `requestStsToken` do SDK, que tem o
 * prazo próprio de 60 s no React Native: `SY-PR2-anexos/README.md`, a div. 1269) — e um servidor local atrasa a resposta.
 * Cada caso é UM sync (`sincronizar`), com o tempo até a linha final, as linhas `api`, e quantas requisições o servidor
 * de fato recebeu:
 *
 *   (a) token na hora, servidor 18 s           → ok em ~18 s × 2 (os 20 s são da API, por requisição)
 *   (b) token 5 s, servidor 18 s               → falha em ~20 s: o token comeu 5 dos 20
 *   (c) token 25 s (passa do prazo), servidor na hora → falha em ~25 s, NÃO em 20: o `fetch` sai com o sinal já
 *       abortado e rejeita na hora — e o servidor não recebe nada
 *
 * A ressalva da SY-PR1 vale (div. 1270): o `fetch` do Node não é o do aparelho. Aqui o que importa é o relógio e o
 * sinal, que são do `api.ts`; no aparelho o `whatwg-fetch` rejeita do mesmo jeito com o sinal já abortado
 * (`fetch.umd.js:536-538`).
 */
import { createServer, type Server } from 'node:http'
import { createServer as criarTcp } from 'node:net'
import { afterAll, beforeAll, describe, it, vi } from 'vitest'
import { __reset } from '../../../../../apps/native/test/fake-expo-file-system'
import { musica, setlistCom } from '../../../../../apps/native/test/sy-arnes'

let atrasoDoToken = 0
vi.mock('../../../../../apps/native/src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../../../../../apps/native/src/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: async () => {
        await new Promise((r) => setTimeout(r, atrasoDoToken))
        return 'token-sy-prazo-token'
      },
    },
  },
}))
// o `expo-network` é o duplo do projeto, por alias na configuração (a rede de pé)

const BIB = [musica(1), musica(2)]
const SL = [setlistCom('efefefef-1111-4222-8333-444455556666', 'SY prazo', BIB.map((c) => c.id))]
let atrasoDoServidor = 0
let recebidas = 0
let servidor: Server

function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = criarTcp()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const e = s.address()
      const p = typeof e === 'object' && e !== null ? e.port : 0
      s.close(() => resolve(p))
    })
  })
}

beforeAll(async () => {
  const porta = await portaLivre()
  servidor = createServer((req, res) => {
    recebidas++
    const corpo = String(req.url).startsWith('/api/setlists')
      ? JSON.stringify(SL)
      : JSON.stringify({ data: BIB, total: BIB.length, page: 1, pageSize: 100, hasMore: false, totalPages: 1 })
    setTimeout(() => {
      if (res.destroyed) return
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(corpo)
    }, atrasoDoServidor)
  })
  await new Promise<void>((r) => servidor.listen(porta, '127.0.0.1', () => r()))
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  __reset()
})
afterAll(() => {
  servidor.closeAllConnections()
  servidor.close()
})

describe('a div. 1269 — o prazo com o token dentro', () => {
  it('três casos, um sync cada', async () => {
    const { sincronizar } = await import('../../../../../apps/native/src/sync')
    const { PRAZO_DE_REDE_MS } = await import('@octavia/core')
    const saida: string[] = [`PRAZO_DE_REDE_MS = ${PRAZO_DE_REDE_MS}`]
    let linhas: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...x: unknown[]) => {
      const l = x.map(String).join(' ')
      if (l.startsWith('OCTAVIA: ')) linhas.push(l.slice('OCTAVIA: '.length))
    })
    for (const [rotulo, token, srv] of [
      ['(a) token na hora, servidor 18 s', 0, 18_000],
      ['(b) token 5 s, servidor 18 s', 5_000, 18_000],
      ['(c) token 25 s, servidor na hora', 25_000, 0],
    ] as const) {
      atrasoDoToken = token
      atrasoDoServidor = srv
      recebidas = 0
      linhas = []
      const t0 = performance.now()
      const r = await sincronizar('sy-prazo-token', null)
      const ms = Math.round(performance.now() - t0)
      saida.push('', rotulo, `  resultado: ${r.kind}${r.kind === 'failed' ? ` stage=${r.stage} falhaDeRede=${r.falhaDeRede}` : ''} · ${ms} ms · requisições que o servidor recebeu: ${recebidas}`)
      for (const l of linhas) saida.push(`  ${l.replace(/ ms=\d+| t=\d+/g, (m) => m)}`)
    }
    console.info(`\n### PRAZO-TOKEN ###\n${saida.join('\n')}\n### FIM ###`)
  })
})
