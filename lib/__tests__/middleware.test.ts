import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockVerifyFirebaseToken = vi.fn()
vi.mock('../firebase-admin', () => ({
  verifyFirebaseToken: mockVerifyFirebaseToken,
}))

describe('middleware auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('redirects to login when session cookie is invalid', async () => {
    mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=expired' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    expect(mockVerifyFirebaseToken).toHaveBeenCalledWith('expired')
  })

  it('allows request when session cookie is valid', async () => {
    mockVerifyFirebaseToken.mockResolvedValue({ uid: 'test-uid' })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=valid' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    expect(mockVerifyFirebaseToken).toHaveBeenCalledWith('valid')
  })

  it('redirects to login when bearer token is invalid', async () => {
    mockVerifyFirebaseToken.mockRejectedValue(new Error('Invalid token'))

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer badtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    expect(mockVerifyFirebaseToken).toHaveBeenCalledWith('badtoken')
  })

  it('allows request when bearer token is valid', async () => {
    mockVerifyFirebaseToken.mockResolvedValue({ uid: 'test-uid' })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer goodtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    expect(mockVerifyFirebaseToken).toHaveBeenCalledWith('goodtoken')
  })

  it('redirects to login when verification fails', async () => {
    mockVerifyFirebaseToken.mockRejectedValue(new Error('Network error'))

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
