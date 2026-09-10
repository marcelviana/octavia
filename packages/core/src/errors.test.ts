import { describe, it, expect } from 'vitest'
import { errorFrom } from './errors'

/**
 * Corpos verbatim dos exemplos normativos de `docs/api/CONTRATO-DE-ERRO.md`
 * e as três formas de falha de transporte medidas no N0
 * (`N0-H15.md` §1, `N0-H16.md` §4).
 */
describe('errorFrom (T1-R37 / A19)', () => {
  it('401 AUTH_REQUIRED → auth', () => {
    expect(
      errorFrom({
        status: 401,
        bodyText: '{"error":"Authentication required","code":"AUTH_REQUIRED"}',
      }),
    ).toEqual({ kind: 'auth', code: 'AUTH_REQUIRED', retryAfter: null, messageKey: 'erro.sessao_invalida' })
  })

  it('429 RATE_LIMITED → rate-limited com o prazo do header ou do corpo', () => {
    const body = '{"error":"Rate limit exceeded","code":"RATE_LIMITED","retryAfter":868}'
    expect(errorFrom({ status: 429, bodyText: body })).toEqual({
      kind: 'rate-limited',
      code: 'RATE_LIMITED',
      retryAfter: 868,
      messageKey: 'erro.servidor_ocupado',
    })
    expect(errorFrom({ status: 429, bodyText: body, headers: { 'Retry-After': '30' } }).retryAfter).toBe(30)
  })

  it('404 NOT_FOUND → not-found', () => {
    expect(errorFrom({ status: 404, bodyText: '{"error":"Setlist not found","code":"NOT_FOUND"}' })).toEqual(
      { kind: 'not-found', code: 'NOT_FOUND', retryAfter: null, messageKey: 'erro.nao_encontrado' },
    )
  })

  it('400 VALIDATION_ERROR → validation', () => {
    const body =
      '{"error":"Validation failed","code":"VALIDATION_ERROR","details":[{"field":"id","message":"Invalid ID format","code":"invalid_string"}]}'
    expect(errorFrom({ status: 400, bodyText: body })).toEqual({
      kind: 'validation',
      code: 'VALIDATION_ERROR',
      retryAfter: null,
      messageKey: 'erro.requisicao_invalida',
    })
  })

  it('500 com envelope INTERNAL_ERROR e 500 sem JSON → server', () => {
    expect(
      errorFrom({ status: 500, bodyText: '{"error":"Internal server error","code":"INTERNAL_ERROR"}' }).kind,
    ).toBe('server')
    expect(errorFrom({ status: 500, bodyText: '' })).toEqual({
      kind: 'server',
      code: null,
      retryAfter: null,
      messageKey: 'erro.falha_do_servidor',
    })
  })

  it('413 text/plain (cláusula não-JSON) → unknown, sem retry', () => {
    expect(
      errorFrom({
        status: 413,
        bodyText: 'Request Entity Too Large FUNCTION_PAYLOAD_TOO_LARGE',
      }),
    ).toEqual({ kind: 'unknown', code: null, retryAfter: null, messageKey: 'erro.desconhecido' })
  })

  it('404 HTML de rota inexistente → unknown', () => {
    expect(errorFrom({ status: 404, bodyText: '<!DOCTYPE html><html>404</html>' }).kind).toBe('unknown')
  })

  it('as três formas de falha de transporte do N0 → network', () => {
    const formas = [
      'fetch failed: java.net.UnknownHostException: Unable to resolve host "octavia.rocks": No address associated with hostname',
      'Firebase: Error (auth/network-request-failed).',
      "Call to function 'FileSystem.downloadFileAsync' has been rejected. → Caused by: java.net.UnknownHostException",
    ]
    for (const networkError of formas) {
      expect(errorFrom({ networkError })).toEqual({
        kind: 'network',
        code: null,
        retryAfter: null,
        messageKey: 'erro.sem_conexao',
      })
    }
  })

  it('sem status, sem corpo e sem erro de rede → unknown', () => {
    expect(errorFrom({})).toEqual({
      kind: 'unknown',
      code: null,
      retryAfter: null,
      messageKey: 'erro.desconhecido',
    })
  })
})
