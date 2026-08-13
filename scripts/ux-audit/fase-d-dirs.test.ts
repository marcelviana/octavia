import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Guard do registro histórico da Fase D (housekeeping pós-fila A, item 1).
 * Invariante testado: sem opt-in explícito, o path de escrita resolvido
 * NUNCA aponta para docs/ux/fase-d — rodadas pós-Fase D não tocam o
 * registro histórico, independente do alvo.
 */

const HISTORICO = path.resolve('docs/ux/fase-d')

async function freshModule() {
  vi.resetModules()
  return await import('./fase-d-dirs')
}

describe('resolveFaseDDir (guard do registro histórico)', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('default: path efêmero fora de docs/ux/fase-d, com escrita funcionando', async () => {
    vi.stubEnv('UX_AUDIT_FASE_D_HISTORICO', '')
    const { resolveFaseDDir } = await freshModule()
    for (const sub of ['data', 'evidence'] as const) {
      const dir = path.resolve(resolveFaseDDir(sub))
      expect(dir, `${sub} não pode ser o próprio histórico`).not.toBe(HISTORICO)
      expect(
        dir.startsWith(HISTORICO + path.sep),
        `${sub} não pode resolver para dentro de ${HISTORICO}`
      ).toBe(false)
    }
    const file = path.join(resolveFaseDDir('data'), 'probe-guard.json')
    fs.writeFileSync(file, '{}')
    expect(fs.existsSync(file)).toBe(true)
  })

  it('data e evidence compartilham a mesma raiz efêmera da rodada', async () => {
    const { resolveFaseDDir } = await freshModule()
    expect(path.dirname(resolveFaseDDir('data'))).toBe(path.dirname(resolveFaseDDir('evidence')))
  })

  it('opt-in explícito (UX_AUDIT_FASE_D_HISTORICO=1) devolve o path histórico', async () => {
    vi.stubEnv('UX_AUDIT_FASE_D_HISTORICO', '1')
    const { resolveFaseDDir } = await freshModule()
    expect(resolveFaseDDir('data')).toBe(path.join('docs/ux/fase-d', 'data'))
    expect(resolveFaseDDir('evidence')).toBe(path.join('docs/ux/fase-d', 'evidence'))
  })
})
