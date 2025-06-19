import { NextRequest } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!baseUrl) {
  console.error('NEXT_PUBLIC_SUPABASE_URL not set')
  throw new Error('Server misconfiguration')
}
const defaultHost = new URL(baseUrl).host
const allowedHosts = (process.env.ALLOWED_PROXY_HOSTS ?? defaultHost)
  .split(',')
  .map(h => h.trim())
  .filter(Boolean)

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

// Periodically remove stale rate limit entries to avoid unbounded memory usage
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip)
    }
  }
}, RATE_LIMIT_WINDOW_MS).unref()

export async function GET(req: NextRequest) {
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

  const supabase = await getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return new Response('Authentication required', { status: 401 })
  }

  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (entry && now - entry.timestamp < RATE_LIMIT_WINDOW_MS) {
    if (entry.count >= RATE_LIMIT_MAX) {
      return new Response('Too Many Requests', { status: 429 })
    }
    entry.count++
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
  }

  try {
    const res = await fetch(target.href)
    if (!res.ok) {
      return new Response('Fetch failed', { status: res.status })
    }
    const headers = new Headers(res.headers)
    return new Response(res.body, { status: res.status, headers })
  } catch (err) {
    console.error('Proxy error', err)
    return new Response('Error fetching resource', { status: 500 })
  }
}
