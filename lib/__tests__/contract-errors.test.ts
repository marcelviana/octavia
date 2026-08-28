/**
 * Gate do contrato de erro (B3, docs/api/CONTRATO-DE-ERRO.md) — o
 * PRIMEIRO gate unitário do shape semente (achado do PR-0/§4.1: os
 * contract tests do B2 testam parse de schema, uma camada ABAIXO do
 * envelope; grep VALIDATION_ERROR nos testes → zero antes deste arquivo).
 *
 * DUAS CAMADAS (ordem vinculante do PR-1, B3-DESENHO.md §4.1):
 *
 *  1. Módulo lib/api-errors.ts: taxonomia 1:1, shape de cada atalho,
 *     G-D7 (multi-chave), G-sintética (field:"" sem campos crus do Zod).
 *  2. MIDDLEWARE: os literais MEDIDOS no B3-PRECHECK.md §2.1/2.2,
 *     assertados por res.text() — byte-identidade, não deep-equal.
 *     Escritos VERDES contra o middleware PRÉ-delegação (commit 1);
 *     verdes intocados PÓS-delegação (commit 2) = a prova. Única exceção
 *     declarada: o caso sintético (>1MB/JSON inválido), que nasce no
 *     shape NOVO como it.fails (controle negativo codificado) e tem o
 *     .fails removido no commit 2.
 */

import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import {
  STATUS_BY_CODE,
  apiError,
  zodDetails,
  authRequired,
  notFound,
  internalError,
  validationError,
  type ApiErrorCode,
} from '../api-errors'

// Camada 2 precisa do middleware com auth controlável (caso 401).
vi.mock('@/lib/secure-auth-utils', () => ({
  requireAuthServerSecure: vi.fn(async () => null),
}))

import { withValidation, withPublicBodyValidation } from '../api-validation-middleware'

// ————————————————————————————————————————————————————————————————
// Camada 1 — o módulo
// ————————————————————————————————————————————————————————————————

describe('api-errors — taxonomia e envelope (camada 1)', () => {
  it('mapeamento code↔status é 1:1 para os 5 codes', () => {
    const esperado: Record<ApiErrorCode, number> = {
      AUTH_REQUIRED: 401,
      VALIDATION_ERROR: 400,
      NOT_FOUND: 404,
      RATE_LIMITED: 429,
      INTERNAL_ERROR: 500,
    }
    for (const code of Object.keys(esperado) as ApiErrorCode[]) {
      expect(STATUS_BY_CODE[code]).toBe(esperado[code])
      expect(apiError(code, 'x').status).toBe(esperado[code])
    }
  })

  it('envelope mínimo: { error, code } + Content-Type json', async () => {
    const res = apiError('NOT_FOUND', 'Nada aqui')
    expect(res.headers.get('Content-Type')).toBe('application/json')
    expect(await res.json()).toEqual({ error: 'Nada aqui', code: 'NOT_FOUND' })
  })

  it('details entra quando passado; retryAfter entra via extra tipado (emenda 2)', async () => {
    const res = apiError('RATE_LIMITED', 'Rate limit exceeded', {
      extra: { retryAfter: 42 },
    })
    expect(await res.json()).toEqual({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMITED',
      retryAfter: 42,
    })
    const res2 = apiError('VALIDATION_ERROR', 'Validation failed', {
      details: [{ field: 'x', message: 'm', code: 'c' }],
    })
    expect((await res2.json()).details).toEqual([{ field: 'x', message: 'm', code: 'c' }])
  })

  it('authRequired: 401 + WWW-Authenticate: Bearer + corpo canônico', async () => {
    const res = authRequired()
    expect(res.status).toBe(401)
    expect(res.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await res.text()).toBe('{"error":"Authentication required","code":"AUTH_REQUIRED"}')
  })

  it('notFound: 404 com mensagem canônica (e específica quando passada)', async () => {
    expect(await notFound().text()).toBe('{"error":"Resource not found","code":"NOT_FOUND"}')
    expect(await notFound('Setlist not found').text()).toBe(
      '{"error":"Setlist not found","code":"NOT_FOUND"}'
    )
  })

  it('internalError: 500 sempre genérico', async () => {
    expect(await internalError().text()).toBe(
      '{"error":"Internal server error","code":"INTERNAL_ERROR"}'
    )
  })

  it('validationError com ZodError real → shape semente com field do path', async () => {
    const r = z.object({ name: z.string() }).strict().safeParse({})
    expect(r.success).toBe(false)
    if (r.success) return
    const res = validationError(r.error)
    expect(res.status).toBe(400)
    expect(await res.text()).toBe(
      '{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"name","message":"Required","code":"invalid_type"}]}'
    )
  })

  it('G-D7: DUAS chaves desconhecidas → um detail POR CHAVE, fields nomeados', async () => {
    // Controle negativo (medido, B3-PRECHECK §2.2): o middleware atual
    // emite UM item com field:"" — o contrato exige um por chave.
    const r = z
      .object({ name: z.string() })
      .strict()
      .safeParse({ name: 'x', __b3_x__: 1, __b3_y__: 2 })
    expect(r.success).toBe(false)
    if (r.success) return
    const body = await validationError(r.error).json()
    expect(body.details).toHaveLength(2)
    expect(body.details).toEqual([
      { field: '__b3_x__', message: "Unrecognized key: '__b3_x__'", code: 'unrecognized_keys' },
      { field: '__b3_y__', message: "Unrecognized key: '__b3_y__'", code: 'unrecognized_keys' },
    ])
  })

  it('G-D7: UMA chave desconhecida → field = a chave (default do contrato)', async () => {
    const r = z.object({ name: z.string() }).strict().safeParse({ name: 'x', __b3_unknown__: 1 })
    expect(r.success).toBe(false)
    if (r.success) return
    const body = await validationError(r.error).json()
    expect(body.details).toEqual([
      {
        field: '__b3_unknown__',
        message: "Unrecognized key: '__b3_unknown__'",
        code: 'unrecognized_keys',
      },
    ])
  })

  it('expandUnrecognizedKeys:false preserva o mapping antigo (field:"") — uso exclusivo do middleware nesta fase', async () => {
    const r = z.object({ name: z.string() }).strict().safeParse({ name: 'x', __b3_unknown__: 1 })
    expect(r.success).toBe(false)
    if (r.success) return
    const body = await validationError(r.error, { expandUnrecognizedKeys: false }).json()
    expect(body.details).toEqual([
      {
        field: '',
        message: "Unrecognized key(s) in object: '__b3_unknown__'",
        code: 'unrecognized_keys',
      },
    ])
  })

  it('G-sintética: issue de corpo (path:[]) → field:"" SEM expected/received crus', () => {
    // Literal do achado §0.3 do desenho: o middleware atual vaza
    // path/expected/received no 400 de corpo >1MB / JSON inválido.
    const sintetica = {
      code: 'invalid_type',
      message: 'Invalid request body format',
      path: [],
      expected: 'object',
      received: 'unknown',
    } as unknown as z.ZodIssue
    const details = zodDetails([sintetica])
    expect(details).toEqual([
      { field: '', message: 'Invalid request body format', code: 'invalid_type' },
    ])
    expect(details[0]).not.toHaveProperty('expected')
    expect(details[0]).not.toHaveProperty('received')
    expect(details[0]).not.toHaveProperty('path')
  })
})

