/**
 * Ponto ÚNICO de construção de resposta de erro (B3, docs/api/CONTRATO-DE-ERRO.md).
 *
 * Substitui os 7 idiomas medidos no pre-check do B3 (§4): middleware,
 * validation-utils, rateLimited, inline espalhado, storage/upload inline,
 * proxy em texto e o withSecureAuth órfão. As rotas migram por PR
 * (B3-DESENHO.md §3); as mensagens humanas canônicas vivem nos atalhos
 * deste arquivo, uma vez cada.
 *
 * Módulo deliberadamente com `Response` puro e ZERO imports de
 * next/server (mesmo motivo do user-rate-limit: este módulo entra no
 * grafo dos funis de auth, que o client também importa). O import de zod
 * é type-only — nada de runtime novo no grafo.
 */

import type { ZodError, ZodIssue } from 'zod'

/**
 * Taxonomia FECHADA do contrato — mapeamento 1:1 code↔status nas duas
 * direções. Status é DERIVADO do code: um par inconsistente não compila.
 * Lista append-only (cláusula do contrato); code novo = editar AQUI.
 */
export const STATUS_BY_CODE = {
  AUTH_REQUIRED: 401,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
} as const

export type ApiErrorCode = keyof typeof STATUS_BY_CODE

export interface ApiErrorDetail {
  field: string
  message: string
  code: string
}

/**
 * Construtor único do envelope flat { error, code, details?, retryAfter? }.
 *
 * `extra` é TIPADO FECHADO por decisão (emenda 2 do aval do desenho):
 * o único campo extra do envelope é o retryAfter do 429 — o envelope não
 * cresce sem tocar este arquivo, e campo não previsto não compila.
 */
export function apiError(
  code: ApiErrorCode,
  error: string,
  opts?: {
    details?: ApiErrorDetail[]
    headers?: Record<string, string>
    extra?: { retryAfter?: number }
  }
): Response {
  const body: Record<string, unknown> = { error, code }
  if (opts?.details) body.details = opts.details
  if (opts?.extra?.retryAfter !== undefined) body.retryAfter = opts.extra.retryAfter
  return new Response(JSON.stringify(body), {
    status: STATUS_BY_CODE[code],
    headers: {
      'Content-Type': 'application/json',
      ...opts?.headers,
    },
  })
}

/**
 * Mapper único de issues Zod → details do contrato.
 *
 * (a) D7: `unrecognized_keys` expande em UM detail POR CHAVE de
 *     `issue.keys` — nunca só keys[0], nunca field:"" (princípio SAN-01:
 *     nenhuma chave ofensora silenciada).
 * (b) Issues sintéticas do parse de corpo (JSON malformado, corpo >1MB —
 *     path: []) saem com field:"" ("o corpo como um todo", reserva do
 *     contrato) e SEM os campos crus do Zod (expected/received — o achado
 *     §0.3 do desenho morre aqui).
 *
 * [PR-3b] O flag temporário do PR-1 (modo não-contrato do unrecognized,
 * usado só pelo middleware pela byte-identidade do §4.1) MORREU no flip
 * — o helper só fala o contrato.
 */
export function zodDetails(issues: ZodIssue[]): ApiErrorDetail[] {
  const details: ApiErrorDetail[] = []
  for (const issue of issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) {
        details.push({
          field: key,
          message: `Unrecognized key: '${key}'`,
          code: issue.code,
        })
      }
      continue
    }
    details.push({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    })
  }
  return details
}

// ——— Atalhos com as mensagens humanas canônicas ———

/** 401 — credencial ausente/inválida/expirada (indistinguíveis por contrato). */
export function authRequired(error = 'Authentication required'): Response {
  return apiError('AUTH_REQUIRED', error, {
    headers: { 'WWW-Authenticate': 'Bearer' },
  })
}

/** 404 — inexistente OU de outro usuário (D2: sem oráculo de existência). */
export function notFound(error = 'Resource not found'): Response {
  return apiError('NOT_FOUND', error)
}

/** 500 — mensagem SEMPRE genérica; nada de mensagem interna de dependência. */
export function internalError(error = 'Internal server error'): Response {
  return apiError('INTERNAL_ERROR', error)
}

/** 400 de validação — aceita o ZodError inteiro ou issues avulsas. */
export function validationError(input: ZodError | ZodIssue[]): Response {
  const issues = Array.isArray(input) ? input : input.issues
  return apiError('VALIDATION_ERROR', 'Validation failed', {
    details: zodDetails(issues),
  })
}
