/**
 * Memory Management and Leak Prevention System
 * 
 * Comprehensive memory management for long-running live performance sessions
 * with automatic cleanup, leak detection, and memory optimization.
 */

import { useEffect, useRef, useCallback, useState } from 'react'

// Memory thresholds and configuration
const MEMORY_CONFIG = {
  MAX_HEAP_SIZE_MB: 100, // Maximum allowed heap size
  GC_TRIGGER_THRESHOLD_MB: 80, // Trigger cleanup at this threshold
  MONITORING_INTERVAL_MS: 30000, // Check memory every 30 seconds
  LEAK_DETECTION_THRESHOLD: 5, // Consecutive increases to consider a leak
  CLEANUP_BATCH_SIZE: 10, // Number of items to clean up at once
  IMAGE_CACHE_LIMIT: 20, // Maximum cached images for performance mode
  BLOB_CACHE_LIMIT_MB: 50, // Maximum blob cache size
} as const

interface MemoryStats {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
  timestamp: number
}

interface ResourceTracker {
  id: string
  type: 'blob' | 'image' | 'audio' | 'timeout' | 'interval' | 'listener' | 'observer'
  resource: any
  size?: number
  createTime: number
  lastAccessed: number
}

class MemoryManager {
  private trackedResources = new Map<string, ResourceTracker>()
  private memoryHistory: MemoryStats[] = []
  private monitoringInterval: NodeJS.Timeout | null = null
  private isMonitoring = false
  private cleanupCallbacks = new Set<() => void>()
  private imageCache = new Map<string, HTMLImageElement>()
  private blobCache = new Map<string, Blob>()
  
