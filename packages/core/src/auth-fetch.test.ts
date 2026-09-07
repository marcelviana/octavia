// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { createAuthFetch, type AuthRequestInit } from './auth-fetch'

type Call = { path: string; init: AuthRequestInit }
type Res = { status: number }

function fakeFetch(statuses: number[]) {
  const calls: Call[] = []
  const fetch = vi.fn(async (path: string, init: AuthRequestInit): Promise<Res> => {
    calls.push({ path, init })
    return { status: statuses[calls.length - 1] ?? 200 }
  })
  return { fetch, calls }
}

const authHeader = (c: Call) => c.init.headers?.['Authorization']

describe('createAuthFetch (T1-R1 / T1-R3 / T1-R12)', () => {
  it('200 → 1 request com header exato "Bearer t1"', async () => {
    const { fetch, calls } = fakeFetch([200])
    const onAuthFailure = vi.fn()
    const af = createAuthFetch<Res>({ fetch, getToken: async () => 't1', onAuthFailure })
    const { response, requests } = await af('/api/setlists')
    expect(response.status).toBe(200)
    expect(requests).toBe(1)
    expect(calls).toHaveLength(1)
    expect(authHeader(calls[0]!)).toBe('Bearer t1')
    expect(onAuthFailure).not.toHaveBeenCalled()
  })

  it('401 → refresh devolve t2 ≠ t1 → 2ª request com t2 → 200: 2 requests', async () => {
    const { fetch, calls } = fakeFetch([401, 200])
    const getToken = vi.fn(async ({ forceRefresh }: { forceRefresh: boolean }) => (forceRefresh ? 't2' : 't1'))
    const onAuthFailure = vi.fn()
    const af = createAuthFetch<Res>({ fetch, getToken, onAuthFailure })
    const { response, requests } = await af('/api/setlists')
    expect(response.status).toBe(200)
    expect(requests).toBe(2)
    expect(authHeader(calls[0]!)).toBe('Bearer t1')
    expect(authHeader(calls[1]!)).toBe('Bearer t2')
    expect(getToken).toHaveBeenNthCalledWith(2, { forceRefresh: true })
    expect(onAuthFailure).not.toHaveBeenCalled()
  })

  it('401 → refresh devolve o MESMO t1 → 1 request, onAuthFailure (anti-loop)', async () => {
    const { fetch, calls } = fakeFetch([401, 200])
    const onAuthFailure = vi.fn()
    const af = createAuthFetch<Res>({ fetch, getToken: async () => 't1', onAuthFailure })
    const { response, requests } = await af('/api/setlists')
    expect(response.status).toBe(401)
    expect(requests).toBe(1)
    expect(calls).toHaveLength(1)
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
  })

  it('401 → t2 → 401 → 2 requests, onAuthFailure, nunca uma 3ª', async () => {
    const { fetch, calls } = fakeFetch([401, 401, 200])
    const getToken = vi.fn(async ({ forceRefresh }: { forceRefresh: boolean }) => (forceRefresh ? 't2' : 't1'))
    const onAuthFailure = vi.fn()
    const af = createAuthFetch<Res>({ fetch, getToken, onAuthFailure })
    const { response, requests } = await af('/api/setlists')
    expect(response.status).toBe(401)
    expect(requests).toBe(2)
    expect(calls).toHaveLength(2)
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
  })

  it('toda request leva cache: "no-store" (T1-R12)', async () => {
    const { fetch, calls } = fakeFetch([401, 200])
    const getToken = async ({ forceRefresh }: { forceRefresh: boolean }) => (forceRefresh ? 't2' : 't1')
    const af = createAuthFetch<Res>({ fetch, getToken, onAuthFailure: vi.fn() })
    await af('/api/setlists')
    expect(calls.map((c) => c.init.cache)).toEqual(['no-store', 'no-store'])
  })
})
