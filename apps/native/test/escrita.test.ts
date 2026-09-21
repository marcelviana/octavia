/**
 * CONTROLES NEGATIVOS DA ESCRITA — N2-PR2, T2-R9…R13, N2-D9, N2-D13, N2-D18,
 * N2-D22. Vêm ANTES do código que medem: contra a árvore de hoje, os treze
 * reprovam por ausência do módulo (`src/escrita.ts` não existe).
 *
 * O MECANISMO é o da N2-PR1 (`sync-t1r10.test.ts`): o mock de
 * `src/fixtures/aceite.py`, agora com as seis rotas de escrita e um modelo em
 * memória — sem o modelo, "o cache é igual ao 200 da releitura" passaria por
 * acaso, porque um mock que responde 201 e não muda nada devolve no `GET`
 * exatamente o que já estava lá.
 *
 * O que roda de verdade: `escrever()` (`src/escrita.ts`), a camada `api.ts`
 * com o `fetch` do Node, a classificação do core e o `store.ts` sobre o duplo
 * do `expo-file-system`. O que é duplo: o Firebase (tokens que MUDAM a cada
 * chamada — sem isso o T1-R3 pararia em `n=1` e o CN do 401 não veria o
 * limite), a sessão (um espião, que é o instrumento da N2-D9) e o
 * `expo-network`.
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { Directory, File, Paths, __reset } from './fake-expo-file-system'

/** O espião da N2-D9: quem chama isto é o app deslogando. */
const deslogou = vi.fn()
vi.mock('../src/session', () => ({ signOutSession: async () => { deslogou() } }))

/**
 * Token DIFERENTE a cada chamada. É o que exercita o caminho inteiro do
 * T1-R3 no 401: o 1º 401 pede renovação, o token novo é diferente, o
 * `authFetch` refaz UMA vez, o 2º 401 chega e para — `n=2`. Com um token
 * constante o caminho pararia em `n=1` (é o que a nota do `api.ts` já
 * registra para o caminho de dev do A2).
 */
let tokens = 0
vi.mock('../src/firebase', () => ({
  auth: { currentUser: { getIdToken: async () => `token-cn-escrita-${++tokens}` } },
}))

let online = true
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: online, isInternetReachable: online }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))

const ACEITE_PY = path.resolve(__dirname, '../src/fixtures/aceite.py')
const UID = 'cn-escrita'
const T0 = '2026-09-01T00:00:00.000+00:00'

type Escrita = typeof import('../src/escrita')
let mod: Escrita
let porta = 0
let dir = ''
let servidor: ChildProcess | null = null
let linhas: string[] = []

function content(id: string, title: string): ContentDTO {
  return {
    id,
    title,
    artist: null,
    album: null,
    content_type: 'Lyrics',
    content_data: { lyrics: `letra de ${title}` },
    file_url: null,
    updated_at: T0,
  }
}

function setlist(id: string, nome: string, songs: number): SetlistDTO {
  return {
    id,
    name: nome,
    performance_date: null,
    venue: null,
    updated_at: T0,
    setlist_songs: Array.from({ length: songs }, (_, i) => ({
      id: `${id}-ss-${i + 1}`,
      setlist_id: id,
      content_id: `c-${i + 1}`,
      position: i + 1,
      notes: null,
      content: null,
    })),
  }
}

const BIBLIOTECA = [content('c-1', 'Primeira'), content('c-2', 'Segunda'), content('c-3', 'Terceira')]
const SL = 'aaaaaaaa-1111-4222-8333-444455556666'

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

/** Sobe (ou re-sobe) o mock no modo pedido, servindo estes dois conjuntos. */
async function servir(modo: string, setlists: SetlistDTO[] = [setlist(SL, 'Show', 2)]): Promise<void> {
  await parar()
  const fs = path.join(dir, 'setlists.json')
  const fc = path.join(dir, 'content.json')
  writeFileSync(fs, JSON.stringify(setlists))
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
  // A linha sai ANTES do bind (`aceite.py`): pronto é RESPONDER.
  const limite = Date.now() + 10_000
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${porta}/api/setlists`)
      if (r.status === 200 || r.status === 401 || r.status === 500) return
    } catch {
      // ainda não aceita conexão
    }
    if (s.exitCode !== null || Date.now() > limite) throw new Error('mock não aceitou conexão')
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

/** O conjunto que o servidor tem AGORA, lido fora do app. */
async function doServidor(): Promise<SetlistDTO[]> {
  const r = await fetch(`http://127.0.0.1:${porta}/api/setlists`)
  return (await r.json()) as SetlistDTO[]
}