  /**
   * Start memory monitoring for performance mode
   */
  startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, MEMORY_CONFIG.MONITORING_INTERVAL_MS)
    
    console.log('Memory monitoring started for performance mode')
  }

  /**
   * Stop memory monitoring and cleanup
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    
    // Force cleanup on monitoring stop
    this.forceCleanup()
    console.log('Memory monitoring stopped')
  }

  /**
   * Track a resource for automatic cleanup
   */
  trackResource(
    id: string,
    type: ResourceTracker['type'],
    resource: any,
    size?: number
  ): void {
    this.trackedResources.set(id, {
      id,
      type,
      resource,
      size,
      createTime: Date.now(),
      lastAccessed: Date.now()
    })
  }

  /**
   * Untrack and cleanup a resource
   */
  untrackResource(id: string): void {
    const tracker = this.trackedResources.get(id)
    if (!tracker) return

    this.cleanupResource(tracker)
    this.trackedResources.delete(id)
  }

  /**
   * Update access time for a resource
   */
  touchResource(id: string): void {
    const tracker = this.trackedResources.get(id)
    if (tracker) {
      tracker.lastAccessed = Date.now()
    }
  }

  /**
   * Force garbage collection trigger (if available)
   */
  triggerGC(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      // Manual GC is available in development/debug builds
      (window as any).gc()
      console.log('Manual garbage collection triggered')
    } else {
      // Fallback: create pressure to encourage GC
      this.createMemoryPressure()
    }
  }

  /**
   * Optimized image loading with caching
   */
  loadOptimizedImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (this.imageCache.has(src)) {
        const cachedImage = this.imageCache.get(src)!
        this.touchResource(`image:${src}`)
        resolve(cachedImage)
        return
      }

      // Clean cache if at limit
      if (this.imageCache.size >= MEMORY_CONFIG.IMAGE_CACHE_LIMIT) {
        this.cleanupImageCache()
      }

      const img = new Image()
      const resourceId = `image:${src}`
      
      img.onload = () => {
        this.imageCache.set(src, img)
        this.trackResource(resourceId, 'image', img, this.estimateImageSize(img))
        resolve(img)
      }

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`))
      }

      img.src = src
    })
  }

  /**
   * Optimized blob creation and tracking
   */
  createTrackedBlob(data: BlobPart[], options?: BlobPropertyBag): Blob {
    const blob = new Blob(data, options)
    const resourceId = `blob:${Date.now()}-${Math.random()}`
    
    this.trackResource(resourceId, 'blob', blob, blob.size)
    
    // Clean blob cache if over limit
    const totalBlobSize = Array.from(this.blobCache.values())
      .reduce((total, b) => total + b.size, 0)
    
    if (totalBlobSize > MEMORY_CONFIG.BLOB_CACHE_LIMIT_MB * 1024 * 1024) {
      this.cleanupBlobCache()
    }

    return blob
  }

  /**
   * Register cleanup callback for component unmount
   */
  registerCleanupCallback(callback: () => void): () => void {
    this.cleanupCallbacks.add(callback)
    
    // Return unregister function
    return () => {
      this.cleanupCallbacks.delete(callback)
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): {
    current: MemoryStats | null
    trend: 'increasing' | 'stable' | 'decreasing'
    trackedResources: number
    potentialLeaks: string[]
  } {
    const current = this.getCurrentMemoryStats()
    const trend = this.analyzeMemoryTrend()
    const potentialLeaks = this.detectPotentialLeaks()

    return {
      current,
      trend,
      trackedResources: this.trackedResources.size,
      potentialLeaks
    }
  }

  // Private methods

  private checkMemoryUsage(): void {
    const stats = this.getCurrentMemoryStats()
    if (!stats) return

    this.memoryHistory.push(stats)
    
    // Keep only recent history (last 10 readings)
    if (this.memoryHistory.length > 10) {
      this.memoryHistory.shift()
    }

    const usedMB = stats.usedJSHeapSize / (1024 * 1024)
    
    if (usedMB > MEMORY_CONFIG.GC_TRIGGER_THRESHOLD_MB) {
      console.warn(`Memory usage high: ${usedMB.toFixed(2)}MB, triggering cleanup`)
      this.performAutomaticCleanup()
    }

    // Detect potential memory leaks
    const leaks = this.detectPotentialLeaks()
    if (leaks.length > 0) {
      console.warn('Potential memory leaks detected:', leaks)
    }
  }

  private getCurrentMemoryStats(): MemoryStats | null {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return null
    }

    const memory = (performance as any).memory
    if (!memory) return null

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    }
  }

  private analyzeMemoryTrend(): 'increasing' | 'stable' | 'decreasing' {
    if (this.memoryHistory.length < 3) return 'stable'

    const recent = this.memoryHistory.slice(-3)
    const increases = recent.filter((stats, i) => 
      i > 0 && stats.usedJSHeapSize > recent[i - 1].usedJSHeapSize
    ).length

    if (increases >= 2) return 'increasing'
    if (increases === 0) return 'decreasing'
    return 'stable'
  }

  private detectPotentialLeaks(): string[] {
    const leaks: string[] = []
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    // Look for old resources that haven't been accessed
    this.trackedResources.forEach((tracker) => {
      const age = now - tracker.createTime
      const lastAccessed = now - tracker.lastAccessed

      if (age > oneHour && lastAccessed > oneHour) {
        leaks.push(`${tracker.type}:${tracker.id} (unused for ${Math.round(lastAccessed / 1000 / 60)}m)`)
      }
    })

    // Check for consistent memory growth
    if (this.memoryHistory.length >= MEMORY_CONFIG.LEAK_DETECTION_THRESHOLD) {
      const recentHistory = this.memoryHistory.slice(-MEMORY_CONFIG.LEAK_DETECTION_THRESHOLD)
      const isConsistentlyGrowing = recentHistory.every((stats, i) => 
        i === 0 || stats.usedJSHeapSize >= recentHistory[i - 1].usedJSHeapSize
      )

      if (isConsistentlyGrowing) {
        leaks.push('consistent-memory-growth')
      }
    }

    return leaks
  }

  private performAutomaticCleanup(): void {
    let cleanedCount = 0
    const now = Date.now()
    const thirtyMinutes = 30 * 60 * 1000

    // Clean up old, unused resources
    const toCleanup: string[] = []
    
    this.trackedResources.forEach((tracker, id) => {
      const timeSinceAccess = now - tracker.lastAccessed
      if (timeSinceAccess > thirtyMinutes) {
        toCleanup.push(id)
      }
    })

    // Clean up in batches
    for (let i = 0; i < Math.min(toCleanup.length, MEMORY_CONFIG.CLEANUP_BATCH_SIZE); i++) {
      this.untrackResource(toCleanup[i])
      cleanedCount++
    }

    // Clean up caches
    this.cleanupImageCache()
    this.cleanupBlobCache()

    if (cleanedCount > 0) {
      console.log(`Automatic cleanup completed: ${cleanedCount} resources cleaned`)
    }

    // Trigger GC after cleanup
    setTimeout(() => this.triggerGC(), 100)
  }

  private forceCleanup(): void {
    // Clean up all tracked resources
    this.trackedResources.forEach((tracker) => {
      this.cleanupResource(tracker)
    })
    this.trackedResources.clear()

    // Clear caches
    this.imageCache.clear()
    this.blobCache.clear()

    // Run cleanup callbacks
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Cleanup callback error:', error)
      }
    })
    this.cleanupCallbacks.clear()

    // Clear memory history
    this.memoryHistory = []

    console.log('Force cleanup completed')
  }

  private cleanupResource(tracker: ResourceTracker): void {
    try {
      switch (tracker.type) {
        case 'image':
          if (tracker.resource instanceof HTMLImageElement) {
            tracker.resource.src = ''
            tracker.resource.onload = null
            tracker.resource.onerror = null
          }
          break

        case 'blob':
          // Blobs are automatically GC'd, no explicit cleanup needed
          break

        case 'timeout':
          clearTimeout(tracker.resource)
          break

        case 'interval':
          clearInterval(tracker.resource)
          break

        case 'listener':
          if (tracker.resource.element && tracker.resource.type && tracker.resource.handler) {
            tracker.resource.element.removeEventListener(tracker.resource.type, tracker.resource.handler)
          }
          break

        case 'observer':
          if (tracker.resource.disconnect) {
            tracker.resource.disconnect()
          }
          break
      }
    } catch (error) {
      console.error('Resource cleanup error:', error)
    }
  }

  private cleanupImageCache(): void {
    if (this.imageCache.size <= MEMORY_CONFIG.IMAGE_CACHE_LIMIT) return

    // Convert to array and sort by last accessed time
    const images = Array.from(this.imageCache.entries()).map(([src, img]) => {
      const tracker = this.trackedResources.get(`image:${src}`)
      return {
        src,
        img,
        lastAccessed: tracker?.lastAccessed || 0
      }
    })

    images.sort((a, b) => a.lastAccessed - b.lastAccessed)

    // Remove oldest images
    const toRemove = images.slice(0, images.length - MEMORY_CONFIG.IMAGE_CACHE_LIMIT)
    toRemove.forEach(({ src }) => {
      this.imageCache.delete(src)
      this.untrackResource(`image:${src}`)
    })
  }

  private cleanupBlobCache(): void {
    let totalSize = 0
    const blobs: Array<{ key: string; blob: Blob; lastAccessed: number }> = []

    this.blobCache.forEach((blob, key) => {
      totalSize += blob.size
      const tracker = this.trackedResources.get(key)
      blobs.push({
        key,
        blob,
        lastAccessed: tracker?.lastAccessed || 0
      })
    })

    if (totalSize <= MEMORY_CONFIG.BLOB_CACHE_LIMIT_MB * 1024 * 1024) return

    // Sort by last accessed and remove oldest
    blobs.sort((a, b) => a.lastAccessed - b.lastAccessed)

    let removedSize = 0
    const targetRemoval = totalSize - (MEMORY_CONFIG.BLOB_CACHE_LIMIT_MB * 1024 * 1024 * 0.8) // 80% of limit

    for (const { key, blob } of blobs) {
      if (removedSize >= targetRemoval) break
      
      this.blobCache.delete(key)
      this.untrackResource(key)
      removedSize += blob.size
    }
  }

  private createMemoryPressure(): void {
    // Create and immediately discard large arrays to encourage GC
    for (let i = 0; i < 10; i++) {
      const pressure = new Array(100000).fill(Math.random())
      pressure.length = 0 // Clear the array
    }
  }

  private estimateImageSize(img: HTMLImageElement): number {
    // Rough estimation: width * height * 4 bytes per pixel (RGBA)
    return img.width * img.height * 4
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager()

// React hooks for memory management

export const useMemoryManagement = () => {
  const cleanupRef = useRef<(() => void)[]>([])

  useEffect(() => {
    memoryManager.startMonitoring()
    
    return () => {
      memoryManager.stopMonitoring()
      
      // Run component cleanup
      cleanupRef.current.forEach(cleanup => cleanup())
      cleanupRef.current = []
    }
  }, [])

  const trackResource = useCallback((
    id: string,
    type: ResourceTracker['type'],
    resource: any,
    size?: number
  ) => {
    memoryManager.trackResource(id, type, resource, size)
    
    // Add to component cleanup
    cleanupRef.current.push(() => memoryManager.untrackResource(id))
  }, [])

  const untrackResource = useCallback((id: string) => {
    memoryManager.untrackResource(id)
  }, [])

  const touchResource = useCallback((id: string) => {
    memoryManager.touchResource(id)
  }, [])

  const getMemoryStats = useCallback(() => {
    return memoryManager.getMemoryStats()
  }, [])

  return {
    trackResource,
    untrackResource,
    touchResource,
    getMemoryStats,
    triggerGC: () => memoryManager.triggerGC()
  }
}

export const useOptimizedImage = (src: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setError(null)

    memoryManager.loadOptimizedImage(src)
      .then(img => {
        if (mounted) {
          setImage(img)
          setLoading(false)
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [src])

  return { image, loading, error }
}