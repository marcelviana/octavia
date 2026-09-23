/**
 * CONTROLE NEGATIVO DO PRAZO DE REDE — N2-PR4, div. 262/263 (N2-D35).
 *
 * **O que a medição do §1 achou.** Nem o `createAuthFetch` do core
 * (`packages/core/src/auth-fetch.ts`, o arquivo inteiro: sem `signal`, sem
 * `AbortController`, sem relógio) nem a camada de rede do app
 * (`api.ts:104` e `:134`, `fetch(path, init as RequestInit)`) têm prazo.
 * O `fetch` do React Native no Android é OkHttp com os três tempos zerados,
 * e zero em OkHttp quer dizer **sem limite**. Logo: um servidor que aceita a
 * conexão e não responde deixa a escrita em voo **para sempre**, e a folha
 * fica em "Salvando no servidor…" sem botão para sair — o `Cancelar` some
 * enquanto a escrita voa (regra 1 do congelado), de propósito.
 *
 * Este arquivo mede as duas metades da decisão:
 *
 *  1. **o prazo existe e vale 20 s** — com o mock `escrita-pendurada`, e com
 *     o relógio de verdade. É o único teste caro da suíte (≈20 s), e o custo
 *     é deliberado: encurtar o prazo aqui mediria um número que o app não
 *     usa. O `PRAZO_DE_REDE_MS` é do core e o CN afirma o valor dele;
 *  2. **o prazo cobre a RELEITURA também** (T2-R9), pelo mock
 *     `resync-pendurado` — e este roda com um prazo curto passado pela
 *     chamada, porque o que se mede aqui é a ligação, não o número.
 *
 * Contra a árvore de hoje o arquivo inteiro reprova: `PRAZO_DE_REDE_MS` não
 * existe no core e `escrever` não aceita `prazoMs`.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PRAZO_DE_REDE_MS, type ContentDTO, type SetlistDTO } from '@octavia/core'
import { __reset } from './fake-expo-file-system'

const deslogou = vi.fn()
vi.mock('../src/session', () => ({ signOutSession: async () => { deslogou() } }))
let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-prazo-${++tokens}` } },
}))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const ACEITE_PY = path.resolve(__dirname, '../src/fixtures/aceite.py')
const UID = 'cn-prazo'
const T0 = '2026-09-01T00:00:00.000+00:00'
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'

type Escrita = typeof import('../src/escrita')
let mod: Escrita
let porta = 0
let dir = ''
let servidor: ChildProcess | null = null
let linhas: string[] = []

function content(id: string, title: string): ContentDTO {
  return {
    id, title, artist: null, album: null,
    content_type: 'Lyrics', content_data: { lyrics: `letra de ${title}` },
    file_url: null, updated_at: T0,
  }
}

function setlist(id: string, nome: string): SetlistDTO {
  return {
    id, name: nome, performance_date: null, venue: null, updated_at: T0,
    setlist_songs: [{ id: `${id}-ss-1`, setlist_id: id, content_id: 'c-1', position: 1, notes: null, content: null }],
  }
}

const BIBLIOTECA = [content('c-1', 'Primeira')]

function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = createServer()
    s.once('error', reject)
    s.listen(0, '127.0.0.1', () => {
      const e = s.address()
      const p = typeof e === 'object' && e !== null ? e.port : 0
      s.close(() => resolve(p))
    })
  })
}

async function parar(): Promise<void> {
  const s = servidor
  servidor = null
  if (s === null || s.exitCode !== null) return
  await new Promise<void>((resolve) => {
    s.once('exit', () => resolve())
    s.kill('SIGTERM')
  })
}

async function servir(modo: string): Promise<void> {
  await parar()
  const fs = path.join(dir, 'setlists.json')
  const fc = path.join(dir, 'content.json')
  writeFileSync(fs, JSON.stringify([setlist(SL, 'Show')]))
  writeFileSync(fc, JSON.stringify(BIBLIOTECA))
  const s = spawn('python3', [ACEITE_PY, 'servidor', String(porta), modo, fs, fc], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  servidor = s
  await new Promise<void>((resolve, reject) => {
    let saida = ''
    const t = setTimeout(() => reject(new Error(`mock não subiu: ${saida}`)), 10_000)
    const ler = (b: Buffer): void => {
      saida += b.toString()
      if (saida.includes('fixture: servidor')) {
        clearTimeout(t)
        resolve()
      }
    }
    s.stdout?.on('data', ler)
    s.stderr?.on('data', ler)
    s.once('exit', (code) => {
      clearTimeout(t)
      reject(new Error(`mock saiu com ${code}: ${saida}`))
    })
  })
  const limite = Date.now() + 10_000
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${porta}/api/setlists`)
      if (r.status === 200) return
    } catch {
      // ainda não aceita conexão
    }
    if (s.exitCode !== null || Date.now() > limite) throw new Error('mock não aceitou conexão')
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}

function estado(): { uid: string; setlists: SetlistDTO[]; content: ContentDTO[]; syncedAtMs: number } {
  return { uid: UID, setlists: [setlist(SL, 'Show')], content: BIBLIOTECA, syncedAtMs: 1 }
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-prazo-'))
  porta = await portaLivre()
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  mod = await import('../src/escrita')
})

afterAll(async () => {
  await parar()
  rmSync(dir, { recursive: true, force: true })
})

beforeEach(() => {
  __reset()
  linhas = []
  mod.limparGatesDeEscrita()
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('N2-D35 — o prazo de rede de uma escrita', () => {
  it('o número é do CORE, e é 20 s', () => {
    // Um prazo que cada chamador escolhesse seria cinco prazos diferentes na
    // primeira PR que esquecesse de passar o dele.
    expect(PRAZO_DE_REDE_MS).toBe(20_000)
  })

  it(
    'servidor mudo: a escrita desiste em ≤ 20 s, com espécie `rede` e `status=net`',
    async () => {
      await servir('escrita-pendurada')
      const t0 = Date.now()
      const saida = await mod.escrever(mod.pedidoAtualizar(SL, { name: 'Outro nome' }), estado())
      const ms = Date.now() - t0

      // A espécie é `rede`: a operação não aconteceu, e não é erro do
      // servidor — o servidor não disse nada.
      expect(saida.resultado.especie).toBe('rede')
      expect(saida.resultado.status).toBeNull()
      // N2-E19: a request saiu e não voltou — "sem resposta", não "nada foi salvo".
      expect(saida.resultado.frase).toBe('sem resposta do servidor')
      // Um `PUT` repetido não duplica: não há "pode já ter sido gravada".
      expect(saida.resultado.podeTerGravado).toBe(false)
      expect(so('write op=update')).toHaveLength(1)
      expect(so('write op=update')[0]).toMatch(
        /^write op=update setlist=aaaaaaaa items=- status=net code=net ms=\d+$/,
      )
      // O prazo é ESTE, e não um menor que passaria por acaso: entre 19 s e
      // 20 s + folga. Sem o piso, um `AbortController` disparando na hora
      // também passaria, e o CN não distinguiria "tem prazo" de "não tem
      // rede".
      expect(ms).toBeGreaterThan(19_000)
      expect(ms).toBeLessThan(PRAZO_DE_REDE_MS + 4_000)
      // Nada foi gravado e ninguém deslogou.
      expect(deslogou).not.toHaveBeenCalled()
    },
    40_000,
  )

  it('a RELEITURA tem o mesmo prazo: 2xx com o `GET` mudo vira `ok-nao-relido`', async () => {
    await servir('resync-pendurado')
    // Prazo curto passado pela chamada — aqui se mede a LIGAÇÃO (a releitura
    // desiste), não o número, que o primeiro `it` já afirma.
    const saida = await mod.escrever(mod.pedidoAtualizar(SL, { name: 'Outro nome' }), estado(), {
      prazoMs: 400,
    })
    expect(saida.resultado.especie).toBe('ok-nao-relido')
    expect(so('write op=update')[0]).toMatch(/ status=200 code=- /)
    // A linha da releitura sai com `status=net`: ela foi emitida e não voltou.
    expect(so('resync kind=setlists')).toHaveLength(1)
    expect(so('resync kind=setlists')[0]).toMatch(
      /^resync kind=setlists reason=write op=update status=net setlists=- ms=\d+$/,
    )
    // E o cache NÃO mudou: quem grava é a releitura (T2-R9), e ela não voltou.
    expect(saida.setlists).toBeNull()
  })

  /**
   * **O NÚMERO na releitura, e o caminho `reopen` — div. 272.**
   *
   * O `it` acima prova a LIGAÇÃO com um prazo curto passado pela chamada;
   * este prova que o prazo que roda **de verdade** é o do core, nos DOIS
   * caminhos de leitura pós-escrita, e com o relógio.
   *
   * **O `reopen` é o que não tinha cobertura nenhuma de prazo**, e é o mais
   * exposto: ele é o `GET` que as QUATRO telas disparam pelo botão
   * `Tentar recarregar` (`SetlistsScreen.tsx:377`, `IndexScreen.tsx:379`,
   * `DialogoDeApagar.tsx:87`, `FolhaDeCriar.tsx:212`), todas chamando
   * `relerAoAbrir(estado)` **sem o segundo argumento**. Quem põe o prazo ali
   * é o DEFAULT do parâmetro de `reler`, e default que ninguém mede é
   * promessa, não garantia — ainda mais um que atravessa duas funções e um
   * `?:` opcional até chegar ao `AbortController`.
   *
   * Por que os dois num `it` só: o segundo depende do estado que o primeiro
   * deixa (é a espécie `ok-nao-relido` que faz a tela oferecer
   * `Tentar recarregar`), são 20 s cada de qualquer forma, e partir em dois
   * perderia a sequência que o congelado desenha.
   */
  it(
    'o prazo da releitura é o do CORE (20 s), e vale também no `reopen`',
    async () => {
      await servir('resync-pendurado')

      // 1) a releitura POR ESCRITA, sem prazo passado pela chamada.
      const t0 = Date.now()
      const saida = await mod.escrever(mod.pedidoAtualizar(SL, { name: 'Outro nome' }), estado())
      const msEscrita = Date.now() - t0
      expect(saida.resultado.especie).toBe('ok-nao-relido')
      expect(so('resync kind=setlists')[0]).toMatch(
        /^resync kind=setlists reason=write op=update status=net setlists=- ms=\d+$/,
      )
      expect(msEscrita).toBeGreaterThan(19_000)
      expect(msEscrita).toBeLessThan(PRAZO_DE_REDE_MS + 4_000)

      // 2) o `reopen` — o que o botão `Tentar recarregar` das telas chama.
      linhas = []
      const t1 = Date.now()
      const novas = await mod.relerAoAbrir(estado())
      const msReopen = Date.now() - t1
      expect(novas).toBeNull()
      expect(so('resync kind=setlists')).toHaveLength(1)
      expect(so('resync kind=setlists')[0]).toMatch(
        /^resync kind=setlists reason=reopen op=- status=net setlists=- ms=\d+$/,
      )
      expect(msReopen).toBeGreaterThan(19_000)
      expect(msReopen).toBeLessThan(PRAZO_DE_REDE_MS + 4_000)
    },
    70_000,
  )
})
