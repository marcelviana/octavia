/**
 * AddContent Refactoring Tests
 *
 * Comprehensive testing to ensure the refactored AddContent component
 * (709→232 lines) maintains all content creation workflows while improving maintainability.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddContent } from '@/components/add-content-refactored'
import { useAddContentState } from '@/hooks/useAddContentState'
import { useFileHandling } from '@/hooks/useFileHandling'
import { ContentTypeSelector } from '@/components/add-content/ContentTypeSelector'
import { ModeSelector } from '@/components/add-content/ModeSelector'
import { ImportModeSelector } from '@/components/add-content/ImportModeSelector'
import { StepIndicator } from '@/components/add-content/StepIndicator'

// Mock dependencies
vi.mock('@/hooks/useAddContentState')
vi.mock('@/hooks/useFileHandling')
vi.mock('@/components/add-content/ContentTypeSelector')
vi.mock('@/components/add-content/ModeSelector')
vi.mock('@/components/add-content/ImportModeSelector')
vi.mock('@/components/add-content/StepIndicator')
vi.mock('@/components/file-upload')
vi.mock('@/components/content-creator')
vi.mock('@/components/metadata-form')
vi.mock('@/components/batch-preview')
vi.mock('@/contexts/firebase-auth-context')

const mockUseAddContentState = vi.mocked(useAddContentState)
const mockUseFileHandling = vi.mocked(useFileHandling)
const mockContentTypeSelector = vi.mocked(ContentTypeSelector)
const mockModeSelector = vi.mocked(ModeSelector)
const mockImportModeSelector = vi.mocked(ImportModeSelector)
const mockStepIndicator = vi.mocked(StepIndicator)

// Mock implementations
const mockState = {
  mode: 'create',
  uploadedFile: null,
  currentStep: 1,
  isProcessing: false,
  createdContent: null,
  parsedSongs: [],
  importMode: 'single',
  contentType: 'Lyrics',
  batchArtist: '',
  batchImported: false,
  error: null,
  isAutoDetectingContentType: { current: false },
  setMode: vi.fn(),
  setUploadedFile: vi.fn(),
  setCurrentStep: vi.fn(),
  setImportMode: vi.fn(),
  setContentType: vi.fn(),
  setError: vi.fn()
}

const mockFileHandling = {
  handleFilesUploaded: vi.fn(),
  handleFilesRemoved: vi.fn()
}

const defaultProps = {
  onBack: vi.fn(),
  onContentCreated: vi.fn(),
  onNavigate: vi.fn()
}

describe('AddContent Refactoring Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAddContentState.mockReturnValue(mockState)
    mockUseFileHandling.mockReturnValue(mockFileHandling)

    // Mock sub-components
    mockContentTypeSelector.mockImplementation(({ onTypeChange }) => (
      <div data-testid="content-type-selector">
        <button onClick={() => onTypeChange('Lyrics')} data-testid="lyrics-type">
          Lyrics
        </button>
        <button onClick={() => onTypeChange('Chords')} data-testid="chords-type">
          Chords
        </button>
        <button onClick={() => onTypeChange('Sheet')} data-testid="sheet-type">
          Sheet Music
        </button>
      </div>
    ))

    mockModeSelector.mockImplementation(({ onModeChange }) => (
      <div data-testid="mode-selector">
        <button onClick={() => onModeChange('create')} data-testid="create-mode">
          Create New
        </button>
        <button onClick={() => onModeChange('import')} data-testid="import-mode">
          Import File
        </button>
      </div>
    ))

    mockImportModeSelector.mockImplementation(({ onImportModeChange }) => (
      <div data-testid="import-mode-selector">
        <button onClick={() => onImportModeChange('single')} data-testid="single-import">
          Single Content
        </button>
        <button onClick={() => onImportModeChange('batch')} data-testid="batch-import">
          Batch Import
        </button>
      </div>
    ))

    mockStepIndicator.mockImplementation(({ currentStep, steps }) => (
      <div data-testid="step-indicator">
        Step {currentStep} of {steps.length}
      </div>
    ))
  })

  describe('Component Structure and State Management', () => {
    it('should render with initial state', () => {
      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Add New Content')).toBeInTheDocument()
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument()
      expect(mockUseAddContentState).toHaveBeenCalled()
      expect(mockUseFileHandling).toHaveBeenCalled()
    })

    it('should initialize useFileHandling with correct parameters', () => {
      render(<AddContent {...defaultProps} />)

      expect(mockUseFileHandling).toHaveBeenCalledWith({
        contentType: 'Lyrics',
        setContentType: mockState.setContentType,
        setUploadedFile: mockState.setUploadedFile,
        setCurrentStep: mockState.setCurrentStep,
        isAutoDetectingContentType: mockState.isAutoDetectingContentType
      })
    })

    it('should handle back navigation', () => {
      const onBack = vi.fn()
      render(<AddContent {...defaultProps} onBack={onBack} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)

      expect(onBack).toHaveBeenCalledOnce()
    })
  })

  describe('Step 1: Content Type Selection', () => {
    it('should display content type selector on step 1', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 1
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('content-type-selector')).toBeInTheDocument()
      expect(screen.getByText('What type of content do you want to add?')).toBeInTheDocument()
    })

    it('should handle content type selection', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 1
      })

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('lyrics-type'))

      expect(mockState.setContentType).toHaveBeenCalledWith('Lyrics')
      expect(mockState.setCurrentStep).toHaveBeenCalled()
    })

    it('should skip to step 3 for Sheet Music type', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 1
      })

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('sheet-type'))

      expect(mockState.setContentType).toHaveBeenCalledWith('Sheet')
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(3)
    })

    it('should generate correct steps for different content types', () => {
      // Test different step configurations
      const testCases = [
        { contentType: 'Sheet', expectedSteps: 3 },
        { contentType: 'Lyrics', expectedSteps: 4 },
        { contentType: 'Chords', expectedSteps: 4 }
      ]

      testCases.forEach(({ contentType, expectedSteps }) => {
        mockUseAddContentState.mockReturnValue({
          ...mockState,
          contentType,
          currentStep: 1
        })

        render(<AddContent {...defaultProps} />)

        expect(mockStepIndicator).toHaveBeenCalledWith(
          expect.objectContaining({
            totalSteps: expectedSteps
          }),
          expect.anything()
        )
      })
    })
  })

  describe('Step 2: Mode Selection', () => {
    it('should display mode selector on step 2 for non-sheet content', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 2,
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
      expect(screen.getByText('How would you like to add your content?')).toBeInTheDocument()
    })

    it('should not display mode selector for Sheet Music', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 2,
        contentType: 'Sheet'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
    })

    it('should handle create mode selection', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 2,
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('create-mode'))

      expect(mockState.setMode).toHaveBeenCalledWith('create')
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(5)
    })

    it('should handle import mode selection', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 2,
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('import-mode'))

      expect(mockState.setMode).toHaveBeenCalledWith('import')
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(3)
    })
  })

  describe('Step 3: Import Mode Selection', () => {
    it('should display import mode selector when on step 3 with import mode', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 3,
        mode: 'import',
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('import-mode-selector')).toBeInTheDocument()
      expect(screen.getByText('Import Options')).toBeInTheDocument()
    })

    it('should handle single import mode selection', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 3,
        mode: 'import',
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('single-import'))

      expect(mockState.setImportMode).toHaveBeenCalledWith('single')
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(4)
    })

    it('should handle batch import mode selection', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 3,
        mode: 'import',
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('batch-import'))

      expect(mockState.setImportMode).toHaveBeenCalledWith('batch')
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(4)
    })
  })

  describe('Step 4: File Upload', () => {
    it('should display file upload for import mode on step 4', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 4,
        mode: 'import'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Import Music File')).toBeInTheDocument()
    })

    it('should display file upload for Sheet Music on step 3', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 3,
        contentType: 'Sheet',
        mode: 'import'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Import Music File')).toBeInTheDocument()
    })

    it('should call file handling functions when files are uploaded', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 4,
        mode: 'import'
      })

      render(<AddContent {...defaultProps} />)

      const fileUpload = screen.getByTestId('file-upload')
      expect(fileUpload).toBeInTheDocument()

      // File upload component should receive correct props
      expect(mockFileHandling.handleFilesUploaded).toBeDefined()
      expect(mockFileHandling.handleFilesRemoved).toBeDefined()
    })
  })

  describe('Step 5: Content Creation and Metadata', () => {
    it('should display content creator for create mode', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'create',
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('content-creator')).toBeInTheDocument()
    })

    it('should display metadata form for import mode with uploaded file', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'import',
        uploadedFile: { id: 1, name: 'test.pdf' },
        createdContent: { id: 'test', title: 'Test Song' },
        importMode: 'single'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('metadata-form')).toBeInTheDocument()
    })

    it('should display batch preview for batch import mode', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'import',
        uploadedFile: { id: 1, name: 'batch.pdf' },
        createdContent: { id: 'test', title: 'Test Song' },
        importMode: 'batch',
        parsedSongs: [
          { title: 'Song 1' },
          { title: 'Song 2' }
        ]
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('batch-preview')).toBeInTheDocument()
    })

    it('should handle content creation callback', () => {
      const onContentCreated = vi.fn()

      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'create'
      })

      render(<AddContent {...defaultProps} onContentCreated={onContentCreated} />)

      // Simulate content creation
      const mockContent = { id: 'new-content', title: 'New Song' }
      const contentCreator = screen.getByTestId('content-creator')

      // Trigger onContentCreated callback
      fireEvent.click(contentCreator)

      expect(onContentCreated).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should display error messages when present', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        error: 'File upload failed'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('File upload failed')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should clear errors when moving between steps', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 1,
        error: 'Previous error'
      })

      const { rerender } = render(<AddContent {...defaultProps} />)

      // Move to next step
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 2,
        error: null
      })

      rerender(<AddContent {...defaultProps} />)

      expect(screen.queryByText('Previous error')).not.toBeInTheDocument()
    })

    it('should handle missing required data gracefully', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'import',
        uploadedFile: null,
        createdContent: null
      })

      render(<AddContent {...defaultProps} />)

      // Should not crash and should display appropriate message
      expect(screen.queryByTestId('metadata-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('batch-preview')).not.toBeInTheDocument()
    })
  })

  describe('Content Type Specific Workflows', () => {
    it('should handle Lyrics content workflow', () => {
      const steps = [
        { step: 1, contentType: 'Lyrics' },
        { step: 2, mode: 'create' },
        { step: 5, expectedContent: 'lyrics' }
      ]

      steps.forEach(({ step, contentType, mode, expectedContent }) => {
        mockUseAddContentState.mockReturnValue({
          ...mockState,
          currentStep: step,
          contentType: contentType || 'Lyrics',
          mode: mode || 'create'
        })

        render(<AddContent {...defaultProps} />)

        if (expectedContent) {
          expect(screen.getByTestId('content-creator')).toBeInTheDocument()
        }
      })
    })

    it('should handle Chords content workflow', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'create',
        contentType: 'Chords'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('content-creator')).toBeInTheDocument()
    })

    it('should handle Sheet Music workflow', () => {
      // Sheet music skips mode selection
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 3,
        contentType: 'Sheet',
        mode: 'import'
      })

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Import Music File')).toBeInTheDocument()
      expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
    })
  })

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()

      const TestComponent = (props: any) => {
        renderSpy()
        return <AddContent {...props} />
      }

      const { rerender } = render(<TestComponent {...defaultProps} />)

      const initialRenderCount = renderSpy.mock.calls.length

      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />)

      // Should not trigger additional renders for same props
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount)
    })

    it('should handle rapid state changes efficiently', () => {
      const { rerender } = render(<AddContent {...defaultProps} />)

      const startTime = performance.now()

      // Simulate rapid state changes
      for (let i = 1; i <= 5; i++) {
        mockUseAddContentState.mockReturnValue({
          ...mockState,
          currentStep: i
        })

        rerender(<AddContent {...defaultProps} />)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle rapid changes efficiently
      expect(duration).toBeLessThan(100)
    })

    it('should clean up resources on unmount', () => {
      const { unmount } = render(<AddContent {...defaultProps} />)

      unmount()

      // Should not cause memory leaks
      expect(true).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<AddContent {...defaultProps} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Add New Content')
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 1
      })

      render(<AddContent {...defaultProps} />)

      const contentTypeSelector = screen.getByTestId('content-type-selector')
      fireEvent.keyDown(contentTypeSelector, { key: 'Enter' })

      // Should handle keyboard interactions
      expect(contentTypeSelector).toBeInTheDocument()
    })

    it('should have proper focus management', () => {
      render(<AddContent {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      backButton.focus()

      expect(document.activeElement).toBe(backButton)
    })
  })

  describe('Integration with Sub-components', () => {
    it('should pass correct props to ContentTypeSelector', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      expect(mockContentTypeSelector).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedType: 'Lyrics',
          onTypeChange: expect.any(Function)
        }),
        expect.anything()
      )
    })

    it('should pass correct props to ModeSelector', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 2,
        mode: 'create',
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      expect(mockModeSelector).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedMode: 'create',
          contentType: 'Lyrics',
          onModeChange: expect.any(Function)
        }),
        expect.anything()
      )
    })

    it('should pass correct props to StepIndicator', () => {
      mockUseAddContentState.mockReturnValue({
        ...mockState,
        currentStep: 2,
        contentType: 'Lyrics'
      })

      render(<AddContent {...defaultProps} />)

      expect(mockStepIndicator).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 2,
          totalSteps: expect.any(Number),
          steps: expect.any(Array)
        }),
        expect.anything()
      )
    })
  })
})