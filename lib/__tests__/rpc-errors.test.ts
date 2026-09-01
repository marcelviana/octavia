/**
 * B6 PR-3b — helper único de tradução rpc error.code → envelope
 * (tabela do §2.2 do desenho: 3 colunas + "outro").
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { rpcErrorResponse } from '../rpc-errors'

const SENTINELA = 'SENTINELA-b6-nao-navega-9f3c'

async function corpo(res: Response) {
  return { status: res.status, text: await res.clone().text() }
}

describe('B6 PR-3b — rpcErrorResponse (tabela §2.2)', () => {
  it('coluna reorder: OB601 → 400 field:"order"; OB602 → 404 Setlist; outro → 500', async () => {
    expect(await corpo(rpcErrorResponse('reorder', { code: 'OB601', message: 'x' }))).toEqual({
      status: 400,
      text: '{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"order","message":"order must contain exactly the songs of the setlist","code":"custom"}]}',
    })
    expect(await corpo(rpcErrorResponse('reorder', { code: 'OB602', message: 'x' }))).toEqual({
      status: 404,
      text: '{"error":"Setlist not found","code":"NOT_FOUND"}',
    })
    expect(await corpo(rpcErrorResponse('reorder', { code: 'OB603', message: 'x' }))).toEqual({
      status: 500,
      text: '{"error":"Internal server error","code":"INTERNAL_ERROR"}',
    })
  })

  it('coluna removeSong: OB603 e OB602 → 404 Song byte-idênticos; OB601 → 500', async () => {
    const ob603 = await corpo(rpcErrorResponse('removeSong', { code: 'OB603', message: 'x' }))
    const ob602 = await corpo(rpcErrorResponse('removeSong', { code: 'OB602', message: 'x' }))
    expect(ob603).toEqual({ status: 404, text: '{"error":"Song not found","code":"NOT_FOUND"}' })
    expect(ob602.text).toBe(ob603.text)
    expect(await corpo(rpcErrorResponse('removeSong', { code: 'OB601', message: 'x' }))).toEqual({
      status: 500,
      text: '{"error":"Internal server error","code":"INTERNAL_ERROR"}',
    })
  })

  it('coluna addSong: OB602 → 404 Setlist; OB601 → 500; OB604 (de outra rota) → 500', async () => {
    expect(await corpo(rpcErrorResponse('addSong', { code: 'OB602', message: 'x' }))).toEqual({
      status: 404,
      text: '{"error":"Setlist not found","code":"NOT_FOUND"}',
    })
    expect((await corpo(rpcErrorResponse('addSong', { code: 'OB601', message: 'x' }))).status).toBe(500)
    expect((await corpo(rpcErrorResponse('addSong', { code: 'OB604', message: 'x' }))).status).toBe(500)
  })

  it('"outro": code desconhecido, ausente ou error null → 500 genérico', async () => {
    expect((await corpo(rpcErrorResponse('reorder', { code: 'XX000' }))).status).toBe(500)
    expect((await corpo(rpcErrorResponse('addSong', {}))).status).toBe(500)
    expect((await corpo(rpcErrorResponse('removeSong', null))).status).toBe(500)
  })

  it('endurecimento (checkpoint B): code anômalo do prototype ("toString") → 500 internalError, nunca função herdada', async () => {
    for (const route of ['reorder', 'removeSong', 'addSong'] as const) {
      expect(await corpo(rpcErrorResponse(route, { code: 'toString', message: 'x' }))).toEqual({
        status: 500,
        text: '{"error":"Internal server error","code":"INTERNAL_ERROR"}',
      })
    }
  })

  it('D6: error.message NUNCA aparece no corpo (todas as colunas, code mapeado e não-mapeado)', async () => {
    for (const route of ['reorder', 'removeSong', 'addSong'] as const) {
      for (const code of ['OB601', 'OB602', 'OB603', 'XX000']) {
        const res = rpcErrorResponse(route, { code, message: SENTINELA })
        expect(await res.clone().text()).not.toContain(SENTINELA)
      }
    }
  })
})
