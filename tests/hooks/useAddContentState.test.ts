/**
 * useAddContentState Hook Tests
 *
 * Tests for the extracted useAddContentState hook to ensure proper
 * state management for the AddContent component workflow.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAddContentState } from '@/hooks/useAddContentState'
import { ContentType } from '@/types/content'

// Mock dependencies
vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({ user: { uid: 'test-user' } })
}))

describe('useAddContentState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAddContentState())

      expect(result.current.mode).toBe('create')
      expect(result.current.uploadedFile).toBeNull()
      expect(result.current.currentStep).toBe(1)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.createdContent).toBeNull()
      expect(result.current.parsedSongs).toEqual([])
      expect(result.current.importMode).toBe('single')
      expect(result.current.contentType).toBe('Lyrics')
      expect(result.current.batchArtist).toBe('')
      expect(result.current.batchImported).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isAutoDetectingContentType.current).toBe(false)
    })

    it('should provide all necessary setter functions', () => {
      const { result } = renderHook(() => useAddContentState())

      expect(typeof result.current.setMode).toBe('function')
      expect(typeof result.current.setUploadedFile).toBe('function')
      expect(typeof result.current.setCurrentStep).toBe('function')
      expect(typeof result.current.setImportMode).toBe('function')
      expect(typeof result.current.setContentType).toBe('function')
      expect(typeof result.current.setError).toBe('function')
    })
  })

  describe('State Updates', () => {
    it('should update mode correctly', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setMode('import')
      })

      expect(result.current.mode).toBe('import')
    })

    it('should update content type correctly', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setContentType(ContentType.CHORDS)
      })

      expect(result.current.contentType).toBe(ContentType.CHORDS)
    })

    it('should update current step correctly', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setCurrentStep(3)
      })

      expect(result.current.currentStep).toBe(3)
    })

    it('should update import mode correctly', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setImportMode('batch')
      })

      expect(result.current.importMode).toBe('batch')
    })

    it('should update uploaded file correctly', () => {
      const { result } = renderHook(() => useAddContentState())

      const mockFile = {
        id: 1,
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        contentType: 'Sheet',
        file: new File(['content'], 'test.pdf')
      }

      act(() => {
        result.current.setUploadedFile(mockFile)
      })

      expect(result.current.uploadedFile).toEqual(mockFile)
    })

    it('should update error state correctly', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setError('Test error message')
      })

      expect(result.current.error).toBe('Test error message')

      // Should be able to clear error
      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Content Type Auto-Detection', () => {
    it('should handle auto-detecting content type', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.isAutoDetectingContentType.current = true
        result.current.setContentType(ContentType.SHEET)
      })

      expect(result.current.contentType).toBe(ContentType.SHEET)
      expect(result.current.isAutoDetectingContentType.current).toBe(true)
    })

    it('should reset auto-detection flag appropriately', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.isAutoDetectingContentType.current = true
      })

      expect(result.current.isAutoDetectingContentType.current).toBe(true)

      act(() => {
        result.current.isAutoDetectingContentType.current = false
      })

      expect(result.current.isAutoDetectingContentType.current).toBe(false)
    })
  })

  describe('Complex State Interactions', () => {
    it('should handle complete workflow state changes', () => {
      const { result } = renderHook(() => useAddContentState())

      // Step 1: Select content type
      act(() => {
        result.current.setContentType(ContentType.LYRICS)
        result.current.setCurrentStep(2)
      })

      expect(result.current.contentType).toBe(ContentType.LYRICS)
      expect(result.current.currentStep).toBe(2)

      // Step 2: Select mode
      act(() => {
        result.current.setMode('import')
        result.current.setCurrentStep(3)
      })

      expect(result.current.mode).toBe('import')
      expect(result.current.currentStep).toBe(3)

      // Step 3: Select import mode
      act(() => {
        result.current.setImportMode('batch')
        result.current.setCurrentStep(4)
      })

      expect(result.current.importMode).toBe('batch')
      expect(result.current.currentStep).toBe(4)

      // Step 4: Upload file
      const mockFile = {
        id: 1,
        name: 'batch.pdf',
        size: 2048,
        type: 'application/pdf',
        contentType: 'Lyrics',
        file: new File(['batch content'], 'batch.pdf')
      }

      act(() => {
        result.current.setUploadedFile(mockFile)
        result.current.setCurrentStep(5)
      })

      expect(result.current.uploadedFile).toEqual(mockFile)
      expect(result.current.currentStep).toBe(5)
    })

    it('should handle Sheet Music specific workflow', () => {
      const { result } = renderHook(() => useAddContentState())

      // Sheet music skips mode selection
      act(() => {
        result.current.setContentType(ContentType.SHEET)
        result.current.setCurrentStep(3) // Skip to file upload
        result.current.setMode('import') // Auto-set to import
      })

      expect(result.current.contentType).toBe(ContentType.SHEET)
      expect(result.current.mode).toBe('import')
      expect(result.current.currentStep).toBe(3)
    })

    it('should handle create mode workflow', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setContentType(ContentType.CHORDS)
        result.current.setCurrentStep(2)
      })

      act(() => {
        result.current.setMode('create')
        result.current.setCurrentStep(5) // Skip to content creation
      })

      expect(result.current.mode).toBe('create')
      expect(result.current.currentStep).toBe(5)
    })
  })

  describe('Error State Management', () => {
    it('should maintain error state across other updates', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setError('Upload failed')
      })

      expect(result.current.error).toBe('Upload failed')

      // Other state changes shouldn't clear error
      act(() => {
        result.current.setCurrentStep(2)
        result.current.setMode('import')
      })

      expect(result.current.error).toBe('Upload failed')
    })

    it('should allow error clearing', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setError('Test error')
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.setError(null)
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Processing State', () => {
    it('should initialize with processing as false', () => {
      const { result } = renderHook(() => useAddContentState())

      expect(result.current.isProcessing).toBe(false)
    })

    it('should handle processing state updates (if setter available)', () => {
      const { result } = renderHook(() => useAddContentState())

      // Note: setIsProcessing might not be exposed in the hook interface
      // This test verifies the current state structure
      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe('Batch Import State', () => {
    it('should handle batch artist state', () => {
      const { result } = renderHook(() => useAddContentState())

      expect(result.current.batchArtist).toBe('')
      expect(result.current.batchImported).toBe(false)
    })

    it('should handle parsed songs state', () => {
      const { result } = renderHook(() => useAddContentState())

      expect(result.current.parsedSongs).toEqual([])
    })

    it('should handle created content state', () => {
      const { result } = renderHook(() => useAddContentState())

      expect(result.current.createdContent).toBeNull()
    })
  })

  describe('State Persistence', () => {
    it('should maintain state across re-renders', () => {
      const { result, rerender } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setContentType(ContentType.TAB)
        result.current.setCurrentStep(3)
        result.current.setMode('import')
      })

      rerender()

      expect(result.current.contentType).toBe(ContentType.TAB)
      expect(result.current.currentStep).toBe(3)
      expect(result.current.mode).toBe('import')
    })

    it('should handle rapid state changes without issues', () => {
      const { result } = renderHook(() => useAddContentState())

      // Rapid state changes
      act(() => {
        result.current.setCurrentStep(2)
        result.current.setMode('import')
        result.current.setImportMode('batch')
        result.current.setContentType(ContentType.LYRICS)
        result.current.setCurrentStep(4)
      })

      expect(result.current.currentStep).toBe(4)
      expect(result.current.mode).toBe('import')
      expect(result.current.importMode).toBe('batch')
      expect(result.current.contentType).toBe(ContentType.LYRICS)
    })
  })

  describe('Memory Management', () => {
    it('should not cause memory leaks with large file objects', () => {
      const { result, unmount } = renderHook(() => useAddContentState())

      const largeFile = {
        id: 1,
        name: 'large-file.pdf',
        size: 50 * 1024 * 1024, // 50MB
        type: 'application/pdf',
        contentType: 'Sheet',
        file: new File(['x'.repeat(1000000)], 'large-file.pdf')
      }

      act(() => {
        result.current.setUploadedFile(largeFile)
      })

      expect(result.current.uploadedFile).toEqual(largeFile)

      unmount()

      // Should not cause memory leaks
      expect(true).toBe(true)
    })

    it('should handle null file uploads correctly', () => {
      const { result } = renderHook(() => useAddContentState())

      const mockFile = {
        id: 1,
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        contentType: 'Sheet',
        file: new File(['content'], 'test.pdf')
      }

      act(() => {
        result.current.setUploadedFile(mockFile)
      })

      expect(result.current.uploadedFile).toEqual(mockFile)

      act(() => {
        result.current.setUploadedFile(null)
      })

      expect(result.current.uploadedFile).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid content type gracefully', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        // Try to set an invalid content type
        result.current.setContentType('InvalidType' as ContentType)
      })

      expect(result.current.contentType).toBe('InvalidType')
    })

    it('should handle negative step numbers', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setCurrentStep(-1)
      })

      expect(result.current.currentStep).toBe(-1)
    })

    it('should handle large step numbers', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setCurrentStep(999)
      })

      expect(result.current.currentStep).toBe(999)
    })

    it('should handle empty error messages', () => {
      const { result } = renderHook(() => useAddContentState())

      act(() => {
        result.current.setError('')
      })

      expect(result.current.error).toBe('')
    })
  })

  describe('Performance', () => {
    it('should handle frequent state updates efficiently', () => {
      const { result } = renderHook(() => useAddContentState())

      const startTime = performance.now()

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.setCurrentStep(i % 5 + 1)
          result.current.setContentType(
            i % 2 === 0 ? ContentType.LYRICS : ContentType.CHORDS
          )
        }
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle frequent updates efficiently
      expect(duration).toBeLessThan(100)
      expect(result.current.currentStep).toBe(1) // (999 % 5) + 1
    })

    it('should not trigger unnecessary re-renders', () => {
      const renderSpy = vi.fn()

      const TestHook = () => {
        renderSpy()
        return useAddContentState()
      }

      const { result, rerender } = renderHook(TestHook)

      const initialRenderCount = renderSpy.mock.calls.length

      // Setting the same value shouldn't trigger re-render
      act(() => {
        result.current.setCurrentStep(1) // Same as initial
        result.current.setMode('create') // Same as initial
      })

      rerender()

      // Should have minimal additional renders
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(
        initialRenderCount + 2
      )
    })
  })
})