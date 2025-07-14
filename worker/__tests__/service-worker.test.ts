import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

interface MockEvent {
  waitUntil?: (p: Promise<any>) => void
  respondWith?: (p: Promise<any>) => void
  request?: any
  clientId?: string
}

class MockCache {
  store = new Map<string, Response>()
  async addAll(files: string[]) {
    files.forEach(f => this.store.set(f, new Response(f)))
  }
  async match(req: Request | string) {
    const key = typeof req === 'string' ? req : req.url
    return this.store.get(key) || undefined
  }
  async put(req: Request | string, res: Response) {
    const key = typeof req === 'string' ? req : req.url
    this.store.set(key, res)
  }
}

class MockCaches {
  caches = new Map<string, MockCache>()
  async open(name: string) {
    if (!this.caches.has(name)) this.caches.set(name, new MockCache())
    return this.caches.get(name)!
  }
  async keys() { return Array.from(this.caches.keys()) }
  async delete(name: string) { this.caches.delete(name); return true }
  async match(req: Request | string) {
    for (const cache of this.caches.values()) {
      const res = await cache.match(req)
      if (res) return res
    }
    return undefined
  }
}

let events: Record<string, Function>

beforeEach(async () => {
  vi.resetModules()
  events = {}
  ;(globalThis as any).self = {
    addEventListener: (type: string, cb: any) => { events[type] = cb },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn(), get: vi.fn(async () => null), matchAll: vi.fn(async () => []) },
    location: { origin: 'https://example.com' }
  }
  ;(globalThis as any).caches = new MockCaches()
  await import('../index.js')
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (globalThis as any).self
  delete (globalThis as any).caches
})

describe('service worker', () => {
  it('caches assets during install using CACHE_NAME', async () => {
    let p: Promise<any> | undefined
    const event: MockEvent = { waitUntil: prom => { p = prom } }
    events['install'](event)
    await p
    const cachesObj = (globalThis as any).caches as MockCaches
    expect((await cachesObj.keys())).toContain('octavia-v1')
    const cache = await cachesObj.open('octavia-v1')
    expect(await cache.match('/offline')).toBeInstanceOf(Response)
  })

  it('serves offline page when navigation fetch fails', async () => {
    // run install to cache offline page
    let p: Promise<any> | undefined
    events['install']({ waitUntil: prom => { p = prom } })
    await p

    global.fetch = vi.fn(() => Promise.reject(new Error('fail')))

    let rp: Promise<Response> | undefined
    const event: MockEvent = {
      request: { method: 'GET', url: 'https://example.com/page', mode: 'navigate' },
      respondWith: prom => { rp = prom },
      clientId: '1'
    }
    events['fetch'](event)
    const res = await rp!
    expect(await res.text()).toBe('/offline')
  })
})
