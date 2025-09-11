"use client"

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface DomainErrorBoundaryProps {
  children: React.ReactNode
  domain: string
  feature?: string
}

export function DomainErrorBoundary({ 
  children, 
  domain, 
  feature 
}: DomainErrorBoundaryProps) {
  const context = feature ? `${domain} - ${feature}` : domain

  const handleRetry = () => {
    window.location.reload()
  }

  const customFallback = (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md shadow-lg border-orange-200">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-orange-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feature || domain} Unavailable
            </h3>
            <p className="text-sm text-gray-600">
              We're having trouble loading this section. This might be a temporary issue.
            </p>
          </div>
          
          <Button
            onClick={handleRetry}
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <p className="text-xs text-gray-500">
            If this continues, try refreshing the page or contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <ErrorBoundary
      context={context}
      fallback={customFallback}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundary>
  )
}