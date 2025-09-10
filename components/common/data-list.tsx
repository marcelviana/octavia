/**
 * DataList Component - Reusable Composition Pattern
 * 
 * A flexible, composable component for displaying lists of data with
 * consistent patterns across the application. Supports loading states,
 * empty states, error handling, and custom rendering.
 */

import { memo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Plus } from "lucide-react"

export interface DataListProps<T = any> {
  data: T[]
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  onCreateNew?: () => void
  createButtonText?: string
  renderItem: (item: T, index: number) => ReactNode
  renderHeader?: () => ReactNode
  renderFooter?: () => ReactNode
  className?: string
  itemClassName?: string
  testId?: string
}

export const DataList = memo(function DataList<T>({
  data,
  loading = false,
  error = null,
  emptyTitle = "No items found",
  emptyDescription = "Get started by creating your first item.",
  emptyIcon = <Plus className="w-8 h-8 text-gray-400" />,
  onCreateNew,
  createButtonText = "Create New",
  renderItem,
  renderHeader,
  renderFooter,
  className = "",
  itemClassName = "",
  testId = "data-list",
}: DataListProps<T>) {
  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid={`${testId}-loading`}>
        {renderHeader?.()}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        {renderFooter?.()}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`space-y-4 ${className}`} data-testid={`${testId}-error`}>
        {renderHeader?.()}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Try Again
            </Button>
          </div>
        </div>
        {renderFooter?.()}
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`space-y-4 ${className}`} data-testid={`${testId}-empty`}>
        {renderHeader?.()}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {emptyIcon}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyTitle}</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">{emptyDescription}</p>
            {onCreateNew && (
              <Button
                onClick={onCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {createButtonText}
              </Button>
            )}
          </div>
        </div>
        {renderFooter?.()}
      </div>
    )
  }

  // Data state
  return (
    <div className={`space-y-4 ${className}`} data-testid={testId}>
      {renderHeader?.()}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      {renderFooter?.()}
    </div>
  )
})