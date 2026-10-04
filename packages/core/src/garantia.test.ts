/**
 * N4-PR5 — a garantia de todos os arquivos da biblioteca (N4-R26, N4-D42, N4-D82, N4-D88) e o estado do arquivo por
 * música (N4-R6, N4-R15, N4-D43), no core. Escrito ANTES do código: contra a `main`, o arquivo reprova —
 * `urlsDaBiblioteca`, `planoDaBiblioteca` e `estadoDoArquivo` não existem.
 *
 * - **O conjunto garantido** (A-N4-26, a parte do core): **todo `file_url` com `body === 'file'`** da biblioteca —
 *   não mais só a janela de 7 dias. Texto, inválido e item sem arquivo ficam fora.
 * - **O plano** (N4-D88, `[Marcel, 2026-10-04]`): primeiro os arquivos da janela de 7 dias (a ordem de hoje, a do
 *   `selectPrefetch`), depois o resto da biblioteca na ordem da biblioteca (alfabética, N4-R4); o que já está no
 *   aparelho não entra; URL repetida, uma vez.
 * - **O LRU não despeja garantido**: com todo arquivo da biblioteca protegido, só o órfão (arquivo de música que
 *   saiu da biblioteca) é despejável.
 * - **O estado do arquivo**: sem arquivo · formato (pela extensão, N4-D43) · baixado · baixando · falhou (com o
 *   motivo, o conjunto fechado do `files.ts`) · não baixado.
 */
import { describe, expect, it } from 'vitest'
import {
  ehFormatoQueOAppMostra,
  estadoDoArquivo,
  lruEvict,
  planoDaBiblioteca,
  selectPrefetch,
  urlsDaBiblioteca,
} from './offline'
import type { ContentDTO, ContentType, SetlistDTO } from './types'

const T0 = '2026-09-01T00:00:00.000+00:00'
const H = 'https://h/storage/v1/object/public/content-files'

function c(id: string, title: string, tipo: ContentType | string, url: string | null, data: unknown = null): ContentDTO {
  return {
    id,
    title,
    artist: null,
    album: null,
    content_type: tipo as ContentType,
    content_data: data as ContentDTO['content_data'],
    file_url: url,
    updated_at: T0,
  }
}

function setlist(id: string, data: string | null, ids: string[]): SetlistDTO {
  return {
    id,
    name: id,
    performance_date: data,
    venue: null,
    updated_at: T0,
    setlist_songs: ids.map((cid, i) => ({
      id: `${id}-${i}`,
      setlist_id: id,
      content_id: cid,
      position: i + 1,
      notes: null,
      content: null,
    })),
  }
}

const BIBLIOTECA: ContentDTO[] = [
  c('p-z', 'Zabumba (partitura)', 'Sheet', `${H}/z.pdf`),
  c('p-a', 'Abertura (partitura)', 'Sheet', `${H}/a.pdf`),
  c('ce', 'Cifra escaneada', 'Chords', `${H}/cifra.pdf`), // `content_data` null + arquivo: body file
  c('l', 'Letra', 'Lyrics', null, { lyrics: 'texto' }),
  c('lf', 'Letra com arquivo', 'Lyrics', `${H}/letra.pdf`, { lyrics: 'texto' }), // body text: o arquivo não conta
  c('inv', 'Partitura sem arquivo', 'Sheet', null), // no-body
  c('m', 'Matriz (partitura)', 'Sheet', `${H}/m.pdf`),
  c('dup', 'Duplicata da Abertura', 'Sheet', `${H}/a.pdf`),
  c('img', 'Partitura em imagem', 'Sheet', `${H}/foto.JPG`),
]
const POR_ID = new Map(BIBLIOTECA.map((x) => [x.id, x]))
const HOJE = '2026-10-04'

describe('o conjunto garantido = todo file_url com body === "file" (A-N4-26, core)', () => {
  it('a biblioteca inteira, não a janela de 7 dias', () => {
    expect([...urlsDaBiblioteca(BIBLIOTECA)].sort()).toEqual(
      [`${H}/a.pdf`, `${H}/cifra.pdf`, `${H}/foto.JPG`, `${H}/m.pdf`, `${H}/z.pdf`].sort(),
    )
  })

  it('sem setlist nenhuma, o conjunto é o mesmo (a garantia não depende de setlist)', () => {
    expect(urlsDaBiblioteca(BIBLIOTECA).size).toBe(5)
    expect(selectPrefetch([], POR_ID, new Set(), HOJE)).toEqual([])
  })
})

