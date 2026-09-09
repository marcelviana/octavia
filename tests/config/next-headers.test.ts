import { describe, it, expect } from 'vitest'
import nextConfig from '../../next.config.mjs'

/**
 * B7-PR3 — inventário de headers do next.config.mjs (docs/ux/B7-PRECHECK.md
 * H-C1, decisão B7-D3): toda resposta de /api/* EXCETO /api/proxy sai com
 * `Cache-Control: private, no-store`. O proxy fica de fora por decisão
 * (repassa o Cache-Control do upstream — é stream de arquivo do palco).
 *
 * Por que aqui e não no middleware: o matcher do middleware exclui /api,
 * então o no-store de lib/security-headers.ts:256 nunca chega às rotas
 * (medido no pre-check). headers() do Next é o ponto único.
 *
 * Commit 1 = it.fails contra o config presente (sem headers()); commit 2 = it.
 */

const SOURCE = '/api/:path((?!proxy).*)'

async function headerRules(): Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>> {
  const cfg = nextConfig as { headers?: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>> }
  return typeof cfg.headers === 'function' ? await cfg.headers() : []
}

describe('next.config.mjs headers() — B7-PR3', () => {
  it.fails(`tem a regra ${SOURCE} com Cache-Control: private, no-store`, async () => {
    const rules = await headerRules()
    const rule = rules.find((r) => r.source === SOURCE)
    expect(rule).toBeDefined()
    expect(rule!.headers).toContainEqual({ key: 'Cache-Control', value: 'private, no-store' })
  })

  it.fails('nenhuma regra de headers cobre /api/proxy (exclusão por decisão B7-D3)', async () => {
    const rules = await headerRules()
    expect(rules.length).toBeGreaterThan(0)
    // Só a regra do /api/* é esperada; nenhuma com source que case o proxy literalmente.
    expect(rules.some((r) => r.source === '/api/:path*' || r.source === '/api/proxy')).toBe(false)
  })
})
