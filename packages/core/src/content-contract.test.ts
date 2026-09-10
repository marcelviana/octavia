import { describe, it, expect } from 'vitest'
import { isValidContent, bodyOf } from './content-contract'

/**
 * N1-PR2a — uma linha por caso da tabela do PRD §4 / T1-R7 (aceite A6), na
 * versão pós-errata N1-PR1. Os estados "objeto sem a chave" existem nos dados
 * (2 Chords no anexo D5 do B7, fora da conta principal); os demais são o
 * inventário medido em `N1-PRECHECK.md` A3.
 */
describe('isValidContent (T1-R7 (a)–(d))', () => {
  it.fails('Lyrics com lyrics string → ok/text', () => {
    expect(isValidContent('Lyrics', { lyrics: 'É pedra, é ponte' }, null)).toEqual({
      ok: true,
      body: 'text',
    })
  })

  it.fails('Lyrics com objeto sem lyrics → no-key (regra c)', () => {
    expect(isValidContent('Lyrics', { annotations: [] }, null)).toEqual({
      ok: false,
      reason: 'no-key',
    })
  })

  it.fails('Lyrics com lyrics não-string → not-string (regra c)', () => {
    expect(isValidContent('Lyrics', { lyrics: 42 }, null)).toEqual({
      ok: false,
      reason: 'not-string',
    })
  })

  it.fails('Chords com chords string → ok/text', () => {
    expect(isValidContent('Chords', { chords: '[Intro] C7M Dm7' }, null)).toEqual({
      ok: true,
      body: 'text',
    })
  })

  it.fails('Chords com content_data null e file_url → ok/file (cifra escaneada)', () => {
    expect(isValidContent('Chords', null, 'https://host/content-files/1-cifra.pdf')).toEqual({
      ok: true,
      body: 'file',
    })
  })

  it.fails('Chords com content_data null e sem file_url → no-body (regra b)', () => {
    expect(isValidContent('Chords', null, null)).toEqual({ ok: false, reason: 'no-body' })
  })

  it.fails('Chords com objeto sem chords → no-key (os 2 registros do anexo D5)', () => {
    expect(isValidContent('Chords', { sections: [], capo: 2 }, null)).toEqual({
      ok: false,
      reason: 'no-key',
    })
  })

  it.fails('Chords poluído pelo editor do web mas com chords → ok/text (regra a)', () => {
    const poluido = {
      chords: '[Intro] C7M',
      content_data: { chords: '[Intro] C7M' },
      user_id: 'x',
      is_favorite: false,
    }
    expect(isValidContent('Chords', poluido, null)).toEqual({ ok: true, body: 'text' })
  })

  it.fails('Tab com tablature string → ok/text', () => {
    expect(isValidContent('Tab', { tablature: 'e|-----0-----|' }, null)).toEqual({
      ok: true,
      body: 'text',
    })
  })

  it.fails('Tab com objeto sem tablature → no-key', () => {
    expect(isValidContent('Tab', { tuning: 'EADGBE' }, null)).toEqual({
      ok: false,
      reason: 'no-key',
    })
  })

  it.fails('Sheet com file_url é ok/file com content_data null, {file} ou {annotations} (D5b)', () => {
    const url = 'https://host/content-files/1-partitura-12p.pdf'
    const esperado = { ok: true, body: 'file' }
    expect(isValidContent('Sheet', null, url)).toEqual(esperado)
    expect(isValidContent('Sheet', { file: { name: 'x.pdf' } }, url)).toEqual(esperado)
    expect(isValidContent('Sheet', { annotations: [] }, url)).toEqual(esperado)
  })

  it.fails('Sheet sem file_url → no-body', () => {
    expect(isValidContent('Sheet', null, null)).toEqual({ ok: false, reason: 'no-body' })
  })

  it.fails('content_type fora do enum → unknown-type (regra d)', () => {
    expect(isValidContent('Piano', { lyrics: 'x' }, null)).toEqual({
      ok: false,
      reason: 'unknown-type',
    })
  })
})

describe('bodyOf (T1-R7)', () => {
  it.fails('devolve a string da chave de cada tipo', () => {
    expect(bodyOf('Lyrics', { lyrics: 'a' })).toBe('a')
    expect(bodyOf('Chords', { chords: 'b' })).toBe('b')
    expect(bodyOf('Tab', { tablature: 'c' })).toBe('c')
  })

  it.fails('Sheet, content_data null, chave ausente, não-string ou tipo desconhecido → null', () => {
    expect(bodyOf('Sheet', { file: {} })).toBeNull()
    expect(bodyOf('Lyrics', null)).toBeNull()
    expect(bodyOf('Lyrics', { annotations: [] })).toBeNull()
    expect(bodyOf('Lyrics', { lyrics: 42 })).toBeNull()
    expect(bodyOf('Piano', { lyrics: 'a' })).toBeNull()
  })
})
