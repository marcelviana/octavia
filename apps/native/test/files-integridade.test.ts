/**
 * **G7 — integridade.** O gate que dá nome à PR, e o controle negativo dela.
 *
 * Escrito ANTES do conserto e commitado reprovando ("o gate vem antes do que
 * ele mede" — regra que a V1-PR3 deixou e a V1-PR4 repetiu). Sobre `f79a4b7`
 * estes testes descrevem um app que não existe: um em que **existir é estar
 * completo**.
 *
 * Só usa exports que JÁ existem em `f79a4b7`, de propósito: assim a
 * reprovação é por COMPORTAMENTO medido, não por `import` que não resolve.
 * O que depende de export novo está em `files-saneamento.test.ts`, e a
 * reprovação de lá é declaradamente mais fraca.
 *
 * Roda no projeto `native` do Vitest, com `expo-file-system` apontado para o
 * duplo de `fake-expo-file-system.ts`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { offlineStatus } from '@octavia/core'
import {
  __existe,
  __inventario,
  __plantar,
  __reset,
  __responder,
} from './fake-expo-file-system'
import { BUCKET, content, pdfBom, pdfTruncado, setlist, song } from './ajuda'
import { ensureFile, filesDirs, hasFile, knownBytes, listFiles, presentUrls, setFilesUser, touch } from '../src/files'

let n = 0
/**
 * Um nome por teste: o `emVoo` do `files.ts` é estado de MÓDULO indexado por
 * URL, e um teste que deixa um voo pendente contaminaria o seguinte.
 */
let NOME_A = ''
let URL_A = ''

beforeEach(() => {
  __reset()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-14T12:00:00Z'))
  n++
  NOME_A = `17862184${n}-partitura-12p.pdf`
  URL_A = `${BUCKET}/${NOME_A}`
  setFilesUser(`u${n}`)
})

afterEach(() => {
  vi.useRealTimers()
  setFilesUser(null)
})

/** A setlist de uma música que precisa de `URL_A` — o cartão do S1. */
function cartao(): { sl: ReturnType<typeof setlist>; porId: Map<string, ReturnType<typeof content>> } {
  const c = content('c1', URL_A)
  return { sl: setlist('sl1', [song('s1', 1, 'c1')]), porId: new Map([['c1', c]]) }
}

describe('G7 — o que está no disco só conta se estiver completo', () => {
  it('(a) um arquivo de 0 byte NÃO conta como presente', () => {
    __plantar(`${filesDirs().guaranteed}/${NOME_A}`, '')
    touch(URL_A)

    expect(hasFile(URL_A)).toBe(false)
    expect(listFiles()).toEqual([])
    expect(presentUrls().has(URL_A)).toBe(false)

    const { sl, porId } = cartao()
    expect(offlineStatus(sl, porId, presentUrls())).toEqual({ kind: 'partial', have: 0, need: 1 })
  })

  it('(c) um `.part` sobrando de um download morto não conta como presente', () => {
    __plantar(`${filesDirs().guaranteed}/${NOME_A}.part`, pdfTruncado(4000))
    touch(URL_A)

    expect(hasFile(URL_A)).toBe(false)
    expect(presentUrls().has(URL_A)).toBe(false)
    const { sl, porId } = cartao()
    expect(offlineStatus(sl, porId, presentUrls()).kind).toBe('partial')
  })

  it('o arquivo íntegro continua contando — o gate não pode recusar o que é bom', async () => {
    __responder(URL_A, { corpo: pdfBom(4000) })
    const r = await ensureFile(URL_A, { guaranteed: true })

    expect(r.src).toBe('download')
    expect(hasFile(URL_A)).toBe(true)
    expect(presentUrls().has(URL_A)).toBe(true)
    const { sl, porId } = cartao()
    expect(offlineStatus(sl, porId, presentUrls())).toEqual({ kind: 'guaranteed', have: 1, need: 1 })

    // A9 — a segunda vez vem do disco, sem request.
    const segunda = await ensureFile(URL_A, { guaranteed: true })
    expect(segunda.src).toBe('disk')
  })
})

