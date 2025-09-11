"use client"

import { useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, X } from 'lucide-react'
import { useUI, useUIActions } from '../state-management/app-store'

export function GlobalErrorHandler() {
  const { errors } = useUI()
  const { setGlobalError, clearAllErrors } = useUIActions()

  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      const errorMessage = event.reason instanceof Error 
        ? event.reason.message 
        : 'An unexpected error occurred'

      setGlobalError(errorMessage)
      
      // Prevent the default browser error handling
      event.preventDefault()
    }

    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error)
      
      const errorMessage = event.error instanceof Error
        ? event.error.message
        : event.message || 'An unexpected error occurred'

      setGlobalError(errorMessage)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [setGlobalError])

  // Don't render anything if there's no global error
  if (!errors.global) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <Alert 
        variant="destructive" 
        className="bg-red-50 border-red-200 shadow-lg max-w-md mx-auto"
      >
        <AlertCircle className="h-4 w-4" />
        <div className="flex-1">
          <AlertDescription className="text-red-800">
            {errors.global}
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
          onClick={() => setGlobalError(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  )
}

// Utility component for displaying operation-specific errors
interface OperationErrorProps {
  operation: string
  className?: string
}

export function OperationError({ operation, className = '' }: OperationErrorProps) {
  const { errors } = useUI()
  const { setOperationError } = useUIActions()

  const error = errors.operations[operation]

  if (!error) {
    return null
  }

  return (
    <Alert variant="destructive" className={`border-red-200 bg-red-50 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="ml-2 h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
        onClick={() => setOperationError(operation, null)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}