// ————————————————————————————————————————————————————————————————
// Camada 2 — o MIDDLEWARE, pelos literais medidos (byte-identidade)
// Fonte dos literais: B3-PRECHECK.md §2.1/§2.2 e B3-DESENHO.md §0.3.
// NÃO EDITAR entre os commits 1 e 2 do PR-1 (ordem vinculante §4.1) —
// exceção única e declarada: o it.fails do caso sintético.
// ————————————————————————————————————————————————————————————————

const schemaB3 = z.object({ name: z.string() }).strict()

function jsonRequest(body: string): Request {
  return new Request('http://test.local/api/b3-contract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

describe('shape semente contra o middleware (camada 2 — byte-identidade)', () => {
  it('400 de validação: literal do pre-check §2.2 (campo faltando)', async () => {
    const handler = withPublicBodyValidation(schemaB3)(async () => new Response('ok'))
    const res = await handler(jsonRequest(JSON.stringify({})))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe(
      '{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"name","message":"Required","code":"invalid_type"}]}'
    )
  })

  it('400 unrecognized_keys de UMA chave: literal do pre-check §2.2 (field:"" — comportamento atual, não muda neste PR)', async () => {
    const handler = withPublicBodyValidation(schemaB3)(async () => new Response('ok'))
    const res = await handler(jsonRequest(JSON.stringify({ name: 'x', __b3_unknown__: 1 })))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe(
      '{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"","message":"Unrecognized key(s) in object: \'__b3_unknown__\'","code":"unrecognized_keys"}]}'
    )
  })

  it('401 sem credencial: literal do pre-check §2.1 + WWW-Authenticate', async () => {
    const handler = withValidation(schemaB3, { requireAuth: true })(
      async () => new Response('ok')
    )
    const res = await handler(jsonRequest(JSON.stringify({ name: 'x' })))
    expect(res.status).toBe(401)
    expect(res.headers.get('WWW-Authenticate')).toBe('Bearer')
    expect(await res.text()).toBe('{"error":"Authentication required","code":"AUTH_REQUIRED"}')
  })

  it('500 do catch do middleware: literal (código-confirmado no pre-check §2.9)', async () => {
    const handler = withPublicBodyValidation(schemaB3)(async () => {
      throw new Error('boom interno')
    })
    const res = await handler(jsonRequest(JSON.stringify({ name: 'x' })))
    expect(res.status).toBe(500)
    expect(await res.text()).toBe('{"error":"Internal server error","code":"INTERNAL_ERROR"}')
  })

  // MUDANÇA DECLARADA do PR-1 (desenho §0.3-2 / §3.PR-1): o 400 sintético
  // (JSON inválido, corpo >1MB) passa pelo mapper único. Este assert já
  // nasce no shape NOVO; no commit 1 ele rodou como it.fails contra o
  // middleware ATUAL (details crus com path/expected/received — literal
  // medido no §0.3): o controle negativo CODIFICADO e executado (regra
  // nº 7). O commit 2 removeu o .fails; nenhum outro caractere mudou.
  it('400 sintético (JSON inválido): shape novo via mapper único', async () => {
    const handler = withPublicBodyValidation(schemaB3)(async () => new Response('ok'))
    const res = await handler(jsonRequest('não é json {{{'))
    expect(res.status).toBe(400)
    expect(await res.text()).toBe(
      '{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"","message":"Invalid request body format","code":"invalid_type"}]}'
    )
  })
})
