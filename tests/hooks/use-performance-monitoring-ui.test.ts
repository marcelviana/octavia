import { renderHook, act } from '@testing-library/react'
import { usePerformanceMonitoringUI } from '@/hooks/use-performance-monitoring-ui'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('usePerformanceMonitoringUI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with showWarning as false', () => {
    const { result } = renderHook(() => usePerformanceMonitoringUI())

    expect(result.current.showWarning).toBe(false)
  })

  it('should provide dismissWarning function', () => {
    const { result } = renderHook(() => usePerformanceMonitoringUI())

    expect(typeof result.current.dismissWarning).toBe('function')
  })

  it('should show warning when performance is poor', () => {
    const summary = {
      overall: 'poor' as const,
      score: 30,
      issues: 5,
      recommendations: ['Optimize rendering']
    }

    const { result } = renderHook(() => usePerformanceMonitoringUI(summary))

    expect(result.current.showWarning).toBe(true)
  })

  it('should show warning when performance is fair', () => {
    const summary = {
      overall: 'fair' as const,
      score: 60,
      issues: 2,
      recommendations: ['Consider optimization']
    }

    const { result } = renderHook(() => usePerformanceMonitoringUI(summary))

    expect(result.current.showWarning).toBe(true)
  })

  it('should not show warning when performance is good', () => {
    const summary = {
      overall: 'good' as const,
      score: 80,
      issues: 0,
      recommendations: []
    }

    const { result } = renderHook(() => usePerformanceMonitoringUI(summary))

    expect(result.current.showWarning).toBe(false)
  })

  it('should dismiss warning when dismissWarning is called', () => {
    const summary = {
      overall: 'poor' as const,
      score: 30,
      issues: 5,
      recommendations: ['Optimize rendering']
    }

    const { result } = renderHook(() => usePerformanceMonitoringUI(summary))

    expect(result.current.showWarning).toBe(true)

    act(() => {
      result.current.dismissWarning()
    })

    expect(result.current.showWarning).toBe(false)
  })

  it('should auto-dismiss warning after 10 seconds', () => {
    const summary = {
      overall: 'poor' as const,
      score: 30,
      issues: 5,
      recommendations: ['Optimize rendering']
    }

    const { result } = renderHook(() => usePerformanceMonitoringUI(summary))

    expect(result.current.showWarning).toBe(true)

    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.showWarning).toBe(false)
  })

  it('should handle undefined summary', () => {
    const { result } = renderHook(() => usePerformanceMonitoringUI(undefined))

    expect(result.current.showWarning).toBe(false)
  })
})
