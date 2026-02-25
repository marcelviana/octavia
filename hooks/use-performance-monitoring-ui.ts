/**
 * Performance Monitoring UI Hook
 *
 * Extracts performance monitoring UI state management from optimized-performance-mode.
 * Manages warning display, dismissal, and monitoring alerts.
 */

import { useState, useEffect } from 'react'

interface PerformanceSummary {
  overall: 'excellent' | 'good' | 'fair' | 'poor'
  score: number
  issues: number
  recommendations: string[]
}

interface PerformanceMonitoringUIResult {
  showWarning: boolean
  dismissWarning: () => void
}

export function usePerformanceMonitoringUI(
  summary?: PerformanceSummary
): PerformanceMonitoringUIResult {
  const [showWarning, setShowWarning] = useState(false)

  // Monitor for performance issues
  useEffect(() => {
    if (summary && (summary.overall === 'poor' || summary.overall === 'fair')) {
      setShowWarning(true)

      // Auto-hide warning after 10 seconds
      const timer = setTimeout(() => setShowWarning(false), 10000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [summary])

  const dismissWarning = () => {
    setShowWarning(false)
  }

  return {
    showWarning,
    dismissWarning
  }
}
