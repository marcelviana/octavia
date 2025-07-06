import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const mockValidateFirebaseTokenServer = vi.fn()
vi.mock('../firebase-server-utils', () => ({
  validateFirebaseTokenServer: mockValidateFirebaseTokenServer,
}))

describe('middleware auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('redirects to login when session cookie is invalid', async () => {
    mockValidateFirebaseTokenServer.mockResolvedValue({ isValid: false })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=expired' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    expect(mockValidateFirebaseTokenServer).toHaveBeenCalledWith(
      'expired',
      baseReq.url
    )
  })

  it('allows request when session cookie is valid and email is verified', async () => {
    mockValidateFirebaseTokenServer.mockResolvedValue({ 
      isValid: true, 
      user: { uid: 'user1', email: 'test@example.com', emailVerified: true }
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=valid' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    expect(mockValidateFirebaseTokenServer).toHaveBeenCalledWith('valid', baseReq.url)
  })

  it('redirects to verify-email when session cookie is valid but email is not verified', async () => {
    mockValidateFirebaseTokenServer.mockResolvedValue({ 
      isValid: true, 
      user: { uid: 'user1', email: 'test@example.com', emailVerified: false }
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=valid' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/verify-email')
    expect(mockValidateFirebaseTokenServer).toHaveBeenCalledWith('valid', baseReq.url)
  })

  it('redirects to login when bearer token is invalid', async () => {
    mockValidateFirebaseTokenServer.mockResolvedValue({ isValid: false })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer badtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    expect(mockValidateFirebaseTokenServer).toHaveBeenCalledWith(
      'badtoken',
      baseReq.url
    )
  })

  it('allows request when bearer token is valid and email is verified', async () => {
    mockValidateFirebaseTokenServer.mockResolvedValue({ 
      isValid: true, 
      user: { uid: 'user1', email: 'test@example.com', emailVerified: true }
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer goodtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    expect(mockValidateFirebaseTokenServer).toHaveBeenCalledWith(
      'goodtoken',
      baseReq.url
    )
  })

  it('redirects to verify-email when bearer token is valid but email is not verified', async () => {
    mockValidateFirebaseTokenServer.mockResolvedValue({ 
      isValid: true, 
      user: { uid: 'user1', email: 'test@example.com', emailVerified: false }
    })

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer goodtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/verify-email')
    expect(mockValidateFirebaseTokenServer).toHaveBeenCalledWith(
      'goodtoken',
      baseReq.url
    )
  })

  it('redirects to login when verification fails', async () => {
    mockValidateFirebaseTokenServer.mockRejectedValue(new Error('Network error'))

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
