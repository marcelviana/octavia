/**
 * A fila de três trabalhadores (div. 122) e a falha que não pode ser engolida
 * (div. 114, div. 115). Aceites **W1-A4** e **W1-A7**.
 *
 * A frase que estes testes protegem: **o teto nunca foi sobre paciência — era
 * sobre um download condenado comer o orçamento dos outros, e a proteção da
 * fila NÃO É UM TETO.** Um número maior no teto não faz o quarto arquivo
 * começar mais cedo; só adia o instante em que a fila destrava.
 *
 * `CONCORRENCIA = 3` não muda de valor, muda de significado: era o tamanho do
 * lote, passa a ser o teto de downloads simultâneos. O invariante do
 * **T1-R13 passo 3** ("concorrência ≤ 3") é o mesmo nas duas formas — o lote
 * garante ≤ 3 e desperdiça vagas, a fila garante ≤ 3 e as usa.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __existe,
  __iniciados,
  __picoDeConcorrencia,
  __plantar,
  __quebrarDelete,
  __quebrarMove,
  __reset,
  __responder,
} from './fake-expo-file-system'
import { pdfBom, repertorio } from './ajuda'
import { PARCIAL, filesDirs, hasFile, setFilesUser, touch } from '../src/files'
import { baixarSetlist, prefetch7Dias } from '../src/prefetch'

let n = 0
let linhas: string[] = []

/** Marca única por teste — ver `repertorio()` em `ajuda.ts`. */
function marca(): string {
  return String(400000 + n)
}

beforeEach(() => {
  __reset()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-14T12:00:00Z'))
  linhas = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
  n++
  setFilesUser(`p${n}`)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setFilesUser(null)
})

