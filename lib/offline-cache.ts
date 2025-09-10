import localforage from 'localforage'
import { auth } from './firebase'
import { toast } from '@/hooks/use-toast'
import { debug } from '@/lib/debug'

const FILE_PREFIX = 'octavia-offline-file'

const STORE_KEY_BASE = 'octavia-offline-content'
const INDEX_KEY_BASE = 'octavia-offline-index'
const MAX_CACHE_BYTES = 50 * 1024 * 1024 // 50MB

// Helper: Detect if a URL is a public Supabase Storage URL
function isPublicSupabaseUrl(url: string): boolean {
  try {
    // You may want to make this more robust for your project
    // e.g., check against process.env.NEXT_PUBLIC_SUPABASE_URL
    return url.includes('/storage/v1/object/public/');
  } catch {
    return false;
  }
}

// Track ongoing cache operations to prevent race conditions
const ongoingOperations = new Map<string, Promise<string | null>>()

// Cache performance metrics for optimization
const cacheMetrics = {
  hitRate: 0,
  missCount: 0,
  hitCount: 0,
  lastOptimization: Date.now()
}

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

interface IndexEntry {
  id: string
  size: number
  lastAccess: number
}

async function getIndex(): Promise<IndexEntry[]> {
  try {
    const userId = await getUserId()
    const data = await localforage.getItem<IndexEntry[]>(getIndexKey(userId))
    return data || []
  } catch (err) {
    debug.error('Failed to load cache index:', err)
    return []
  }
}

async function saveIndex(index: IndexEntry[]): Promise<void> {
  try {
    const userId = await getUserId()
    await localforage.setItem(getIndexKey(userId), index)
  } catch (err) {
    debug.error('Failed to save cache index:', err)
  }
}

function totalSize(index: IndexEntry[]): number {
  return index.reduce((sum, entry) => sum + entry.size, 0)
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
    debug.error('Failed to load cached content:', err)
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
    debug.error('Failed to cache offline content', err)
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
    debug.error('Failed to remove cached content', err)
  }
}

export async function cacheFilesForContent(items: any[]): Promise<void> {
  for (const item of items) {
    if (!item?.id || !item?.file_url) continue
    
    // Check if operation is already in progress
    const operationKey = `cache-${item.id}`
    if (ongoingOperations.has(operationKey)) {
      debug.log(`Cache operation already in progress for ${item.id}, skipping`)
      continue
    }
    
    const cachePromise = (async (): Promise<string | null> => {
      const userId = await getUserId()
      const key = getFileKey(userId, item.id)
      try {
        const existing = await localforage.getItem<any>(key)
        if (!existing) {
          // Use direct public URL if available, otherwise use proxy
          const fetchUrl = isPublicSupabaseUrl(item.file_url)
            ? item.file_url
            : `/api/proxy?url=${encodeURIComponent(item.file_url)}`;
          debug.log(`Caching file for content ${item.id} from ${fetchUrl}`)
          const res = await fetch(fetchUrl)
          if (!res.ok) {
            const text = await res.text().catch(() => '')
            throw new Error(text || `fetch failed with status ${res.status}`)
          }
          const lengthHeader = res.headers.get('Content-Length')
          if (lengthHeader && Number(lengthHeader) > MAX_CACHE_BYTES) {
            toast({
              title: 'File too large to cache',
              description: 'This file exceeds the 50MB offline cache limit.'
            })
            res.body?.cancel?.()
            return null
          }
          const array = await res.arrayBuffer()
          if (array.byteLength === 0) {
            debug.error('Fetched file is empty, not caching')
            return null
          }
          if (array.byteLength > MAX_CACHE_BYTES) {
            toast({
              title: 'File too large to cache',
              description: 'This file exceeds the 50MB offline cache limit.'
            })
            return null
          }
          const mime = res.headers.get('Content-Type') || 'application/octet-stream'
          await localforage.setItem(key, { mime, data: array })
          const size = array.byteLength
          let index = await getIndex()
          index.push({ id: item.id, size, lastAccess: Date.now() })
          index = await enforceQuota(index)
          await saveIndex(index)
          debug.log(`Successfully cached file for content ${item.id}, size: ${size} bytes`)
        }
        return null // Return null for cache operations (not URL operations)
      } catch (err) {
        debug.error(`Failed to cache file for ${item.id}:`, err)
        throw err
      }
    })()
    
    ongoingOperations.set(operationKey, cachePromise)
    
    try {
      await cachePromise
    } finally {
      ongoingOperations.delete(operationKey)
    }
  }
}

export async function cacheFileForContent(item: any): Promise<void> {
  if (!item) return
  await cacheFilesForContent([item])
}

