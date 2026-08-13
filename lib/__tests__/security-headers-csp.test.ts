import { describe, it, expect } from 'vitest'
import { PRODUCTION_SECURITY_CONFIG, DEVELOPMENT_SECURITY_CONFIG } from '../security-headers'

/**
 * Invariantes da CSP tocados/preservados pela PR-1 (PERF-02).
 * Os suites antigos de tests/security/ estão desligados (skip) — este é o
 * teste vivo que trava os valores no nível da config.
 */
describe('CSP — invariantes do frame-src (PERF-02)', () => {
  const directives = PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives

  it('frame-src permite exatamente blob: (o único iframe do app usa blob do próprio origin)', () => {
    expect(directives['frame-src']).toEqual(['blob:'])
  })

  it('frame-src não regride para none nem abre origens externas', () => {
    const value = directives['frame-src'] ?? []
    expect(value).not.toContain("'none'")
    expect(value).not.toContain("'self'")
    expect(value).not.toContain('data:')
    expect(value.some(v => v.startsWith('http'))).toBe(false)
  })

  it('object-src segue none e o anti-clickjacking segue DENY (não tocados pela PR)', () => {
    expect(directives['object-src']).toEqual(["'none'"])
    expect(PRODUCTION_SECURITY_CONFIG.frameOptions).toBe('DENY')
  })

  it('config de desenvolvimento herda o frame-src da produção (spread, sem override)', () => {
    expect(
      DEVELOPMENT_SECURITY_CONFIG.contentSecurityPolicy.directives['frame-src']
    ).toEqual(['blob:'])
  })
})
