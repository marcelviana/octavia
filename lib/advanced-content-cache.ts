/**
 * Advanced Content Caching System
 * 
 * High-performance caching implementation for live music performance
 * with intelligent preloading, memory management, and cache optimization.
 */

import localforage from 'localforage'
import { useCallback } from 'react'
import type { SongData } from '@/types/performance'

// Cache configuration
const CACHE_CONFIG = {
  MAX_CACHE_SIZE_MB: 100, // 100MB limit for performance content
  PRELOAD_AHEAD_COUNT: 3, // Preload next 3 songs
  PRELOAD_BEHIND_COUNT: 1, // Keep 1 previous song cached
  CACHE_EXPIRY_HOURS: 24, // Cache expires after 24 hours
  HIGH_PRIORITY_CACHE_SIZE_MB: 50, // Reserved for high-priority content
  BACKGROUND_SYNC_DELAY_MS: 1000, // Delay for background operations
} as const

interface CacheEntry {
  url: string
  data: Blob
  mimeType: string
  size: number
  priority: 'high' | 'medium' | 'low'
  accessTime: number
  createTime: number
  songId: string
  preloadScore: number // Higher score = more likely to be needed soon
}

interface CacheMetadata {
  totalSize: number
  entryCount: number
  lastCleanup: number
  performanceMetrics: {
    hitRate: number
    avgLoadTime: number
    preloadSuccessRate: number
  }
}

class AdvancedContentCache {
  private cache = localforage.createInstance({
    name: 'octavia-performance-cache',
    storeName: 'content'
  })

  private metadata = localforage.createInstance({
    name: 'octavia-performance-cache',
    storeName: 'metadata'
  })

  private preloadQueue = new Set<string>()
  private isPreloading = false
  private abortController: AbortController | null = null

  /**
   * Get cached content with performance tracking
   */
  async getCachedContent(url: string, songId?: string): Promise<{
    data: Blob
    mimeType: string
    fromCache: boolean
  } | null> {
    const startTime = performance.now()
    
    try {
      const cacheKey = this.getCacheKey(url)
      const entry = await this.cache.getItem<CacheEntry>(cacheKey)

      if (entry && !this.isExpired(entry)) {
        // Update access time for LRU management
        entry.accessTime = Date.now()
        await this.cache.setItem(cacheKey, entry)
        
        // Update performance metrics
        this.updateHitRate(true)
        
        const loadTime = performance.now() - startTime
        this.updateLoadTime(loadTime)

        return {
          data: entry.data,
          mimeType: entry.mimeType,
          fromCache: true
        }
      }

      // Cache miss - fetch from network
      this.updateHitRate(false)
      const networkData = await this.fetchFromNetwork(url)
      
      if (networkData && songId) {
        // Cache the fetched content with appropriate priority
        await this.setCachedContent(url, networkData.data, networkData.mimeType, songId, 'medium')
      }

      const loadTime = performance.now() - startTime
      this.updateLoadTime(loadTime)

      return networkData ? { ...networkData, fromCache: false } : null
    } catch (error) {
      console.error('Cache retrieval error:', error)
      
      // Fallback to network
      try {
        const networkData = await this.fetchFromNetwork(url)
        return networkData ? { ...networkData, fromCache: false } : null
      } catch (networkError) {
        console.error('Network fallback failed:', networkError)
        return null
      }
    }
  }

