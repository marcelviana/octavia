"use client"

/**
 * O limite de erro GLOBAL (`app/layout.tsx`). Captura o que capturava (exceção de render de qualquer descendente),
 * registra como antes (`logger.error`, o `onError` do chamador, o `console.error` em produção) e aceita o `fallback`
 * do chamador. I1-PR-14: a TELA é a `TelaDeErro` (`components/identidade/tela-de-erro.tsx`, decisão 4 do aval — em
 * `lib/` o `content` do Tailwind não a veria, div. 896); a ação única recarrega a página (decisão 11).
 */
import React, { Component, ErrorInfo, ReactNode } from 'react'
import logger from '@/lib/logger'
import { TelaDeErro } from '@/components/identidade/tela-de-erro'

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

      // Show error details in development
      const detalhes = process.env.NODE_ENV === 'development' && this.state.errorInfo
        ? { pilha: this.state.error?.stack, pilhaDeComponentes: this.state.errorInfo.componentStack }
        : undefined
      return <TelaDeErro onTentar={() => window.location.reload()} detalhes={detalhes} />
    }

    return this.props.children
  }
}
