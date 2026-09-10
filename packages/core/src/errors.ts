/**
 * Normalização de falha da camada de rede única (PRD T1-R37; aceites A19/A3):
 * toda não-2xx vira um `AppError` com chave de mensagem pt-BR derivada do
 * `code` do envelope (`docs/api/CONTRATO-DE-ERRO.md`), nunca do campo `error`.
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */

export type AppErrorKind =
  | 'network'
  | 'auth'
  | 'rate-limited'
  | 'not-found'
  | 'validation'
  | 'server'
  | 'unknown'

export interface AppError {
  kind: AppErrorKind
  /** `code` do envelope quando houve envelope; `null` caso contrário. */
  code: string | null
  /** Segundos até a próxima tentativa (só `rate-limited`). */
  retryAfter: number | null
  /** Chave da mensagem pt-BR (o texto é da UI — PR3). */
  messageKey: string
}

export interface ErrorInput {
  status?: number
  bodyText?: string | null
  /** Mensagem do erro de transporte, quando a request nem chegou a responder. */
  networkError?: string | null
  /** Headers da resposta (só `Retry-After` é lido). */
  headers?: Record<string, string>
}

export function errorFrom(_input: ErrorInput): AppError {
  throw new Error('not implemented')
}
