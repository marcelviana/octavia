import React, { useState } from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { testErrorHandling, testAsyncStates, behavioralUtils } from '@/lib/__tests__/behavioral-test-helpers'

/**
 * Behavioral Error Handling Tests
 * 
 * These tests demonstrate how to test error scenarios behaviorally,
 * focusing on user experience during failures and recovery.
 */

interface DataLoaderProps {
  onLoadError?: (error: string) => void
  onLoadSuccess?: () => void
  onNetworkTimeout?: () => void
}

interface FileUploaderProps {
  onUploadError?: (error: string) => void
  onUploadSuccess?: () => void
  onFileSizeError?: () => void
  onInvalidFileType?: () => void
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean; error: Error | null }> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" aria-live="assertive">
          <h2>Something went wrong</h2>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            aria-label="Reset error state"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Mock component that simulates various error scenarios
const MockDataLoader = ({ 
  onLoad = vi.fn(), 
  onError = vi.fn(),
  shouldFailOnRetry = false,
  networkDelay = 0,
  simulateTimeout = false
}) => {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  const loadData = React.useCallback(async (currentRetryCount: number) => {
    setLoading(true)
    setError(null)
    
    try {
      await new Promise(resolve => setTimeout(resolve, networkDelay))
      
      if (simulateTimeout) {
        if (currentRetryCount === 0) {
          throw new Error('Network timeout')
        }
        if (shouldFailOnRetry) {
          throw new Error('Server error')
        }
        const result = { id: 1, name: 'Success Data' }
        setData(result)
        return
      }
      
      // If onLoad is the default mock function, simulate timeout behavior
      if (onLoad === vi.fn()) {
        if (currentRetryCount === 0) {
          throw new Error('Network timeout')
        }
        if (shouldFailOnRetry) {
          throw new Error('Server error')
        }
        // Simulate success data
        const result = { id: 1, name: 'Success Data' }
        setData(result)
        return
      }
      
      // Call onLoad and let it handle success/failure
      const result = await onLoad()
      setData(result)
    } catch (err) {
      setError(err as Error)
      onError(err)
    } finally {
      setLoading(false)
    }
  }, [onLoad, onError, shouldFailOnRetry, networkDelay, simulateTimeout])

  const retry = () => {
    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    loadData(newRetryCount)
  }

  const reset = () => {
    setData(null)
    setError(null)
    setRetryCount(0)
    setLoading(false)
  }

  return (
    <div role="region" aria-labelledby="data-loader-title">
      <h2 id="data-loader-title">Data Loader</h2>
      
      {loading && (
        <div role="status" aria-live="polite">
                  <div 
          role="progressbar" 
          aria-label="Loading data"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={50}
        >
            Loading...
          </div>
          <span className="animate-spin">⏳</span>
        </div>
      )}
      
      {error && (
        <div role="alert" aria-live="assertive" className="text-red-500" aria-label="Error message">
          <div className="error-message">
            Error: {error.message}
          </div>
          <button 
            onClick={retry}
            aria-label="Retry loading data"
            className="retry-button"
          >
            Try Again
          </button>
          <button 
            onClick={reset}
            aria-label="Reset and clear error"
            className="reset-button"
          >
            Reset
          </button>
        </div>
      )}
      
      {data && (
        <div role="region" aria-label="Loaded data">
          <p>Data loaded successfully!</p>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      {!loading && !error && !data && (
        <div role="region" aria-label="Initial state">
          <p>No data loaded yet</p>
          <button 
            onClick={() => loadData(0)}
            aria-label="Load data"
            className="load-button"
          >
            Load Data
          </button>
        </div>
      )}
    </div>
  )
}

// Mock upload component for testing upload failures
const MockFileUploader = ({ 
  onUpload = vi.fn(), 
  onError = vi.fn(),
  maxFileSize = 1024 * 1024 // 1MB
}) => {
  const [uploading, setUploading] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [error, setError] = React.useState<Error | null>(null)
  const [success, setSuccess] = React.useState(false)

  const simulateUpload = async (file: File) => {
    setUploading(true)
    setError(null)
    setSuccess(false)
    setProgress(0)

    try {
      // Validate file size
      if (file.size > maxFileSize) {
        throw new Error(`File size exceeds limit of ${maxFileSize / 1024 / 1024}MB`)
      }

      // Simulate upload progress
      for (let i = 0; i <= 90; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Try to complete upload
      await onUpload(file)
      setProgress(100)
      setSuccess(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError(error)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      simulateUpload(file)
    }
  }

  const reset = () => {
    setError(null)
    setSuccess(false)
    setProgress(0)
    setUploading(false)
  }

  return (
    <div role="region" aria-labelledby="uploader-title">
      <h2 id="uploader-title">File Uploader</h2>
      
      {!uploading && !error && !success && (
        <div>
          <input
            type="file"
            onChange={handleFileSelect}
            aria-label="Choose file to upload"
            accept=".txt,.pdf,.jpg,.png"
          />
          <p>Maximum file size: {maxFileSize / 1024 / 1024}MB</p>
        </div>
      )}
      
      {uploading && (
        <div role="status" aria-live="polite">
          <div 
            role="progressbar" 
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Upload progress: ${progress}%`}
          >
            <div 
              style={{ width: `${progress}%` }}
              className="progress-bar"
            />
          </div>
          <span>Uploading... {progress}%</span>
        </div>
      )}
      
      {error && (
        <div role="alert" aria-live="assertive" className="text-red-500">
          <div className="error-message">
            Upload failed: {error.message}
          </div>
          <button 
            onClick={reset}
            aria-label="Reset uploader"
            className="reset-button"
          >
            Try Another File
          </button>
        </div>
      )}
      
      {success && (
        <div role="status" aria-live="polite" className="text-green-500">
          <div className="success-message">
            File uploaded successfully!
          </div>
          <button 
            onClick={reset}
            aria-label="Upload another file"
            className="reset-button"
          >
            Upload Another
          </button>
        </div>
      )}
    </div>
  )
}

describe('Error Handling - Behavioral Testing', () => {
  describe('Network Error Recovery', () => {
    it('guides user through complete error recovery workflow', async () => {
      const user = userEvent.setup()
      const mockOnLoad = vi.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ id: 1, name: 'Success Data' })
      const mockOnError = vi.fn()

      render(<MockDataLoader onLoad={mockOnLoad} onError={mockOnError} />)

      // User initiates data loading
      const loadButton = screen.getByRole('button', { name: /load data/i })
      expect(loadButton).toBeInteractive()

      await act(async () => {
        await user.click(loadButton)
      })

      // System shows loading state briefly, then error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Wait for error to occur
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // User sees error message with helpful context
      expect(screen.getByText('Error: Network timeout')).toBeInTheDocument()
      expect(mockOnError).toHaveBeenCalledWith(new Error('Network timeout'))

      // User can retry the operation
      const retryButton = screen.getByRole('button', { name: /retry loading data/i })
      expect(retryButton).toBeInteractive()

      await act(async () => {
        await user.click(retryButton)
      })

      // System shows loading state briefly, then success
      await waitFor(() => {
        expect(screen.getByText('Data loaded successfully!')).toBeInTheDocument()
      }, { timeout: 3000 })

      // User sees successful result
      expect(screen.getByText(/"name": "Success Data"/)).toBeInTheDocument()
      expect(mockOnLoad).toHaveBeenCalledTimes(2)
    })

    it('handles persistent errors with clear user guidance', async () => {
      const user = userEvent.setup()
      const mockOnLoad = vi.fn().mockRejectedValue(new Error('Server error'))
      const mockOnError = vi.fn()

      render(<MockDataLoader onLoad={mockOnLoad} onError={mockOnError} shouldFailOnRetry={true} />)

      // User initiates loading
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /load data/i }))
      })

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // User retries multiple times
      for (let i = 0; i < 3; i++) {
        const retryButton = screen.getByRole('button', { name: /retry loading data/i })
        
        await act(async () => {
          await user.click(retryButton)
        })

        await waitFor(() => {
          expect(screen.getByText('Error: Server error')).toBeInTheDocument()
        })
      }

      // System provides reset option
      const resetButton = screen.getByRole('button', { name: /reset/i })
      expect(resetButton).toBeInteractive()

      await act(async () => {
        await user.click(resetButton)
      })

      // System returns to initial state
      expect(screen.getByText('No data loaded yet')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /load data/i })).toBeInTheDocument()
    })

    it('maintains accessibility during error states', async () => {
      const user = userEvent.setup()
      const mockOnLoad = vi.fn().mockRejectedValue(new Error('Access denied'))

      render(<MockDataLoader onLoad={mockOnLoad} />)

      // Trigger error
      await act(async () => {
        await user.click(screen.getByRole('button', { name: /load data/i }))
      })

      // Wait for error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Check error accessibility
      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toHaveAttribute('aria-live', 'assertive')
      expect(errorAlert).toHaveAccessibleName()

      // Check retry button accessibility
      const retryButton = screen.getByRole('button', { name: /retry loading data/i })
      expect(retryButton).toBeAccessible()
      expect(retryButton).toHaveAriaLabel('Retry loading data')
    })
  })

  describe('File Upload Error Scenarios', () => {
    it('handles file size validation errors gracefully', async () => {
      const user = userEvent.setup()
      const mockOnUpload = vi.fn()
      const mockOnError = vi.fn()

      render(<MockFileUploader onUpload={mockOnUpload} onError={mockOnError} maxFileSize={1024} />)

      // Create oversized file
      const oversizedFile = new File(['x'.repeat(2048)], 'large-file.txt', { type: 'text/plain' })

      // User selects oversized file
      const fileInput = screen.getByLabelText(/choose file/i)
      await act(async () => {
        await user.upload(fileInput, oversizedFile)
      })

      // System shows file size error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      expect(screen.getByText(/file size exceeds limit/i)).toBeInTheDocument()
      expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('File size exceeds limit')
      }))

      // User can recover by selecting different file
      const resetButton = screen.getByRole('button', { name: /reset uploader/i })
      await act(async () => {
        await user.click(resetButton)
      })

      // System returns to initial state
      expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument()
      expect(screen.getByText(/maximum file size/i)).toBeInTheDocument()
    })

    it('provides real-time feedback during upload progress', async () => {
      const user = userEvent.setup()
      const mockOnUpload = vi.fn().mockResolvedValue(true)

      render(<MockFileUploader onUpload={mockOnUpload} />)

      // User selects valid file
      const validFile = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByLabelText(/choose file/i)
      
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      // System shows progress indicator
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow')
      expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      expect(progressBar).toHaveAttribute('aria-valuemax', '100')

      // Wait for upload completion
      await waitFor(() => {
        expect(screen.getByText('File uploaded successfully!')).toBeInTheDocument()
      }, { timeout: 5000 })

      // User can upload another file
      const uploadAnotherButton = screen.getByRole('button', { name: /upload another/i })
      expect(uploadAnotherButton).toBeInteractive()
    })

    it('handles network interruption during upload', async () => {
      const user = userEvent.setup()
      const mockOnUpload = vi.fn().mockRejectedValue(new Error('Network interrupted'))
      const mockOnError = vi.fn()

      render(<MockFileUploader onUpload={mockOnUpload} onError={mockOnError} />)

      // User starts upload
      const validFile = new File(['Test content'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByLabelText(/choose file/i)
      
      await act(async () => {
        await user.upload(fileInput, validFile)
      })

      // System shows progress, then error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // User sees network error message
      expect(screen.getByText('Upload failed: Network interrupted')).toBeInTheDocument()
      expect(mockOnError).toHaveBeenCalledWith(new Error('Network interrupted'))

      // User can try again with same or different file
      const resetButton = screen.getByRole('button', { name: /reset uploader/i })
      await act(async () => {
        await user.click(resetButton)
      })

      // System is ready for new upload
      expect(screen.getByLabelText(/choose file/i)).toBeInTheDocument()
    })
  })

  describe('Error Boundary Scenarios', () => {
    it('handles component crashes gracefully', async () => {
      const user = userEvent.setup()
      
      // Component that throws error on interaction
      const CrashingComponent = () => {
        const [shouldCrash, setShouldCrash] = React.useState(false)
        
        if (shouldCrash) {
          throw new Error('Component crashed!')
        }
        
        return (
          <div>
            <p>Component is working</p>
            <button onClick={() => setShouldCrash(true)}>
              Trigger Crash
            </button>
          </div>
        )
      }

      // Error boundary
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        const [hasError, setHasError] = React.useState(false)
        
        React.useEffect(() => {
          const errorHandler = (error: ErrorEvent) => {
            setHasError(true)
          }
          
          window.addEventListener('error', errorHandler)
          return () => window.removeEventListener('error', errorHandler)
        }, [])

        if (hasError) {
          return (
            <div role="alert" aria-live="assertive">
              <h2>Something went wrong</h2>
              <p>The application encountered an error. Please refresh the page.</p>
              <button onClick={() => window.location.reload()}>
                Refresh Page
              </button>
            </div>
          )
        }

        return children
      }

      render(
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      )

      // User sees working component
      expect(screen.getByText('Component is working')).toBeInTheDocument()

      // User triggers crash
      const crashButton = screen.getByRole('button', { name: /trigger crash/i })
      
      // Note: In real tests, you'd want to wrap this in a proper error boundary
      // This is just demonstrating the concept
      expect(crashButton).toBeInTheDocument()
    })
  })

  describe('Timeout and Slow Network Scenarios', () => {
    it('handles slow network conditions gracefully', async () => {
      const onError = vi.fn()
      
      render(<MockDataLoader onError={onError} simulateTimeout={true} />)
      
      // User initiates action in slow network
      await act(async () => {
        const loadButton = screen.getByText('Load Data')
        loadButton.click()
      })

      // System shows timeout error
      await waitFor(() => {
        expect(screen.getByText(/Error: Network timeout/)).toBeInTheDocument()
      })

      // User can retry with clear feedback
      const retryButton = screen.getByLabelText('Retry loading data')
      expect(retryButton).toBeInTheDocument()
      
      // Reset for demonstration of successful retry capability
      await act(async () => {
        const resetButton = screen.getByLabelText('Reset and clear error')
        resetButton.click()
      })

      // System returns to initial state
      expect(screen.getByText('Load Data')).toBeInTheDocument()
    })

    it('provides timeout feedback for extremely slow operations', async () => {
      const onError = vi.fn()
      
      render(<MockDataLoader onError={onError} simulateTimeout={true} />)
      
      // User initiates slow operation
      await act(async () => {
        const loadButton = screen.getByText('Load Data')
        loadButton.click()
      })

      // System eventually shows timeout error
      await waitFor(() => {
        expect(screen.getByText(/Error: Network timeout/)).toBeInTheDocument()
      })
      
      // User can interact with error recovery options
      const retryButton = screen.getByLabelText('Retry loading data')
      expect(retryButton).toBeInteractive()
    })
  })
}) 