  /**
   * Intelligent preloading for performance mode
   */
  async preloadForPerformance(
    songs: SongData[], 
    currentIndex: number,
    options: { priority?: 'high' | 'medium' | 'low' } = {}
  ): Promise<void> {
    if (this.isPreloading) {
      // Cancel previous preload operation
      this.abortController?.abort()
    }

    this.isPreloading = true
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    try {
      // Calculate preload range
      const startIndex = Math.max(0, currentIndex - CACHE_CONFIG.PRELOAD_BEHIND_COUNT)
      const endIndex = Math.min(songs.length - 1, currentIndex + CACHE_CONFIG.PRELOAD_AHEAD_COUNT)
      
      const preloadTasks: Promise<void>[] = []

      for (let i = startIndex; i <= endIndex; i++) {
        if (signal.aborted) break

        const song = songs[i]
        if (!song.file_url) continue

        const priority = this.calculatePriority(i, currentIndex, options.priority)
        const preloadScore = this.calculatePreloadScore(i, currentIndex, songs.length)

        preloadTasks.push(
          this.preloadSingle(song.file_url, song.id, priority, preloadScore, signal)
        )
      }

      // Execute preloading with concurrency limit
      const PRELOAD_CONCURRENCY = 3
      for (let i = 0; i < preloadTasks.length; i += PRELOAD_CONCURRENCY) {
        if (signal.aborted) break
        
        const batch = preloadTasks.slice(i, i + PRELOAD_CONCURRENCY)
        await Promise.allSettled(batch)
        
        // Small delay between batches to avoid overwhelming the system
        if (i + PRELOAD_CONCURRENCY < preloadTasks.length) {
          await this.delay(100)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Preload operation failed:', error)
      }
    } finally {
      this.isPreloading = false
      this.abortController = null
    }
  }

  /**
   * Background cache warming for upcoming performances
   */
  async warmCacheForUpcomingPerformances(
    upcomingSetlists: Array<{ songs: SongData[], performanceDate: string }>
  ): Promise<void> {
    // Sort by performance date (nearest first)
    const sortedSetlists = upcomingSetlists.sort((a, b) => 
      new Date(a.performanceDate).getTime() - new Date(b.performanceDate).getTime()
    )

    for (const setlist of sortedSetlists) {
      const hoursUntilPerformance = this.getHoursUntilPerformance(setlist.performanceDate)
      
      if (hoursUntilPerformance > 168) break // Don't preload more than 1 week ahead
      
      const priority = hoursUntilPerformance < 24 ? 'high' : 
                      hoursUntilPerformance < 72 ? 'medium' : 'low'

      // Background preload with low priority
      setTimeout(() => {
        this.preloadSetlist(setlist.songs, priority)
      }, CACHE_CONFIG.BACKGROUND_SYNC_DELAY_MS)
    }
  }

  /**
   * Optimize cache by removing low-value entries
   */
  async optimizeCache(): Promise<{
    freedSpace: number
    removedEntries: number
  }> {
    const startTime = performance.now()
    const metadata = await this.getMetadata()
    
    if (metadata.totalSize < CACHE_CONFIG.MAX_CACHE_SIZE_MB * 1024 * 1024) {
      return { freedSpace: 0, removedEntries: 0 }
    }

    // Get all cache entries
    const allKeys = await this.cache.keys()
    const entries: (CacheEntry & { key: string })[] = []

    for (const key of allKeys) {
      const entry = await this.cache.getItem<CacheEntry>(key)
      if (entry) {
        entries.push({ ...entry, key })
      }
    }

    // Sort by optimization score (lower score = more likely to be removed)
    entries.sort((a, b) => this.getOptimizationScore(a) - this.getOptimizationScore(b))

    const targetSize = CACHE_CONFIG.HIGH_PRIORITY_CACHE_SIZE_MB * 1024 * 1024
    let currentSize = metadata.totalSize
    let removedEntries = 0
    let freedSpace = 0

    // Remove entries until we're under the target size
    for (const entry of entries) {
      if (currentSize <= targetSize) break

      await this.cache.removeItem(entry.key)
      currentSize -= entry.size
      freedSpace += entry.size
      removedEntries++
    }

    // Update metadata
    await this.updateMetadata({
      totalSize: currentSize,
      entryCount: metadata.entryCount - removedEntries,
      lastCleanup: Date.now()
    })

    const optimizationTime = performance.now() - startTime
    console.log(`Cache optimization completed in ${optimizationTime.toFixed(2)}ms`)

    return { freedSpace, removedEntries }
  }

  /**
   * Get cache statistics for performance monitoring
   */
  async getCacheStats(): Promise<{
    size: number
    entryCount: number
    hitRate: number
    topContent: Array<{ songId: string, accessCount: number }>
  }> {
    const metadata = await this.getMetadata()
    const allKeys = await this.cache.keys()
    
    // Get access patterns for top content
    const accessCounts: Record<string, number> = {}
    
    for (const key of allKeys) {
      const entry = await this.cache.getItem<CacheEntry>(key)
      if (entry) {
        accessCounts[entry.songId] = (accessCounts[entry.songId] || 0) + 1
      }
    }

    const topContent = Object.entries(accessCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([songId, accessCount]) => ({ songId, accessCount }))

    return {
      size: metadata.totalSize,
      entryCount: allKeys.length,
      hitRate: metadata.performanceMetrics.hitRate,
      topContent
    }
  }

  // Private helper methods

  private getCacheKey(url: string): string {
    return `content:${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`
  }

  private isExpired(entry: CacheEntry): boolean {
    const expiryTime = entry.createTime + (CACHE_CONFIG.CACHE_EXPIRY_HOURS * 60 * 60 * 1000)
    return Date.now() > expiryTime
  }

  private async fetchFromNetwork(url: string): Promise<{ data: Blob, mimeType: string } | null> {
    try {
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.blob()
      const mimeType = response.headers.get('content-type') || 'application/octet-stream'

      return { data, mimeType }
    } catch (error) {
      console.error('Network fetch failed:', error)
      return null
    }
  }

  private async setCachedContent(
    url: string, 
    data: Blob, 
    mimeType: string, 
    songId: string, 
    priority: 'high' | 'medium' | 'low',
    preloadScore = 0
  ): Promise<void> {
    const cacheKey = this.getCacheKey(url)
    const entry: CacheEntry = {
      url,
      data,
      mimeType,
      size: data.size,
      priority,
      accessTime: Date.now(),
      createTime: Date.now(),
      songId,
      preloadScore
    }

    await this.cache.setItem(cacheKey, entry)
    
    // Update metadata
    const metadata = await this.getMetadata()
    await this.updateMetadata({
      totalSize: metadata.totalSize + data.size,
      entryCount: metadata.entryCount + 1
    })
  }

  private calculatePriority(
    songIndex: number, 
    currentIndex: number, 
    basePriority?: 'high' | 'medium' | 'low'
  ): 'high' | 'medium' | 'low' {
    if (basePriority === 'high') return 'high'
    
    const distance = Math.abs(songIndex - currentIndex)
    if (distance === 0) return 'high'
    if (distance <= 1) return 'medium'
    return 'low'
  }

  private calculatePreloadScore(songIndex: number, currentIndex: number, totalSongs: number): number {
    const distance = Math.abs(songIndex - currentIndex)
    const positionWeight = songIndex === 0 || songIndex === totalSongs - 1 ? 1.2 : 1.0
    const proximityWeight = Math.max(0, 10 - distance)
    
    return proximityWeight * positionWeight
  }

  private async preloadSingle(
    url: string, 
    songId: string, 
    priority: 'high' | 'medium' | 'low',
    preloadScore: number,
    signal: AbortSignal
  ): Promise<void> {
    if (signal.aborted || this.preloadQueue.has(url)) return

    this.preloadQueue.add(url)
    
    try {
      const networkData = await this.fetchFromNetwork(url)
      if (networkData && !signal.aborted) {
        await this.setCachedContent(url, networkData.data, networkData.mimeType, songId, priority, preloadScore)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Preload failed for:', url, error)
      }
    } finally {
      this.preloadQueue.delete(url)
    }
  }

  private async preloadSetlist(songs: SongData[], priority: 'high' | 'medium' | 'low'): Promise<void> {
    for (const song of songs) {
      if (!song.file_url) continue
      await this.preloadSingle(song.file_url, song.id, priority, 1, new AbortController().signal)
    }
  }

  private getHoursUntilPerformance(performanceDate: string): number {
    return (new Date(performanceDate).getTime() - Date.now()) / (1000 * 60 * 60)
  }

  private getOptimizationScore(entry: CacheEntry): number {
    const ageScore = (Date.now() - entry.accessTime) / (1000 * 60 * 60) // Hours since last access
    const priorityScore = entry.priority === 'high' ? 0 : entry.priority === 'medium' ? 10 : 20
    const sizeScore = (entry.size / (1024 * 1024)) // MB
    const preloadScore = entry.preloadScore * -1 // Negative because higher preload score should reduce removal chance
    
    return ageScore + priorityScore + sizeScore + preloadScore
  }

  private async getMetadata(): Promise<CacheMetadata> {
    return await this.metadata.getItem<CacheMetadata>('stats') || {
      totalSize: 0,
      entryCount: 0,
      lastCleanup: Date.now(),
      performanceMetrics: {
        hitRate: 0,
        avgLoadTime: 0,
        preloadSuccessRate: 0
      }
    }
  }

  private async updateMetadata(updates: Partial<CacheMetadata>): Promise<void> {
    const current = await this.getMetadata()
    const updated = { ...current, ...updates }
    await this.metadata.setItem('stats', updated)
  }

  private async updateHitRate(isHit: boolean): Promise<void> {
    // Implement moving average for hit rate
    const metadata = await this.getMetadata()
    const currentHitRate = metadata.performanceMetrics.hitRate
    const alpha = 0.1 // Smoothing factor
    const newHitRate = currentHitRate * (1 - alpha) + (isHit ? 1 : 0) * alpha
    
    await this.updateMetadata({
      performanceMetrics: {
        ...metadata.performanceMetrics,
        hitRate: newHitRate
      }
    })
  }

  private async updateLoadTime(loadTime: number): Promise<void> {
    const metadata = await this.getMetadata()
    const currentAvg = metadata.performanceMetrics.avgLoadTime
    const alpha = 0.1
    const newAvg = currentAvg * (1 - alpha) + loadTime * alpha
    
    await this.updateMetadata({
      performanceMetrics: {
        ...metadata.performanceMetrics,
        avgLoadTime: newAvg
      }
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const advancedContentCache = new AdvancedContentCache()

// Hook for React components
export const useAdvancedContentCache = () => {
  const preloadForCurrentSetlist = useCallback(async (songs: SongData[], currentIndex: number) => {
    await advancedContentCache.preloadForPerformance(songs, currentIndex, { priority: 'high' })
  }, [])

  const getCachedContent = useCallback(async (url: string, songId?: string) => {
    return await advancedContentCache.getCachedContent(url, songId)
  }, [])

  const optimizeCache = useCallback(async () => {
    return await advancedContentCache.optimizeCache()
  }, [])

  return {
    preloadForCurrentSetlist,
    getCachedContent,
    optimizeCache,
    cache: advancedContentCache
  }
}