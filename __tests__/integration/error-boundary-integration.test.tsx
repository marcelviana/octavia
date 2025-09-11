/**
 * Error Boundary and Cross-Component Integration Tests
 * 
 * Tests for error handling, component boundaries, and cross-component
 * integration patterns that ensure the application remains stable
 * during live music performances.
 * 
 * Test Coverage:
 * - React Error Boundary behavior
 * - Component isolation and error containment
 * - Cross-component communication patterns
 * - Global state management during errors
 * - Recovery mechanisms and fallback UI
 * - Memory leak prevention
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  server, 
  TEST_USER, 
  createTestContent, 
  createTestSetlist,
  performanceMonitor 
} from './test-setup'
import { http, HttpResponse } from 'msw'
import { PerformanceMode } from '@/components/performance-mode'
import { ContentCreator } from '@/components/content-creator'
import { SetlistManager } from '@/components/setlist-manager'
import type { SetlistWithSongs } from '@/types/performance'

// Mock console.error to capture error boundary logs
const originalConsoleError = console.error
const mockConsoleError = vi.fn()

// Test Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error, errorInfo: any) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error, errorInfo: any) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" data-testid="error-fallback">
          <h2>Something went wrong</h2>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={this.resetErrorBoundary}>Try again</button>
        </div>
      )
    }

    return this.props.children
  }
}

// Component that throws errors on demand for testing
function ErrorThrowingComponent({ shouldThrow, errorMessage }: { 
  shouldThrow: boolean
  errorMessage: string 
}) {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div data-testid="working-component">Component working normally</div>
}

describe('Error Boundary and Cross-Component Integration Tests', () => {
  let testSetlist: SetlistWithSongs
  let mockOnError: vi.Mock

  beforeEach(() => {
    console.error = mockConsoleError
    mockOnError = vi.fn()
    performanceMonitor.clear()

    testSetlist = {
      ...createTestSetlist({ name: 'Error Test Setlist' }),
      setlist_songs: [
        {
          id: 'setlist-song-1',
          position: 1,
          notes: 'Normal song',
          content: createTestContent({
            id: 'normal-content',
            title: 'Normal Song',
            content_type: 'LYRICS'
          })
        },
        {
          id: 'setlist-song-2',
          position: 2,
          notes: 'Problematic song',
          content: createTestContent({
            id: 'error-content',
            title: 'Error Song',
            content_type: 'CHORDS',
            file_url: 'https://broken-url.com/broken.pdf'
          })
        }
      ]
    }
  })

  afterEach(() => {
    console.error = originalConsoleError
    vi.clearAllMocks()
  })

  describe('React Error Boundary Behavior', () => {
    it('should catch and display errors in components', async () => {
      const { rerender } = render(
        <TestErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent shouldThrow={false} errorMessage="" />
        </TestErrorBoundary>
      )

      // Component should work normally initially
      expect(screen.getByTestId('working-component')).toBeInTheDocument()

      // Trigger error
      rerender(
        <TestErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Test component error" />
        </TestErrorBoundary>
      )

      // Should show error fallback
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Error: Test component error')).toBeInTheDocument()

      // Should call onError callback
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test component error' }),
        expect.any(Object)
      )
    })

    it('should recover from errors when resetErrorBoundary is called', async () => {
      const user = userEvent.setup()
      
      const { rerender } = render(
        <TestErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Recoverable error" />
        </TestErrorBoundary>
      )

      // Should show error state
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Fix the error condition and try to recover
      rerender(
        <TestErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent shouldThrow={false} errorMessage="" />
        </TestErrorBoundary>
      )

      // Click try again
      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      await user.click(tryAgainButton)

      // Should show working component
      await waitFor(() => {
        expect(screen.getByTestId('working-component')).toBeInTheDocument()
      })

      // Should not show error anymore
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('Component Isolation and Error Containment', () => {
    it('should isolate errors in performance mode components', async () => {
      // Mock a content component that will fail
      server.use(
        http.get('/api/proxy', ({ request }) => {
          const url = new URL(request.url)
          const targetUrl = url.searchParams.get('url')
          
          if (targetUrl?.includes('broken.pdf')) {
            return HttpResponse.json(
              { error: 'File not found' },
              { status: 404 }
            )
          }
          
          return new HttpResponse('Working content')
        })
      )

      const mockOnExitPerformance = vi.fn()

      render(
        <TestErrorBoundary onError={mockOnError}>
          <PerformanceMode
            selectedSetlist={testSetlist}
            onExitPerformance={mockOnExitPerformance}
          />
        </TestErrorBoundary>
      )

      // First song should load normally
      await waitFor(() => {
        expect(screen.getByText('Normal Song')).toBeInTheDocument()
      })

      // Navigate to problematic song
      const user = userEvent.setup()
      await user.keyboard('{ArrowRight}')

      // Should show error song but handle content error gracefully
      await waitFor(() => {
        expect(screen.getByText('Error Song')).toBeInTheDocument()
      })

      // Should show fallback content or error message for the problematic content
      // but not crash the entire performance mode
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      // Should still be able to navigate back to working song
      await user.keyboard('{ArrowLeft}')

      await waitFor(() => {
        expect(screen.getByText('Normal Song')).toBeInTheDocument()
      })

      // Performance mode should remain functional
      const exitButton = screen.getByTestId('exit-button')
      expect(exitButton).toBeInTheDocument()
    })

    it('should contain content manager errors without affecting other features', async () => {
      // Mock API failure for content operations
      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json(
            { error: 'Database connection failed' },
            { status: 500 }
          )
        })
      )

      render(
        <div>
          <TestErrorBoundary onError={mockOnError}>
            <ContentCreator />
          </TestErrorBoundary>
          <div data-testid="other-feature">Other app features</div>
        </div>
      )

      // Content manager should show error
      await waitFor(() => {
        expect(screen.getByText(/database connection failed/i)).toBeInTheDocument()
      })

      // But other features should remain unaffected
      expect(screen.getByTestId('other-feature')).toBeInTheDocument()
      expect(screen.getByText('Other app features')).toBeInTheDocument()
    })

    it('should handle memory leaks and cleanup on component errors', async () => {
      const cleanupSpy = vi.fn()
      const subscriptionSpy = vi.fn()

      // Component with subscriptions that should cleanup on error
      function ComponentWithSubscriptions({ shouldThrow }: { shouldThrow: boolean }) {
        React.useEffect(() => {
          // Simulate subscription
          const subscription = {
            unsubscribe: cleanupSpy
          }
          subscriptionSpy()

          return () => {
            subscription.unsubscribe()
          }
        }, [])

        if (shouldThrow) {
          throw new Error('Component error with subscriptions')
        }

        return <div>Component with subscriptions</div>
      }

      const { rerender } = render(
        <TestErrorBoundary onError={mockOnError}>
          <ComponentWithSubscriptions shouldThrow={false} />
        </TestErrorBoundary>
      )

      // Subscription should be active
      expect(subscriptionSpy).toHaveBeenCalled()

      // Trigger error
      rerender(
        <TestErrorBoundary onError={mockOnError}>
          <ComponentWithSubscriptions shouldThrow={true} />
        </TestErrorBoundary>
      )

      // Should show error boundary
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Cleanup should have been called
      expect(cleanupSpy).toHaveBeenCalled()
    })
  })

  describe('Cross-Component Communication Patterns', () => {
    it('should maintain state consistency during component errors', async () => {
      const user = userEvent.setup()
      
      // Mock global state context
      const globalState = { selectedContent: null, setSelectedContent: vi.fn() }
      
      render(
        <div>
          <TestErrorBoundary onError={mockOnError}>
            <ContentCreator />
          </TestErrorBoundary>
          <TestErrorBoundary onError={mockOnError}>
            <SetlistManager />
          </TestErrorBoundary>
        </div>
      )

      // Both components should render initially
      await waitFor(() => {
        expect(screen.getByText(/content manager/i)).toBeInTheDocument()
        expect(screen.getByText(/setlist manager/i)).toBeInTheDocument()
      })

      // Simulate error in content manager
      server.use(
        http.get('/api/content', () => {
          return HttpResponse.json(
            { error: 'Content service unavailable' },
            { status: 503 }
          )
        })
      )

      // Content manager should show error
      await waitFor(() => {
        expect(screen.getByText(/content service unavailable/i)).toBeInTheDocument()
      })

      // Setlist manager should continue working
      expect(screen.getByText(/setlist manager/i)).toBeInTheDocument()

      // Global state should remain consistent
      expect(globalState.setSelectedContent).not.toHaveBeenCalledWith(undefined)
    })

    it('should handle event propagation during component errors', async () => {
      const onGlobalEvent = vi.fn()
      const user = userEvent.setup()

      function EventPropagationTest() {
        return (
          <div onClick={onGlobalEvent} data-testid="global-container">
            <TestErrorBoundary onError={mockOnError}>
              <button onClick={() => { throw new Error('Event handler error') }}>
                Trigger Error
              </button>
            </TestErrorBoundary>
            <div data-testid="sibling-component">Sibling Component</div>
          </div>
        )
      }

      render(<EventPropagationTest />)

      const errorButton = screen.getByRole('button', { name: /trigger error/i })
      
      // Click should trigger error in component but not break event system
      await user.click(errorButton)

      // Should show error boundary
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Sibling component should still respond to events
      const siblingComponent = screen.getByTestId('sibling-component')
      await user.click(siblingComponent)

      // Global event handler should still work
      expect(onGlobalEvent).toHaveBeenCalled()
    })

    it('should recover gracefully from context provider errors', async () => {
      const mockContextValue = { data: 'test data', error: null }
      const TestContext = React.createContext(mockContextValue)

      function ContextProvider({ children, shouldError }: { 
        children: React.ReactNode
        shouldError: boolean 
      }) {
        if (shouldError) {
          throw new Error('Context provider error')
        }
        
        return (
          <TestContext.Provider value={mockContextValue}>
            {children}
          </TestContext.Provider>
        )
      }

      function ContextConsumer() {
        const context = React.useContext(TestContext)
        return <div>Context data: {context.data}</div>
      }

      const { rerender } = render(
        <TestErrorBoundary onError={mockOnError}>
          <ContextProvider shouldError={false}>
            <ContextConsumer />
          </ContextProvider>
        </TestErrorBoundary>
      )

      // Should work initially
      expect(screen.getByText('Context data: test data')).toBeInTheDocument()

      // Trigger provider error
      rerender(
        <TestErrorBoundary onError={mockOnError}>
          <ContextProvider shouldError={true}>
            <ContextConsumer />
          </ContextProvider>
        </TestErrorBoundary>
      )

      // Should show error boundary
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Should be recoverable
      const user = userEvent.setup()
      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      
      // Fix the error first
      rerender(
        <TestErrorBoundary onError={mockOnError}>
          <ContextProvider shouldError={false}>
            <ContextConsumer />
          </ContextProvider>
        </TestErrorBoundary>
      )

      await user.click(tryAgainButton)

      // Should recover
      await waitFor(() => {
        expect(screen.getByText('Context data: test data')).toBeInTheDocument()
      })
    })
  })

  describe('Global State Management During Errors', () => {
    it('should maintain performance mode state during component errors', async () => {
      const mockOnExitPerformance = vi.fn()

      // Mock performance state
      let performanceState = {
        isActive: true,
        currentSongIndex: 0,
        isPlaying: false
      }

      render(
        <TestErrorBoundary onError={mockOnError}>
          <PerformanceMode
            selectedSetlist={testSetlist}
            onExitPerformance={mockOnExitPerformance}
            startingSongIndex={performanceState.currentSongIndex}
          />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Normal Song')).toBeInTheDocument()
      })

      // Navigate to song with potential issues
      const user = userEvent.setup()
      await user.keyboard('{ArrowRight}')

      // Even if content loading fails, performance state should persist
      await waitFor(() => {
        expect(screen.getByText('Error Song')).toBeInTheDocument()
      })

      // Controls should still reflect correct state
      const playButton = screen.getByTestId('play-pause-button')
      expect(playButton).toBeInTheDocument()

      // Should be able to continue performance
      await user.keyboard('{ArrowLeft}')

      await waitFor(() => {
        expect(screen.getByText('Normal Song')).toBeInTheDocument()
      })

      // Performance state should be maintained throughout
      expect(mockOnExitPerformance).not.toHaveBeenCalled()
    })

    it('should handle concurrent state updates during error recovery', async () => {
      const stateUpdates: string[] = []
      
      function ConcurrentStateComponent({ triggerError }: { triggerError: boolean }) {
        const [count, setCount] = React.useState(0)
        
        React.useEffect(() => {
          stateUpdates.push(`State update: ${count}`)
        }, [count])

        const handleIncrement = () => {
          if (triggerError && count === 2) {
            throw new Error('State update error')
          }
          setCount(c => c + 1)
        }

        return (
          <div>
            <div>Count: {count}</div>
            <button onClick={handleIncrement}>Increment</button>
          </div>
        )
      }

      const { rerender } = render(
        <TestErrorBoundary onError={mockOnError}>
          <ConcurrentStateComponent triggerError={true} />
        </TestErrorBoundary>
      )

      const user = userEvent.setup()
      const incrementButton = screen.getByRole('button', { name: /increment/i })

      // First two increments should work
      await user.click(incrementButton)
      expect(screen.getByText('Count: 1')).toBeInTheDocument()

      await user.click(incrementButton)
      expect(screen.getByText('Count: 2')).toBeInTheDocument()

      // Third increment should trigger error
      await user.click(incrementButton)

      // Should show error boundary
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Fix error condition and recover
      rerender(
        <TestErrorBoundary onError={mockOnError}>
          <ConcurrentStateComponent triggerError={false} />
        </TestErrorBoundary>
      )

      const tryAgainButton = screen.getByRole('button', { name: /try again/i })
      await user.click(tryAgainButton)

      // Should recover with reset state
      await waitFor(() => {
        expect(screen.getByText('Count: 0')).toBeInTheDocument()
      })

      // Verify state updates were properly tracked
      expect(stateUpdates).toContain('State update: 0')
      expect(stateUpdates).toContain('State update: 1')
      expect(stateUpdates).toContain('State update: 2')
    })
  })

  describe('Recovery Mechanisms and Performance Impact', () => {
    it('should have minimal performance impact during error recovery', async () => {
      const mockOnExitPerformance = vi.fn()
      
      performanceMonitor.start('error-recovery-performance')

      render(
        <TestErrorBoundary onError={mockOnError}>
          <PerformanceMode
            selectedSetlist={testSetlist}
            onExitPerformance={mockOnExitPerformance}
          />
        </TestErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Normal Song')).toBeInTheDocument()
      })

      // Simulate error condition and recovery
      const user = userEvent.setup()
      
      // Navigate to problematic content multiple times
      for (let i = 0; i < 3; i++) {
        await user.keyboard('{ArrowRight}')
        await waitFor(() => {
          expect(screen.getByText('Error Song')).toBeInTheDocument()
        })
        
        await user.keyboard('{ArrowLeft}')
        await waitFor(() => {
          expect(screen.getByText('Normal Song')).toBeInTheDocument()
        })
      }

      const recoveryDuration = performanceMonitor.end('error-recovery-performance')

      // Recovery should not significantly impact performance
      expect(recoveryDuration).toBeLessThan(2000)

      // Should maintain smooth navigation
      expect(mockOnExitPerformance).not.toHaveBeenCalled()
    })

    it('should provide helpful error information for debugging', async () => {
      const detailedError = new Error('Detailed component error')
      detailedError.stack = 'Error stack trace information'

      const { rerender } = render(
        <TestErrorBoundary onError={mockOnError}>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Detailed component error" />
        </TestErrorBoundary>
      )

      // Should show error boundary
      expect(screen.getByRole('alert')).toBeInTheDocument()

      // Should have called onError with detailed information
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Detailed component error'
        }),
        expect.objectContaining({
          componentStack: expect.stringContaining('ErrorThrowingComponent')
        })
      )

      // In development, should provide helpful error information
      expect(screen.getByText('Error: Detailed component error')).toBeInTheDocument()
    })
  })
})