export async function getCachedFileUrl(id: string): Promise<string | null> {
  // Check if operation is already in progress
  const operationKey = `get-${id}`
  if (ongoingOperations.has(operationKey)) {
    debug.log(`Get operation already in progress for ${id}, waiting...`)
    return ongoingOperations.get(operationKey)!
  }
  
  const getPromise = (async () => {
    try {
      const userId = await getUserId()
      const stored = await localforage.getItem<any>(getFileKey(userId, id))
      if (!stored) {
        debug.log(`No cached file found for content ${id}`)
        return null
      }
      
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
        const url = URL.createObjectURL(blob)
        debug.log(`Created blob URL for content ${id}: ${url.substring(0, 50)}...`)
        return url
      }
      
      const base64 = encodeBase64(dataArray)
      const dataUrl = `data:${stored.mime};base64,${base64}`
      debug.log(`Created data URL for content ${id}: ${dataUrl.substring(0, 50)}...`)
      return dataUrl
    } catch (err) {
      debug.error('Failed to load cached file for', id, ':', err)
      return null
    }
  })()
  
  ongoingOperations.set(operationKey, getPromise)
  
  try {
    return await getPromise
  } finally {
    ongoingOperations.delete(operationKey)
  }
}

// New function to get both URL and MIME type for better file type detection
export async function getCachedFileInfo(id: string): Promise<{ url: string; mimeType: string } | null> {
  // Check if operation is already in progress
  const operationKey = `get-info-${id}`
  if (ongoingOperations.has(operationKey)) {
    debug.log(`Get info operation already in progress for ${id}, waiting...`)
    return ongoingOperations.get(operationKey)! as Promise<{ url: string; mimeType: string } | null>
  }
  
  const getPromise = (async () => {
    try {
      const userId = await getUserId()
      const stored = await localforage.getItem<any>(getFileKey(userId, id))
      if (!stored) {
        // Track cache miss for performance metrics
        cacheMetrics.missCount++
        debug.log(`No cached file found for content ${id}`)
        return null
      }

      // Track cache hit for performance metrics
      cacheMetrics.hitCount++
      cacheMetrics.hitRate = cacheMetrics.hitCount / (cacheMetrics.hitCount + cacheMetrics.missCount)
      
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
        const url = URL.createObjectURL(blob)
        debug.log(`Created blob URL for content ${id}: ${url.substring(0, 50)}...`)
        return { url, mimeType: stored.mime }
      }
      
      const base64 = encodeBase64(dataArray)
      const dataUrl = `data:${stored.mime};base64,${base64}`
      debug.log(`Created data URL for content ${id}: ${dataUrl.substring(0, 50)}...`)
      return { url: dataUrl, mimeType: stored.mime }
    } catch (err) {
      debug.error('Failed to load cached file for', id, ':', err)
      return null
    }
  })()
  
  ongoingOperations.set(operationKey, getPromise as Promise<any>)
  
  try {
    return await getPromise
  } finally {
    ongoingOperations.delete(operationKey)
  }
}

export async function preloadContent(items: any[], signal?: AbortSignal): Promise<void> {
  if (!items || items.length === 0) return
  
  for (const item of items) {
    // Check for abort signal
    if (signal?.aborted) {
      debug.log('Preload operation aborted')
      return
    }
    
    if (!item?.id || !item?.file_url) continue
    
    try {
      // Check if already cached to avoid unnecessary work
      const userId = await getUserId()
      const cached = await localforage.getItem(getFileKey(userId, item.id))
      if (cached) {
        debug.log(`Content ${item.id} already cached, skipping preload`)
        continue
      }
      
      // Use the existing caching mechanism
      await cacheFileForContent(item)
      
      // Small delay to prevent overwhelming the system
      if (!signal?.aborted) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    } catch (error) {
      // Don't let preload failures break the system
      debug.warn(`Failed to preload content ${item.id}:`, error)
    }
  }
}

export async function warmCache(priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
  try {
    const content = await getCachedContent()
    if (content.length === 0) return
    
    // Sort by priority: recently accessed first, then by creation date
    const sorted = content.sort((a, b) => {
      const aAccess = a.lastAccess || a.created_at || 0
      const bAccess = b.lastAccess || b.created_at || 0
      return new Date(bAccess).getTime() - new Date(aAccess).getTime()
    })
    
    // Limit based on priority level
    const limit = priority === 'high' ? 5 : priority === 'normal' ? 3 : 1
    const toWarm = sorted.slice(0, limit)
    
    debug.log(`Warming cache for ${toWarm.length} items (priority: ${priority})`)
    
    // Warm cache in background without waiting
    cacheFilesForContent(toWarm).catch(error => {
      debug.warn('Cache warming failed:', error)
    })
  } catch (error) {
    debug.warn('Failed to warm cache:', error)
  }
}

export function getCacheMetrics() {
  return {
    ...cacheMetrics,
    totalRequests: cacheMetrics.hitCount + cacheMetrics.missCount,
    hitRatePercent: Math.round(cacheMetrics.hitRate * 100)
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
  
  // Reset cache metrics on clear
  cacheMetrics.hitCount = 0
  cacheMetrics.missCount = 0
  cacheMetrics.hitRate = 0
  cacheMetrics.lastOptimization = Date.now()
}
