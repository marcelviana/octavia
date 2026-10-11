/**
 * SY-PR1, commit 4 — O PRAZO DE REDE, MEDIDO (SY-D19). Instrumento de anexo (fora de CI, lint e typecheck, N4-D117).
 *
 * A pergunta da SY-D19: o `PRAZO_DE_REDE_MS` (20 s, N2-D35) cobre a resposta INTEIRA ou só até o primeiro byte? A
 * leitura (`api.ts` `prazoDe`/`get`; o `fetch` do React Native = `whatwg-fetch` sobre XHR) está no README §5. Aqui, a
 * medida, com o `api.ts` DE VERDADE do app (o `get` com o `prazoDe`), no Node — com a ressalva declarada de que o
 * `fetch` do Node (undici) não é o do aparelho:
 *
 *   (a) o mock (`aceite.py servidor`, a fixture do pre-check do N3, `hoje` = 2026-09-23) no modo `normal`: o tempo e o
 *       tamanho do `GET /api/setlists` e do `GET /api/content?…page=1`, n = 10 cada;
 *   (b) o mock no modo `atraso` (45 s antes de responder, o S1a): o `GET /api/content` do sync, como é hoje (sem prazo),
 *       e o `GET /api/setlists` com o prazo do core — a falha em 20 s é o que a PR-2 fará com o S1a;
 *   (c) um servidor que GOTEJA: o cabeçalho e o primeiro pedaço na hora, o resto a uma vazão fixa. O corpo tem
 *       52.941 B — o tamanho da página de content da CONTA DE AUDIT (66 músicas) medido no pre-check do N1
 *       (`N1-PRECHECK-anexos/A3-probe-prod.txt:14-15`), preenchido com texto do projeto. A 2.000 B/s (26,5 s) o prazo
 *       derruba no meio do corpo, se ele cobrir a resposta inteira; a 4.000 B/s (13,2 s) o mesmo pedido passa.
 *
 * Nenhuma requisição a prod: o mock e o servidor de gotas são locais (127.0.0.1).
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer as criarHttp, type Server } from 'node:http'
import { createConnection, createServer as criarTcp } from 'node:net'
import path from 'node:path'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { PRAZO_DE_REDE_MS } from '@octavia/core'

vi.mock('../../../../../apps/native/src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../../../../../apps/native/src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => 'token-sy-prazo' } },
}))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const RAIZ = path.resolve(__dirname, '../../../../..')
const ACEITE_PY = path.join(RAIZ, 'apps/native/src/fixtures/aceite.py')
const FIXTURE = process.env.SY_FIXTURE ?? ''
const BYTES_DA_CONTA = 52_941

type Api = typeof import('../../../../../apps/native/src/api')
let api: Api
const linhas: string[] = []

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

async function subirMock(modo: string, porta: number): Promise<ChildProcess> {
  const p = spawn('python3', [ACEITE_PY, 'servidor', String(porta), modo, `${FIXTURE}/setlists.json`, `${FIXTURE}/content.json`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  await new Promise<void>((resolve, reject) => {
    let saida = ''
    let pronto = false
    const t = setTimeout(() => reject(new Error(`mock não subiu: ${saida}`)), 10_000)
    const ler = (b: Buffer): void => {
      saida += b.toString()
      if (!pronto && saida.includes('fixture: servidor')) {
        pronto = true
        clearTimeout(t)
        console.log(`[mock] ${saida.trim().split('\n')[0]}`)
        resolve()
      }
    }
    p.stdout?.on('data', ler)
    p.stderr?.on('data', ler)
  })
  // pronto é RESPONDER (a linha sai antes do bind) — no `atraso` qualquer GET demora 45 s, então espera-se o socket
  for (let i = 0; i < 100; i++) {
    const ok = await new Promise<boolean>((r) => {
      const s = createConnection(porta, "127.0.0.1", () => {
        s.destroy()
        r(true)
      })
      s.once("error", () => r(false))
    })
    if (ok) return p
    await new Promise((r) => setTimeout(r, 100))
  }
  throw new Error('mock sem socket')
}

async function pararMock(p: ChildProcess): Promise<void> {
  if (p.exitCode !== null) return
  await new Promise<void>((r) => {
    p.once('exit', () => r())
    p.kill('SIGTERM')
  })
}

/** O servidor de gotas: o cabeçalho (com `content-length`) e um pedaço na hora; depois `porTick` bytes a cada 250 ms. */
function gotejar(porta: number, bytesPorSegundo: number): Promise<Server> {
  const unidade = '{"name":"texto do projeto SY-PR1, o prazo de rede","notes":null},'
  let corpo = '['
  while (corpo.length + unidade.length + 1 < BYTES_DA_CONTA) corpo += unidade
  corpo = corpo.slice(0, -1)
  corpo += `,{"name":"${'x'.repeat(BYTES_DA_CONTA - corpo.length - 13)}"}]`
  const bruto = Buffer.from(corpo)
  if (bruto.length !== BYTES_DA_CONTA) throw new Error(`corpo de ${bruto.length} B`)
  JSON.parse(corpo)
  const porTick = Math.round(bytesPorSegundo / 4)
  const s = criarHttp((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': String(bruto.length) })
    let enviado = 0
    const tick = (): void => {
      if (res.destroyed) return
      const fim = Math.min(enviado + porTick, bruto.length)
      res.write(bruto.subarray(enviado, fim))
      enviado = fim
      if (enviado >= bruto.length) res.end()
      else setTimeout(tick, 250)
    }
    tick()
    req.on('close', () => {
      if (enviado < bruto.length) console.log(`[gotas ${bytesPorSegundo} B/s] o cliente fechou com ${enviado} de ${bruto.length} B enviados`)
    })
  })
  return new Promise((r) => s.listen(porta, '127.0.0.1', () => r(s)))
}

