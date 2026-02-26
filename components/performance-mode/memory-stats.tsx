/**
 * Memory Stats Component (Development Only)
 *
 * Displays performance and memory statistics for debugging
 */

import React, { memo } from 'react'
import type { PerformanceSummary, PerformanceAlert } from '@/lib/performance-monitor'
import type { MemoryStats as MemoryStatsType } from '@/lib/memory-management'

interface MemoryStatsData {
  current: MemoryStatsType | null
  trend: 'increasing' | 'stable' | 'decreasing'
  trackedResources: number
  potentialLeaks: string[]
}

interface MemoryStatsProps {
  summary: PerformanceSummary | null
  alerts: PerformanceAlert[]
  memoryStats: MemoryStatsData
}

export const MemoryStats = memo(function MemoryStats({
  summary,
  alerts,
  memoryStats
}: MemoryStatsProps) {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono">
      <div>Performance: {summary?.overall || 'measuring...'}</div>
      <div>Score: {summary?.score || 0}/100</div>
      <div>Alerts: {alerts.length}</div>
      <div>Memory: {memoryStats.trackedResources} resources</div>
    </div>
  )
})
