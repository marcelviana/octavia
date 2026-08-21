/**
 * Sistema ÚNICO de rate limiting (B1.3, docs/ux/PLANO-TRANSICAO.md).
 *
 * Chave por USUÁRIO AUTENTICADO (uid, pós-verificação — viável porque a
 * verificação é chamada local e barata desde a B1.1), com fallback por IP
 * exclusivamente para (a) o caminho de auth FALHADA ("sem credencial não
 * significa sem limite") e (b) rotas públicas (health). Substitui o
 * lib/rate-limit.ts (por IP, buckets compartilhados entre rotas — o
 * desenho que derrubava o usuário logado, RATE-01) e o lib/rate-limiter.ts
 * (chave ip:prefixo-de-token:path — prefixo muda a cada refresh de 1h).
 *
 * NOTA DE ARQUITETURA (aceita por desenho, não bug): o store é um Map em
 * memória POR INSTÂNCIA de lambda — janelas independentes por instância.
 * Para app de usuário único o teto efetivo é limite × instâncias, o que
 * só afrouxa, nunca aperta. Store distribuído (Redis) fica registrado
 * como evolução se o app um dia tiver multiusuário real.
 *
 * A resposta 429 é ESTRUTURADA (semente do B3): body { error, retryAfter }
 * + X-RateLimit-Limit/Remaining/Reset + Retry-After honesto +
 * X-RateLimit-Scope ('user'|'ip') — a assinatura que o gate G2 assert.
 *
 * Módulo deliberadamente sem imports de next/server (Response puro):
 * firebase-server-utils está no grafo do client e este módulo é importado
 * pelos funis de auth.
 */

export interface RateLimitConfig {
  windowMs: number
  max: number
}

/**
 * Janelas do sistema único — racionais na tabela do plano (B1.3).
 * Caso dimensionante do SESSION: visibilitychange do tablet de palco
 * (dossiê de 6 medições: 7-11 POSTs em 12 navegações triviais); 120/15min
 * = 8/min sustentado, ~8× o pior show real, e ainda barra loop doente.
 */
export const RATE_LIMITS = {
  /** POST /api/auth/session com token válido (por uid) */
  SESSION: { windowMs: 15 * 60_000, max: 120 },
  /** POST /api/auth/session com token INVÁLIDO (por IP — brute force) */
  SESSION_AUTH_FAIL: { windowMs: 15 * 60_000, max: 10 },
  /** DELETE /api/auth/session (logout; por IP — logout com token morto deve funcionar) */
  SESSION_DELETE: { windowMs: 15 * 60_000, max: 30 },
  /** Auth falhada em qualquer rota autenticada (por IP, nos funis de auth) */
  AUTH_FAIL: { windowMs: 5 * 60_000, max: 30 },
  /** Leituras (content/setlists GET) — performance mode nunca pode engasgar */
  READ: { windowMs: 60_000, max: 300 },
  /** Mutações (content/setlists POST/PUT/DELETE/PATCH) — montagem de setlist de 56 canções cabe 2× */
  MUTATE: { windowMs: 15 * 60_000, max: 120 },
  /** Perfil (GET/POST/PATCH) — 1× por load + retry */
  PROFILE: { windowMs: 15 * 60_000, max: 60 },
  /** storage upload/delete — subir um repertório inteiro numa sessão */
  STORAGE: { windowMs: 60 * 60_000, max: 60 },
  /** /api/proxy — biblioteca cheia busca dezenas de assets por load */
  PROXY: { windowMs: 60_000, max: 120 },
  /** /api/health (pública; por IP) */
  HEALTH: { windowMs: 60_000, max: 120 },
} as const

export interface RateLimitResult {
  ok: boolean
  scope: 'user' | 'ip'
  limit: number
  remaining: number
  resetTime: number
}

interface Entry {
  count: number
  resetTime: number
}

const store = new Map<string, Entry>()

// Limpeza periódica de janelas vencidas (por instância)
if (typeof setInterval === 'function') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetTime) store.delete(key)
    }
  }, 60_000).unref?.()
}

/** Só para testes: zera o store da instância. */
export function clearRateLimitStore(): void {
  store.clear()
}

export function checkRateLimit(opts: {
  scope: 'user' | 'ip'
  id: string
  familia: string
  config: RateLimitConfig
}): RateLimitResult {
  const { scope, id, familia, config } = opts
  const key = `${scope}:${id}:${familia}`
  const now = Date.now()

  let entry = store.get(key)
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + config.windowMs }
    store.set(key, entry)
  }
  entry.count++

  return {
    ok: entry.count <= config.max,
    scope,
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetTime: entry.resetTime,
  }
}

/** Resposta 429 estruturada com a assinatura do sistema único. */
export function rateLimited(result: RateLimitResult): Response {
  const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000))
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded', retryAfter }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
        'X-RateLimit-Scope': result.scope,
        'Retry-After': String(retryAfter),
      },
    }
  )
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Fallback de auth falhada, chamado NOS FUNIS de auth (requireAuthServer
 * e requireAuthServerSecure) quando a validação de credencial falha.
 * Devolve true quando o IP estourou a janela — o funil então nega SEM
 * verificar (corta o trabalho e o oráculo); o status na resposta é 429
 * onde a rota/wrapper consegue emiti-lo (withValidation e session POST)
 * e 401 nos handlers legados — o deny-fast vale em todos.
 */
export function recordAuthFailure(ip: string): void {
  checkRateLimit({ scope: 'ip', id: ip, familia: 'authfail', config: RATE_LIMITS.AUTH_FAIL })
}

export function authFailureLimited(ip: string): boolean {
  const key = `ip:${ip}:authfail`
  const entry = store.get(key)
  if (!entry || Date.now() > entry.resetTime) return false
  return entry.count > RATE_LIMITS.AUTH_FAIL.max
}
