import { afterEach, describe, it, expect, vi } from 'vitest'

/**
 * Invariantes da CSP tocados/preservados pela PR-1 (PERF-02).
 * I1-PR3 (I1-D24): o iframe do palco morreu; o frame-src volta a 'none'.
 * I1-PR2 (I1-D6): o login com Google — o frame-src passa a ser só a origem do
 * authDomain do Firebase, o script-src ganha o gapi e o COOP deixa o popup
 * falar com o opener (docs/ux/I1-PR2-anexos/cn/).
 * Os suites antigos de tests/security/ estão desligados (skip) — este é o
 * teste vivo que trava os valores no nível da config.
 */
const AUTH_DOMAIN = 'exemplo-teste.firebaseapp.com'

async function carregar(authDomain: string | undefined) {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', authDomain as string)
  return import('../security-headers')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('CSP — invariantes do frame-src (PERF-02 → I1-D24 → I1-PR2)', () => {
  it("frame-src é exatamente a origem do authDomain; sem a variável, 'none'", async () => {
    const com = await carregar(AUTH_DOMAIN)
    expect(com.PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives['frame-src']).toEqual([`https://${AUTH_DOMAIN}`])
    const sem = await carregar(undefined)
    expect(sem.PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives['frame-src']).toEqual(["'none'"])
  })

  it('frame-src não abre blob:, self, data:, curinga nem origem além do authDomain', async () => {
    const { PRODUCTION_SECURITY_CONFIG } = await carregar(AUTH_DOMAIN)
    const value = PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives['frame-src'] ?? []
    expect(value).not.toContain('blob:')
    expect(value).not.toContain("'self'")
    expect(value).not.toContain('data:')
    expect(value.some(v => v.includes('*'))).toBe(false)
    expect(value.filter(v => v !== `https://${AUTH_DOMAIN}`)).toEqual([])
  })

  it('object-src segue none e o anti-clickjacking segue DENY (não tocados pela PR)', async () => {
    const { PRODUCTION_SECURITY_CONFIG } = await carregar(AUTH_DOMAIN)
    expect(PRODUCTION_SECURITY_CONFIG.contentSecurityPolicy.directives['object-src']).toEqual(["'none'"])
    expect(PRODUCTION_SECURITY_CONFIG.frameOptions).toBe('DENY')
  })

  it('config de desenvolvimento herda o frame-src da produção (spread, sem override)', async () => {
    const { DEVELOPMENT_SECURITY_CONFIG } = await carregar(AUTH_DOMAIN)
    expect(
      DEVELOPMENT_SECURITY_CONFIG.contentSecurityPolicy.directives['frame-src']
    ).toEqual([`https://${AUTH_DOMAIN}`])
  })
})

describe('CSP — o login com Google (I1-PR2)', () => {
  it('script-src de produção e de desenvolvimento têm https://apis.google.com uma vez, sem curinga de google.com', async () => {
    const { PRODUCTION_SECURITY_CONFIG, DEVELOPMENT_SECURITY_CONFIG } = await carregar(AUTH_DOMAIN)
    for (const config of [PRODUCTION_SECURITY_CONFIG, DEVELOPMENT_SECURITY_CONFIG]) {
      const value = config.contentSecurityPolicy.directives['script-src'] ?? []
      expect(value.filter(v => v === 'https://apis.google.com')).toHaveLength(1)
      expect(value).not.toContain('https://*.google.com')
    }
  })

  it('COOP same-origin-allow-popups nos dois campos da produção; o dev herda; nunca unsafe-none', async () => {
    const { PRODUCTION_SECURITY_CONFIG, DEVELOPMENT_SECURITY_CONFIG } = await carregar(AUTH_DOMAIN)
    expect(PRODUCTION_SECURITY_CONFIG.crossOriginPolicies.openerPolicy).toBe('same-origin-allow-popups')
    expect(PRODUCTION_SECURITY_CONFIG.additionalHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin-allow-popups')
    expect(DEVELOPMENT_SECURITY_CONFIG.crossOriginPolicies.openerPolicy).toBe('same-origin-allow-popups')
    expect(DEVELOPMENT_SECURITY_CONFIG.additionalHeaders['Cross-Origin-Opener-Policy']).toBeUndefined()
  })
})
