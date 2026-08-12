import localforage from 'localforage'
import { auth } from './firebase'

const STORE_KEY_BASE = 'octavia-offline-setlists'

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

export async function getCachedSetlists(): Promise<any[]> {
  try {
    const userId = await getUserId()
    const data = await localforage.getItem<any[]>(getStoreKey(userId))
    return data || []
  } catch (err) {
    console.error('Failed to load cached setlists:', err)
    return []
  }
}

export async function saveSetlists(items: any[]): Promise<void> {
  try {
    const userId = await getUserId()
    const existing = (await localforage.getItem<any[]>(getStoreKey(userId))) || []
    const merged = [
      ...existing.filter(ex => !items.some(it => it.id === ex.id)),
      ...items,
    ]
    await localforage.setItem(getStoreKey(userId), merged)
  } catch (err) {
    console.error('Failed to cache offline setlists', err)
  }
}

/**
 * Substitui o cache inteiro pela lista dada (sem merge). Para gravações
 * vindas de um fetch completo do servidor: a resposta é a verdade — um
 * merge ressuscitaria setlists deletadas em outro dispositivo. Mutações
 * individuais continuam usando saveSetlists (merge).
 */
export async function replaceSetlists(items: any[]): Promise<void> {
  try {
    const userId = await getUserId()
    await localforage.setItem(getStoreKey(userId), items)
  } catch (err) {
    console.error('Failed to replace offline setlists cache', err)
  }
}

export async function removeCachedSetlist(id: string): Promise<void> {
  try {
    const userId = await getUserId()
    const storeKey = getStoreKey(userId)
  const existing = (await localforage.getItem<any[]>(storeKey)) || []
  const filtered = existing.filter((it: any) => String(it.id) !== String(id))
    await localforage.setItem(storeKey, filtered)
  } catch (err) {
    console.error('Failed to remove cached setlist', err)
  }
}

export async function clearOfflineSetlists(userIdArg?: string): Promise<void> {
  const userId = userIdArg ?? (await getUserId())
  await localforage.removeItem(getStoreKey(userId))
}