describe('W1-A1 — um download interrompido não deixa arquivo no lugar do bom', () => {
  it('a conexão que morre no meio: nada com o nome final, e a promessa rejeita', async () => {
    // 2 pedaços entregues e o soquete de pé para sempre: é a conexão MORTA.
    __responder(URL_A, { corpo: pdfBom(4000), pedacos: 4, atrasoMs: 1000, morre: true })

    const voo = ensureFile(URL_A, { guaranteed: true })
    const rejeita = expect(voo).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(60_000)
    await rejeita

    expect(__existe(`${filesDirs().guaranteed}/${NOME_A}`)).toBe(false)
    expect(hasFile(URL_A)).toBe(false)
    expect(__inventario().filter((p) => p.endsWith(NOME_A))).toEqual([])
  })

  it('durante o download, o nome final ainda não existe — a promessa não mente enquanto baixa', async () => {
    __responder(URL_A, { corpo: pdfBom(4000), pedacos: 4, atrasoMs: 1000 })

    const voo = ensureFile(URL_A, { guaranteed: true })
    await vi.advanceTimersByTimeAsync(1500)
    // div. 113: com o download direto no alvo, aqui o arquivo JÁ existiria.
    expect(hasFile(URL_A)).toBe(false)

    await vi.advanceTimersByTimeAsync(10_000)
    await voo
    expect(hasFile(URL_A)).toBe(true)
  })
})

describe('W1-A2 / W1-A3 — o teto é de inatividade, e a checagem é do corpo', () => {
  it('sem nenhum byte novo por 30 s, o download é abortado e a falha aparece', async () => {
    __responder(URL_A, { corpo: pdfBom(4000), pedacos: 2, atrasoMs: 100, morre: true })

    const voo = ensureFile(URL_A, { guaranteed: true })
    const rejeita = expect(voo).rejects.toThrow(/30\s?s/)
    await vi.advanceTimersByTimeAsync(31_000)
    await rejeita

    expect(hasFile(URL_A)).toBe(false)
  })

  it('CONTROLE NEGATIVO do teto: lento mas SEM parar não pode abortar', async () => {
    // 10 pedaços a cada 10 s = 100 s de download, muito além do teto de 30 s,
    // e nenhum silêncio maior que 10 s. É o caso de 1,8 KB/s medido no V1.
    __responder(URL_A, { corpo: pdfBom(4000), pedacos: 10, atrasoMs: 10_000 })

    const voo = ensureFile(URL_A, { guaranteed: true })
    await vi.advanceTimersByTimeAsync(120_000)
    const r = await voo

    expect(r.src).toBe('download')
    expect(hasFile(URL_A)).toBe(true)
  })

  it('um corpo mais curto que o `Content-Length` é recusado', async () => {
    const inteiro = pdfBom(4000)
    __responder(URL_A, { corpo: inteiro.slice(0, 2000), total: inteiro.length })

    const voo = ensureFile(URL_A, { guaranteed: true })
    const rejeita = expect(voo).rejects.toThrow(/2000|incompleto/)
    await vi.advanceTimersByTimeAsync(1000)
    await rejeita

    expect(hasFile(URL_A)).toBe(false)
    expect(__existe(`${filesDirs().guaranteed}/${NOME_A}`)).toBe(false)
  })

  it('sem `Content-Length` (`total=-1`) o download vale pela forma do arquivo', async () => {
    __responder(URL_A, { corpo: pdfBom(4000), total: -1 })

    const voo = ensureFile(URL_A, { guaranteed: true })
    await vi.advanceTimersByTimeAsync(1000)
    await voo

    expect(hasFile(URL_A)).toBe(true)
  })

  it('um PDF sem `%%EOF` é recusado mesmo com o tamanho "certo"', async () => {
    const meio = pdfTruncado(4000)
    __responder(URL_A, { corpo: meio, total: meio.length })

    const voo = ensureFile(URL_A, { guaranteed: true })
    const rejeita = expect(voo).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(1000)
    await rejeita

    expect(hasFile(URL_A)).toBe(false)
  })
})

describe('o índice continua sendo memória, não oráculo (div. 111)', () => {
  it('o tamanho lembrado sobrevive ao arquivo recusado — é o "(1,2 MB)" do S3e', async () => {
    __responder(URL_A, { corpo: pdfBom(4000) })
    await ensureFile(URL_A, { guaranteed: true })
    expect(knownBytes(URL_A)).toBe(pdfBom(4000).length)
  })
})
