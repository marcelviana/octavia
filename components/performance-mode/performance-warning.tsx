/**
 * Performance Warning Component
 *
 * Displays performance warnings and recommendations
 */

import React, { memo } from 'react'
import { Card } from '@/components/ui/card'
import type { PerformanceSummary } from '@/lib/performance-monitor'

interface PerformanceWarningProps {
  summary: PerformanceSummary | null
  onDismiss: () => void
}

export const PerformanceWarning = memo(function PerformanceWarning({
  summary,
  onDismiss
}: PerformanceWarningProps) {
  return (
    <Card className="mx-4 mt-4 p-3 bg-orange-50 border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-orange-600 font-medium">Performance Notice</div>
          <div className="text-sm text-orange-700">
            {summary?.recommendations[0] || 'Performance could be improved'}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-orange-600 hover:text-orange-800 px-2 py-1 text-sm"
        >
          Dismiss
        </button>
      </div>
    </Card>
  )
})
