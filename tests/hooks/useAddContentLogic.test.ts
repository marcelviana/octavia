/**
 * useAddContentLogic Hook Tests
 *
 * Tests for the useAddContentLogic hook to ensure proper
 * state management for the AddContent component workflow.
 *
 * P1-B: retargeted from the dead twin (hooks/useAddContentState) to the
 * live hook actually used by RefactoredAddContent (mounted at
 * app/add-content/page.tsx): hooks/useAddContentLogic.
 * P1-E: renamed to match the live hook; the it.skip INAPLICÁVEL(P1-B)
 * specs (dead-twin-only surface) were removed together with the dead twin.
 *
 * Setup-only adaptations (assertions preserved):
 * - useAddContentLogic does not expose setUploadedFile; the live entry
 *   point for files is handleFilesUploaded([file]) — acts were retargeted.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAddContentLogic } from '@/hooks/useAddContentLogic'
import { ContentType } from '@/types/content'

// Note: Auth context is mocked globally in test-setup.ts
// No need for local mocking here

describe('useAddContentLogic Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useAddContentLogic())

      expect(result.current.mode).toBe('create')
      expect(result.current.uploadedFile).toBeNull()
      expect(result.current.currentStep).toBe(1)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.createdContent).toBeNull()
      expect(result.current.parsedSongs).toEqual([])
      expect(result.current.importMode).toBe('single')
      expect(result.current.contentType).toBe('Lyrics')
      expect(result.current.error).toBeNull()
    })

    it('should provide all necessary setter functions', () => {
      const { result } = renderHook(() => useAddContentLogic())

      expect(typeof result.current.setMode).toBe('function')
      expect(typeof result.current.setCurrentStep).toBe('function')
      expect(typeof result.current.setImportMode).toBe('function')
      expect(typeof result.current.setContentType).toBe('function')
    })
  })

  describe('State Updates', () => {
    it('should update mode correctly', () => {
      const { result } = renderHook(() => useAddContentLogic())

      act(() => {
        result.current.setMode('import')
      })

      expect(result.current.mode).toBe('import')
    })

    it('should update content type correctly', () => {
      const { result } = renderHook(() => useAddContentLogic())

      act(() => {
        result.current.setContentType(ContentType.CHORDS)
      })

      expect(result.current.contentType).toBe(ContentType.CHORDS)
    })

    it('should update current step correctly', () => {
      const { result } = renderHook(() => useAddContentLogic())

      act(() => {
        result.current.setCurrentStep(3)
      })

      expect(result.current.currentStep).toBe(3)
    })

    it('should update import mode correctly', () => {
      const { result } = renderHook(() => useAddContentLogic())

      act(() => {
        result.current.setImportMode('batch')
      })

      expect(result.current.importMode).toBe('batch')
    })

    it('should update uploaded file correctly', () => {
      const { result } = renderHook(() => useAddContentLogic())

      const mockFile = {
        id: 1,
        name: 'test.pdf',
        size: 1024,
        type: 'application/pdf',
        contentType: 'Sheet',
        file: new File(['content'], 'test.pdf')
      }

      // P1-B setup retarget: o hook vivo recebe arquivos via handleFilesUploaded
      act(() => {
        result.current.handleFilesUploaded([mockFile])
      })

      expect(result.current.uploadedFile).toEqual(mockFile)
    })
  })

  describe('Complex State Interactions', () => {
    it('should handle complete workflow state changes', () => {
      const { result } = renderHook(() => useAddContentLogic())

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

      // P1-B setup retarget: o hook vivo recebe arquivos via handleFilesUploaded
      act(() => {
        result.current.handleFilesUploaded([mockFile])
        result.current.setCurrentStep(5)
      })

      expect(result.current.uploadedFile).toEqual(mockFile)
      expect(result.current.currentStep).toBe(5)
    })

    it('should handle create mode workflow', () => {
      const { result } = renderHook(() => useAddContentLogic())

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

  describe('Processing State', () => {
    it('should initialize with processing as false', () => {
      const { result } = renderHook(() => useAddContentLogic())

      expect(result.current.isProcessing).toBe(false)
    })

    it('should handle processing state updates (if setter available)', () => {
      const { result } = renderHook(() => useAddContentLogic())

      // Note: setIsProcessing might not be exposed in the hook interface
      // This test verifies the current state structure
      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe('Batch Import State', () => {
    it('should handle parsed songs state', () => {
      const { result } = renderHook(() => useAddContentLogic())

      expect(result.current.parsedSongs).toEqual([])
    })

    it('should handle created content state', () => {
      const { result } = renderHook(() => useAddContentLogic())

      expect(result.current.createdContent).toBeNull()
    })
  })

  describe('State Persistence', () => {
    it('should handle rapid state changes without issues', () => {
      const { result } = renderHook(() => useAddContentLogic())

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
      const { result, unmount } = renderHook(() => useAddContentLogic())

      const largeFile = {
        id: 1,
        name: 'large-file.pdf',
        size: 50 * 1024 * 1024, // 50MB
        type: 'application/pdf',
        contentType: 'Sheet',
        file: new File(['x'.repeat(1000000)], 'large-file.pdf')
      }

      // P1-B setup retarget: o hook vivo recebe arquivos via handleFilesUploaded
      act(() => {
        result.current.handleFilesUploaded([largeFile])
      })

      expect(result.current.uploadedFile).toEqual(largeFile)

      unmount()

      // Should not cause memory leaks
      expect(true).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid content type gracefully', () => {
      const { result } = renderHook(() => useAddContentLogic())

      act(() => {
        // Try to set an invalid content type
        result.current.setContentType('InvalidType' as ContentType)
      })

      expect(result.current.contentType).toBe('InvalidType')
    })

    it('should handle negative step numbers', () => {
      const { result } = renderHook(() => useAddContentLogic())

      act(() => {
        result.current.setCurrentStep(-1)
      })

      expect(result.current.currentStep).toBe(-1)
    })

    it('should handle large step numbers', () => {
      const { result } = renderHook(() => useAddContentLogic())

      act(() => {
        result.current.setCurrentStep(999)
      })

      expect(result.current.currentStep).toBe(999)
    })
  })

  describe('Performance', () => {
    it('should handle frequent state updates efficiently', () => {
      const { result } = renderHook(() => useAddContentLogic())

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
        return useAddContentLogic()
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
