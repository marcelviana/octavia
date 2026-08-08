/**
 * Performance Mode Empty State Component
 *
 * Displayed when performance mode is opened without any selected
 * content or setlist (e.g., navigating to /performance directly).
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Music } from 'lucide-react'

interface EmptyStateProps {
  onExitPerformance: () => void
}

export function EmptyState({ onExitPerformance }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center px-6">
        <Music className="w-10 h-10 mx-auto mb-4 text-gray-400" aria-hidden="true" />
        <div className="text-lg font-semibold text-gray-900 mb-2">
          No song selected
        </div>
        <div className="text-sm text-gray-600 mb-6">
          Choose a song or setlist to start performance mode
        </div>
        <Button onClick={onExitPerformance} variant="outline">
          Go back
        </Button>
      </div>
    </div>
  )
}