describe('N4-D88 — o plano: a janela de 7 dias primeiro, depois a biblioteca em ordem alfabética', () => {
  const S7 = setlist('s7', '2026-10-06', ['m', 'ce']) // dentro da janela
  const SV = setlist('sv', null, ['z']) // sem data

  it('7d na ordem de hoje (position), depois o resto pela ordem da biblioteca, sem repetir', () => {
    const plano = planoDaBiblioteca([S7, SV], POR_ID, new Set(), HOJE)
    expect(plano).toEqual([
      { url: `${H}/m.pdf`, prioridade: '7d' },
      { url: `${H}/cifra.pdf`, prioridade: '7d' },
      { url: `${H}/a.pdf`, prioridade: 'biblioteca' }, // Abertura
      { url: `${H}/foto.JPG`, prioridade: 'biblioteca' }, // Partitura em imagem
      { url: `${H}/z.pdf`, prioridade: 'biblioteca' }, // Zabumba
    ])
  })

  it('o que já está no aparelho não entra', () => {
    const plano = planoDaBiblioteca([S7], POR_ID, new Set([`${H}/m.pdf`, `${H}/a.pdf`]), HOJE)
    expect(plano.map((p) => p.url)).toEqual([`${H}/cifra.pdf`, `${H}/foto.JPG`, `${H}/z.pdf`])
  })

  it('fora da janela, a setlist datada não tem prioridade: tudo é biblioteca', () => {
    const passada = setlist('sp', '2026-01-01', ['z'])
    expect(planoDaBiblioteca([passada], POR_ID, new Set(), HOJE).every((p) => p.prioridade === 'biblioteca')).toBe(true)
  })

  it('a janela de 7 dias continua UMA definição: os 7d do plano são o selectPrefetch', () => {
    const plano = planoDaBiblioteca([S7, SV], POR_ID, new Set(), HOJE)
    expect(plano.filter((p) => p.prioridade === '7d').map((p) => p.url)).toEqual(
      selectPrefetch([S7, SV], POR_ID, new Set(), HOJE).map((i) => i.url),
    )
  })
})

describe('o LRU não despeja garantido; só o órfão sai', () => {
  it('acima do teto, com todo arquivo da biblioteca protegido, o órfão é a única vítima', () => {
    const garantidas = urlsDaBiblioteca(BIBLIOTECA)
    const files = [
      { url: `${H}/a.pdf`, bytes: 60, lastUsedMs: 1 },
      { url: `${H}/z.pdf`, bytes: 60, lastUsedMs: 2 },
      { url: `${H}/orfao.pdf`, bytes: 30, lastUsedMs: 3 },
    ]
    expect(lruEvict(files, 100, garantidas)).toEqual({ evict: [`${H}/orfao.pdf`], bytesAfter: 120 })
  })
})

describe('o estado do arquivo por música', () => {
  const vazio = { baixando: new Set<string>(), falhas: new Map<string, string>() }

  it('sem arquivo: texto, inválido', () => {
    expect(estadoDoArquivo(POR_ID.get('l')!, new Set(), vazio)).toEqual({ tipo: 'sem-arquivo' })
    expect(estadoDoArquivo(POR_ID.get('lf')!, new Set(), vazio)).toEqual({ tipo: 'sem-arquivo' })
    expect(estadoDoArquivo(POR_ID.get('inv')!, new Set(), vazio)).toEqual({ tipo: 'sem-arquivo' })
  })

  it('formato que o app ainda não mostra, pela extensão (N4-D43) — antes de qualquer estado de disco', () => {
    const img = POR_ID.get('img')!
    expect(estadoDoArquivo(img, new Set([`${H}/foto.JPG`]), vazio)).toEqual({ tipo: 'formato', nome: 'foto.JPG' })
    expect(ehFormatoQueOAppMostra(`${H}/a.pdf`)).toBe(true)
    expect(ehFormatoQueOAppMostra(`${H}/A.PDF?token=1`)).toBe(true)
    for (const u of [`${H}/x.png`, `${H}/x.docx`, `${H}/x.txt`, `${H}/sem-extensao`, `${H}/pdf`]) {
      expect(ehFormatoQueOAppMostra(u)).toBe(false)
    }
  })

  it('baixado · baixando · falhou com o motivo · não baixado', () => {
    const p = POR_ID.get('p-a')!
    const url = `${H}/a.pdf`
    expect(estadoDoArquivo(p, new Set([url]), vazio)).toEqual({ tipo: 'baixado' })
    expect(estadoDoArquivo(p, new Set(), { ...vazio, baixando: new Set([url]) })).toEqual({ tipo: 'baixando' })
    expect(
      estadoDoArquivo(p, new Set(), { ...vazio, falhas: new Map([[url, 'o servidor respondeu 404']]) }),
    ).toEqual({ tipo: 'falhou', motivo: 'o servidor respondeu 404' })
    expect(estadoDoArquivo(p, new Set(), vazio)).toEqual({ tipo: 'nao-baixado' })
  })

  it('a precedência: baixado vence baixando e falhou; baixando (a nova tentativa) vence a falha anterior', () => {
    const p = POR_ID.get('p-a')!
    const url = `${H}/a.pdf`
    const tudo = { baixando: new Set([url]), falhas: new Map([[url, 'não consegui baixar']]) }
    expect(estadoDoArquivo(p, new Set([url]), tudo)).toEqual({ tipo: 'baixado' })
    expect(estadoDoArquivo(p, new Set(), tudo)).toEqual({ tipo: 'baixando' })
  })
})
