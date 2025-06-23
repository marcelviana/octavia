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
  })
})
