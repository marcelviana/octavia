import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('middleware auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('redirects to login when session cookie is invalid', async () => {
    // Mock fetch to return invalid token response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, error: 'Invalid token' })
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=expired' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('/api/auth/verify', 'https://site.test'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'expired' })
      })
    )
  })

  it('allows request when session cookie is valid', async () => {
    // Mock fetch to return valid token response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        user: { uid: 'test-uid', email: 'test@example.com' }
      })
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=valid' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('/api/auth/verify', 'https://site.test'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid' })
      })
    )
  })

  it('redirects to login when bearer token is invalid', async () => {
    // Mock fetch to return invalid token response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, error: 'Invalid token' })
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer badtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('/api/auth/verify', 'https://site.test'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'badtoken' })
      })
    )
  })

  it('allows request when bearer token is valid', async () => {
    // Mock fetch to return valid token response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        user: { uid: 'test-uid', email: 'test@example.com' }
      })
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer goodtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('/api/auth/verify', 'https://site.test'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'goodtoken' })
      })
    )
  })

  it('redirects to login when fetch fails', async () => {
    // Mock fetch to throw an error
    mockFetch.mockRejectedValue(new Error('Network error'))

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=token' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
  })
})
