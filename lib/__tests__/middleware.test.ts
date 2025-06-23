import { describe, it, expect, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'


describe('middleware auth', () => {
  it('redirects to login when session cookie is invalid', async () => {
    vi.doMock('../firebase-server-utils', () => ({
      validateFirebaseTokenServer: vi.fn().mockResolvedValue({ isValid: false })
    }))

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=expired' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    vi.resetModules()
  })

  it('allows request when session cookie is valid', async () => {
    vi.doMock('../firebase-server-utils', () => ({
      validateFirebaseTokenServer: vi.fn().mockResolvedValue({ isValid: true })
    }))

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ cookie: 'firebase-session=valid' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    vi.resetModules()
  })

  it('redirects to login when bearer token is invalid', async () => {
    vi.doMock('../firebase-server-utils', () => ({
      validateFirebaseTokenServer: vi.fn().mockResolvedValue({ isValid: false })
    }))

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer badtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBe('https://site.test/login')
    vi.resetModules()
  })

  it('allows request when bearer token is valid', async () => {
    vi.doMock('../firebase-server-utils', () => ({
      validateFirebaseTokenServer: vi.fn().mockResolvedValue({ isValid: true })
    }))

    vi.spyOn(NextResponse, 'next').mockImplementation(() => new NextResponse())

    const { middleware } = await import('../../middleware')

    const baseReq = new Request('https://site.test/dashboard', {
      headers: new Headers({ authorization: 'Bearer goodtoken' })
    })
    const req = new NextRequest(baseReq)

    const res = await middleware(req as any)

    expect(res.headers.get('location')).toBeNull()
    vi.resetModules()
  })
})
