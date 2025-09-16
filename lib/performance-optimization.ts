/**
 * Performance Optimization Utilities
 *
 * Collection of utilities and patterns for optimizing React performance,
 * especially for live music performance contexts where lag is unacceptable.
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react'

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  static startTiming(label: string): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      const existing = this.metrics.get(label) || []
      existing.push(duration)

      // Keep only last 100 measurements
      if (existing.length > 100) {
        existing.shift()
      }

      this.metrics.set(label, existing)

      // Log slow operations (>100ms for performance mode)
      if (duration > 100) {
        console.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`)
      }
    }
  }

  static getAverageTime(label: string): number {
    const times = this.metrics.get(label) || []
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
  }

  static getMetrics(): Record<string, { average: number; count: number; max: number }> {
    const result: Record<string, { average: number; count: number; max: number }> = {}

    for (const [label, times] of this.metrics) {
      if (times.length > 0) {
        result[label] = {
          average: times.reduce((a, b) => a + b, 0) / times.length,
          count: times.length,
          max: Math.max(...times)
        }
      }
    }

    return result
  }
}

// Optimized event handlers to prevent unnecessary re-renders
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(((...args: unknown[]) => {
    return callbackRef.current(...args)
  }) as T, [])
}

// Debounced value hook for search and user input
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Virtual list implementation for large content libraries
export interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
}

export function useVirtualList<T>({
  items,
  height,
  itemHeight,
  overscan = 5
}: Omit<VirtualListProps<T>, 'renderItem'>) {
  const [scrollTop, setScrollTop] = useState(0)

  return useMemo(() => {
    const containerHeight = height
    const itemCount = items.length
    const totalHeight = itemCount * itemHeight

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const visibleItems = items.slice(startIndex, endIndex + 1)
    const offsetY = startIndex * itemHeight

    return {
      totalHeight,
      visibleItems,
      offsetY,
      startIndex,
      endIndex,
      setScrollTop
    }
  }, [items, height, itemHeight, scrollTop, overscan])
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const elementRef = useRef<HTMLElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options])

  return [elementRef, isIntersecting]
}

// Memory management for large content
export class ContentCache {
  private static cache: Map<string, { data: unknown; timestamp: number; size: number }> = new Map()
  private static maxSize = 50 * 1024 * 1024 // 50MB
  private static currentSize = 0

  static set(key: string, data: unknown): void {
    // Estimate size (rough approximation)
    const size = this.estimateSize(data)

    // Remove old entries if needed
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.removeOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size
    })

    this.currentSize += size
  }

  static get(key: string): unknown | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Update timestamp for LRU
    entry.timestamp = Date.now()
    return entry.data
  }

  static has(key: string): boolean {
    return this.cache.has(key)
  }

  static delete(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)
      this.currentSize -= entry.size
    }
  }

  static clear(): void {
    this.cache.clear()
    this.currentSize = 0
  }

  static getStats(): { entries: number; totalSize: number; maxSize: number } {
    return {
      entries: this.cache.size,
      totalSize: this.currentSize,
      maxSize: this.maxSize
    }
  }

  private static removeOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Date.now()

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  private static estimateSize(data: unknown): number {
    // Rough estimation - could be more sophisticated
    const str = JSON.stringify(data)
    return str.length * 2 // 2 bytes per character for UTF-16
  }
}

// Image optimization utilities
export function optimizeImageUrl(url: string, options: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
} = {}): string {
  // This would integrate with your image optimization service
  // For now, return the original URL
  // In production, you might use Cloudflare Images, AWS CloudFront, etc.

  const params = new URLSearchParams()

  if (options.width) params.set('w', options.width.toString())
  if (options.height) params.set('h', options.height.toString())
  if (options.quality) params.set('q', options.quality.toString())
  if (options.format) params.set('f', options.format)

  const hasParams = params.toString()
  return hasParams ? `${url}?${params.toString()}` : url
}

// Bundle splitting utilities
export const dynamicImports = {
  // Performance mode components (critical path)
  PerformanceMode: () => import('@/components/performance-mode'),
  OptimizedContentDisplay: () => import('@/components/performance-mode/optimized-content-display'),

  // Editor components (non-critical)
  ChordEditor: () => import('@/components/chord-editor'),
  TabEditor: () => import('@/components/tab-editor'),
  LyricsEditor: () => import('@/components/lyrics-editor'),

  // Library components (lazy load)
  LibraryGrid: () => import('@/components/library/library-grid'),
  LibrarySearch: () => import('@/components/library/library-search'),

  // Admin components (rarely used)
  AdminPanel: () => import('@/components/admin/admin-panel'),
}

// Preloading utilities for performance mode
export function preloadCriticalAssets(): void {
  // Preload fonts
  const fonts = [
    '/fonts/inter.woff2',
    '/fonts/source-code-pro.woff2'
  ]

  fonts.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = font
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  })

  // Preload critical images
  const images = [
    '/icons/play.svg',
    '/icons/pause.svg',
    '/icons/next.svg',
    '/icons/prev.svg'
  ]

  images.forEach(src => {
    const img = new Image()
    img.src = src
  })
}

// React performance optimization HOC
export function withPerformanceOptimization<P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
): React.MemoExoticComponent<React.ComponentType<P>> {
  const OptimizedComponent = React.memo(Component)

  if (displayName) {
    OptimizedComponent.displayName = `withPerformanceOptimization(${displayName})`
  }

  return OptimizedComponent
}

// Export performance monitoring for global access
if (typeof window !== 'undefined') {
  ;(window as any).performanceMonitor = PerformanceMonitor
  ;(window as any).contentCache = ContentCache
}