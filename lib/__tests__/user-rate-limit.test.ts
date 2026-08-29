/**
 * Testes do núcleo do sistema único de rate limiting (B1.3).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkRateLimit,
  rateLimited,
  recordAuthFailure,
  authFailureLimited,
  getClientIp,
  clearRateLimitStore,
  RATE_LIMITS,
} from '@/lib/user-rate-limit'

const CFG = { windowMs: 60_000, max: 3 }

describe('user-rate-limit (núcleo do sistema único)', () => {
  beforeEach(() => {
    clearRateLimitStore()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('permite até o limite e bloqueia o excedente na mesma janela', () => {
    const call = () =>
      checkRateLimit({ scope: 'user', id: 'uid-1', familia: 'teste', config: CFG })

    expect(call().ok).toBe(true)
    expect(call().ok).toBe(true)
    const terceira = call()
    expect(terceira.ok).toBe(true)
    expect(terceira.remaining).toBe(0)
    expect(call().ok).toBe(false)
  })

  it('janela FIXA: expira pelo primeiro request, sem renovação por hit (defeito do antigo)', () => {
    const call = () =>
      checkRateLimit({ scope: 'user', id: 'uid-1', familia: 'teste', config: CFG })
    call(); call(); call()
    expect(call().ok).toBe(false)

    // no antigo, cada hit renovava o TTL — a janela nunca virava.
    vi.advanceTimersByTime(61_000)
    expect(call().ok).toBe(true)
  })

  it('usuários diferentes NÃO compartilham bucket (defeito central do antigo)', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ scope: 'user', id: 'uid-a', familia: 'teste', config: CFG })
    }
    expect(
      checkRateLimit({ scope: 'user', id: 'uid-a', familia: 'teste', config: CFG }).ok
    ).toBe(false)
    expect(
      checkRateLimit({ scope: 'user', id: 'uid-b', familia: 'teste', config: CFG }).ok
    ).toBe(true)
  })

  it('famílias diferentes do mesmo usuário NÃO compartilham bucket', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ scope: 'user', id: 'uid-a', familia: 'leitura', config: CFG })
    }
    expect(
      checkRateLimit({ scope: 'user', id: 'uid-a', familia: 'leitura', config: CFG }).ok
    ).toBe(false)
    expect(
      checkRateLimit({ scope: 'user', id: 'uid-a', familia: 'mutacao', config: CFG }).ok
    ).toBe(true)
  })

  it('rateLimited devolve 429 estruturada com a assinatura do sistema único', async () => {
    const r = checkRateLimit({ scope: 'user', id: 'uid-1', familia: 'teste', config: { windowMs: 60_000, max: 0 } })
    const res = rateLimited(r)

    expect(res.status).toBe(429)
    expect(res.headers.get('X-RateLimit-Scope')).toBe('user')
    expect(res.headers.get('Retry-After')).toBeTruthy()
    expect(res.headers.get('X-RateLimit-Limit')).toBe('0')
    const body = await res.json()
    expect(body.error).toBe('Rate limit exceeded')
    // B3 PR-4/D4 (mudança declarada): o corpo ganhou code
    expect(body.code).toBe('RATE_LIMITED')
    expect(body.retryAfter).toBeGreaterThan(0)
  })

  it('fallback de auth falhada: janela por IP, deny-fast só após estourar', () => {
    const ip = '203.0.113.7'
    expect(authFailureLimited(ip)).toBe(false)

    for (let i = 0; i < RATE_LIMITS.AUTH_FAIL.max; i++) {
      recordAuthFailure(ip)
    }
    expect(authFailureLimited(ip)).toBe(false) // exatamente no limite ainda passa

    recordAuthFailure(ip)
    expect(authFailureLimited(ip)).toBe(true)

    // outro IP não é afetado
    expect(authFailureLimited('203.0.113.8')).toBe(false)

    // janela expira
    vi.advanceTimersByTime(RATE_LIMITS.AUTH_FAIL.windowMs + 1000)
    expect(authFailureLimited(ip)).toBe(false)
  })

  it('getClientIp: x-forwarded-for primeiro (primeiro hop), depois x-real-ip, depois unknown', () => {
    expect(
      getClientIp(new Request('https://x.example', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } }))
    ).toBe('1.2.3.4')
    expect(
      getClientIp(new Request('https://x.example', { headers: { 'x-real-ip': '9.9.9.9' } }))
    ).toBe('9.9.9.9')
    expect(getClientIp(new Request('https://x.example'))).toBe('unknown')
  })
})

// B3 PR-4/D4 — o 429 ganha code no corpo. it.fails contra o código atual
// (corpo {error, retryAfter} sem code — literal medido no B3-PRECHECK
// §2.8); o commit do flip remove o .fails. O gate de headers é de
// INVARIÂNCIA (plain it): os 5 headers NÃO mudam no D4.
describe('B3 contrato — 429 (PR-4/D4)', () => {
  it('corpo do 429 carrega code:"RATE_LIMITED" (+error +retryAfter)', async () => {
    const r = checkRateLimit({ scope: 'user', id: 'uid-d4', familia: 'd4', config: { windowMs: 60_000, max: 0 } })
    const body = await rateLimited(r).clone().json()
    expect(body.error).toBe('Rate limit exceeded')
    expect(body.code).toBe('RATE_LIMITED')
    expect(body.retryAfter).toBeGreaterThan(0)
  })

  it('INVARIÂNCIA: os 5 headers do 429 ficam como estão (D4 não os toca)', () => {
    const r = checkRateLimit({ scope: 'ip', id: 'ip-d4', familia: 'd4h', config: { windowMs: 60_000, max: 0 } })
    const res = rateLimited(r)
    expect(res.status).toBe(429)
    expect(res.headers.get('X-RateLimit-Scope')).toBe('ip')
    expect(res.headers.get('X-RateLimit-Limit')).toBe('0')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(Number(res.headers.get('X-RateLimit-Reset'))).toBeGreaterThan(Date.now() - 1000)
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
  })
})
