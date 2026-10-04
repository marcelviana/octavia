/**
 * N4-PR5 — a garantia de todos os arquivos da biblioteca no tablet (N4-R26, N4-D42, N4-D82, N4-D88), o caso da L2 e o
 * estado de download por URL. Escrito ANTES do código: contra a `main`, reprova — o `prefetchDaBiblioteca` e o
 * `estadoDosDownloads` não existem, e o plano de hoje só cobre a janela de 7 dias.
 *
 * O que se mede, sobre o duplo do `expo-file-system`:
 *
 * - **todo arquivo da biblioteca baixa num sync**, com setlist ou sem, no armazenamento DURÁVEL — a linha do plano é
 *   `prefetch plan n=<n> reason=library` (errata em par do `reason=7d`, G3);
 * - **N4-D88**: a janela de 7 dias primeiro; o resto da biblioteca para quando o total no aparelho passa do teto — o
 *   que não coube fica não baixado, e o sinal é o `lru over` que já existe;
 * - **o LRU não despeja arquivo da biblioteca** (todos protegidos); o órfão sai;
 * - **a promoção** alcança o arquivo da biblioteca que veio sob demanda;
 * - **a L2** (`N4-PRECHECK.md` §10): o `updated_at` de uma música muda, o `file_url` não — o arquivo no disco fica,
 *   e o plano seguinte não o baixa de novo;
 * - **o estado de download por URL**: baixando enquanto o voo existe; falhou com a frase do conjunto fechado do
 *   `files.ts`; um download bem-sucedido apaga a falha; quem assina é avisado.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { __existe, __iniciados, __plantar, __plantarGrande, __reset, __responder } from './fake-expo-file-system'
import { BUCKET, amanha, content, pdfBom, setlist, song } from './ajuda'
import {
  assinarDownloads,
  ensureFile,
  estadoDosDownloads,
  filesDirs,
  hasFile,
  listFiles,
  presentUrls,
  setFilesUser,
  touch,
} from '../src/files'
import { CAP_BYTES, aplicarLru, prefetchDaBiblioteca, urlsGarantidas } from '../src/prefetch'

let n = 0
let linhas: string[] = []

beforeEach(() => {
  __reset()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-04T12:00:00Z'))
  linhas = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
  n++
  setFilesUser(`n4pr5-${n}`)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setFilesUser(null)
})

function octavia(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`))
}

/** Um nome por teste: o `emVoo` do `files.ts` é estado de módulo indexado por URL. */
function nome(s: string): string {
  return `1786220${n}-${s}.pdf`
}
function url(s: string): string {
  return `${BUCKET}/${nome(s)}`
}

/** Uma biblioteca: `d1`, `d2` numa setlist de amanhã; `b1`…`b4` só na biblioteca; uma letra sem arquivo. */
function biblioteca(): { contentById: Map<string, ContentDTO>; setlists: SetlistDTO[] } {
  const itens: ContentDTO[] = [
    { ...content('d1', url('d1')), title: 'Zeta da setlist' },
    { ...content('d2', url('d2')), title: 'Ypsilon da setlist' },
    { ...content('b1', url('b1')), title: 'Alfa da biblioteca' },
    { ...content('b2', url('b2')), title: 'Beta da biblioteca' },
    { ...content('b3', url('b3')), title: 'Gama da biblioteca' },
    { ...content('b4', url('b4')), title: 'Delta da biblioteca' },
    content('l1', null),
  ]
  return {
    contentById: new Map(itens.map((c) => [c.id, c])),
    setlists: [setlist('sl-7d', [song('s1', 1, 'd1'), song('s2', 2, 'd2')], amanha())],
  }
}

function responderTodos(bytes = 1000): void {
  for (const s of ['d1', 'd2', 'b1', 'b2', 'b3', 'b4']) __responder(url(s), { corpo: pdfBom(bytes) })
}

