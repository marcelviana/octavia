/**
 * 429 e janela de espera (PRD T1-R4; aceite A3). O prazo vem no header
 * `Retry-After` e no `retryAfter` do envelope `RATE_LIMITED`
 * (`docs/api/CONTRATO-DE-ERRO.md`; nota N3 do PRD).
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */

export function retryAfterFrom(
  _headers: Record<string, string>,
  _bodyText: string | null,
): number | null {
  throw new Error('not implemented')
}

export interface RateLimitGate {
  /** Fecha a família até `untilMs` (nunca encurta uma janela já aberta). */
  block(family: string, untilMs: number): void
  /** Pode enviar agora? Famílias sem janela aberta liberam sempre. */
  canRequest(family: string, nowMs: number): boolean
  /** Instante em que a família volta a liberar, ou `null` se nunca fechou. */
  nextAllowedAt(family: string): number | null
}

export function rateLimitGate(): RateLimitGate {
  throw new Error('not implemented')
}
