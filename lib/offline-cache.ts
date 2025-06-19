import localforage from 'localforage'

const FILE_PREFIX = 'octavia-offline-file-'

const STORE_KEY = 'octavia-offline-content'

export async function getCachedContent(): Promise<any[]> {
  try {
    const data = await localforage.getItem<any[]>(STORE_KEY)
    return data || []
  } catch (err) {
    console.error('Failed to load cached content:', err)
    return []
  }
}

export async function saveContent(items: any[]): Promise<void> {
  try {
    const existing = (await localforage.getItem<any[]>(STORE_KEY)) || []
    const merged = [
      ...existing.filter((ex: any) => !items.some((it: any) => it.id === ex.id)),
      ...items,
    ]
    await localforage.setItem(STORE_KEY, merged)
  } catch (err) {
    console.error('Failed to cache offline content', err)
  }
}

export async function cacheFilesForContent(items: any[]): Promise<void> {
  for (const item of items) {
    if (!item?.id || !item?.file_url) continue
    const key = `${FILE_PREFIX}${item.id}`
    try {
      const existing = await localforage.getItem<any>(key)
      if (!existing) {
        const res = await fetch(item.file_url)
        if (!res.ok) throw new Error('fetch failed')
        const array = await res.arrayBuffer()
        const mime = res.headers.get('Content-Type') || 'application/octet-stream'
        const base64 = Buffer.from(array).toString('base64')
        await localforage.setItem(key, { mime, data: base64 })
      }
    } catch (err) {
      console.error(`Failed to cache file for ${item.id}`, err)
    }
  }
}

export async function getCachedFileUrl(id: string): Promise<string | null> {
  try {
    const stored = await localforage.getItem<any>(`${FILE_PREFIX}${id}`)
    if (!stored) return null
    const buffer = Buffer.from(stored.data, 'base64')
    const blob = new Blob([buffer], { type: stored.mime })
    if (typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(blob)
    }
    return `data:${stored.mime};base64,${stored.data}`
  } catch (err) {
    console.error('Failed to load cached file', err)
    return null
  }
}
