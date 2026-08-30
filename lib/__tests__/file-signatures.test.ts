import { describe, it, expect } from 'vitest'
import { contentMatchesDeclaredMime, detectSignature, SIGNATURE_RULES } from '@/lib/file-signatures'
import { ALLOWED_UPLOAD_MIMES } from '@/lib/api-schemas'

/**
 * B5 PR-2 — tabela de assinaturas (B5-DESENHO.md §4.1), positivo E
 * negativo por tipo, + o teste de paridade que trava mecanicamente a
 * regra do comentário cruzado: tipo novo em ALLOWED_UPLOADS exige
 * assinatura nova aqui.
 */

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const ascii = (s: string) => new TextEncoder().encode(s)
const bytes = (...ns: number[]) => Uint8Array.from(ns)
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

// Amostras mínimas reais por família
const PDF_MIN = ascii('%PDF-1.4\nmini pdf de teste')
const PNG_MIN = concat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), ascii('IHDRmini'))
const JPEG_MIN = concat(bytes(0xff, 0xd8, 0xff, 0xe0), ascii('JFIFmini'))
const DOCX_MIN = concat(bytes(0x50, 0x4b, 0x03, 0x04), ascii('\x14\x00\x06\x00[Content_Types].xml resto-do-zip'))
const ZIP_SEM_OOXML = concat(bytes(0x50, 0x4b, 0x03, 0x04), ascii('word-qualquer/sem-a-entrada.bin'))
const TXT_UTF8 = ascii('Águas de Março — cifra em UTF-8, sem NUL')
const TXT_LATIN1 = bytes(0x41, 0xe7, 0xe3, 0x6f, 0x20, 0x6c, 0x69, 0x76, 0x72, 0x65) // "Ação livre" em Latin-1
const BIN_COM_NUL = bytes(0x4d, 0x5a, 0x00, 0x01, 0x02, 0x00, 0xff) // executável-like
const UTF16LE_BOM = bytes(0xff, 0xfe, 0x68, 0x00, 0x69, 0x00) // BOM + "hi" em UTF-16LE

describe('B5 PR-2 — tabela de assinaturas: positivos', () => {
  it('pdf/png/jpeg/jpg com bytes verdadeiros → ok', () => {
    expect(contentMatchesDeclaredMime(PDF_MIN, 'application/pdf')).toEqual({ ok: true })
    expect(contentMatchesDeclaredMime(PNG_MIN, 'image/png')).toEqual({ ok: true })
    expect(contentMatchesDeclaredMime(JPEG_MIN, 'image/jpeg')).toEqual({ ok: true })
    expect(contentMatchesDeclaredMime(JPEG_MIN, 'image/jpg')).toEqual({ ok: true })
  })

  it('docx real (PK + [Content_Types].xml nos primeiros 4096) → ok', () => {
    expect(contentMatchesDeclaredMime(DOCX_MIN, DOCX_MIME)).toEqual({ ok: true })
  })

  it('txt UTF-8 e txt Latin-1 (bytes >127, sem NUL) → ok (heurística B5-D9)', () => {
    expect(contentMatchesDeclaredMime(TXT_UTF8, 'text/plain')).toEqual({ ok: true })
    expect(contentMatchesDeclaredMime(TXT_LATIN1, 'text/plain')).toEqual({ ok: true })
  })
})

describe('B5 PR-2 — tabela de assinaturas: negativos', () => {
  it('texto declarado image/png → recusado (o P1 do pre-check, na unidade)', () => {
    expect(contentMatchesDeclaredMime(ascii('this is not a png'), 'image/png')).toEqual({ ok: false, detected: null })
  })

  it('PK sem [Content_Types].xml declarado docx → recusado (zip renomeado .docx)', () => {
    expect(contentMatchesDeclaredMime(ZIP_SEM_OOXML, DOCX_MIME)).toEqual({ ok: false, detected: 'application/zip' })
  })

  it('zip declarado application/pdf → recusado com detected (o item 45b)', () => {
    expect(contentMatchesDeclaredMime(ZIP_SEM_OOXML, 'application/pdf')).toEqual({ ok: false, detected: 'application/zip' })
  })

  it('binário com NUL declarado text/plain → recusado', () => {
    expect(contentMatchesDeclaredMime(BIN_COM_NUL, 'text/plain')).toEqual({ ok: false, detected: null })
  })

  it('UTF-16LE com BOM declarado text/plain → RECUSADO (limitação R1/B5-D9, declarada e aceita)', () => {
    expect(contentMatchesDeclaredMime(UTF16LE_BOM, 'text/plain')).toEqual({ ok: false, detected: null })
  })

  it('pdf declarado image/jpeg → recusado com detected application/pdf', () => {
    expect(contentMatchesDeclaredMime(PDF_MIN, 'image/jpeg')).toEqual({ ok: false, detected: 'application/pdf' })
  })
})

describe('B5 PR-2 — detectSignature', () => {
  it('reconhece as quatro famílias binárias e devolve null para texto', () => {
    expect(detectSignature(PDF_MIN)).toBe('application/pdf')
    expect(detectSignature(PNG_MIN)).toBe('image/png')
    expect(detectSignature(JPEG_MIN)).toBe('image/jpeg')
    expect(detectSignature(ZIP_SEM_OOXML)).toBe('application/zip')
    expect(detectSignature(TXT_UTF8)).toBe(null)
  })
})

describe('B5 PR-2 — paridade lista×assinaturas (trava mecânica do comentário cruzado)', () => {
  it('todo MIME de ALLOWED_UPLOAD_MIMES tem regra no sniffer', () => {
    for (const mime of ALLOWED_UPLOAD_MIMES) {
      expect(SIGNATURE_RULES[mime], `tipo permitido sem assinatura: ${mime}`).toBeTypeOf('function')
    }
  })
})
