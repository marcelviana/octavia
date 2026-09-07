// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { normalizeForSearch } from './normalize'

describe('normalizeForSearch (T1-R21)', () => {
  it('remove acentos: Águas → aguas', () => {
    expect(normalizeForSearch('Águas')).toBe('Aguas')
  })

  it('minúsculas e acentos: GAROTA, garôta, garota → garota', () => {
    expect(normalizeForSearch('GAROTA')).toBe('garota')
    expect(normalizeForSearch('garôta')).toBe('garota')
    expect(normalizeForSearch('garota')).toBe('garota')
  })

  it('colapsa espaços e faz trim: "  a   b " → "a b"', () => {
    expect(normalizeForSearch('  a   b ')).toBe('a b')
  })

  it('é idempotente: f(f(x)) === f(x)', () => {
    for (const x of ['Águas', '  Garota   de  Ipanema ', 'ÇÃO ñ ü']) {
      const once = normalizeForSearch(x)
      expect(normalizeForSearch(once)).toBe(once)
    }
  })
})