function resumo(xs: number[]): string {
  const o = [...xs].sort((a, b) => a - b)
  const med = o.length % 2 ? o[(o.length - 1) / 2]! : (o[o.length / 2 - 1]! + o[o.length / 2]!) / 2
  return `n=${o.length} mín ${o[0]} · mediana ${med} · máx ${o[o.length - 1]} ms`
}

beforeAll(async () => {
  expect(FIXTURE, 'SY_FIXTURE=<dir com setlists.json e content.json>').not.toBe('')
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  const orig = console.log
  console.log = (...a: unknown[]): void => {
    const l = a.map(String).join(' ')
    if (l.startsWith('OCTAVIA: ')) linhas.push(l)
    orig(...a)
  }
  api = await import('../../../../../apps/native/src/api')
})


describe('SY-D19 — o prazo de rede', () => {
  it('(a) o mock normal: tempo e tamanho das duas leituras do sync (n = 10)', async () => {
    const porta = await portaLivre()
    const m = await subirMock('normal', porta)
    process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
    try {
      const bS = (await (await fetch(`http://127.0.0.1:${porta}/api/setlists`)).arrayBuffer()).byteLength
      const bC = (await (await fetch(`http://127.0.0.1:${porta}/api/content?pageSize=100&page=1&sortBy=recent`)).arrayBuffer()).byteLength
      const tS: number[] = []
      const tC: number[] = []
      for (let i = 0; i < 10; i++) {
        let t0 = Date.now()
        expect((await api.getSetlists()).ok).toBe(true)
        tS.push(Date.now() - t0)
        t0 = Date.now()
        expect((await api.getContentPage(1)).ok).toBe(true)
        tC.push(Date.now() - t0)
      }
      console.log(`[a] GET /api/setlists   ${bS} B · ${resumo(tS)}`)
      console.log(`[a] GET /api/content p1 ${bC} B · ${resumo(tC)}`)
    } finally {
      await pararMock(m)
    }
  })

  it('(b) o mock `atraso` (45 s): o GET do sync sem prazo, e o mesmo GET com o prazo do core', async () => {
    const porta = await portaLivre()
    const m = await subirMock('atraso', porta)
    process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
    try {
      let t0 = Date.now()
      const semPrazo = await api.getContentPage(1)
      const msSem = Date.now() - t0
      console.log(`[b] GET /api/content p1, como o sync pede hoje (sem prazo): ok=${semPrazo.ok} em ${msSem} ms`)
      t0 = Date.now()
      const comPrazo = await api.getSetlists({ prazoMs: PRAZO_DE_REDE_MS })
      const msCom = Date.now() - t0
      console.log(
        `[b] GET /api/setlists com o prazo do core (${PRAZO_DE_REDE_MS} ms): ok=${comPrazo.ok}` +
          `${comPrazo.ok ? '' : ` kind=${comPrazo.error.kind} status=${comPrazo.status}`} em ${msCom} ms`,
      )
      expect(semPrazo.ok).toBe(true)
      expect(msSem).toBeGreaterThanOrEqual(45_000)
      expect(comPrazo.ok).toBe(false)
      expect(msCom).toBeLessThan(25_000)
    } finally {
      await pararMock(m)
    }
  })

  it('(c) o servidor de gotas: 52.941 B a 2.000 B/s (o prazo derruba no meio do corpo?) e a 4.000 B/s (passa)', async () => {
    for (const [vazao, esperaOk] of [[2_000, false], [4_000, true]] as const) {
      const porta = await portaLivre()
      const s = await gotejar(porta, vazao)
      process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
      try {
        const antes = linhas.length
        const t0 = Date.now()
        const r = await api.getSetlists({ prazoMs: PRAZO_DE_REDE_MS })
        const ms = Date.now() - t0
        const api_ = linhas.slice(antes).filter((l) => l.includes('api status='))
        console.log(
          `[c] ${vazao} B/s (o corpo inteiro levaria ${(BYTES_DA_CONTA / vazao).toFixed(1)} s): ok=${r.ok}` +
            `${r.ok ? '' : ` kind=${r.error.kind} status=${r.status}`} em ${ms} ms · linhas api: ${JSON.stringify(api_)}`,
        )
        expect(r.ok).toBe(esperaOk)
      } finally {
        await new Promise<void>((res) => {
          s.closeAllConnections()
          s.close(() => res())
        })
      }
    }
  })
})
