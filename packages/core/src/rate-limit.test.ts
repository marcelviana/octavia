import { describe, it, expect } from 'vitest'
import { retryAfterFrom, rateLimitGate } from './rate-limit'

/** Corpo verbatim do exemplo normativo do CONTRATO-DE-ERRO.md, com 30 s. */
const ENVELOPE_429 = '{"error":"Rate limit exceeded","code":"RATE_LIMITED","retryAfter":30}'

describe('retryAfterFrom (T1-R4 / A3)', () => {
  it('header Retry-After manda (é o autoritativo)', () => {
    expect(retryAfterFrom({ 'Retry-After': '30' }, null)).toBe(30)
    expect(retryAfterFrom({ 'retry-after': '30' }, ENVELOPE_429)).toBe(30)
  })

  it('sem header, lê retryAfter do envelope RATE_LIMITED', () => {
    expect(retryAfterFrom({}, ENVELOPE_429)).toBe(30)
  })

  it('sem header e sem envelope de 429 → null', () => {
    expect(retryAfterFrom({}, null)).toBeNull()
    expect(retryAfterFrom({}, '{"error":"Internal server error","code":"INTERNAL_ERROR"}')).toBeNull()
    expect(retryAfterFrom({}, 'Request Entity Too Large FUNCTION_PAYLOAD_TOO_LARGE')).toBeNull()
  })

  it('header não-inteiro (data HTTP) e sem corpo → null', () => {
    expect(retryAfterFrom({ 'Retry-After': 'Wed, 10 Sep 2026 12:00:00 GMT' }, null)).toBeNull()
  })
})

describe('rateLimitGate (T1-R4 / A3 — sem timer, relógio de quem chama)', () => {
  it('bloqueia a família até untilMs', () => {
    const gate = rateLimitGate()
    gate.block('content-read', 1_000 + 30_000)
    expect(gate.canRequest('content-read', 1_000)).toBe(false)
    expect(gate.canRequest('content-read', 30_999)).toBe(false)
  })

  it('libera em untilMs e nextAllowedAt devolve o instante', () => {
    const gate = rateLimitGate()
    expect(gate.nextAllowedAt('content-read')).toBeNull()
    gate.block('content-read', 31_000)
    expect(gate.nextAllowedAt('content-read')).toBe(31_000)
    expect(gate.canRequest('content-read', 31_000)).toBe(true)
    expect(gate.canRequest('content-read', 31_001)).toBe(true)
  })

  it('famílias são independentes', () => {
    const gate = rateLimitGate()
    gate.block('content-read', 31_000)
    expect(gate.canRequest('setlist-read', 1_000)).toBe(true)
    expect(gate.nextAllowedAt('setlist-read')).toBeNull()
  })
})
