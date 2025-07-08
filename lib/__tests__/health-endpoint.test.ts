import { describe, it, expect } from 'vitest'

it('GET returns 200', async () => {
  const mod = await import('../../app/api/health/route')
  const { NextRequest } = await import('next/server')
  const res = await mod.GET(new NextRequest('http://localhost/api/health'))
  expect(res.status).toBe(200)
})

it('HEAD returns 200', async () => {
  const mod = await import('../../app/api/health/route')
  const { NextRequest } = await import('next/server')
  const res = await mod.HEAD(new NextRequest('http://localhost/api/health'))
  expect(res.status).toBe(200)
})
