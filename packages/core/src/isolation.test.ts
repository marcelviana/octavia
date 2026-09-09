import { describe, it, expect, vi } from 'vitest'

/**
 * B7-PR7 — isolamento do projeto `core` do Vitest (docs/ux/B7-PRECHECK.md H-N4).
 * Sem pragma de ambiente no arquivo (o Vitest o detecta por regex no conteúdo — até
 * dentro de comentário): o ambiente vem do projeto. Controle negativo
 * (regra nº 7): ANTES do `test.projects`, este arquivo roda sob jsdom + setup do web
 * (window existe; global.fetch é mock do src/test-setup.ts:200-202) e os dois `it`
 * FALHAM; DEPOIS, sob o projeto `core` (node, sem setupFiles), passam.
 */
// Via globalThis: o tsconfig do core é lib ES2022 sem DOM (não conhece `window`).
const g = globalThis as unknown as Record<string, unknown>

describe('packages/core — isolamento do projeto Vitest', () => {
  it('core não vê window (environment: node)', () => {
    expect(typeof g.window).toBe('undefined')
  })

  it('core não tem o setup do web (global.fetch não é mock do src/test-setup.ts)', () => {
    expect(vi.isMockFunction(g.fetch)).toBe(false)
  })
})
