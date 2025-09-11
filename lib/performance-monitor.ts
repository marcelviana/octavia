/**
 * Real-time Performance Monitoring System
 * 
 * Comprehensive performance monitoring for live music performance
 * with real-time alerts, metrics collection, and optimization suggestions.
 */

import { useEffect, useRef, useCallback, useState } from 'react'

// Performance thresholds for live music performance
const PERFORMANCE_THRESHOLDS = {
  NAVIGATION_TIME_MS: 100, // Song navigation should be under 100ms
  RENDER_TIME_MS: 50, // Component renders should be under 50ms
  MEMORY_USAGE_MB: 150, // Memory usage should stay under 150MB
  FPS_TARGET: 60, // Target 60fps for smooth experience
  FPS_WARNING: 45, // Warn if FPS drops below 45
  CACHE_HIT_RATE: 0.8, // Target 80% cache hit rate
  LOAD_TIME_MS: 500, // Content loading should be under 500ms
  BATTERY_WARNING: 20, // Warn if battery below 20%
} as const

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  threshold?: number
  unit: string
  category: 'navigation' | 'render' | 'memory' | 'network' | 'battery' | 'user'
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  category: string
  message: string
  value: number
  threshold: number
  timestamp: number
  acknowledged: boolean
}

interface PerformanceSummary {
  overall: 'excellent' | 'good' | 'fair' | 'poor'
  score: number
  issues: number
  recommendations: string[]
}

class RealTimePerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private alerts: PerformanceAlert[] = []
  private isMonitoring = false
  private frameCount = 0
  private lastFrameTime = 0
  private currentFPS = 60
  private monitoringInterval: NodeJS.Timeout | null = null
  private observers: PerformanceObserver[] = []
  private eventListeners: { element: EventTarget; type: string; handler: EventListener }[] = []

  /**
   * Start comprehensive performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    
    // Start frame rate monitoring
    this.startFPSMonitoring()
    
    // Start system metrics monitoring
    this.startSystemMonitoring()
    
    // Setup performance observers
    this.setupPerformanceObservers()
    
    // Setup user interaction monitoring
    this.setupUserInteractionMonitoring()

    console.log('Real-time performance monitoring started')
  }

  /**
   * Stop performance monitoring and cleanup
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []

    // Remove event listeners
    this.eventListeners.forEach(({ element, type, handler }) => {
      element.removeEventListener(type, handler)
    })
    this.eventListeners = []

    console.log('Performance monitoring stopped')
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    category: PerformanceMetric['category'],
    unit: string,
    threshold?: number
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      threshold,
      unit,
      category
    }

    this.metrics.push(metric)

    // Keep only recent metrics (last 1000)
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }

    // Check for threshold violations
    if (threshold && value > threshold) {
      this.createAlert('warning', category, 
        `${name} exceeded threshold: ${value}${unit} > ${threshold}${unit}`,
        value, threshold
      )
    }

    // Real-time analysis for critical metrics
    this.analyzeMetricTrends(name, category)
  }

  /**
   * Measure and record navigation time
   */
  measureNavigation<T>(operation: string, fn: () => T): T {
    const start = performance.now()
    
    try {
      const result = fn()
      
      // Handle both sync and async operations
      if (result instanceof Promise) {
        return result.then(data => {
          const duration = performance.now() - start
          this.recordMetric(
            `navigation-${operation}`,
            duration,
            'navigation',
            'ms',
            PERFORMANCE_THRESHOLDS.NAVIGATION_TIME_MS
          )
          return data
        }) as T
      } else {
        const duration = performance.now() - start
        this.recordMetric(
          `navigation-${operation}`,
          duration,
          'navigation',
          'ms',
          PERFORMANCE_THRESHOLDS.NAVIGATION_TIME_MS
        )
        return result
      }
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`navigation-${operation}-error`, duration, 'navigation', 'ms')
      throw error
    }
  }

  /**
   * Measure render performance
   */
  measureRender(componentName: string, renderFn: () => void): void {
    const start = performance.now()
    renderFn()
    const duration = performance.now() - start
    
    this.recordMetric(
      `render-${componentName}`,
      duration,
      'render',
      'ms',
      PERFORMANCE_THRESHOLDS.RENDER_TIME_MS
    )
  }

  /**
   * Get current performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const recentMetrics = this.metrics.filter(m => 
      performance.now() - m.timestamp < 60000 // Last minute
    )

    let score = 100
    let issues = 0
    const recommendations: string[] = []

    // Analyze navigation performance
    const navigationMetrics = recentMetrics.filter(m => m.category === 'navigation')
    const avgNavTime = navigationMetrics.reduce((sum, m) => sum + m.value, 0) / navigationMetrics.length || 0
    
    if (avgNavTime > PERFORMANCE_THRESHOLDS.NAVIGATION_TIME_MS) {
      score -= 20
      issues++
      recommendations.push('Song navigation is slow. Consider preloading content.')
    }

    // Analyze memory usage
    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory-usage')
    const currentMemory = memoryMetrics[memoryMetrics.length - 1]?.value || 0
    
    if (currentMemory > PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB) {
      score -= 15
      issues++
      recommendations.push('Memory usage is high. Clear cache or restart the application.')
    }

    // Analyze FPS
    if (this.currentFPS < PERFORMANCE_THRESHOLDS.FPS_WARNING) {
      score -= 25
      issues++
      recommendations.push('Low frame rate detected. Close other browser tabs or applications.')
    }

    // Analyze cache performance
    const cacheMetrics = recentMetrics.filter(m => m.name === 'cache-hit-rate')
    const cacheHitRate = cacheMetrics[cacheMetrics.length - 1]?.value || 1
    
    if (cacheHitRate < PERFORMANCE_THRESHOLDS.CACHE_HIT_RATE) {
      score -= 10
      issues++
      recommendations.push('Low cache hit rate. Allow time for content preloading.')
    }

    // Determine overall grade
    let overall: PerformanceSummary['overall']
    if (score >= 90) overall = 'excellent'
    else if (score >= 75) overall = 'good'
    else if (score >= 60) overall = 'fair'
    else overall = 'poor'

    return {
      overall,
      score: Math.max(0, score),
      issues,
      recommendations
    }
  }

  /**
   * Get recent alerts
   */
  getAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => 
      performance.now() - alert.timestamp < 300000 // Last 5 minutes
    )
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  /**
   * Get performance metrics for a specific category
   */
  getMetricsByCategory(category: PerformanceMetric['category'], limit = 50): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.category === category)
      .slice(-limit)
  }

  /**
   * Export performance data for analysis
   */
  exportData(): {
    metrics: PerformanceMetric[]
    alerts: PerformanceAlert[]
    summary: PerformanceSummary
    timestamp: number
  } {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getPerformanceSummary(),
      timestamp: Date.now()
    }
  }

  // Private methods

  private startFPSMonitoring(): void {
    const measureFPS = () => {
      if (!this.isMonitoring) return

      const now = performance.now()
      this.frameCount++

      if (this.lastFrameTime === 0) {
        this.lastFrameTime = now
      }

      const elapsed = now - this.lastFrameTime
      
      if (elapsed >= 1000) { // Calculate FPS every second
        this.currentFPS = Math.round((this.frameCount * 1000) / elapsed)
        this.frameCount = 0
        this.lastFrameTime = now

        this.recordMetric('fps', this.currentFPS, 'render', 'fps', PERFORMANCE_THRESHOLDS.FPS_WARNING)
      }

      requestAnimationFrame(measureFPS)
    }

    measureFPS()
  }

  private startSystemMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      if (!this.isMonitoring) return

      // Memory monitoring
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / (1024 * 1024)
        this.recordMetric('memory-usage', usedMB, 'memory', 'MB', PERFORMANCE_THRESHOLDS.MEMORY_USAGE_MB)
      }

      // Battery monitoring (if available)
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          const batteryLevel = battery.level * 100
          this.recordMetric('battery-level', batteryLevel, 'battery', '%', PERFORMANCE_THRESHOLDS.BATTERY_WARNING)
        })
      }

      // Network monitoring
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        if (connection) {
          this.recordMetric('network-downlink', connection.downlink, 'network', 'Mbps')
          this.recordMetric('network-rtt', connection.rtt, 'network', 'ms')
        }
      }
    }, 5000) // Check every 5 seconds
  }

  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return

    // Navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric('page-load-time', navEntry.loadEventEnd - navEntry.startTime, 'navigation', 'ms')
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)
    } catch (e) {
      console.warn('Navigation timing observer not supported')
    }

    // Resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart
            
            if (resourceEntry.name.includes('api/proxy')) {
              this.recordMetric('content-load-time', loadTime, 'network', 'ms', PERFORMANCE_THRESHOLDS.LOAD_TIME_MS)
            }
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)
    } catch (e) {
      console.warn('Resource timing observer not supported')
    }

    // Long task monitoring
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric('long-task', entry.duration, 'render', 'ms', 50)
            this.createAlert('warning', 'render', 
              `Long task detected: ${entry.duration.toFixed(2)}ms`, entry.duration, 50
            )
          }
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    } catch (e) {
      console.warn('Long task observer not supported')
    }
  }

  private setupUserInteractionMonitoring(): void {
    const trackInteraction = (type: string) => (event: Event) => {
      const start = performance.now()
      
      // Use requestAnimationFrame to measure the time to next frame
      requestAnimationFrame(() => {
        const duration = performance.now() - start
        this.recordMetric(`interaction-${type}`, duration, 'user', 'ms', 16) // 16ms = 60fps
      })
    }

    const events = ['click', 'keydown', 'touchstart']
    events.forEach(eventType => {
      const handler = trackInteraction(eventType)
      document.addEventListener(eventType, handler, { passive: true })
      this.eventListeners.push({ element: document, type: eventType, handler })
    })
  }

  private analyzeMetricTrends(name: string, category: string): void {
    const recentMetrics = this.metrics
      .filter(m => m.name === name && performance.now() - m.timestamp < 30000) // Last 30 seconds
      .slice(-5) // Last 5 measurements

    if (recentMetrics.length < 3) return

    // Check for consistent degradation
    const isConsistentlyDegrading = recentMetrics.every((metric, i) => 
      i === 0 || metric.value >= recentMetrics[i - 1].value
    )

    if (isConsistentlyDegrading) {
      const trend = recentMetrics[recentMetrics.length - 1].value - recentMetrics[0].value
      this.createAlert('warning', category, 
        `Performance degrading: ${name} increased by ${trend.toFixed(2)} over last 30s`,
        trend, 0
      )
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    category: string,
    message: string,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      message,
      value,
      threshold,
      timestamp: performance.now(),
      acknowledged: false
    }

    this.alerts.push(alert)

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts.shift()
    }

    // Log critical alerts
    if (type === 'error') {
      console.error(`Performance Alert: ${message}`)
    } else if (type === 'warning') {
      console.warn(`Performance Warning: ${message}`)
    }
  }
}

