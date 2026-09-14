/**
 * O saneamento do que JÁ está no disco (commit 6; aceite **W1-A6**).
 *
 * Por que ele existe, mesmo com o estrago medido hoje sendo zero: um arquivo
 * envenenado **nunca se recupera sozinho** — o `ensureFileUma` vê que
 * `localizar()` achou, devolve `src=disk` e não tenta baixar de novo. Sem uma
 * varredura na abertura, um 0 byte de amanhã fica lá para sempre, inclusive
 * DEPOIS do conserto do caminho de escrita (`W1-PRECHECK.md` §2/H4).
 *
 * **A reprovação deste arquivo sobre `f79a4b7` é mais fraca que a do
 * `files-integridade.test.ts`, e isso vai declarado**: aqui ela é
 * `No "sanearArquivos" export is defined`, não uma asserção sobre
 * comportamento. O comportamento medido está no outro arquivo.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __existe, __inventario, __plantar, __reset } from './fake-expo-file-system'
import { BUCKET, pdfBom, pdfTruncado } from './ajuda'
import {
  filesDirs,
  hasFile,
  knownBytes,
  listFiles,
  sanearArquivos,
  setFilesUser,
  touch,
} from '../src/files'

const NOME_BOM = '1786218429715-partitura-12p.pdf'
const NOME_VAZIO = '1786218427769-partitura-1p.pdf'
const NOME_CURTO = '1786295844475-cifra.pdf'
const URL_BOM = `${BUCKET}/${NOME_BOM}`
const URL_VAZIO = `${BUCKET}/${NOME_VAZIO}`
const URL_CURTO = `${BUCKET}/${NOME_CURTO}`

let n = 0

beforeEach(() => {
  __reset()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-14T12:00:00Z'))
  n++
  setFilesUser(`s${n}`)
})

afterEach(() => {
  vi.useRealTimers()
  setFilesUser(null)
})

describe('W1-A6 — a varredura da abertura repara o que já está no disco', () => {
  it('apaga o 0 byte e o truncado, e deixa o íntegro em paz', () => {
    const dir = filesDirs()
    __plantar(`${dir.guaranteed}/${NOME_BOM}`, pdfBom(4000))
    __plantar(`${dir.guaranteed}/${NOME_VAZIO}`, '')
    __plantar(`${dir.demand}/${NOME_CURTO}`, pdfTruncado(4000))
    touch(URL_BOM)
    touch(URL_VAZIO)
    touch(URL_CURTO)

    const veredito = sanearArquivos()

    expect(veredito.removidos).toBe(2)
    expect(__existe(`${dir.guaranteed}/${NOME_BOM}`)).toBe(true)
    expect(__existe(`${dir.guaranteed}/${NOME_VAZIO}`)).toBe(false)
    expect(__existe(`${dir.demand}/${NOME_CURTO}`)).toBe(false)
    expect(hasFile(URL_BOM)).toBe(true)
    expect(hasFile(URL_VAZIO)).toBe(false)
    expect(hasFile(URL_CURTO)).toBe(false)
    expect(listFiles().map((f) => f.url)).toEqual([URL_BOM])
  })

  it('a ENTRADA do índice fica — é o "(1,2 MB)" que o S3e mostra (Q3)', () => {
    const dir = filesDirs()
    __plantar(`${dir.demand}/${NOME_CURTO}`, pdfTruncado(4000))
    touch(URL_CURTO)
    const lembrado = knownBytes(URL_CURTO)
    expect(lembrado).not.toBeNull()

    sanearArquivos()

    expect(__existe(`${dir.demand}/${NOME_CURTO}`)).toBe(false)
    expect(knownBytes(URL_CURTO)).toBe(lembrado)
  })

  it('varre o `.part` que um processo morto deixou para trás', () => {
    const dir = filesDirs()
    __plantar(`${dir.guaranteed}/${NOME_BOM}.part`, pdfTruncado(4000))
    __plantar(`${dir.demand}/${NOME_CURTO}.part`, '')

    const veredito = sanearArquivos()

    expect(veredito.parciais).toBe(2)
    expect(__inventario().filter((p) => p.endsWith('.part'))).toEqual([])
  })

  it('num disco já são, não apaga nada e não custa nada', () => {
    const dir = filesDirs()
    __plantar(`${dir.guaranteed}/${NOME_BOM}`, pdfBom(4000))
    touch(URL_BOM)

    expect(sanearArquivos()).toEqual({ removidos: 0, parciais: 0 })
    expect(hasFile(URL_BOM)).toBe(true)
  })

  it('um arquivo que não é PDF não é julgado pela forma do PDF', () => {
    // O saneamento só sabe a forma do PDF (§2/H4). Julgar um `.png` pela
    // cabeça `%PDF` o apagaria toda abertura — e o dano seria um
    // re-download por abertura, para sempre.
    const dir = filesDirs()
    const urlPng = `${BUCKET}/1786295884124-capa.png`
    __plantar(`${dir.demand}/1786295884124-capa.png`, '\x89PNG\r\n\x1a\n-conteudo-')
    touch(urlPng)

    expect(sanearArquivos().removidos).toBe(0)
    expect(hasFile(urlPng)).toBe(true)
  })
})
