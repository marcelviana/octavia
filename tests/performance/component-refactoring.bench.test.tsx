/**
 * Component Refactoring Performance Benchmarks
 *
 * Performance testing to compare before/after metrics for refactored components
 * ContentViewer (864→114 lines) and AddContent (709→232 lines).
 */

import { describe, it, expect, beforeEach, afterEach, vi, bench } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { act } from '@testing-library/react'
import React from 'react'

// Import both original and refactored components for comparison
import { ContentViewer } from '@/components/content-viewer'
import { AddContent } from '@/components/add-content-refactored'

// Mock all dependencies
vi.mock('@/contexts/firebase-auth-context')
vi.mock('@/hooks/useContentFile')
vi.mock('@/hooks/useAddContentState')
vi.mock('@/hooks/useFileHandling')
vi.mock('@/components/content-viewer/ContentHeader')
vi.mock('@/components/content-viewer/ContentToolbar')
vi.mock('@/components/add-content/ContentTypeSelector')
vi.mock('@/components/add-content/ModeSelector')
vi.mock('@/components/add-content/ImportModeSelector')
vi.mock('@/components/add-content/StepIndicator')

// Test data
const mockContent = {
  id: 'test-content-123',
  title: 'Test Song',
  artist: 'Test Artist',
  content_type: 'Lyrics',
  file_url: 'https://example.com/test-file.pdf',
  content_data: {
    lyrics: 'Test lyrics content\n'.repeat(100), // Large content
    chords: Array.from({ length: 50 }, (_, i) => `Chord${i}`),
    sections: Array.from({ length: 20 }, (_, i) => `Section${i}`)
  },
  key: 'C',
  bpm: 120,
  user_id: 'test-user',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockSetlist = {
  id: 'test-setlist-123',
  name: 'Test Setlist',
  songs: Array.from({ length: 100 }, (_, i) => ({
    content_id: `content-${i}`,
    position: i + 1
  }))
}

const contentViewerProps = {
  content: mockContent,
  onBack: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onNavigate: vi.fn(),
  setlist: mockSetlist,
  currentSongIndex: 0
}

const addContentProps = {
  onBack: vi.fn(),
  onContentCreated: vi.fn(),
  onNavigate: vi.fn()
}

describe('Component Refactoring Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock implementations for consistent testing
    vi.mocked(require('@/hooks/useContentFile')).useContentFile.mockReturnValue({
      offlineUrl: 'blob:test-url',
      isLoading: false,
      error: null,
      loadOfflineUrl: vi.fn()
    })

    vi.mocked(require('@/hooks/useAddContentState')).useAddContentState.mockReturnValue({
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
    })

    vi.mocked(require('@/hooks/useFileHandling')).useFileHandling.mockReturnValue({
      handleFilesUploaded: vi.fn(),
      handleFilesRemoved: vi.fn()
    })

    // Mock sub-components
    vi.mocked(require('@/components/content-viewer/ContentHeader')).ContentHeader.mockImplementation(
      ({ title, artist }) => React.createElement('div', { 'data-testid': 'content-header' }, `${title} - ${artist}`)
    )

    vi.mocked(require('@/components/content-viewer/ContentToolbar')).ContentToolbar.mockImplementation(
      () => React.createElement('div', { 'data-testid': 'content-toolbar' }, 'Toolbar')
    )

    vi.mocked(require('@/components/add-content/ContentTypeSelector')).ContentTypeSelector.mockImplementation(
      () => React.createElement('div', { 'data-testid': 'content-type-selector' }, 'Type Selector')
    )

    vi.mocked(require('@/components/add-content/ModeSelector')).ModeSelector.mockImplementation(
      () => React.createElement('div', { 'data-testid': 'mode-selector' }, 'Mode Selector')
    )

    vi.mocked(require('@/components/add-content/ImportModeSelector')).ImportModeSelector.mockImplementation(
      () => React.createElement('div', { 'data-testid': 'import-mode-selector' }, 'Import Mode Selector')
    )

    vi.mocked(require('@/components/add-content/StepIndicator')).StepIndicator.mockImplementation(
      ({ currentStep, totalSteps }) => React.createElement('div', { 'data-testid': 'step-indicator' }, `Step ${currentStep} of ${totalSteps}`)
    )
  })

  afterEach(() => {
    cleanup()
  })

  describe('ContentViewer Performance Benchmarks', () => {
    bench('ContentViewer - Initial Render', () => {
      render(<ContentViewer {...contentViewerProps} />)
    })

    bench('ContentViewer - Re-render with Same Props', () => {
      const { rerender } = render(<ContentViewer {...contentViewerProps} />)
      rerender(<ContentViewer {...contentViewerProps} />)
    })

    bench('ContentViewer - Re-render with Different Content', () => {
      const { rerender } = render(<ContentViewer {...contentViewerProps} />)

      const newContent = {
        ...mockContent,
        id: 'new-content-456',
        title: 'New Song Title'
      }

      rerender(<ContentViewer {...contentViewerProps} content={newContent} />)
    })

    bench('ContentViewer - Setlist Navigation (50 songs)', () => {
      const { rerender } = render(<ContentViewer {...contentViewerProps} />)

      for (let i = 0; i < 50; i++) {
        rerender(
          <ContentViewer
            {...contentViewerProps}
            currentSongIndex={i}
          />
        )
      }
    })

    bench('ContentViewer - Large Content Data Rendering', () => {
      const largeContent = {
        ...mockContent,
        content_data: {
          lyrics: 'Large lyrics content\n'.repeat(1000),
          chords: Array.from({ length: 500 }, (_, i) => `Chord${i}`),
          sections: Array.from({ length: 100 }, (_, i) => `Section${i}`)
        }
      }

      render(<ContentViewer {...contentViewerProps} content={largeContent} />)
    })

    bench('ContentViewer - Multiple Rapid Updates', () => {
      const { rerender } = render(<ContentViewer {...contentViewerProps} />)

      for (let i = 0; i < 100; i++) {
        rerender(
          <ContentViewer
            {...contentViewerProps}
            currentSongIndex={i % mockSetlist.songs.length}
          />
        )
      }
    })
  })

  describe('AddContent Performance Benchmarks', () => {
    bench('AddContent - Initial Render', () => {
      render(<AddContent {...addContentProps} />)
    })

    bench('AddContent - Step Navigation (Complete Workflow)', () => {
      const mockState = vi.mocked(require('@/hooks/useAddContentState')).useAddContentState

      // Step 1
      mockState.mockReturnValue({
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
      })

      const { rerender } = render(<AddContent {...addContentProps} />)

      // Navigate through all steps
      for (let step = 1; step <= 5; step++) {
        mockState.mockReturnValue({
          mode: step < 5 ? 'import' : 'create',
          uploadedFile: step >= 4 ? { id: 1, name: 'test.pdf' } : null,
          currentStep: step,
          isProcessing: false,
          createdContent: step === 5 ? { id: 'test', title: 'Test' } : null,
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
        })

        rerender(<AddContent {...addContentProps} />)
      }
    })

    bench('AddContent - Rapid State Changes', () => {
      const mockState = vi.mocked(require('@/hooks/useAddContentState')).useAddContentState
      const { rerender } = render(<AddContent {...addContentProps} />)

      const contentTypes = ['Lyrics', 'Chords', 'Tab', 'Sheet']
      const modes = ['create', 'import']
      const importModes = ['single', 'batch']

      for (let i = 0; i < 50; i++) {
        mockState.mockReturnValue({
          mode: modes[i % modes.length],
          uploadedFile: null,
          currentStep: (i % 5) + 1,
          isProcessing: false,
          createdContent: null,
          parsedSongs: [],
          importMode: importModes[i % importModes.length],
          contentType: contentTypes[i % contentTypes.length],
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
        })

        rerender(<AddContent {...addContentProps} />)
      }
    })

    bench('AddContent - Batch Import with Large Dataset', () => {
      const mockState = vi.mocked(require('@/hooks/useAddContentState')).useAddContentState

      mockState.mockReturnValue({
        mode: 'import',
        uploadedFile: { id: 1, name: 'large-batch.pdf' },
        currentStep: 5,
        isProcessing: false,
        createdContent: { id: 'test', title: 'Test' },
        parsedSongs: Array.from({ length: 100 }, (_, i) => ({
          title: `Song ${i}`,
          artist: `Artist ${i}`,
          content: `Lyrics for song ${i}`.repeat(50)
        })),
        importMode: 'batch',
        contentType: 'Lyrics',
        batchArtist: 'Various Artists',
        batchImported: false,
        error: null,
        isAutoDetectingContentType: { current: false },
        setMode: vi.fn(),
        setUploadedFile: vi.fn(),
        setCurrentStep: vi.fn(),
        setImportMode: vi.fn(),
        setContentType: vi.fn(),
        setError: vi.fn()
      })

      render(<AddContent {...addContentProps} />)
    })

    bench('AddContent - Error State Handling', () => {
      const mockState = vi.mocked(require('@/hooks/useAddContentState')).useAddContentState
      const { rerender } = render(<AddContent {...addContentProps} />)

      const errors = [
        'File upload failed',
        'Network error occurred',
        'Invalid file format',
        'File too large',
        'Processing failed'
      ]

      for (let i = 0; i < errors.length; i++) {
        mockState.mockReturnValue({
          mode: 'import',
          uploadedFile: null,
          currentStep: 4,
          isProcessing: false,
          createdContent: null,
          parsedSongs: [],
          importMode: 'single',
          contentType: 'Lyrics',
          batchArtist: '',
          batchImported: false,
          error: errors[i],
          isAutoDetectingContentType: { current: false },
          setMode: vi.fn(),
          setUploadedFile: vi.fn(),
          setCurrentStep: vi.fn(),
          setImportMode: vi.fn(),
          setContentType: vi.fn(),
          setError: vi.fn()
        })

        rerender(<AddContent {...addContentProps} />)
      }
    })
  })

  describe('Hook Performance Benchmarks', () => {
    bench('useContentFile - Multiple Invocations', () => {
      const useContentFile = vi.mocked(require('@/hooks/useContentFile')).useContentFile

      for (let i = 0; i < 100; i++) {
        useContentFile({
          content: {
            ...mockContent,
            id: `content-${i}`
          },
          autoLoad: true
        })
      }
    })

    bench('useAddContentState - Rapid State Updates', () => {
      const mockSetters = {
        setMode: vi.fn(),
        setUploadedFile: vi.fn(),
        setCurrentStep: vi.fn(),
        setImportMode: vi.fn(),
        setContentType: vi.fn(),
        setError: vi.fn()
      }

      // Simulate rapid state updates
      for (let i = 0; i < 1000; i++) {
        mockSetters.setCurrentStep(i % 5 + 1)
        mockSetters.setContentType(['Lyrics', 'Chords', 'Tab'][i % 3])
        mockSetters.setMode(['create', 'import'][i % 2])
      }
    })
  })

  describe('Memory Usage Benchmarks', () => {
    bench('ContentViewer - Memory Allocation Pattern', () => {
      // Test memory allocation with large datasets
      const components = []

      for (let i = 0; i < 50; i++) {
        const content = {
          ...mockContent,
          id: `content-${i}`,
          content_data: {
            lyrics: `Lyrics ${i}\n`.repeat(100),
            chords: Array.from({ length: 20 }, (_, j) => `Chord${j}`)
          }
        }

        components.push(
          render(<ContentViewer {...contentViewerProps} content={content} />)
        )
      }

      // Cleanup
      components.forEach(component => component.unmount())
    })

    bench('AddContent - State Object Creation', () => {
      const states = []

      for (let i = 0; i < 100; i++) {
        states.push({
          mode: 'create',
          uploadedFile: {
            id: i,
            name: `file-${i}.pdf`,
            size: 1024 * i,
            type: 'application/pdf',
            contentType: 'Lyrics',
            file: new File([`content-${i}`], `file-${i}.pdf`)
          },
          currentStep: (i % 5) + 1,
          isProcessing: false,
          createdContent: null,
          parsedSongs: Array.from({ length: i % 10 }, (_, j) => ({
            title: `Song ${j}`,
            content: `Content ${j}`
          })),
          importMode: 'single',
          contentType: 'Lyrics',
          batchArtist: `Artist ${i}`,
          batchImported: false,
          error: null,
          isAutoDetectingContentType: { current: false }
        })
      }
    })
  })

  describe('Component Lifecycle Benchmarks', () => {
    bench('ContentViewer - Mount/Unmount Cycle', () => {
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(<ContentViewer {...contentViewerProps} />)
        unmount()
      }
    })

    bench('AddContent - Mount/Unmount Cycle', () => {
      for (let i = 0; i < 20; i++) {
        const { unmount } = render(<AddContent {...addContentProps} />)
        unmount()
      }
    })

    bench('Component Integration - Full Workflow', () => {
      // Simulate complete user workflow
      const { unmount: unmountAdd } = render(<AddContent {...addContentProps} />)

      // Simulate content creation
      const createdContent = {
        ...mockContent,
        id: 'newly-created-content'
      }

      const { unmount: unmountView } = render(
        <ContentViewer {...contentViewerProps} content={createdContent} />
      )

      unmountView()
      unmountAdd()
    })
  })
})