// Export singleton instance
export const performanceMonitor = new RealTimePerformanceMonitor()

// React hooks for performance monitoring

export const usePerformanceMonitoring = () => {
  const [summary, setSummary] = useState<PerformanceSummary>()
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])

  useEffect(() => {
    performanceMonitor.startMonitoring()
    
    // Update summary and alerts periodically
    const interval = setInterval(() => {
      setSummary(performanceMonitor.getPerformanceSummary())
      setAlerts(performanceMonitor.getAlerts())
    }, 5000)

    return () => {
      performanceMonitor.stopMonitoring()
      clearInterval(interval)
    }
  }, [])

  const measureNavigation = useCallback(<T,>(operation: string, fn: () => T): T => {
    return performanceMonitor.measureNavigation(operation, fn)
  }, [])

  const measureRender = useCallback((componentName: string, renderFn: () => void) => {
    performanceMonitor.measureRender(componentName, renderFn)
  }, [])

  const recordMetric = useCallback((
    name: string,
    value: number,
    category: PerformanceMetric['category'],
    unit: string,
    threshold?: number
  ) => {
    performanceMonitor.recordMetric(name, value, category, unit, threshold)
  }, [])

  const acknowledgeAlert = useCallback((alertId: string) => {
    performanceMonitor.acknowledgeAlert(alertId)
    setAlerts(performanceMonitor.getAlerts())
  }, [])

  return {
    summary,
    alerts,
    measureNavigation,
    measureRender,
    recordMetric,
    acknowledgeAlert,
    exportData: () => performanceMonitor.exportData()
  }
}

export const useNavigationTiming = () => {
  const measureNavigation = useCallback(<T,>(operation: string, fn: () => T): T => {
    return performanceMonitor.measureNavigation(operation, fn)
  }, [])

  return { measureNavigation }
}

export const useRenderTiming = () => {
  const measureRender = useCallback((componentName: string, renderFn: () => void) => {
    performanceMonitor.measureRender(componentName, renderFn)
  }, [])

  return { measureRender }
}