import { describe, it, expect } from 'vitest'

it('GET returns 200', async () => {
  const mod = await import('../../app/api/health/route')
  const res = mod.GET()
  expect(res.status).toBe(200)
})

it('HEAD returns 200', async () => {
  const mod = await import('../../app/api/health/route')
  const res = mod.HEAD()
  expect(res.status).toBe(200)
})
