import { NextRequest } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { isSupabaseConfigured } from '@/lib/supabase'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { checkRateLimit, rateLimited, getClientIp, RATE_LIMITS } from '@/lib/user-rate-limit'
import { authRequired, internalError, notFound, validationError } from '@/lib/api-errors'

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL not set')
    return internalError()
  }
  const defaultHost = new URL(baseUrl).host
  const allowedHosts = (process.env.ALLOWED_PROXY_HOSTS ?? defaultHost)
    .split(',')
    .map(h => h.trim())
    .filter(Boolean)

  const urlParam = req.nextUrl.searchParams.get('url')
  // B3 PR-4/D5: proxy fala o envelope; 400 SEMPRE com details (nota do
  // aval do PR-0 — field:"url"; codes: invalid_type p/ ausente,
  // invalid_string p/ malformada/não-permitida)
  if (!urlParam) {
    return validationError([
      { code: 'invalid_type', path: ['url'], message: 'Missing url' } as never,
    ])
  }

  let target: URL
  try {
    target = new URL(urlParam)
  } catch {
    return validationError([
      { code: 'invalid_string', path: ['url'], message: 'Invalid url' } as never,
    ])
  }

  if (!allowedHosts.includes(target.host)) {
    return validationError([
      { code: 'invalid_string', path: ['url'], message: 'URL not allowed. Configure ALLOWED_PROXY_HOSTS.' } as never,
    ])
  }

  // B1.3: o limiter inline por IP (terceiro sistema, achado do pre-check)
  // migra para o sistema único — por uid quando autenticado; por IP só no
  // modo dev sem Supabase (auth desligada).
  let rlKey: { scope: 'user' | 'ip'; id: string }
  if (isSupabaseConfigured) {
    const user = await requireAuthServer(req)
    if (!user) {
      return authRequired()
    }
    rlKey = { scope: 'user', id: user.uid }
  } else {
    rlKey = { scope: 'ip', id: getClientIp(req) }
  }

  const rl = checkRateLimit({ ...rlKey, familia: 'proxy', config: RATE_LIMITS.PROXY })
  if (!rl.ok) {
    return rateLimited(rl)
  }

  try {
    const res = await fetch(target.href)
    if (!res.ok) {
      // Decisão A (aval do desenho §8): nenhum status de dependência
      // atravessa cru — 404 do upstream vira NOSSO 404; o resto, 500.
      return res.status === 404 ? notFound() : internalError()
    }
    const headers = new Headers(res.headers)
    headers.delete('set-cookie')
    headers.delete('transfer-encoding')
    return new Response(res.body, { status: res.status, headers })
  } catch (err) {
    console.error('Proxy error', err)
    return internalError()
  }
}
