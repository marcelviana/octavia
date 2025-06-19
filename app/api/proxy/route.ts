import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return new Response('Missing url', { status: 400 })
  }
  try {
    const res = await fetch(url)
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
