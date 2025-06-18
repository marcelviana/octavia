"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import logger from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error boundary caught an error:', error, errorInfo)
    
    this.setState({ errorInfo })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo })
      console.error('Production error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h3>
            <p className="text-red-600 text-sm mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-left mb-6 p-4 bg-red-50 rounded border">
                <summary className="cursor-pointer font-medium text-red-800 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto">
                  {this.state.error?.stack}
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="space-x-3">
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Try again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Reload page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logger.error('Unhandled error:', error, errorInfo)
    
    if (process.env.NODE_ENV === 'production') {
      // Report to error tracking service
      console.error('Production error:', error, errorInfo)
    }
  }
}