/**
 * Performance Mode Loading State Component
 *
 * Displays loading state while performance mode initializes
 */

import React from 'react'

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-900 mb-2">
          Loading performance mode...
        </div>
        <div className="text-sm text-gray-600">
          Optimizing for best performance
        </div>
      </div>
    </div>
  )
}
