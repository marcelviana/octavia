import { describe, it, expect } from 'vitest'
import { PRODUCTION_SECURITY_CONFIG, DEVELOPMENT_SECURITY_CONFIG } from '../security-headers'

/**
 * Invariantes da CSP tocados/preservados pela PR-1 (PERF-02).
 * I1-PR3 (I1-D24): o iframe do palco morreu; o frame-src volta a 'none'.
 * Os suites antigos de tests/security/ estão desligados (skip) — este é o
 * teste vivo que trava os valores no nível da config.
 */
describe('CSP — invariantes do frame-src (PERF-02 → I1-D24)', () => {
  const directives = PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives

  it("frame-src é exatamente 'none' (o app não tem iframe desde o corte do palco)", () => {
    expect(directives['frame-src']).toEqual(["'none'"])
  })

  it('frame-src não abre blob:, self, data: nem origens externas', () => {
    const value = directives['frame-src'] ?? []
    expect(value).not.toContain('blob:')
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
    ).toEqual(["'none'"])
  })
})
