/**
 * Tests for Refactored AddContent Component
 * 
 * Tests the refactored add content component that uses the new domain-driven architecture,
 * including content creation workflow, file handling, and state management integration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddContent } from '@/components/add-content-refactored'
import { ContentType } from '@/types/content'
import { createContent } from '@/lib/content-service'
import { 
  renderWithStore, 
  mockContentItem, 
  mockUploadedFile,
  mockFile 
} from '../utils/test-utils'

// Mock external dependencies
vi.mock('@/lib/content-service')
vi.mock('@/lib/batch-import')
vi.mock('@/contexts/firebase-auth-context')
vi.mock('@/domains/shared/components/DomainErrorBoundary', () => ({
  DomainErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}))

// Mock child components
vi.mock('@/components/file-upload', () => ({
  FileUpload: ({ onFilesUploaded, onFilesRemoved }: any) => (
    <div data-testid="file-upload">
      <button onClick={() => onFilesUploaded([mockUploadedFile])}>Upload File</button>
      <button onClick={() => onFilesRemoved()}>Remove File</button>
    </div>
  )
}))

vi.mock('@/components/content-creator', () => ({
  ContentCreator: ({ onContentCreated }: any) => (
    <div data-testid="content-creator">
      <button onClick={() => onContentCreated({
        title: 'Manual Content',
        type: ContentType.LYRICS,
        content: { lyrics: 'Test lyrics' }
      })}>Create Content</button>
    </div>
  )
}))

vi.mock('@/components/metadata-form', () => ({
  MetadataForm: ({ onComplete }: any) => (
    <div data-testid="metadata-form">
      <button onClick={() => onComplete(mockContentItem)}>Complete Metadata</button>
    </div>
  )
}))

vi.mock('@/components/batch-preview', () => ({
  BatchPreview: ({ onComplete }: any) => (
    <div data-testid="batch-preview">
      <button onClick={() => onComplete([mockContentItem])}>Complete Batch</button>
    </div>
  )
}))

const mockCreateContent = vi.mocked(createContent)

// Mock auth context
const mockAuthContext = {
  user: { uid: 'test-user' },
  loading: false,
  error: null,
}

vi.mocked(require('@/contexts/firebase-auth-context').useAuth).mockReturnValue(mockAuthContext)

describe('AddContent (Refactored)', () => {
  const mockOnBack = vi.fn()
  const mockOnContentCreated = vi.fn()
  const mockOnNavigate = vi.fn()

  const defaultProps = {
    onBack: mockOnBack,
    onContentCreated: mockOnContentCreated,
    onNavigate: mockOnNavigate,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateContent.mockResolvedValue(mockContentItem)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('step 1 - content selection', () => {
    it('should render initial content type selection', () => {
      renderWithStore(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
      expect(screen.getByText(/Add Content/i)).toBeInTheDocument()
      expect(screen.getByText(/Select Content Type/i)).toBeInTheDocument()
      
      // Should show all content types
      expect(screen.getByText('Lyrics')).toBeInTheDocument()
      expect(screen.getByText('Chords')).toBeInTheDocument()
      expect(screen.getByText('Guitar Tab')).toBeInTheDocument()
      expect(screen.getByText('Sheet Music')).toBeInTheDocument()
    })

    it('should show creation mode selector for non-sheet music types', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Lyrics should be selected by default
      expect(screen.getByText(/Choose How to Add/i)).toBeInTheDocument()
      expect(screen.getByText('Create Manually')).toBeInTheDocument()
      expect(screen.getByText('Import From File')).toBeInTheDocument()
    })

    it('should not show creation mode selector for sheet music', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Select sheet music
      const sheetMusicButton = screen.getByText('Sheet Music')
      await user.click(sheetMusicButton)

      expect(screen.queryByText(/Choose How to Add/i)).not.toBeInTheDocument()
    })

    it('should show step indicator', () => {
      renderWithStore(<AddContent {...defaultProps} />)

      expect(screen.getByText('Add Content')).toBeInTheDocument()
      expect(screen.getByText('Add Details')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('should show back button that calls onBack', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      expect(mockOnBack).toHaveBeenCalled()
    })
  })

  describe('content type selection', () => {
    it('should select different content types', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Select chords
      const chordsButton = screen.getByText('Chords')
      await user.click(chordsButton)

      // Should show creation mode options
      expect(screen.getByText(/Choose How to Add/i)).toBeInTheDocument()
    })

    it('should auto-switch to import mode for sheet music', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      const sheetMusicButton = screen.getByText('Sheet Music')
      await user.click(sheetMusicButton)

      // Should show file upload immediately
      expect(screen.getByTestId('file-upload')).toBeInTheDocument()
      expect(screen.queryByText(/Choose How to Add/i)).not.toBeInTheDocument()
    })
  })

  describe('create mode workflow', () => {
    it('should show content creator in create mode', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Create mode should be selected by default
      expect(screen.getByTestId('content-creator')).toBeInTheDocument()
    })

    it('should progress to step 2 when content is created manually', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      // Should advance to step 2
      await waitFor(() => {
        expect(screen.getByText('Add Content Details')).toBeInTheDocument()
        expect(screen.getByTestId('metadata-form')).toBeInTheDocument()
      })
    })
  })

  describe('import mode workflow', () => {
    it('should switch to import mode when selected', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      const importButton = screen.getByText('Import From File')
      await user.click(importButton)

      expect(screen.getByTestId('file-upload')).toBeInTheDocument()
      expect(screen.queryByTestId('content-creator')).not.toBeInTheDocument()
    })

    it('should show import options after file upload', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Switch to import mode
      const importButton = screen.getByText('Import From File')
      await user.click(importButton)

      // Upload a file
      const uploadButton = screen.getByText('Upload File')
      await user.click(uploadButton)

      expect(screen.getByText('Import Options')).toBeInTheDocument()
      expect(screen.getByText('Single Content')).toBeInTheDocument()
      expect(screen.getByText('Batch Import')).toBeInTheDocument()
    })

    it('should auto-detect sheet music from image files', async () => {
      const user = userEvent.setup()
      
      // Mock file upload with image file
      vi.mocked(require('@/components/file-upload').FileUpload).mockImplementation(({ onFilesUploaded }: any) => (
        <button onClick={() => onFilesUploaded([{
          ...mockUploadedFile,
          name: 'sheet-music.png',
          type: 'image/png'
        }])}>Upload Image</button>
      ))

      renderWithStore(<AddContent {...defaultProps} />)

      const uploadButton = screen.getByText('Upload Image')
      await user.click(uploadButton)

      // Should auto-advance to step 2 for sheet music
      await waitFor(() => {
        expect(screen.getByText('Add Content Details')).toBeInTheDocument()
      })
    })

    it('should handle single import flow', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Switch to import and upload file
      const importButton = screen.getByText('Import From File')
      await user.click(importButton)
      const uploadButton = screen.getByText('Upload File')
      await user.click(uploadButton)

      // Select single import and proceed
      const singleImportButton = screen.getByText('Single Content')
      await user.click(singleImportButton)
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      // Should advance to metadata form
      await waitFor(() => {
        expect(screen.getByTestId('metadata-form')).toBeInTheDocument()
      })
    })

    it('should handle batch import flow', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Switch to import and upload file
      const importButton = screen.getByText('Import From File')
      await user.click(importButton)
      const uploadButton = screen.getByText('Upload File')
      await user.click(uploadButton)

      // Select batch import
      const batchImportButton = screen.getByText('Batch Import')
      await user.click(batchImportButton)

      // Add artist name
      const artistInput = screen.getByLabelText(/artist name/i)
      await user.type(artistInput, 'Test Artist')

      // Proceed
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      // Should show batch preview
      await waitFor(() => {
        expect(screen.getByTestId('batch-preview')).toBeInTheDocument()
      })
    })
  })

  describe('step 2 - content details', () => {
    it('should show metadata form for single content', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Create content to advance to step 2
      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Add Content Details')).toBeInTheDocument()
        expect(screen.getByTestId('metadata-form')).toBeInTheDocument()
      })
    })

    it('should show batch preview for batch import', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Go through batch import flow
      const importButton = screen.getByText('Import From File')
      await user.click(importButton)
      const uploadButton = screen.getByText('Upload File')
      await user.click(uploadButton)
      const batchImportButton = screen.getByText('Batch Import')
      await user.click(batchImportButton)
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByTestId('batch-preview')).toBeInTheDocument()
      })
    })

    it('should show processing state during operations', async () => {
      const user = userEvent.setup()
      
      // Mock slow metadata completion
      vi.mocked(require('@/components/metadata-form').MetadataForm).mockImplementation(({ onComplete }: any) => (
        <button onClick={() => {
          // Simulate async operation
          setTimeout(() => onComplete(mockContentItem), 100)
        }}>Complete Metadata</button>
      ))

      renderWithStore(<AddContent {...defaultProps} />)

      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      await waitFor(() => {
        const completeButton = screen.getByText('Complete Metadata')
        user.click(completeButton)
      })

      // Should show processing state
      expect(screen.getByText('Processing Content...')).toBeInTheDocument()
    })

    it('should handle back navigation from step 2', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Advance to step 2
      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        user.click(backButton)
      })

      // Should return to step 1
      await waitFor(() => {
        expect(screen.getByText('Select Content Type')).toBeInTheDocument()
      })
    })
  })

  describe('step 3 - completion', () => {
    it('should show success screen after metadata completion', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Complete the workflow
      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      await waitFor(async () => {
        const completeButton = screen.getByText('Complete Metadata')
        await user.click(completeButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Done! Your music is now part of your library/i)).toBeInTheDocument()
        expect(screen.getByText('Go to Library')).toBeInTheDocument()
        expect(screen.getByText(/Add More Music/i)).toBeInTheDocument()
      })
    })

    it('should show success screen after batch completion', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Go through batch import flow
      const importButton = screen.getByText('Import From File')
      await user.click(importButton)
      const uploadButton = screen.getByText('Upload File')
      await user.click(uploadButton)
      const batchImportButton = screen.getByText('Batch Import')
      await user.click(batchImportButton)
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      await waitFor(async () => {
        const completeButton = screen.getByText('Complete Batch')
        await user.click(completeButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/All songs were successfully added/i)).toBeInTheDocument()
      })
    })

    it('should navigate when action buttons are clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Complete workflow to get to success screen
      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      await waitFor(async () => {
        const completeButton = screen.getByText('Complete Metadata')
        await user.click(completeButton)
      })

      await waitFor(async () => {
        const libraryButton = screen.getByText('Go to Library')
        await user.click(libraryButton)
      })

      expect(mockOnNavigate).toHaveBeenCalledWith('library')
    })
  })

  describe('error handling', () => {
    it('should display error messages', () => {
      const initialState = {
        ui: {
          errors: {
            global: null,
            operations: { 'create-content': 'Creation failed' }
          }
        }
      }
      
      renderWithStore(<AddContent {...defaultProps} />, { initialState })

      expect(screen.getByText('Creation failed')).toBeInTheDocument()
    })

    it('should handle content creation errors', async () => {
      const user = userEvent.setup()
      mockCreateContent.mockRejectedValue(new Error('Creation failed'))
      
      // Mock metadata form to trigger creation
      vi.mocked(require('@/components/metadata-form').MetadataForm).mockImplementation(({ onComplete }: any) => (
        <button onClick={() => {
          throw new Error('Creation failed')
        }}>Complete Metadata</button>
      ))

      renderWithStore(<AddContent {...defaultProps} />)

      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      await waitFor(() => {
        const completeButton = screen.getByText('Complete Metadata')
        expect(() => user.click(completeButton)).toThrow()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithStore(<AddContent {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /add content/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      // Should be able to tab through content type options
      await user.tab()
      expect(document.activeElement).toHaveAttribute('role', 'button')
    })
  })

  describe('state management integration', () => {
    it('should update centralized state when content is created', async () => {
      const user = userEvent.setup()
      renderWithStore(<AddContent {...defaultProps} />)

      const createButton = screen.getByText('Create Content')
      await user.click(createButton)

      await waitFor(async () => {
        const completeButton = screen.getByText('Complete Metadata')
        await user.click(completeButton)
      })

      // Should call onContentCreated with the created content
      await waitFor(() => {
        expect(mockOnContentCreated).toHaveBeenCalledWith(mockContentItem)
      })
    })

    it('should show notifications through centralized system', async () => {
      const user = userEvent.setup()
      const initialState = {
        ui: {
          notifications: [
            { id: '1', type: 'success', message: 'Content created successfully', timestamp: Date.now() }
          ]
        }
      }
      
      renderWithStore(<AddContent {...defaultProps} />, { initialState })

      expect(screen.getByText('Content created successfully')).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('should adapt for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      })

      renderWithStore(<AddContent {...defaultProps} />)

      // Should still render all essential elements on mobile
      expect(screen.getByText('Add Content')).toBeInTheDocument()
      expect(screen.getByText('Select Content Type')).toBeInTheDocument()
    })
  })
})