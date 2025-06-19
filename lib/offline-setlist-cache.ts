import localforage from 'localforage'

const STORE_KEY = 'octavia-offline-setlists'

export async function getCachedSetlists(): Promise<any[]> {
  try {
    const data = await localforage.getItem<any[]>(STORE_KEY)
    return data || []
  } catch (err) {
    console.error('Failed to load cached setlists:', err)
    return []
  }
}

export async function saveSetlists(items: any[]): Promise<void> {
  try {
    const existing = (await localforage.getItem<any[]>(STORE_KEY)) || []
    const merged = [
      ...existing.filter(ex => !items.some(it => it.id === ex.id)),
      ...items,
    ]
    await localforage.setItem(STORE_KEY, merged)
  } catch (err) {
    console.error('Failed to cache offline setlists', err)
  }
}
