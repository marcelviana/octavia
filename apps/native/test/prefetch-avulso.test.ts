/**
 * N4-PR6 — div. 964: o prefetch sob demanda do palco avulso SEM hospedeira baixa ESTA música, e só ela.
 *
 * Hoje o avulso aberto de S1 pega emprestada a primeira setlist da lista (`navigation.tsx`), e o `prefetchDemanda`
 * do palco baixa os arquivos DELA a partir da posição da busca — no AVD, abrir a letra "Manhã de ensaio" pela busca
 * de S1 tentava baixar o `nao-existe.pdf` da setlist alheia (`N4-PR6-anexos/README.md` §2). Sem setlist, o plano é
 * o arquivo desta música, se ela tem arquivo e ele não está no disco; a linha do log é a de sempre
 * (`prefetch plan n=<n> reason=demand`) — nenhuma linha nova (`N4-PRECHECK.md` A3).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __iniciados, __reset, __responder } from './fake-expo-file-system'
import { content, exatas, pdfBom, setlist, song } from './ajuda'
import { setFilesUser } from '../src/files'
import { prefetchDemanda } from '../src/prefetch'

const BUCKET = 'https://host/storage/v1/object/public/content-files'
let linhas: string[] = []
let n = 0

beforeEach(() => {
  __reset()
  linhas = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
  n++
  setFilesUser(`av${n}`)
})

afterEach(() => {
  vi.restoreAllMocks()
  setFilesUser(null)
})

describe('div. 964 — o avulso sem hospedeira baixa esta música', () => {
  const alheia1 = content('alheia-1', `${BUCKET}/alheia-1.pdf`)
  const alheia2 = content('alheia-2', `${BUCKET}/alheia-2.pdf`)
  const letra = content('letra', null)
  const partitura = content('esta', `${BUCKET}/esta.pdf`)
  const mapa = new Map([alheia1, alheia2, letra, partitura].map((c) => [c.id, c]))
  const hospedeira = setlist('sl-alheia', [song('s1', 1, alheia1.id), song('s2', 2, alheia2.id)])

  it('com arquivo: o plano é UM arquivo, o desta música — nenhum da setlist alheia', async () => {
    for (const c of [alheia1, alheia2, partitura]) __responder(c.file_url as string, { corpo: pdfBom(500) })
    await prefetchDemanda(null, mapa, 1, partitura.id)
    expect(exatas(linhas, 'prefetch plan n=1 reason=demand')).toHaveLength(1)
    expect(__iniciados()).toEqual([`esta.pdf`])
  })

  it('letra (sem arquivo): plano vazio, nenhum download', async () => {
    await prefetchDemanda(null, mapa, 1, letra.id)
    expect(exatas(linhas, 'prefetch plan n=0 reason=demand')).toHaveLength(1)
    expect(__iniciados()).toEqual([])
  })

  it('o controle: com a setlist, o plano é o dela a partir da posição — como hoje', async () => {
    for (const c of [alheia1, alheia2]) __responder(c.file_url as string, { corpo: pdfBom(500) })
    await prefetchDemanda(hospedeira, mapa, 1)
    expect(exatas(linhas, 'prefetch plan n=2 reason=demand')).toHaveLength(1)
    expect(__iniciados()).toEqual([`alheia-1.pdf`, `alheia-2.pdf`])
  })
})
