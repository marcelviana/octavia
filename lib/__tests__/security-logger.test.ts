import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { securityLogger, getClientIP, getUserAgent } from '../security-logger'

// Silence console output and allow inspection
let infoSpy: ReturnType<typeof vi.spyOn>
let warnSpy: ReturnType<typeof vi.spyOn>
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('securityLogger.logAuthSuccess', () => {
  it('logs at info level with extracted ip and user agent', () => {
    const req = new NextRequest('https://site.test/login', {
      headers: { 'x-forwarded-for': '1.2.3.4', 'user-agent': 'test-agent' }
    })

    const ip = getClientIP(req)
    const ua = getUserAgent(req)

    securityLogger.logAuthSuccess('user1', 'user@example.com', ip, ua)

    expect(ip).toBe('1.2.3.4')
    expect(ua).toBe('test-agent')
    expect(infoSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()

    const [msg, data] = infoSpy.mock.calls[0]
    expect(String(msg)).toMatch(/AUTH_SUCCESS/)
    expect(data).toEqual(expect.objectContaining({
      userId: 'user1',
      email: 'user@example.com',
      ip: '1.2.3.4'
    }))
  })
})

describe('securityLogger.logUnauthorizedAccess', () => {
  it('logs at error level and triggers alert for high risk', () => {
    const req = new NextRequest('https://site.test/admin', {
      headers: { 'x-forwarded-for': '5.6.7.8', 'user-agent': 'bad-agent' }
    })

    const ip = getClientIP(req)
    const ua = getUserAgent(req)

    securityLogger.logUnauthorizedAccess(ip, '/admin', ua)

    expect(ip).toBe('5.6.7.8')
    expect(ua).toBe('bad-agent')
    expect(errorSpy.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()

    const [msg, data] = errorSpy.mock.calls[0]
    expect(String(msg)).toMatch(/UNAUTHORIZED_ACCESS/)
    expect(data).toEqual(expect.objectContaining({
      ip: '5.6.7.8',
      resource: '/admin'
    }))
  })
})

describe('getClientIP', () => {
  it('prefers x-forwarded-for header', () => {
    const req = new NextRequest('https://example.com', {
      headers: { 'x-forwarded-for': '9.8.7.6, 5.4.3.2' }
    })
    expect(getClientIP(req)).toBe('9.8.7.6')
  })

  it('uses x-real-ip when forwarded missing', () => {
    const req = new NextRequest('https://example.com', {
      headers: { 'x-real-ip': '10.0.0.1' }
    })
    expect(getClientIP(req)).toBe('10.0.0.1')
  })

  it('falls back to localhost when no headers present', () => {
    const req = new NextRequest('https://example.com')
    expect(getClientIP(req)).toBe('127.0.0.1')
  })
})

describe('getUserAgent', () => {
  it('returns user agent header value', () => {
    const req = new NextRequest('https://example.com', {
      headers: { 'user-agent': 'agent1' }
    })
    expect(getUserAgent(req)).toBe('agent1')
  })

  it('returns "unknown" when header missing', () => {
    const req = new NextRequest('https://example.com')
    expect(getUserAgent(req)).toBe('unknown')
  })
})
