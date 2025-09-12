/**
 * Tests for useContentCreation Hook
 * 
 * Tests the business logic for content creation workflow, including file handling,
 * state management, and error scenarios.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useContentCreation } from '@/domains/content-management/hooks/use-content-creation'
import { ContentType } from '@/types/content'
import { createContent } from '@/lib/content-service'
import { parseDocxFile, parsePdfFile, parseTextFile } from '@/lib/batch-import'
import { 
  mockContentItem, 
  mockAppStore, 
  mockUploadedFile,
  mockFile,
  TestWrapper 
} from '../utils/test-utils'

// Mock external dependencies
vi.mock('@/lib/content-service')
vi.mock('@/lib/batch-import')
vi.mock('@/contexts/firebase-auth-context')
vi.mock('@/domains/shared/state-management/app-store')

const mockCreateContent = vi.mocked(createContent)
const mockParseDocxFile = vi.mocked(parseDocxFile)
const mockParsePdfFile = vi.mocked(parsePdfFile)
const mockParseTextFile = vi.mocked(parseTextFile)

// Mock auth context
const mockAuthContext = {
  user: { uid: 'test-user' },
  loading: false,
  error: null,
}

vi.mocked(require('@/contexts/firebase-auth-context').useAuth).mockReturnValue(mockAuthContext)

describe('useContentCreation', () => {
  const mockOnContentCreated = vi.fn()
  let mockStore: ReturnType<typeof mockAppStore>

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockStore = mockAppStore()
    
    // Setup default mock responses
    mockCreateContent.mockResolvedValue(mockContentItem)
    mockParseTextFile.mockResolvedValue([
      { title: 'Parsed Song 1', content: 'Lyrics for song 1' },
      { title: 'Parsed Song 2', content: 'Lyrics for song 2' },
    ])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      expect(result.current.mode).toBe('create')
      expect(result.current.currentStep).toBe(1)
      expect(result.current.contentType).toBe(ContentType.LYRICS)
      expect(result.current.importMode).toBe('single')
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.isParsing).toBe(false)
      expect(result.current.uploadedFile).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should set mode to import for sheet music content type', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.setContentType(ContentType.SHEET)
      })

      expect(result.current.mode).toBe('import')
      expect(result.current.importMode).toBe('single')
    })
  })

  describe('content type changes', () => {
    it('should reset state when content type changes', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      // Set some state
      act(() => {
        result.current.setCurrentStep(2)
        result.current.handleFilesUploaded([mockUploadedFile])
        result.current.setBatchArtist('Test Artist')
      })

      // Change content type
      act(() => {
        result.current.setContentType(ContentType.CHORDS)
      })

      // State should be reset
      expect(result.current.currentStep).toBe(1)
      expect(result.current.uploadedFile).toBeNull()
      expect(result.current.batchArtist).toBe('')
      expect(result.current.error).toBeNull()
    })
  })

  describe('file upload handling', () => {
    it('should handle file upload correctly', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleFilesUploaded([mockUploadedFile])
      })

      expect(result.current.uploadedFile).toEqual({
        ...mockUploadedFile,
        contentType: ContentType.LYRICS,
      })
    })

    it('should auto-detect sheet music from image files', () => {
      const imageFile = {
        ...mockUploadedFile,
        name: 'sheet-music.png',
        type: 'image/png',
      }

      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleFilesUploaded([imageFile])
      })

      expect(result.current.contentType).toBe(ContentType.SHEET)
      expect(result.current.currentStep).toBe(2)
      expect(result.current.uploadedFile?.contentType).toBe(ContentType.SHEET)
    })

    it('should advance to step 2 for sheet music uploads', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.setContentType(ContentType.SHEET)
        result.current.handleFilesUploaded([mockUploadedFile])
      })

      expect(result.current.currentStep).toBe(2)
    })

    it('should handle file removal', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleFilesUploaded([mockUploadedFile])
        result.current.handleFilesRemoved()
      })

      expect(result.current.uploadedFile).toBeNull()
    })
  })

  describe('import workflow', () => {
    it('should handle single import mode correctly', async () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      const textImportFile = {
        ...mockUploadedFile,
        isTextImport: true,
        parsedTitle: 'Parsed Song Title',
        textBody: 'Parsed lyrics content',
      }

      act(() => {
        result.current.handleFilesUploaded([textImportFile])
      })

      await act(async () => {
        await result.current.handleImportNext()
      })

      expect(result.current.currentStep).toBe(2)
      expect(result.current.createdContent).toEqual({
        title: 'Parsed Song Title',
        type: ContentType.LYRICS,
        content: { lyrics: 'Parsed lyrics content' },
      })
    })

    it('should handle batch import mode correctly', async () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleFilesUploaded([mockUploadedFile])
        result.current.setImportMode('batch')
        result.current.setBatchArtist('Test Artist')
      })

      await act(async () => {
        await result.current.handleImportNext()
      })

      expect(mockParseTextFile).toHaveBeenCalledWith(mockUploadedFile.file)
      expect(result.current.parsedSongs).toHaveLength(2)
      expect(result.current.parsedSongs[0].artist).toBe('Test Artist')
      expect(result.current.currentStep).toBe(2)
    })

    it('should handle different file types for parsing', async () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      const docxFile = {
        ...mockUploadedFile,
        name: 'songs.docx',
        file: new File(['content'], 'songs.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      }

      act(() => {
        result.current.handleFilesUploaded([docxFile])
        result.current.setImportMode('batch')
      })

      await act(async () => {
        await result.current.handleImportNext()
      })

      expect(mockParseDocxFile).toHaveBeenCalledWith(docxFile.file)
    })

    it('should handle parsing errors gracefully', async () => {
      mockParseTextFile.mockRejectedValue(new Error('Parsing failed'))

      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleFilesUploaded([mockUploadedFile])
        result.current.setImportMode('batch')
      })

      await act(async () => {
        await result.current.handleImportNext()
      })

      expect(result.current.isParsing).toBe(false)
      // Error handling would depend on implementation
    })
  })

  describe('content creation workflow', () => {
    it('should handle content created from manual creation', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      const draftContent = {
        title: 'New Song',
        type: ContentType.LYRICS,
        content: { lyrics: 'Song lyrics' },
      }

      act(() => {
        result.current.handleContentCreated(draftContent)
      })

      expect(result.current.createdContent).toBe(draftContent)
      expect(result.current.currentStep).toBe(2)
    })

    it('should handle metadata completion successfully', async () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      await act(async () => {
        await result.current.handleMetadataComplete(mockContentItem)
      })

      expect(mockStore.addContent).toHaveBeenCalledWith(mockContentItem)
      expect(mockStore.addNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Content saved successfully',
      })
      expect(result.current.currentStep).toBe(3)
      expect(result.current.createdContent).toBe(mockContentItem)
    })

    it('should handle metadata completion errors', async () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      const invalidContent = { ...mockContentItem, id: undefined }

      await act(async () => {
        await result.current.handleMetadataComplete(invalidContent)
      })

      expect(result.current.error).toBe('Failed to save content. Please try again.')
      expect(result.current.currentStep).toBe(1)
      expect(mockStore.addNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to save content',
      })
    })

    it('should handle batch preview completion', () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      const batchContents = [mockContentItem]

      act(() => {
        result.current.handleBatchPreviewComplete(batchContents)
      })

      expect(result.current.batchImported).toBe(true)
      expect(result.current.currentStep).toBe(3)
    })
  })

  describe('finish workflow', () => {
    it('should finish successfully with existing content', async () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleContentCreated({
          title: 'Test',
          type: ContentType.LYRICS,
          content: {},
          id: 'existing-id',
        })
      })

      await act(async () => {
        await result.current.handleFinish()
      })

      expect(mockOnContentCreated).toHaveBeenCalledWith(result.current.createdContent)
    })

    it('should create new content when finishing', async () => {
      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleContentCreated({
          title: 'New Content',
          type: ContentType.LYRICS,
          content: { lyrics: 'Test lyrics' },
        })
      })

      await act(async () => {
        await result.current.handleFinish()
      })

      expect(mockCreateContent).toHaveBeenCalledWith({
        user_id: 'test-user',
        title: 'New Content',
        content_type: ContentType.LYRICS,
        content_data: { lyrics: 'Test lyrics' },
        file_url: null,
        is_favorite: false,
        is_public: false,
      })
      expect(mockStore.addContent).toHaveBeenCalledWith(mockContentItem)
      expect(mockStore.addNotification).toHaveBeenCalledWith({
        type: 'success',
        message: 'Content created successfully',
      })
      expect(mockOnContentCreated).toHaveBeenCalledWith(mockContentItem)
    })

    it('should handle finish errors gracefully', async () => {
      mockCreateContent.mockRejectedValue(new Error('Creation failed'))

      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      act(() => {
        result.current.handleContentCreated({
          title: 'Test',
          type: ContentType.LYRICS,
          content: {},
        })
      })

      await act(async () => {
        await result.current.handleFinish()
      })

      expect(result.current.error).toBe('Creation failed')
      expect(mockStore.addNotification).toHaveBeenCalledWith({
        type: 'error',
        message: 'Failed to create content',
      })
      expect(mockStore.setOperationLoading).toHaveBeenCalledWith('create-content', false)
    })

    it('should handle unauthenticated user errors', async () => {
      // Mock unauthenticated state
      vi.mocked(require('@/contexts/firebase-auth-context').useAuth).mockReturnValue({
        user: null,
        loading: false,
        error: null,
      })

      const { result } = renderHook(
        () => useContentCreation({ onContentCreated: mockOnContentCreated }),
        { wrapper: TestWrapper }
      )

      await act(async () => {
        await result.current.handleFinish()
      })

      expect(result.current.error).toBe('User not authenticated')
    })
  })
})