describe('N4-R26 — depois de um sync com rede, todo arquivo da biblioteca está no aparelho', () => {
  it('os seis baixam, no durável; a linha do plano é `reason=library` com n=6', async () => {
    const { contentById, setlists } = biblioteca()
    responderTodos()
    await prefetchDaBiblioteca(setlists, contentById)
    for (const s of ['d1', 'd2', 'b1', 'b2', 'b3', 'b4']) {
      expect(__existe(`${filesDirs().guaranteed}/${nome(s)}`)).toBe(true)
    }
    expect(octavia('prefetch plan')).toEqual(['OCTAVIA: prefetch plan n=6 reason=library'])
    expect(octavia('download-error')).toEqual([])
  })

  it('N4-D88: a janela de 7 dias começa primeiro, depois a biblioteca em ordem alfabética', async () => {
    const { contentById, setlists } = biblioteca()
    responderTodos()
    await prefetchDaBiblioteca(setlists, contentById)
    expect(__iniciados()).toEqual([nome('d1'), nome('d2'), nome('b1'), nome('b2'), nome('b4'), nome('b3')])
  })

  it('sem setlist nenhuma, a biblioteca baixa do mesmo jeito', async () => {
    const { contentById } = biblioteca()
    responderTodos()
    await prefetchDaBiblioteca([], contentById)
    expect(presentUrls().size).toBe(6)
  })

  it('o conjunto garantido (o que o LRU protege) é a biblioteca inteira', () => {
    const { contentById, setlists } = biblioteca()
    expect([...urlsGarantidas(setlists, contentById)].sort()).toEqual(
      ['d1', 'd2', 'b1', 'b2', 'b3', 'b4'].map(url).sort(),
    )
    expect(urlsGarantidas([], contentById).size).toBe(6)
  })
})

describe('N4-D88 — quando o teto não comporta', () => {
  it('a biblioteca para quando o total passa do teto; o que não coube fica não baixado; o lru over é o sinal', async () => {
    const { contentById, setlists } = biblioteca()
    responderTodos(3000)
    // Teto de 2500 B, arquivos de ≈ 3000. Os três primeiros começam juntos (concorrência 3, total 0 — o tamanho só
    // se conhece depois do download, div. 112); o primeiro que assenta já passa do teto, e o resto da biblioteca não
    // começa. O estouro é de no máximo os três que já estavam em voo (declarado no N4-PR5 §2).
    await prefetchDaBiblioteca(setlists, contentById, undefined, 2500)
    expect(__iniciados()).toEqual([nome('d1'), nome('d2'), nome('b1')])
    expect(hasFile(url('b2'))).toBe(false)
    expect(hasFile(url('b3'))).toBe(false)
    expect(hasFile(url('b4'))).toBe(false)
    aplicarLru(setlists, contentById, 2500)
    const total = listFiles().reduce((s, f) => s + f.bytes, 0)
    expect(octavia('lru over')).toEqual([`OCTAVIA: lru over bytes=${total} cap=2500 protected=6`])
    expect(octavia('lru evict')).toEqual([])
  })

  it('acima do teto, a janela de 7 dias baixa mesmo assim (prioridade); a biblioteca não', async () => {
    const { contentById, setlists } = biblioteca()
    responderTodos(1000)
    // Já no aparelho: b1 e b2, 3000 B no total — acima do teto de 2500.
    __plantarGrande(`${filesDirs().guaranteed}/${nome('b1')}`, pdfBom(400), 1500)
    __plantarGrande(`${filesDirs().guaranteed}/${nome('b2')}`, pdfBom(400), 1500)
    touch(url('b1'))
    touch(url('b2'))
    await prefetchDaBiblioteca(setlists, contentById, undefined, 2500)
    expect(__iniciados()).toEqual([nome('d1'), nome('d2')])
    expect(octavia('prefetch plan')).toEqual(['OCTAVIA: prefetch plan n=4 reason=library'])
  })

  it('o LRU não despeja arquivo da biblioteca — só o órfão', () => {
    const { contentById, setlists } = biblioteca()
    __plantarGrande(`${filesDirs().guaranteed}/${nome('b1')}`, pdfBom(400), 2000)
    touch(url('b1'))
    vi.advanceTimersByTime(1000)
    const orfao = `${BUCKET}/${nome('orfao')}`
    __plantarGrande(`${filesDirs().demand}/${nome('orfao')}`, pdfBom(400), 1000)
    touch(orfao)
    aplicarLru(setlists, contentById, 2500)
    expect(octavia('lru evict')).toEqual(['OCTAVIA: lru evict n=1 bytes=1000'])
    expect(hasFile(url('b1'))).toBe(true)
    expect(hasFile(orfao)).toBe(false)
  })

  it('o teto de verdade continua 200 MB', () => {
    expect(CAP_BYTES).toBe(200 * 1024 * 1024)
  })
})

