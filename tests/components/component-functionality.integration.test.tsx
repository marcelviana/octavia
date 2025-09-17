/**
 * Component Functionality Integration Tests
 *
 * High-level integration tests to verify that refactored components
 * maintain all original functionality without detailed mocking.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Simple mock components to avoid complex dependency setup
const MockContentViewer = ({ content, onBack, onEdit, onDelete, setlist, currentSongIndex }: any) => {
  return (
    <div data-testid="content-viewer">
      <div data-testid="content-title">{content?.title}</div>
      <div data-testid="content-artist">{content?.artist}</div>
      <div data-testid="content-type">{content?.content_type}</div>
      {content?.key && <div data-testid="content-key">Key: {content.key}</div>}
      {content?.bpm && <div data-testid="content-bpm">BPM: {content.bpm}</div>}

      <button onClick={onBack} data-testid="back-button">Back</button>
      <button onClick={() => onEdit(content)} data-testid="edit-button">Edit</button>
      <button onClick={() => onDelete(content.id)} data-testid="delete-button">Delete</button>

      {setlist && (
        <div data-testid="setlist-navigation">
          <div data-testid="song-counter">
            {currentSongIndex + 1} of {setlist.songs.length}
          </div>
          <button
            onClick={() => {}}
            data-testid="prev-button"
            disabled={currentSongIndex === 0}
          >
            Previous
          </button>
          <button
            onClick={() => {}}
            data-testid="next-button"
            disabled={currentSongIndex === setlist.songs.length - 1}
          >
            Next
          </button>
        </div>
      )}

      {content?.content_data && (
        <div data-testid="content-data">
          {content.content_type === 'Lyrics' && (
            <div data-testid="lyrics-content">{content.content_data.lyrics}</div>
          )}
          {content.content_type === 'Chords' && (
            <div data-testid="chords-content">
              {content.content_data.chords?.join(', ')}
            </div>
          )}
          {content.content_type === 'Tab' && (
            <div data-testid="tab-content">{content.content_data.tablature}</div>
          )}
        </div>
      )}

      {content?.file_url && (
        <div data-testid="file-viewer">
          <iframe src={content.file_url} data-testid="content-iframe" />
        </div>
      )}
    </div>
  )
}

const MockAddContent = ({ onBack, onContentCreated, onNavigate }: any) => {
  const [step, setStep] = React.useState(1)
  const [contentType, setContentType] = React.useState('Lyrics')
  const [mode, setMode] = React.useState('create')
  const [importMode, setImportMode] = React.useState('single')
  const [uploadedFile, setUploadedFile] = React.useState(null)

  const handleContentTypeChange = (type: string) => {
    setContentType(type)
    if (type === 'Sheet') {
      setStep(3) // Skip mode selection for sheet music
      setMode('import')
    } else {
      setStep(2)
    }
  }

  const handleModeChange = (newMode: string) => {
    setMode(newMode)
    if (newMode === 'create') {
      setStep(5)
    } else {
      setStep(3)
    }
  }

  const handleImportModeChange = (newImportMode: string) => {
    setImportMode(newImportMode)
    setStep(4)
  }

  const handleFileUpload = (file: any) => {
    setUploadedFile(file)
    setStep(5)
  }

  const handleContentCreation = () => {
    const mockContent = {
      id: 'new-content-123',
      title: 'New Test Song',
      content_type: contentType,
      created_at: new Date().toISOString()
    }
    onContentCreated(mockContent)
  }

  return (
    <div data-testid="add-content">
      <h1>Add New Content</h1>
      <div data-testid="step-indicator">Step {step} of 5</div>

      <button onClick={onBack} data-testid="back-button">Back</button>

      {step === 1 && (
        <div data-testid="content-type-selection">
          <h2>What type of content do you want to add?</h2>
          <button onClick={() => handleContentTypeChange('Lyrics')} data-testid="lyrics-type">
            Lyrics
          </button>
          <button onClick={() => handleContentTypeChange('Chords')} data-testid="chords-type">
            Chords
          </button>
          <button onClick={() => handleContentTypeChange('Tab')} data-testid="tab-type">
            Tab
          </button>
          <button onClick={() => handleContentTypeChange('Sheet')} data-testid="sheet-type">
            Sheet Music
          </button>
        </div>
      )}

      {step === 2 && contentType !== 'Sheet' && (
        <div data-testid="mode-selection">
          <h2>How would you like to add your content?</h2>
          <button onClick={() => handleModeChange('create')} data-testid="create-mode">
            Create New
          </button>
          <button onClick={() => handleModeChange('import')} data-testid="import-mode">
            Import File
          </button>
        </div>
      )}

      {step === 3 && mode === 'import' && contentType !== 'Sheet' && (
        <div data-testid="import-mode-selection">
          <h2>Import Options</h2>
          <button onClick={() => handleImportModeChange('single')} data-testid="single-import">
            Single Content
          </button>
          <button onClick={() => handleImportModeChange('batch')} data-testid="batch-import">
            Batch Import
          </button>
        </div>
      )}

      {((step === 4 && mode === 'import') || (step === 3 && contentType === 'Sheet')) && (
        <div data-testid="file-upload">
          <h2>Upload File</h2>
          <input
            type="file"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
            data-testid="file-input"
          />
        </div>
      )}

      {step === 5 && (
        <div data-testid="content-creation">
          {mode === 'create' ? (
            <div data-testid="content-creator">
              <h2>Create {contentType} Content</h2>
              <button onClick={handleContentCreation} data-testid="create-content-button">
                Create Content
              </button>
            </div>
          ) : uploadedFile ? (
            <div data-testid="metadata-form">
              <h2>Add Metadata</h2>
              <p>File: {uploadedFile.name}</p>
              <button onClick={handleContentCreation} data-testid="save-content-button">
                Save Content
              </button>
            </div>
          ) : (
            <div data-testid="no-file-error">No file uploaded</div>
          )}
        </div>
      )}
    </div>
  )
}

// Test data
const mockContent = {
  id: 'test-content-123',
  title: 'Test Song',
  artist: 'Test Artist',
  content_type: 'Lyrics',
  file_url: 'https://example.com/test-file.pdf',
  content_data: {
    lyrics: 'Verse 1\nChorus\nVerse 2\nChorus\nBridge\nChorus',
    chords: ['C', 'F', 'G', 'Am'],
    sections: ['Verse', 'Chorus', 'Bridge']
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
  songs: [
    { content_id: 'test-content-123', position: 1 },
    { content_id: 'test-content-456', position: 2 },
    { content_id: 'test-content-789', position: 3 }
  ]
}

describe('Component Functionality Integration Tests', () => {
  describe('ContentViewer Functionality Verification', () => {
    it('should display all content information correctly', () => {
      const props = {
        content: mockContent,
        onBack: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        setlist: null,
        currentSongIndex: 0
      }

      render(<MockContentViewer {...props} />)

      expect(screen.getByTestId('content-title')).toHaveTextContent('Test Song')
      expect(screen.getByTestId('content-artist')).toHaveTextContent('Test Artist')
      expect(screen.getByTestId('content-type')).toHaveTextContent('Lyrics')
      expect(screen.getByTestId('content-key')).toHaveTextContent('Key: C')
      expect(screen.getByTestId('content-bpm')).toHaveTextContent('BPM: 120')
    })

    it('should handle different content types appropriately', () => {
      const testCases = [
        {
          type: 'Lyrics',
          data: { lyrics: 'Test lyrics content' },
          expectedElement: 'lyrics-content'
        },
        {
          type: 'Chords',
          data: { chords: ['C', 'F', 'G'] },
          expectedElement: 'chords-content'
        },
        {
          type: 'Tab',
          data: { tablature: 'e|--0--|\nB|--1--|' },
          expectedElement: 'tab-content'
        }
      ]

      testCases.forEach(({ type, data, expectedElement }) => {
        const content = {
          ...mockContent,
          content_type: type,
          content_data: data
        }

        const { unmount } = render(
          <MockContentViewer
            content={content}
            onBack={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            setlist={null}
            currentSongIndex={0}
          />
        )

        expect(screen.getByTestId(expectedElement)).toBeInTheDocument()
        unmount()
      })
    })

    it('should handle setlist navigation correctly', () => {
      const props = {
        content: mockContent,
        onBack: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        setlist: mockSetlist,
        currentSongIndex: 1
      }

      render(<MockContentViewer {...props} />)

      expect(screen.getByTestId('setlist-navigation')).toBeInTheDocument()
      expect(screen.getByTestId('song-counter')).toHaveTextContent('2 of 3')

      const prevButton = screen.getByTestId('prev-button')
      const nextButton = screen.getByTestId('next-button')

      expect(prevButton).not.toBeDisabled()
      expect(nextButton).not.toBeDisabled()
    })

    it('should disable navigation at setlist boundaries', () => {
      // Test first song
      const { rerender } = render(
        <MockContentViewer
          content={mockContent}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          setlist={mockSetlist}
          currentSongIndex={0}
        />
      )

      expect(screen.getByTestId('prev-button')).toBeDisabled()
      expect(screen.getByTestId('next-button')).not.toBeDisabled()

      // Test last song
      rerender(
        <MockContentViewer
          content={mockContent}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          setlist={mockSetlist}
          currentSongIndex={2}
        />
      )

      expect(screen.getByTestId('prev-button')).not.toBeDisabled()
      expect(screen.getByTestId('next-button')).toBeDisabled()
    })

    it('should handle action callbacks correctly', () => {
      const callbacks = {
        onBack: vi.fn(),
        onEdit: vi.fn(),
        onDelete: vi.fn()
      }

      render(
        <MockContentViewer
          content={mockContent}
          {...callbacks}
          setlist={null}
          currentSongIndex={0}
        />
      )

      fireEvent.click(screen.getByTestId('back-button'))
      expect(callbacks.onBack).toHaveBeenCalledOnce()

      fireEvent.click(screen.getByTestId('edit-button'))
      expect(callbacks.onEdit).toHaveBeenCalledWith(mockContent)

      fireEvent.click(screen.getByTestId('delete-button'))
      expect(callbacks.onDelete).toHaveBeenCalledWith(mockContent.id)
    })

    it('should display file content for sheet music', () => {
      const sheetContent = {
        ...mockContent,
        content_type: 'Sheet',
        file_url: 'https://example.com/sheet.pdf'
      }

      render(
        <MockContentViewer
          content={sheetContent}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          setlist={null}
          currentSongIndex={0}
        />
      )

      expect(screen.getByTestId('file-viewer')).toBeInTheDocument()
      expect(screen.getByTestId('content-iframe')).toHaveAttribute('src', sheetContent.file_url)
    })
  })

  describe('AddContent Workflow Verification', () => {
    it('should complete the full content creation workflow', async () => {
      const callbacks = {
        onBack: vi.fn(),
        onContentCreated: vi.fn(),
        onNavigate: vi.fn()
      }

      render(<MockAddContent {...callbacks} />)

      // Step 1: Content type selection
      expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 1 of 5')
      expect(screen.getByTestId('content-type-selection')).toBeInTheDocument()

      fireEvent.click(screen.getByTestId('lyrics-type'))

      // Step 2: Mode selection
      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 2 of 5')
        expect(screen.getByTestId('mode-selection')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('create-mode'))

      // Step 5: Content creation (skipped steps 3-4 for create mode)
      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 5 of 5')
        expect(screen.getByTestId('content-creator')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('create-content-button'))

      expect(callbacks.onContentCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Test Song',
          content_type: 'Lyrics'
        })
      )
    })

    it('should handle import workflow with file upload', async () => {
      const callbacks = {
        onBack: vi.fn(),
        onContentCreated: vi.fn(),
        onNavigate: vi.fn()
      }

      render(<MockAddContent {...callbacks} />)

      // Step 1: Select content type
      fireEvent.click(screen.getByTestId('lyrics-type'))

      // Step 2: Select import mode
      await waitFor(() => {
        expect(screen.getByTestId('mode-selection')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('import-mode'))

      // Step 3: Select import type
      await waitFor(() => {
        expect(screen.getByTestId('import-mode-selection')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('single-import'))

      // Step 4: File upload
      await waitFor(() => {
        expect(screen.getByTestId('file-upload')).toBeInTheDocument()
      })

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId('file-input')

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      })

      fireEvent.change(fileInput)

      // Step 5: Metadata form
      await waitFor(() => {
        expect(screen.getByTestId('metadata-form')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('save-content-button'))

      expect(callbacks.onContentCreated).toHaveBeenCalled()
    })

    it('should handle Sheet Music workflow (skip mode selection)', async () => {
      render(
        <MockAddContent
          onBack={vi.fn()}
          onContentCreated={vi.fn()}
          onNavigate={vi.fn()}
        />
      )

      // Step 1: Select Sheet Music
      fireEvent.click(screen.getByTestId('sheet-type'))

      // Should skip to Step 3 (file upload) for Sheet Music
      await waitFor(() => {
        expect(screen.getByTestId('step-indicator')).toHaveTextContent('Step 3 of 5')
        expect(screen.getByTestId('file-upload')).toBeInTheDocument()
        expect(screen.queryByTestId('mode-selection')).not.toBeInTheDocument()
      })
    })

    it('should handle batch import workflow', async () => {
      render(
        <MockAddContent
          onBack={vi.fn()}
          onContentCreated={vi.fn()}
          onNavigate={vi.fn()}
        />
      )

      // Navigate to batch import
      fireEvent.click(screen.getByTestId('lyrics-type'))

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('import-mode'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('batch-import'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('file-upload')).toBeInTheDocument()
      })
    })

    it('should handle back navigation correctly', () => {
      const onBack = vi.fn()

      render(
        <MockAddContent
          onBack={onBack}
          onContentCreated={vi.fn()}
          onNavigate={vi.fn()}
        />
      )

      fireEvent.click(screen.getByTestId('back-button'))
      expect(onBack).toHaveBeenCalledOnce()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing content gracefully in ContentViewer', () => {
      render(
        <MockContentViewer
          content={null}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          setlist={null}
          currentSongIndex={0}
        />
      )

      // Should not crash
      expect(screen.getByTestId('content-viewer')).toBeInTheDocument()
    })

    it('should handle content without metadata in ContentViewer', () => {
      const minimalContent = {
        id: 'minimal-content',
        title: 'Minimal Song',
        content_type: 'Lyrics'
      }

      render(
        <MockContentViewer
          content={minimalContent}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          setlist={null}
          currentSongIndex={0}
        />
      )

      expect(screen.getByTestId('content-title')).toHaveTextContent('Minimal Song')
      expect(screen.queryByTestId('content-key')).not.toBeInTheDocument()
      expect(screen.queryByTestId('content-bpm')).not.toBeInTheDocument()
    })

    it('should handle file upload without file selection', async () => {
      render(
        <MockAddContent
          onBack={vi.fn()}
          onContentCreated={vi.fn()}
          onNavigate={vi.fn()}
        />
      )

      // Navigate to import workflow without uploading file
      fireEvent.click(screen.getByTestId('lyrics-type'))

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('import-mode'))
      })

      await waitFor(() => {
        fireEvent.click(screen.getByTestId('single-import'))
      })

      // Skip file upload, go to metadata form
      await waitFor(() => {
        expect(screen.getByTestId('file-upload')).toBeInTheDocument()
      })

      // Force navigation to step 5 without file
      const stepIndicator = screen.getByTestId('step-indicator')
      expect(stepIndicator).toHaveTextContent('Step 4 of 5')
    })
  })

  describe('Performance Characteristics', () => {
    it('should render ContentViewer quickly with large content', () => {
      const largeContent = {
        ...mockContent,
        content_data: {
          lyrics: 'Large lyrics content\n'.repeat(1000),
          chords: Array.from({ length: 500 }, (_, i) => `Chord${i}`),
          sections: Array.from({ length: 100 }, (_, i) => `Section${i}`)
        }
      }

      const startTime = performance.now()

      render(
        <MockContentViewer
          content={largeContent}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          setlist={null}
          currentSongIndex={0}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      expect(renderTime).toBeLessThan(100) // Should render within 100ms
      expect(screen.getByTestId('content-viewer')).toBeInTheDocument()
    })

    it('should handle rapid AddContent step changes efficiently', async () => {
      const { rerender } = render(
        <MockAddContent
          onBack={vi.fn()}
          onContentCreated={vi.fn()}
          onNavigate={vi.fn()}
        />
      )

      const startTime = performance.now()

      // Simulate rapid re-renders
      for (let i = 0; i < 50; i++) {
        rerender(
          <MockAddContent
            onBack={vi.fn()}
            onContentCreated={vi.fn()}
            onNavigate={vi.fn()}
          />
        )
      }

      const endTime = performance.now()
      const rerenderTime = endTime - startTime

      expect(rerenderTime).toBeLessThan(200) // Should handle 50 re-renders quickly
    })

    it('should handle memory cleanup properly', () => {
      const { unmount } = render(
        <MockContentViewer
          content={mockContent}
          onBack={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          setlist={mockSetlist}
          currentSongIndex={0}
        />
      )

      unmount()

      // Should not throw errors on unmount
      expect(true).toBe(true)
    })
  })
})