function octavia(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`))
}

describe('div. 122 — um download lento não pode parar a fila', () => {
  it('o quarto arquivo COMEÇA enquanto o primeiro ainda baixa', async () => {
    const { urls, contentById, setlists } = repertorio(5, marca())
    // O primeiro chega devagar mas sem parar: 10 pedaços de 10 s = 100 s.
    __responder(urls[0] as string, { corpo: pdfBom(4000), pedacos: 10, atrasoMs: 10_000 })
    for (const url of urls.slice(1)) __responder(url, { corpo: pdfBom(1000) })

    const voo = prefetch7Dias(setlists, contentById)
    await vi.advanceTimersByTimeAsync(1_000)

    // Com a BARREIRA DE LOTE de hoje, aqui só três teriam começado.
    expect(__iniciados()).toHaveLength(5)
    expect(hasFile(urls[4] as string)).toBe(true)
    expect(hasFile(urls[0] as string)).toBe(false)

    await vi.advanceTimersByTimeAsync(200_000)
    await voo
    expect(hasFile(urls[0] as string)).toBe(true)
  })

  it('nunca mais de três downloads ao mesmo tempo (T1-R13 passo 3)', async () => {
    const { urls, contentById, setlists } = repertorio(7, marca())
    for (const url of urls) __responder(url, { corpo: pdfBom(1000), pedacos: 3, atrasoMs: 500 })

    const voo = prefetch7Dias(setlists, contentById)
    await vi.advanceTimersByTimeAsync(60_000)
    await voo

    expect(__picoDeConcorrencia()).toBe(3)
    expect(__iniciados()).toHaveLength(7)
  })

  it('a ordem de INÍCIO continua sendo a do core — o que muda é a de término', async () => {
    const { urls, nomes, contentById, setlists } = repertorio(4, marca())
    __responder(urls[0] as string, { corpo: pdfBom(1000), pedacos: 4, atrasoMs: 5_000 })
    for (const url of urls.slice(1)) __responder(url, { corpo: pdfBom(1000) })

    const voo = prefetch7Dias(setlists, contentById)
    await vi.advanceTimersByTimeAsync(60_000)
    await voo

    expect(__iniciados().slice(0, 3)).toEqual(nomes.slice(0, 3))
  })
})

describe('W1-A7 — o indicador anda DURANTE o download, não só no fim', () => {
  it('o callback por arquivo corre antes de o plano terminar', async () => {
    const { urls, contentById, setlists } = repertorio(5, marca())
    __responder(urls[0] as string, { corpo: pdfBom(4000), pedacos: 10, atrasoMs: 10_000 })
    for (const url of urls.slice(1)) __responder(url, { corpo: pdfBom(1000) })

    const passos: number[] = []
    const voo = prefetch7Dias(setlists, contentById, () => {
      passos.push(urls.filter((u) => hasFile(u)).length)
    })
    await vi.advanceTimersByTimeAsync(1_000)

    // Com a barreira de lote, aqui `passos` estaria VAZIO: o único ponto de
    // atualização era o fim de `prefetch7Dias`.
    expect(passos.length).toBeGreaterThanOrEqual(4)
    expect(passos).toEqual([...passos].sort((a, b) => a - b))

    await vi.advanceTimersByTimeAsync(200_000)
    await voo
    expect(passos[passos.length - 1]).toBe(5)
  })
})

describe('div. 114 — nenhuma falha de download é engolida (T1-R37)', () => {
  it('três falhas, três linhas, e as outras continuam', async () => {
    const { urls, contentById, setlists } = repertorio(5, marca())
    for (const url of urls.slice(0, 3)) __responder(url, { corpo: '', status: 404 })
    for (const url of urls.slice(3)) __responder(url, { corpo: pdfBom(1000) })

    const voo = prefetch7Dias(setlists, contentById)
    await vi.advanceTimersByTimeAsync(10_000)
    await voo

    expect(octavia('download-error')).toHaveLength(3)
    expect(hasFile(urls[3] as string)).toBe(true)
    expect(hasFile(urls[4] as string)).toBe(true)
  })

  it('a linha de falha não carrega a URL inteira (regra 2 do catálogo)', async () => {
    const { urls, nomes, contentById, setlists } = repertorio(1, marca())
    __responder(urls[0] as string, { corpo: '', status: 404 })

    const voo = prefetch7Dias(setlists, contentById)
    await vi.advanceTimersByTimeAsync(10_000)
    await voo

    const falhas = octavia('download-error')
    expect(falhas).toHaveLength(1)
    expect(falhas[0]).not.toContain('http')
    expect(falhas[0]).toContain(nomes[0] as string)
  })

  it('"Baixar esta setlist" também reporta a falha', async () => {
    const { urls, contentById, setlists } = repertorio(2, marca())
    for (const url of urls) __responder(url, { corpo: '', status: 500 })

    const voo = baixarSetlist(setlists[0] as (typeof setlists)[0], contentById)
    await vi.advanceTimersByTimeAsync(10_000)
    await voo

    expect(octavia('download-error')).toHaveLength(2)
  })
})

describe('div. 115 — a promoção não pode derrubar o sync', () => {
  it('uma promoção que falha vira linha, não rejeição sem dono', async () => {
    const { urls, nomes, contentById, setlists } = repertorio(1, marca())
    const url = urls[0] as string
    const nome = nomes[0] as string
    // O arquivo já está no PURGÁVEL e a setlist é de amanhã: é candidato a
    // promoção. O `moveSync` recusa.
    __plantar(`${filesDirs().demand}/${nome}`, pdfBom(1000))
    touch(url)
    __quebrarMove(nome)
    __responder(url, { corpo: pdfBom(1000) })

    const voo = prefetch7Dias(setlists, contentById)
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(voo).resolves.toBeUndefined()

    expect(octavia('download-error')).toHaveLength(1)
  })
})

describe('div. 102 — "Baixar esta setlist" grava no DURÁVEL', () => {
  it('o arquivo cai em `files/`, não em `cache/`', async () => {
    const { urls, nomes, contentById, setlists } = repertorio(1, marca())
    __responder(urls[0] as string, { corpo: pdfBom(1000) })

    await baixarSetlist(setlists[0] as (typeof setlists)[0], contentById)

    expect(__existe(`${filesDirs().guaranteed}/${nomes[0] as string}`)).toBe(true)
    expect(__existe(`${filesDirs().demand}/${nomes[0] as string}`)).toBe(false)
  })
})

/**
 * **A REDE DE SEGURANÇA TAMBÉM HIGIENIZA** — W3, div. 137, a metade que a W2
 * deixou de pé.
 *
 * O `mensagemDe()` do `prefetch.ts` é o que pega o que **nunca passou pelo
 * `falha()`**, e ele tinha higienização PRÓPRIA e ANTIGA: casava só URI com
 * esquema, e não o host NU entre aspas que o aparelho devolve em modo avião
 * (`Unable to resolve host "<ref>.supabase.co"`). O identificador do projeto
 * Supabase ia inteiro para o log — e log deste projeto se cola em anexo
 * commitado.
 *
 * Como se alcança essa rede, já que a W2 encolheu o conjunto: o
 * `parcial.delete()` da ABERTURA do `baixarAtomico` está fora de qualquer
 * `try`. Um `.part` velho no disco + um `delete()` que recusa = rejeição crua
 * subindo até o `catch` do `baixar()`. É o `__quebrarDelete` do duplo.
 *
 * O CN está dentro do próprio teste: a mensagem crua tem o host e a URI, e o
 * que se afirma é que NENHUM dos dois sobrevive — afirmar só que `<host>`
 * aparece deixaria passar uma higienização que acrescenta o rótulo sem apagar
 * o segredo.
 */
describe('div. 137 — o que não passa pelo `falha()` também é higienizado', () => {
  async function linhaDeErro(bruta: string): Promise<string> {
    const { urls, nomes, contentById, setlists } = repertorio(1, marca())
    const url = urls[0] as string
    const nome = nomes[0] as string
    // Um `.part` velho no durável: a abertura do `baixarAtomico` vai tentar
    // apagá-lo, FORA de qualquer `try`.
    __plantar(`${filesDirs().guaranteed}/${nome}${PARCIAL}`, pdfBom(10))
    __quebrarDelete(`${nome}${PARCIAL}`, bruta)
    __responder(url, { corpo: pdfBom(1000) })

    const voo = prefetch7Dias(setlists, contentById)
    await vi.advanceTimersByTimeAsync(10_000)
    await expect(voo).resolves.toBeUndefined()

    const falhas = octavia('download-error')
    expect(falhas).toHaveLength(1)
    return falhas[0] as string
  }

  it('o HOST NU entre aspas não chega ao log — era o buraco da higienização antiga', async () => {
    const linha = await linhaDeErro(
      'Unable to resolve host "mlxjmpbdchmwplcfislt.supabase.co": No address associated with hostname',
    )
    expect(linha).not.toContain('mlxjmpbdchmwplcfislt')
    expect(linha).not.toContain('supabase.co')
    expect(linha).toContain('"<host>"')
  })

  it('a URI `file://` continua coberta — unificar não podia custar cobertura', async () => {
    const linha = await linhaDeErro(
      'delete recusado: file:///data/user/0/com.octavia/files/octavia/x.pdf.part',
    )
    expect(linha).not.toContain('/data/user/0/')
    expect(linha).toContain('<uri>')
  })

  it('a URL completa continua coberta', async () => {
    const linha = await linhaDeErro('falhou em https://mlxjmpbdchmwplcfislt.supabase.co/o/x.pdf?t=1')
    expect(linha).not.toContain('mlxjmpbdchmwplcfislt')
    expect(linha).toContain('<url>')
  })

  it('CONTROLE NEGATIVO: o que NÃO é segredo sobrevive inteiro', async () => {
    const linha = await linhaDeErro('delete recusado para w3-curto-1.pdf.part')
    expect(linha).toContain('w3-curto-1.pdf.part')
    expect(linha).not.toContain('<host>')
    expect(linha).not.toContain('<uri>')
  })
})
