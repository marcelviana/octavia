import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config.mjs'

/**
 * B7-PR3 — inventário de headers do next.config.mjs (docs/ux/B7-PRECHECK.md
 * H-C1, decisão B7-D3): toda resposta de /api/* sai com
 * `Cache-Control: private, no-store`. Até a I1-PR3 o /api/proxy ficava de
 * fora; a rota morreu com o PWA (I1-D18) e a exclusão saiu (aval 1 da PR-3).
 *
 * Por que aqui e não no middleware: o matcher do middleware exclui /api,
 * então o no-store de lib/security-headers.ts nunca chega às rotas
 * (medido no pre-check). headers() do Next é o ponto único.
 *
 * I1-PR3 (I1-D22): os três redirects da URL antiga do palco.
 */

const SOURCE = '/api/:path*'

type Regra = { source: string; headers: Array<{ key: string; value: string }> }
type Redirect = {
  source: string
  destination: string
  permanent: boolean
  has?: Array<{ type: string; key: string; value?: string }>
}

async function headerRules(): Promise<Regra[]> {
  const cfg = nextConfig as { headers?: () => Promise<Regra[]> }
  return typeof cfg.headers === 'function' ? await cfg.headers() : []
}

async function redirectRules(): Promise<Redirect[]> {
  const cfg = nextConfig as { redirects?: () => Promise<Redirect[]> }
  return typeof cfg.redirects === 'function' ? await cfg.redirects() : []
}

describe('next.config.mjs headers() — B7-PR3', () => {
  it(`tem a regra ${SOURCE} com Cache-Control: private, no-store`, async () => {
    const rules = await headerRules()
    const rule = rules.find((r) => r.source === SOURCE)
    expect(rule).toBeDefined()
    expect(rule!.headers).toContainEqual({ key: 'Cache-Control', value: 'private, no-store' })
  })

  it('nenhuma regra ainda exclui o /api/proxy (a rota não existe)', async () => {
    const rules = await headerRules()
    expect(rules.some((r) => r.source.includes('proxy'))).toBe(false)
  })
})

describe('next.config.mjs redirects() — I1-D22', () => {
  it('são exatamente três, todos de /performance, temporários, nesta ordem', async () => {
    const rules = await redirectRules()
    expect(rules.map((r) => [r.source, r.destination, r.permanent])).toEqual([
      ['/performance', '/content/:contentId', false],
      ['/performance', '/setlists', false],
      ['/performance', '/dashboard', false],
    ])
  })

  it('?contentId= leva ao visualizador do content; ?setlistId= às setlists; sem parâmetro, ao dashboard', async () => {
    const [porContent, porSetlist, semParam] = await redirectRules()
    expect(porContent!.has).toEqual([{ type: 'query', key: 'contentId', value: '(?<contentId>[^/&]+)' }])
    expect(porSetlist!.has).toEqual([{ type: 'query', key: 'setlistId' }])
    expect(semParam!.has).toBeUndefined()
  })
})
