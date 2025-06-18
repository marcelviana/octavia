import { useCallback, useEffect, useRef, useState } from 'react'
import logger from '@/lib/logger'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

interface AsyncOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: any[] = [],
  options: AsyncOptions = {}
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const cancelRef = useRef<boolean>(false)
  const { immediate = true, onSuccess, onError } = options

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    cancelRef.current = false

    try {
      const data = await asyncFunction()
      
      if (!cancelRef.current) {
        setState({ data, loading: false, error: null })
        if (onSuccess) onSuccess(data)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      
      if (!cancelRef.current) {
        setState(prev => ({ ...prev, loading: false, error: err }))
        logger.error('Async operation failed:', err)
        if (onError) onError(err)
      }
    }
  }, deps)

  const cancel = useCallback(() => {
    cancelRef.current = true
    setState(prev => ({ ...prev, loading: false }))
  }, [])

  const reset = useCallback(() => {
    cancelRef.current = false
    setState({ data: null, loading: false, error: null })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }

    return () => {
      cancelRef.current = true
    }
  }, [execute, immediate])

  return {
    ...state,
    execute,
    cancel,
    reset,
  }
}

// Specialized hook for content operations
export function useContentAsync<T>(
  asyncFunction: () => Promise<T>,
  deps: any[] = []
) {
  return useAsync(asyncFunction, deps, {
    onError: (error) => {
      // Log content-specific errors
      logger.error('Content operation failed:', error)
      
      // Show user-friendly error messages
      if (error.message.includes('not authenticated')) {
        // Could trigger a re-auth flow
        console.warn('User needs to re-authenticate')
      }
    }
  })
}

// Hook for handling multiple async operations
export function useAsyncOperations() {
  const [operations, setOperations] = useState<Record<string, boolean>>({})

  const startOperation = useCallback((key: string) => {
    setOperations(prev => ({ ...prev, [key]: true }))
  }, [])

  const finishOperation = useCallback((key: string) => {
    setOperations(prev => ({ ...prev, [key]: false }))
  }, [])

  const isOperationInProgress = useCallback((key: string) => {
    return operations[key] || false
  }, [operations])

  const isAnyOperationInProgress = useCallback(() => {
    return Object.values(operations).some(Boolean)
  }, [operations])

  return {
    startOperation,
    finishOperation,
    isOperationInProgress,
    isAnyOperationInProgress,
    operations
  }
}