/** O `setlists.json` do cache local, como o app o gravou. */
function doCache(): { setlists: SetlistDTO[]; syncedAtMs: number | null } | null {
  const f = new File(new Directory(Paths.document, `octavia-${UID}`), 'setlists.json')
  if (!f.exists) return null
  return JSON.parse(f.textSync())
}

/** O `content.json`, para o A21: a escrita não pode tocá-lo. */
function contentDoCache(): string | null {
  const f = new File(new Directory(Paths.document, `octavia-${UID}`), 'content.json')
  return f.exists ? f.textSync() : null
}

/** O conjunto sem o `content` embutido — o que o `store` grava (T1-R8). */
function semEmbutido(setlists: SetlistDTO[]): SetlistDTO[] {
  return JSON.parse(
    JSON.stringify(setlists.map((s) => ({ ...s, setlist_songs: s.setlist_songs.map((x) => ({ ...x, content: null })) }))),
  )
}

function so(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`)).map((l) => l.slice('OCTAVIA: '.length))
}

/** O estado local de onde toda escrita parte. */
async function estadoInicial(): Promise<import('../src/escrita').EstadoLocal> {
  const setlists = await doServidor()
  return { uid: UID, setlists: semEmbutido(setlists), content: BIBLIOTECA, syncedAtMs: 1 }
}

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'cn-escrita-'))
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
  online = true
  deslogou.mockClear()
  mod.limparGatesDeEscrita()
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('T2-R9 / N2-D13 — depois de todo 2xx, o cache vem da RELEITURA', () => {
  it('criar: o GET acontece e o cache fica igual ao 200 dele (conjunto, não arquivo)', async () => {
    await servir('escrita')
    const estado = await estadoInicial()
    const saida = await mod.escrever(mod.pedidoCriar({ name: 'Season 4', performance_date: null }), estado)

    expect(saida.resultado.especie).toBe('ok')
    // O `cmp` é do CONJUNTO: o `syncedAtMs` muda a cada gravação (regra da
    // N2-PR1), então comparar o arquivo byte a byte mediria o relógio.
    expect(doCache()?.setlists).toEqual(semEmbutido(await doServidor()))
    expect(saida.setlists).toEqual(semEmbutido(await doServidor()))
    // A setlist nova está no topo (`created_at desc`, route.ts:38).
    expect(doCache()?.setlists[0]?.name).toBe('Season 4')
    // T1-R10 ligado: a criação invalida exatamente um item.
    expect(so('cache write kind=setlists')).toEqual(['cache write kind=setlists n=2 invalidated=1'])
  })

  it('a escrita NÃO toca o content.json (N2-D13: a releitura é só de setlists)', async () => {
    await servir('escrita')
    const estado = await estadoInicial()
    const antes = contentDoCache()
    await mod.escrever(mod.pedidoAdicionar(SL, 'c-3'), estado)
    expect(contentDoCache()).toBe(antes)
    expect(so('cache write kind=content')).toEqual([])
  })

  it('nenhuma escrita grava o cache fora do caminho da releitura', async () => {
    await servir('escrita-500')
    const estado = await estadoInicial()
    const saida = await mod.escrever(mod.pedidoCriar({ name: 'x', performance_date: null }), estado)
    expect(saida.resultado.especie).toBe('servidor')
    // 500 não relê: o cache nem chega a existir.
    expect(doCache()).toBeNull()
    expect(so('cache write')).toEqual([])
  })

  it('N2-D22 — 2xx com a releitura em 500: "salvo, não relido", cache intacto, GET refeito ao reabrir', async () => {
    await servir('escrita-resync-500')
    const estado = await estadoInicial()
    const saida = await mod.escrever(mod.pedidoCriar({ name: 'Season 4', performance_date: null }), estado)

    expect(saida.resultado.especie).toBe('ok-nao-relido')
    expect(saida.setlists).toBeNull()
    expect(doCache()).toBeNull() // nada foi gravado: o cache anterior é o que vale
    expect(so('resync')).toEqual([
      expect.stringMatching(/^resync kind=setlists reason=write op=create status=500 setlists=- ms=\d+$/),
    ])
    // E reabrir a tela refaz o GET (`reason=reopen`, com `op=-`).
    linhas = []
    await mod.relerAoAbrir(estado)
    expect(so('resync')).toEqual([
      expect.stringMatching(/^resync kind=setlists reason=reopen op=- status=500 setlists=- ms=\d+$/),
    ])
  })
})

describe('T2-R13 / N2-D9 — 401 numa escrita NÃO desloga', () => {
  it('CONTROLE POSITIVO: no caminho de LEITURA o 401 desloga', async () => {
    await servir('401')
    const r = await mod.relerAoAbrir({ uid: UID, setlists: [], content: [], syncedAtMs: null })
    expect(r).toBeNull()
    expect(deslogou).toHaveBeenCalled()
  })

  it('CN: na escrita o mesmo 401 duplo NÃO chama o logout, e são 2 requests', async () => {
    await servir('escrita-401')
    const estado = await estadoInicial()
    const saida = await mod.escrever(mod.pedidoCriar({ name: 'x', performance_date: null }), estado)

    expect(saida.resultado.especie).toBe('auth')
    expect(deslogou).not.toHaveBeenCalled()
    expect(linhas.join('\n')).not.toContain('auth-failure')
    expect(linhas.join('\n')).not.toContain('login-screen')
    // T1-R3 continua valendo: a original e UMA depois de renovar. Nunca 3.
    expect(so('api status=401')).toEqual([
      expect.stringMatching(/^api status=401 path=\/api\/setlists n=2 ms=\d+$/),
    ])
    // E a leitura seguinte continua saindo, com a sessão de pé.
    linhas = []
    await servir('escrita')
    expect(await mod.relerAoAbrir(estado)).not.toBeNull()
    expect(deslogou).not.toHaveBeenCalled()
  })
})

describe('T2-R3 / A-N2-24 — nada mudou: zero request e nenhuma linha `write op=`', () => {
  it('abrir a edição e sair sem mudar nada', async () => {
    await servir('escrita')
    const noServidor = { name: 'Show', performance_date: null }
    const p = mod.prepararEdicao(SL, noServidor, { ...noServidor })

    expect(p.enviar).toBe(false)
    expect(so('write blocked')).toEqual(['write blocked op=update reason=nada-mudou'])
    expect(so('write op=')).toEqual([])
    expect(so('api ')).toEqual([])
    expect(doCache()).toBeNull()
  })

  it('e um caractere mudado gera o PUT, só com o campo mudado', async () => {
    await servir('escrita')
    const p = mod.prepararEdicao(SL, { name: 'Show', performance_date: null }, { name: 'Show!', performance_date: null })
    expect(p.enviar).toBe(true)
    if (p.enviar) expect(p.pedido.body).toBe('{"name":"Show!"}')
    expect(so('write blocked')).toEqual([])
  })
})

describe('N2-D18 — o servidor gravou e a resposta não chegou', () => {
  it('"grava e corta": espécie rede, e o GET seguinte mostra o item gravado', async () => {
    await servir('escrita-corta')
    const estado = await estadoInicial()
    const saida = await mod.escrever(mod.pedidoAdicionar(SL, 'c-3'), estado)

    expect(saida.resultado.especie).toBe('rede')
    expect(saida.resultado.podeTerGravado).toBe(true)
    expect(saida.setlists).toBeNull()
    expect(doCache()).toBeNull()
    // A prova de que o caso é o da N2-D18, e não um request que não saiu:
    const agora = await doServidor()
    expect(agora[0]?.setlist_songs).toHaveLength(3)
    expect(so('write op=')).toEqual([
      expect.stringMatching(/^write op=add setlist=aaaaaaaa items=- status=net code=net ms=\d+$/),
    ])
  })
})

describe('T2-R8 — reordenar é UM request por gesto concluído', () => {
  it('mover a 8 para a 2 numa setlist de 60 sai como um PUT …/songs/order', async () => {
    const grande = setlist(SL, 'Sessenta', 60)
    await servir('escrita', [grande])
    const estado = await estadoInicial()
    const ordem = grande.setlist_songs.map((s) => s.id)
    const [oitava] = ordem.splice(7, 1)
    ordem.splice(1, 0, oitava as string)

    const saida = await mod.escrever(mod.pedidoReordenar(SL, ordem), estado)

    expect(saida.resultado.especie).toBe('ok')
    expect(so('api status=200 path=/api/setlists/aaaaaaaa/songs/order')).toHaveLength(1)
    expect(so('write op=reorder')).toEqual([
      expect.stringMatching(/^write op=reorder setlist=aaaaaaaa items=60 status=200 code=- ms=\d+$/),
    ])
    expect(saida.setlists?.[0]?.setlist_songs[1]?.id).toBe(`${SL}-ss-8`)
  })
})

describe('T2-R10 — 404 numa escrita: relê e diz que sumiu', () => {
  it('apagar uma setlist que já não existe volta relido, sem auth-failure', async () => {
    await servir('escrita-404')
    const estado = await estadoInicial()
    const saida = await mod.escrever(mod.pedidoApagar(SL), estado)

    expect(saida.resultado.especie).toBe('sumiu')
    expect(deslogou).not.toHaveBeenCalled()
    // O 404 dispara a MESMA releitura do T2-R9 (aqui ela volta 200).
    expect(so('resync')).toEqual([
      expect.stringMatching(/^resync kind=setlists reason=404 op=delete status=200 setlists=1 ms=\d+$/),
    ])
  })
})

describe('T2-R12 / T2-R14 — as escritas barradas, sem request nenhum', () => {
  it('offline: zero linhas `api` e `write op=`, e o motivo no log', async () => {
    await servir('escrita')
    online = false
    const estado = await estadoInicial()
    linhas = []
    const saida = await mod.escrever(mod.pedidoCriar({ name: 'x', performance_date: null }), estado)

    expect(saida.resultado.especie).toBe('rede')
    expect(so('write blocked')).toEqual(['write blocked op=create reason=offline'])
    expect(so('api ')).toEqual([])
    expect(so('write op=')).toEqual([])
  })

  it('429: o prazo fecha a família inteira, e a escrita seguinte nem sai (T2-R14)', async () => {
    await servir('escrita-429')
    const estado = await estadoInicial()
    const primeira = await mod.escrever(mod.pedidoAdicionar(SL, 'c-1'), estado)

    expect(primeira.resultado.especie).toBe('limite')
    expect(primeira.resultado.retryAfter).toBe(30)
    expect(so('ratelimit')).toEqual(['ratelimit retry-after=30 family=setlist-mutate'])

    linhas = []
    const segunda = await mod.escrever(mod.pedidoCriar({ name: 'x', performance_date: null }), estado)
    expect(segunda.resultado.especie).toBe('limite')
    expect(so('write blocked')).toEqual(['write blocked op=create reason=ratelimit'])
    expect(so('api ')).toEqual([])

    // A LEITURA não é bloqueada: é outra família (`setlist-read`).
    await servir('escrita')
    expect(await mod.relerAoAbrir(estado)).not.toBeNull()
  })

  it('uma escrita por vez: com outra em voo, o segundo controle não gera request (T2-R11)', async () => {
    await servir('escrita')
    const estado = await estadoInicial()
    const emVoo = mod.escrever(mod.pedidoAdicionar(SL, 'c-1'), estado)
    const segunda = await mod.escrever(mod.pedidoAdicionar(SL, 'c-2'), estado)
    await emVoo

    expect(segunda.resultado.especie).toBe('rede')
    expect(so('write blocked')).toEqual(['write blocked op=add reason=busy'])
    expect(so('write op=')).toHaveLength(1)
  })
})

/**
 * O ESCOPO DA TRAVA — `DESIGN-N2/telas.html`, legenda de `N2-P-relendo`,
 * verbatim: *"As outras linhas **seguem ativas**: a releitura de uma adição
 * não congela o picker."*
 *
 * O T2-R11 diz "uma escrita por vez", e a leitura óbvia — travar da primeira
 * linha à última — contradiz o congelado: a releitura da N2-D13 é um `GET` de
 * ~50 KB, e segurar o picker por ela transformaria "adicionar 10 músicas" em
 * dez esperas. **A trava é do REQUEST, não da operação inteira.**
 *
 * Os três CNs abaixo medem isso, e o terceiro mede o preço de encurtá-la:
 * com duas releituras em voo, a que chega por último pode trazer uma foto
 * mais VELHA do servidor.
 */
describe('T2-R11 — a trava cobre o request, não a releitura (N2-P-relendo)', () => {
  /** Espera uma condição do log, sem relógio fixo: o mock é rápido demais. */
  async function ate(condicao: () => boolean, oQue: string): Promise<void> {
    const limite = Date.now() + 5_000
    while (!condicao()) {
      if (Date.now() > limite) throw new Error(`não aconteceu em 5 s: ${oQue}`)
      await new Promise((r) => setTimeout(r, 5))
    }
  }

  it('uma segunda adição é ACEITA enquanto a releitura da primeira está em voo', async () => {
    await servir('escrita-releitura-fora-de-ordem')
    const estado = await estadoInicial()

    const primeira = mod.escrever(mod.pedidoAdicionar(SL, 'c-1'), estado)
    // O `write op=add` sai quando o REQUEST da primeira voltou; a releitura
    // dela ainda está em voo (o mock a segura por 600 ms).
    await ate(() => so('write op=add').length === 1, 'o request da primeira voltar')
    expect(so('resync')).toEqual([]) // a releitura da primeira NÃO voltou ainda

    const segunda = await mod.escrever(mod.pedidoAdicionar(SL, 'c-2'), estado)
    await primeira

    // O que o congelado exige: a segunda linha do picker seguia ativa.
    expect(segunda.resultado.especie).not.toBe('rede')
    expect(so('write blocked')).toEqual([])
    expect(so('write op=add')).toHaveLength(2)
  })

  it('duas releituras se SOBREPÕEM — e são duas, não uma enfileirada atrás da outra', async () => {
    await servir('escrita-releitura-fora-de-ordem')
    const estado = await estadoInicial()

    const primeira = mod.escrever(mod.pedidoAdicionar(SL, 'c-1'), estado)
    await ate(() => so('write op=add').length === 1, 'o request da primeira voltar')
    const segunda = mod.escrever(mod.pedidoAdicionar(SL, 'c-2'), estado)
    await Promise.all([primeira, segunda])

    // Duas releituras, e a EMITIDA primeiro chega por último (o mock a
    // segura): é a inversão que uma rede real produz sozinha.
    const resyncs = so('resync')
    expect(resyncs).toHaveLength(2)
    const ms = resyncs.map((l) => Number(/ ms=(\d+)$/.exec(l)?.[1] ?? 0))
    expect(Math.max(...ms)).toBeGreaterThan(500)
    expect(Math.min(...ms)).toBeLessThan(500)
  })

  it('e o cache acaba igual ao ÚLTIMO 200, não ao último a chegar', async () => {
    await servir('escrita-releitura-fora-de-ordem')
    const estado = await estadoInicial()

    const primeira = mod.escrever(mod.pedidoAdicionar(SL, 'c-1'), estado)
    await ate(() => so('write op=add').length === 1, 'o request da primeira voltar')
    const segunda = mod.escrever(mod.pedidoAdicionar(SL, 'c-2'), estado)
    const [r1, r2] = await Promise.all([primeira, segunda])

    // As duas adições entraram no servidor; o cache tem de mostrar as duas.
    // Sem ordem entre releituras, a que foi emitida primeiro chega por último
    // — com a foto de ANTES da segunda adição — e sobrescreve a que já
    // trouxe as duas.
    const noServidor = await doServidor()
    expect(noServidor[0]?.setlist_songs).toHaveLength(4)
    expect(doCache()?.setlists).toEqual(semEmbutido(noServidor))

    // A assinatura do descarte, sem campo novo na linha: DUAS releituras
    // voltaram 200 e só UMA gravou.
    expect(so('resync')).toHaveLength(2)
    expect(so('resync').every((l) => l.includes('status=200'))).toBe(true)
    expect(so('cache write kind=setlists')).toHaveLength(1)

    // E a escrita cuja releitura foi descartada continua `ok`: ela FOI
    // relida, por uma foto melhor. Chamá-la de "não relida" seria mentir ao
    // contrário — tudo funcionou.
    expect(r1.resultado.especie).toBe('ok')
    expect(r2.resultado.especie).toBe('ok')
  })
})

describe('regras 2 e 4 do catálogo — o que NUNCA entra no log', () => {
  it('nenhuma linha nova carrega uuid inteiro, nome de setlist ou token', async () => {
    await servir('escrita')
    const estado = await estadoInicial()
    await mod.escrever(mod.pedidoCriar({ name: 'Season 4 do Marcel', performance_date: null }), estado)
    await mod.escrever(mod.pedidoAdicionar(SL, 'c-1'), estado)

    const tudo = [...so('write '), ...so('resync '), ...so('api ')].join('\n')
    expect(tudo).not.toContain(SL)
    expect(tudo).not.toContain('Season 4')
    expect(tudo).not.toMatch(/token/)
    expect(tudo).not.toMatch(/eyJ/)
    // O path das rotas de escrita leva o `<id8>`, nunca o uuid (T2-R16).
    expect(so('api ').some((l) => l.includes('path=/api/setlists/aaaaaaaa/songs'))).toBe(true)
  })
})
