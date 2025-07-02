import localforage from 'localforage'

const QUEUE_KEY = 'octavia-offline-queue'

export type QueueItem = {
  method: 'POST' | 'PUT' | 'DELETE'
  url: string
  body?: any
  headers?: Record<string, string>
}

export async function enqueueRequest(item: QueueItem): Promise<void> {
  const queue = (await localforage.getItem<QueueItem[]>(QUEUE_KEY)) || []
  queue.push(item)
  await localforage.setItem(QUEUE_KEY, queue)
}

export async function processQueue(): Promise<void> {
  const queue = (await localforage.getItem<QueueItem[]>(QUEUE_KEY)) || []
  if (!queue.length) return
  const remaining: QueueItem[] = []
  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(item.headers || {}),
        },
        body: item.body ? JSON.stringify(item.body) : undefined,
      })
      if (!res.ok) throw new Error('request failed')
    } catch {
      remaining.push(item)
    }
  }
  await localforage.setItem(QUEUE_KEY, remaining)
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('online', () => {
    navigator.serviceWorker.ready.then(() => processQueue())
  })
}
