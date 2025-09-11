import { useCallback } from 'react'
import { useUIActions } from '../state-management/app-store'
import { logger } from '@/lib/logger'

export interface ErrorHandlerOptions {
  context?: string
  showNotification?: boolean
  logError?: boolean
}

export function useErrorHandler() {
  const { addNotification, setGlobalError, setOperationError } = useUIActions()

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      context = 'Unknown',
      showNotification = true,
      logError = true,
    } = options

    // Normalize error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorId = `error-${Date.now()}`

    // Log error if enabled
    if (logError) {
      logger.error('Error handled by useErrorHandler', {
        errorId,
        context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : { message: String(error) },
      })
    }

    // Show user notification if enabled
    if (showNotification) {
      addNotification({
        type: 'error',
        message: errorMessage,
      })
    }

    return { errorId, message: errorMessage }
  }, [addNotification])

  const handleAsyncError = useCallback(async (
    asyncOperation: () => Promise<void>,
    options: ErrorHandlerOptions = {}
  ) => {
    try {
      await asyncOperation()
    } catch (error) {
      handleError(error, options)
      throw error // Re-throw to allow caller to handle if needed
    }
  }, [handleError])

  const handleOperationError = useCallback((
    operation: string,
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const result = handleError(error, options)
    setOperationError(operation, result.message)
    return result
  }, [handleError, setOperationError])

  const clearOperationError = useCallback((operation: string) => {
    setOperationError(operation, null)
  }, [setOperationError])

  const handleGlobalError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const result = handleError(error, options)
    setGlobalError(result.message)
    return result
  }, [handleError, setGlobalError])

  const clearGlobalError = useCallback(() => {
    setGlobalError(null)
  }, [setGlobalError])

  return {
    handleError,
    handleAsyncError,
    handleOperationError,
    clearOperationError,
    handleGlobalError,
    clearGlobalError,
  }
}