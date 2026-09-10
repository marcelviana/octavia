import { describe, it, expect } from 'vitest'
import { shouldRefresh, decodeExp } from './token'

const NOW_MS = 1_760_000_000_000
const NOW_S = NOW_MS / 1000

/** JWT sintético: 3 partes, payload base64url, assinatura irrelevante (não é verificada). */
function jwt(payload: Record<string, unknown>): string {
  const b64url = (obj: Record<string, unknown>): string => {
    const json = JSON.stringify(obj)
    const bytes: number[] = []
    for (const ch of json) {
      const cp = ch.codePointAt(0) ?? 0
      if (cp < 0x80) bytes.push(cp)
      else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
      else bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
    }
    const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    let out = ''
    let acc = 0
    let bits = 0
    for (const byte of bytes) {
      acc = (acc << 8) | byte
      bits += 8
      while (bits >= 6) {
        bits -= 6
        out += A[(acc >> bits) & 0x3f]
      }
    }
    if (bits > 0) out += A[(acc << (6 - bits)) & 0x3f]
    return out
  }
  return `eyJhbGciOiJSUzI1NiJ9.${b64url(payload)}.assinatura-nao-verificada`
}

describe('shouldRefresh (T1-R2 — buffer de 5 min)', () => {
  it('faltando 301 s para o exp → não renova', () => {
    expect(shouldRefresh(NOW_S + 301, NOW_MS)).toBe(false)
  })

  it('faltando exatamente 300 s → renova (limite inclusivo)', () => {
    expect(shouldRefresh(NOW_S + 300, NOW_MS)).toBe(true)
  })

  it('exp no instante de agora → renova', () => {
    expect(shouldRefresh(NOW_S, NOW_MS)).toBe(true)
  })

  it('token já expirado → renova', () => {
    expect(shouldRefresh(NOW_S - 3600, NOW_MS)).toBe(true)
  })
})

describe('decodeExp (T1-R2 — payload sem verificar assinatura)', () => {
  it('JWT com exp → o número em segundos', () => {
    expect(decodeExp(jwt({ sub: 'Pw3b', exp: 1_760_003_600, iat: 1_760_000_000 }))).toBe(
      1_760_003_600,
    )
  })

  it('payload sem exp → null', () => {
    expect(decodeExp(jwt({ sub: 'Pw3b' }))).toBeNull()
  })

  it('token malformado → null', () => {
    expect(decodeExp('nao.e')).toBeNull()
    expect(decodeExp('a.!!!.c')).toBeNull()
    expect(decodeExp('')).toBeNull()
  })
})
