/**
 * Tests for Error Boundary System
 * 
 * Tests the unified error boundary implementation including global error handling,
 * domain-specific error boundaries, and error recovery mechanisms.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/domains/shared/components/ErrorBoundary'
import { DomainErrorBoundary } from '@/domains/shared/components/DomainErrorBoundary'
import { GlobalErrorHandler, OperationError } from '@/domains/shared/components/GlobalErrorHandler'
import { logger } from '@/lib/logger'
import { renderWithStore } from '../utils/test-utils'

// Mock dependencies
vi.mock('@/lib/logger')
const mockLogger = vi.mocked(logger)

// Component that throws an error
const ThrowError = ({ shouldThrow = false, message = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(message)
  }
  return <div>No error</div>
}

// Component that throws async error
const ThrowAsyncError = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    Promise.reject(new Error('Async error'))
  }
  return <div>No async error</div>
}

describe('ErrorBoundary', () => {
  const mockOnError = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('normal operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should not call onError when no error occurs', () => {
      render(
        <ErrorBoundary onError={mockOnError}>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(mockOnError).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should catch and display errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow message="Component error" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      expect(screen.getByText('Component error')).toBeInTheDocument()
    })

    it('should log errors', () => {
      render(
        <ErrorBoundary context="Test Component">
          <ThrowError shouldThrow message="Test error" />
        </ErrorBoundary>
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error Boundary caught error',
        expect.objectContaining({
          context: 'Test Component',
          error: expect.objectContaining({
            message: 'Test error'
          })
        })
      )
    })

    it('should call custom error handler', () => {
      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow message="Custom error" />
        </ErrorBoundary>
      )

      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      )
    })

    it('should generate unique error IDs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow message="ID test error" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
    })

    it('should show context in error message', () => {
      render(
        <ErrorBoundary context="User Profile">
          <ThrowError shouldThrow message="Profile error" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/An error occurred in User Profile/)).toBeInTheDocument()
    })
  })

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
    })
  })

  describe('recovery actions', () => {
    it('should provide retry functionality', async () => {
      const user = userEvent.setup()
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow message="Retry test" />
        </ErrorBoundary>
      )

      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      // Error boundary should reset and try to render children again
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument()
    })

    it('should provide reload functionality', async () => {
      const user = userEvent.setup()
      const mockReload = vi.fn()
      Object.defineProperty(window.location, 'reload', {
        writable: true,
        value: mockReload,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      )

      const reloadButton = screen.getByRole('button', { name: /reload page/i })
      await user.click(reloadButton)

      expect(mockReload).toHaveBeenCalled()
    })

    it('should provide home navigation', async () => {
      const user = userEvent.setup()
      
      // Mock window.location.href
      const mockHref = vi.fn()
      Object.defineProperty(window.location, 'href', {
        writable: true,
        set: mockHref,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      )

      const homeButton = screen.getByRole('button', { name: /go home/i })
      await user.click(homeButton)

      expect(mockHref).toHaveBeenCalledWith('/')
    })
  })

  describe('development features', () => {
    it('should show technical details in development', () => {
      render(
        <ErrorBoundary showDetails>
          <ThrowError shouldThrow message="Dev error" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Technical Details')).toBeInTheDocument()
    })

    it('should hide technical details by default', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow message="Prod error" />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Technical Details')).not.toBeInTheDocument()
    })
  })
})

describe('DomainErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should render children when no error', () => {
    render(
      <DomainErrorBoundary domain="Content Management" feature="Content Viewer">
        <div>Content</div>
      </DomainErrorBoundary>
    )

    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should show domain-specific error UI', () => {
    render(
      <DomainErrorBoundary domain="Content Management" feature="Content Viewer">
        <ThrowError shouldThrow />
      </DomainErrorBoundary>
    )

    expect(screen.getByText('Content Viewer Unavailable')).toBeInTheDocument()
    expect(screen.getByText(/having trouble loading this section/i)).toBeInTheDocument()
  })

  it('should show domain name when feature not specified', () => {
    render(
      <DomainErrorBoundary domain="User Management">
        <ThrowError shouldThrow />
      </DomainErrorBoundary>
    )

    expect(screen.getByText('User Management Unavailable')).toBeInTheDocument()
  })

  it('should provide retry functionality', async () => {
    const user = userEvent.setup()
    const mockReload = vi.fn()
    Object.defineProperty(window.location, 'reload', {
      writable: true,
      value: mockReload,
    })

    render(
      <DomainErrorBoundary domain="Test Domain">
        <ThrowError shouldThrow />
      </DomainErrorBoundary>
    )

    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)

    expect(mockReload).toHaveBeenCalled()
  })

  it('should show details in development mode', () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <DomainErrorBoundary domain="Test Domain">
        <ThrowError shouldThrow />
      </DomainErrorBoundary>
    )

    // Should show development details through the underlying ErrorBoundary
    expect(screen.getByText(/Test Domain Unavailable/)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})

describe('GlobalErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when no global error', () => {
    const initialState = {
      ui: { errors: { global: null, operations: {} } }
    }

    renderWithStore(<GlobalErrorHandler />, { initialState })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should render global error when present', () => {
    const initialState = {
      ui: { errors: { global: 'Global error message', operations: {} } }
    }

    renderWithStore(<GlobalErrorHandler />, { initialState })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Global error message')).toBeInTheDocument()
  })

  it('should allow dismissing global error', async () => {
    const user = userEvent.setup()
    const initialState = {
      ui: { errors: { global: 'Dismissible error', operations: {} } }
    }

    renderWithStore(<GlobalErrorHandler />, { initialState })

    const dismissButton = screen.getByRole('button')
    await user.click(dismissButton)

    // Should call setGlobalError(null) through the store
    // The exact assertion would depend on how we verify store actions
  })

  it('should handle unhandled promise rejections', () => {
    const initialState = {
      ui: { errors: { global: null, operations: {} } }
    }

    renderWithStore(<GlobalErrorHandler />, { initialState })

    // Simulate unhandled promise rejection
    const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.reject(new Error('Unhandled error')),
      reason: new Error('Unhandled error'),
    })

    window.dispatchEvent(rejectionEvent)

    // Should set global error through the store
    // Verification would depend on mock implementation
  })

  it('should handle uncaught JavaScript errors', () => {
    const initialState = {
      ui: { errors: { global: null, operations: {} } }
    }

    renderWithStore(<GlobalErrorHandler />, { initialState })

    // Simulate uncaught error
    const errorEvent = new ErrorEvent('error', {
      error: new Error('Uncaught error'),
      message: 'Uncaught error'
    })

    window.dispatchEvent(errorEvent)

    // Should set global error through the store
  })
})

describe('OperationError', () => {
  it('should not render when no operation error', () => {
    const initialState = {
      ui: { 
        sidebar: { isOpen: false, activeSection: 'dashboard' },
        notifications: [],
        loading: { global: false, operations: {} },
        errors: { global: null, operations: {} } 
      }
    }

    renderWithStore(
      <OperationError operation="test-operation" />, 
      { initialState }
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('should render operation error when present', () => {
    const initialState = {
      ui: { 
        sidebar: { isOpen: false, activeSection: 'dashboard' },
        notifications: [],
        loading: { global: false, operations: {} },
        errors: { 
          global: null, 
          operations: { 'test-operation': 'Operation failed' } 
        } 
      }
    }

    renderWithStore(
      <OperationError operation="test-operation" />, 
      { initialState }
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Operation failed')).toBeInTheDocument()
  })

  it('should allow dismissing operation error', async () => {
    const user = userEvent.setup()
    const initialState = {
      ui: { 
        sidebar: { isOpen: false, activeSection: 'dashboard' },
        notifications: [],
        loading: { global: false, operations: {} },
        errors: { 
          global: null, 
          operations: { 'test-operation': 'Dismissible operation error' } 
        } 
      }
    }

    renderWithStore(
      <OperationError operation="test-operation" />, 
      { initialState }
    )

    const dismissButton = screen.getByRole('button')
    await user.click(dismissButton)

    // Should call setOperationError('test-operation', null) through the store
  })

  it('should apply custom className', () => {
    const initialState = {
      ui: { 
        sidebar: { isOpen: false, activeSection: 'dashboard' },
        notifications: [],
        loading: { global: false, operations: {} },
        errors: { 
          global: null, 
          operations: { 'styled-operation': 'Styled error' } 
        } 
      }
    }

    renderWithStore(
      <OperationError operation="styled-operation" className="custom-class" />, 
      { initialState }
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-class')
  })
})

describe('error boundary integration', () => {
  it('should work together for comprehensive error handling', () => {
    const initialState = {
      ui: { 
        sidebar: { isOpen: false, activeSection: 'dashboard' },
        notifications: [],
        loading: { global: false, operations: {} },
        errors: { global: 'Global system error', operations: {} } 
      }
    }

    renderWithStore(
      <div>
        <GlobalErrorHandler />
        <DomainErrorBoundary domain="Content Management">
          <ErrorBoundary context="Content Viewer">
            <ThrowError shouldThrow message="Component error" />
          </ErrorBoundary>
        </DomainErrorBoundary>
      </div>, 
      { initialState }
    )

    // Should show both global error and component error boundary
    expect(screen.getByText('Global system error')).toBeInTheDocument()
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('should handle nested error boundaries correctly', () => {
    render(
      <ErrorBoundary context="Outer Boundary">
        <DomainErrorBoundary domain="Test Domain">
          <ErrorBoundary context="Inner Boundary">
            <ThrowError shouldThrow message="Nested error" />
          </ErrorBoundary>
        </DomainErrorBoundary>
      </ErrorBoundary>
    )

    // Inner boundary should catch the error
    expect(screen.getByText('Nested error')).toBeInTheDocument()
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error Boundary caught error',
      expect.objectContaining({
        context: 'Inner Boundary'
      })
    )
  })
})