describe('a promoção alcança o arquivo da biblioteca que veio sob demanda', () => {
  it('um arquivo só da biblioteca no purgável vai para o durável', async () => {
    const { contentById } = biblioteca()
    responderTodos()
    __plantar(`${filesDirs().demand}/${nome('b3')}`, pdfBom(1000))
    touch(url('b3'))
    await prefetchDaBiblioteca([], contentById)
    expect(octavia('prefetch promote')).toEqual(['OCTAVIA: prefetch promote n=1'])
    expect(__existe(`${filesDirs().guaranteed}/${nome('b3')}`)).toBe(true)
    expect(__existe(`${filesDirs().demand}/${nome('b3')}`)).toBe(false)
  })
})

describe('L2 — o `updated_at` muda, o `file_url` não: o arquivo no disco fica', () => {
  it('depois do sync com a música mudada, o arquivo está lá, nada baixa de novo, e o LRU não o toca', async () => {
    const { contentById, setlists } = biblioteca()
    responderTodos()
    await prefetchDaBiblioteca(setlists, contentById)
    const antes = __iniciados().length
    expect(antes).toBe(6)

    // O sync seguinte traz `b2` com outro `updated_at` (favoritar no web, por exemplo — N4-D39) e o MESMO arquivo.
    const b2 = contentById.get('b2')!
    const mudada = new Map(contentById)
    mudada.set('b2', { ...b2, updated_at: '2026-10-04T13:00:00.000+00:00', title: 'Beta renomeada' })
    linhas = []
    await prefetchDaBiblioteca(setlists, mudada)
    aplicarLru(setlists, mudada)

    expect(hasFile(url('b2'))).toBe(true)
    expect(__existe(`${filesDirs().guaranteed}/${nome('b2')}`)).toBe(true)
    expect(__iniciados().length).toBe(antes)
    expect(octavia('prefetch plan')).toEqual(['OCTAVIA: prefetch plan n=0 reason=library'])
    expect(octavia('lru')).toEqual([])
  })
})

describe('o estado de download por URL (o que a linha de L e V vão ler na PR-7/PR-8)', () => {
  it('baixando enquanto o voo existe; ao assentar, sai do conjunto; quem assina é avisado', async () => {
    const u = url('lento')
    __responder(u, { corpo: pdfBom(1000), pedacos: 2, atrasoMs: 1_000 })
    let avisos = 0
    const sair = assinarDownloads(() => {
      avisos++
    })
    const voo = ensureFile(u, { guaranteed: true })
    expect(estadoDosDownloads().baixando.has(u)).toBe(true)
    await vi.advanceTimersByTimeAsync(5_000)
    await voo
    expect(estadoDosDownloads().baixando.has(u)).toBe(false)
    expect(estadoDosDownloads().falhas.has(u)).toBe(false)
    expect(avisos).toBeGreaterThanOrEqual(2)
    sair()
  })

  it('falhou: o 404 fica com a frase do conjunto fechado; o próximo download bem-sucedido apaga a falha', async () => {
    const u = url('quatrocentosequatro')
    __responder(u, { corpo: '', status: 404 })
    await expect(ensureFile(u, { guaranteed: true })).rejects.toThrow()
    expect(estadoDosDownloads().falhas.get(u)).toBe('o servidor respondeu 404')
    __responder(u, { corpo: pdfBom(500) })
    await ensureFile(u, { guaranteed: true })
    expect(estadoDosDownloads().falhas.has(u)).toBe(false)
  })

  it('a falha do plano de prefetch também fica registrada (é o mesmo `ensureFile`)', async () => {
    const { contentById } = biblioteca()
    responderTodos()
    __responder(url('b4'), { corpo: '', status: 404 })
    await prefetchDaBiblioteca([], contentById)
    expect(estadoDosDownloads().falhas.get(url('b4'))).toBe('o servidor respondeu 404')
    expect(octavia('download-error')).toHaveLength(1)
  })
})
