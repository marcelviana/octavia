import localforage from 'localforage'

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
