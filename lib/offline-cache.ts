import localforage from 'localforage'
import { auth } from './firebase'
import { toast } from '@/hooks/use-toast'

const FILE_PREFIX = 'octavia-offline-file'

const STORE_KEY_BASE = 'octavia-offline-content'
const INDEX_KEY_BASE = 'octavia-offline-index'
const MAX_CACHE_BYTES = 50 * 1024 * 1024 // 50MB

function encodeBase64(data: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = ''
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i])
    }
    return btoa(binary)
  }
  return Buffer.from(data).toString('base64')
}

async function getUserId(): Promise<string | null> {
  try {
    return auth?.currentUser?.uid || null
  } catch {
    return null
  }
}

function getStoreKey(userId: string | null) {
  return `${STORE_KEY_BASE}-${userId || 'anon'}`
}

function getIndexKey(userId: string | null) {
  return `${INDEX_KEY_BASE}-${userId || 'anon'}`
}

function getFileKey(userId: string | null, id: string) {
  return `${FILE_PREFIX}-${userId || 'anon'}-${id}`
}

type IndexEntry = { id: string; size: number; lastAccess: number }

async function getIndex(): Promise<IndexEntry[]> {
  const userId = await getUserId()
  return (await localforage.getItem<IndexEntry[]>(getIndexKey(userId))) || []
}

async function saveIndex(index: IndexEntry[]): Promise<void> {
  const userId = await getUserId()
  await localforage.setItem(getIndexKey(userId), index)
}

function totalSize(index: IndexEntry[]) {
  return index.reduce((sum, e) => sum + e.size, 0)
}

async function enforceQuota(index: IndexEntry[]): Promise<IndexEntry[]> {
  let current = [...index]
  if (totalSize(current) <= MAX_CACHE_BYTES) return current
  current.sort((a, b) => a.lastAccess - b.lastAccess)
  while (totalSize(current) > MAX_CACHE_BYTES && current.length) {
    const victim = current.shift()!
    const userId = await getUserId()
    await localforage.removeItem(getFileKey(userId, victim.id))
  }
  await saveIndex(current)
  return current
}

export async function getCachedContent(): Promise<any[]> {
  try {
    const userId = await getUserId()
    const data = await localforage.getItem<any[]>(getStoreKey(userId))
    return data || []
  } catch (err) {
    console.error('Failed to load cached content:', err)
    return []
  }
}

export async function saveContent(items: any[]): Promise<void> {
  try {
    const userId = await getUserId()
    const existing = (await localforage.getItem<any[]>(getStoreKey(userId))) || []
    const merged = [
      ...existing.filter((ex: any) => !items.some((it: any) => it.id === ex.id)),
      ...items,
    ]
    await localforage.setItem(getStoreKey(userId), merged)
  } catch (err) {
    console.error('Failed to cache offline content', err)
  }
}

export async function removeCachedContent(id: string): Promise<void> {
  try {
    const userId = await getUserId()
    const storeKey = getStoreKey(userId)
    const indexKey = getIndexKey(userId)
  const existing = (await localforage.getItem<any[]>(storeKey)) || []
  const filtered = existing.filter((it: any) => String(it.id) !== String(id))
    await localforage.setItem(storeKey, filtered)
    await localforage.removeItem(getFileKey(userId, id))
    const index = (await localforage.getItem<IndexEntry[]>(indexKey)) || []
    const updated = index.filter(e => String(e.id) !== String(id))
    await saveIndex(updated)
  } catch (err) {
    console.error('Failed to remove cached content', err)
  }
}

export async function cacheFilesForContent(items: any[]): Promise<void> {
  for (const item of items) {
    if (!item?.id || !item?.file_url) continue
    const userId = await getUserId()
    const key = getFileKey(userId, item.id)
    try {
      const existing = await localforage.getItem<any>(key)
      if (!existing) {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(item.file_url)}`
        const res = await fetch(proxyUrl)
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(text || 'fetch failed')
        }
        const lengthHeader = res.headers.get('Content-Length')
        if (lengthHeader && Number(lengthHeader) > MAX_CACHE_BYTES) {
          toast({
            title: 'File too large to cache',
            description: 'This file exceeds the 50MB offline cache limit.'
          })
          res.body?.cancel?.()
          continue
        }
        const array = await res.arrayBuffer()
        if (array.byteLength > MAX_CACHE_BYTES) {
          toast({
            title: 'File too large to cache',
            description: 'This file exceeds the 50MB offline cache limit.'
          })
          continue
        }
        const mime = res.headers.get('Content-Type') || 'application/octet-stream'
        await localforage.setItem(key, { mime, data: array })
        const size = array.byteLength
        let index = await getIndex()
        index.push({ id: item.id, size, lastAccess: Date.now() })
        index = await enforceQuota(index)
        await saveIndex(index)
      }
    } catch (err) {
      console.error(`Failed to cache file for ${item.id}`, err)
      throw err
    }
  }
}

export async function cacheFileForContent(item: any): Promise<void> {
  if (!item) return
  await cacheFilesForContent([item])
}

export async function getCachedFileUrl(id: string): Promise<string | null> {
  try {
    const userId = await getUserId()
    const stored = await localforage.getItem<any>(getFileKey(userId, id))
    if (!stored) return null
    let index = await getIndex()
    const entry = index.find(e => e.id === id)
    if (entry) {
      entry.lastAccess = Date.now()
      await saveIndex(index)
    }
    const BlobCtor: typeof Blob = (typeof window !== 'undefined' && (window as any).Blob) || Blob
    const dataArray = stored.data instanceof ArrayBuffer ? new Uint8Array(stored.data) : new Uint8Array(stored.data)
    const blob = new BlobCtor([dataArray], { type: stored.mime })
    if (typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(blob)
    }
    const base64 = encodeBase64(dataArray)
    return `data:${stored.mime};base64,${base64}`
  } catch (err) {
    console.error('Failed to load cached file', err)
    return null
  }
}

export async function clearOfflineContent(userIdArg?: string): Promise<void> {
  const userId = userIdArg ?? (await getUserId())
  const indexKey = getIndexKey(userId)
  const storeKey = getStoreKey(userId)
  const index = (await localforage.getItem<IndexEntry[]>(indexKey)) || []
  for (const entry of index) {
    await localforage.removeItem(getFileKey(userId, entry.id))
  }
  await localforage.removeItem(indexKey)
  await localforage.removeItem(storeKey)
}
