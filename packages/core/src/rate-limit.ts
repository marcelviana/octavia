/**
 * 429 e janela de espera (PRD T1-R4; aceite A3). O servidor manda o prazo em
 * DOIS lugares (`docs/api/CONTRATO-DE-ERRO.md`; medido na nota N3 do PRD):
 * header `Retry-After` (segundos, inteiro — `lib/user-rate-limit.ts:134`) e
 * `retryAfter` no corpo do envelope `RATE_LIMITED` (`lib/api-errors.ts:57`).
 * O header é autoritativo; o corpo é o fallback.
 *
 * O gate guarda estado explícito por família (`content-read`, `setlist-read`,
 * …) e **não** usa timer: quem chama passa o relógio.
 */

function parseSeconds(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

function headerValue(headers: Record<string, string>, name: string): string | undefined {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name) return headers[key]
  }
  return undefined
}

/**
 * Segundos a esperar antes da próxima request à mesma família, ou `null`
 * quando a resposta não informa prazo (nesse caso a UI não promete "tentando
 * em N s" — T1-R4).
 */
export function retryAfterFrom(
  headers: Record<string, string>,
  bodyText: string | null,
): number | null {
  const fromHeader = parseSeconds(headerValue(headers, 'retry-after'))
  if (fromHeader !== null) return fromHeader

  if (bodyText === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(bodyText)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const envelope = parsed as { code?: unknown; retryAfter?: unknown }
  if (envelope.code !== 'RATE_LIMITED') return null
  const seconds = envelope.retryAfter
  if (typeof seconds !== 'number' || !Number.isInteger(seconds) || seconds < 0) return null
  return seconds
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
  const blockedUntil = new Map<string, number>()
  return {
    block(family, untilMs) {
      const current = blockedUntil.get(family)
      if (current === undefined || untilMs > current) blockedUntil.set(family, untilMs)
    },
    canRequest(family, nowMs) {
      const until = blockedUntil.get(family)
      return until === undefined || nowMs >= until
    },
    nextAllowedAt(family) {
      return blockedUntil.get(family) ?? null
    },
  }
}
