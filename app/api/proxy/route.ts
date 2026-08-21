import { NextRequest } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { isSupabaseConfigured } from '@/lib/supabase'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { checkRateLimit, rateLimited, getClientIp, RATE_LIMITS } from '@/lib/user-rate-limit'

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) {
    console.error('NEXT_PUBLIC_SUPABASE_URL not set')
    return new Response('Server misconfiguration', { status: 500 })
  }
  const defaultHost = new URL(baseUrl).host
  const allowedHosts = (process.env.ALLOWED_PROXY_HOSTS ?? defaultHost)
    .split(',')
    .map(h => h.trim())
    .filter(Boolean)

  const urlParam = req.nextUrl.searchParams.get('url')
  if (!urlParam) {
    return new Response('Missing url', { status: 400 })
  }

  let target: URL
  try {
    target = new URL(urlParam)
  } catch {
    return new Response('Invalid url', { status: 400 })
  }

  if (!allowedHosts.includes(target.host)) {
    return new Response('URL not allowed. Configure ALLOWED_PROXY_HOSTS.', { status: 400 })
  }

  // B1.3: o limiter inline por IP (terceiro sistema, achado do pre-check)
  // migra para o sistema único — por uid quando autenticado; por IP só no
  // modo dev sem Supabase (auth desligada).
  let rlKey: { scope: 'user' | 'ip'; id: string }
  if (isSupabaseConfigured) {
    const user = await requireAuthServer(req)
    if (!user) {
      return new Response('Authentication required', { status: 401 })
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
      return new Response('Fetch failed', { status: res.status })
    }
    const headers = new Headers(res.headers)
    headers.delete('set-cookie')
    headers.delete('transfer-encoding')
    return new Response(res.body, { status: res.status, headers })
  } catch (err) {
    console.error('Proxy error', err)
    return new Response('Error fetching resource', { status: 500 })
  }
}
