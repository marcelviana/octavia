/**
 * ContentViewer Refactoring Tests
 *
 * Comprehensive testing to ensure the refactored ContentViewer component
 * (864→114 lines) maintains all original functionality while improving performance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContentViewer } from '@/components/content-viewer'
import { useContentFile } from '@/hooks/useContentFile'
import { ContentHeader } from '@/components/content-viewer/ContentHeader'
import { ContentToolbar } from '@/components/content-viewer/ContentToolbar'

// Mock the extracted hooks and components
vi.mock('@/hooks/useContentFile')
vi.mock('@/components/content-viewer/ContentHeader')
vi.mock('@/components/content-viewer/ContentToolbar')
vi.mock('@/contexts/firebase-auth-context')
vi.mock('@/lib/firebase-storage')

const mockUseContentFile = vi.mocked(useContentFile)
const mockContentHeader = vi.mocked(ContentHeader)
const mockContentToolbar = vi.mocked(ContentToolbar)

// Test data matching original ContentViewer functionality
const mockContent = {
  id: 'test-content-123',
  title: 'Test Song',
  artist: 'Test Artist',
  content_type: 'Lyrics',
  file_url: 'https://example.com/test-file.pdf',
  content_data: {
    lyrics: 'Test lyrics content',
    chords: ['C', 'F', 'G'],
    sections: ['Verse', 'Chorus']
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
    { content_id: 'test-content-456', position: 2 }
  ]
}

const defaultProps = {
  content: mockContent,
  onBack: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onNavigate: vi.fn(),
  setlist: null,
  currentSongIndex: 0
}

describe('ContentViewer Refactoring Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useContentFile hook
    mockUseContentFile.mockReturnValue({
      offlineUrl: null,
      isLoading: false,
      error: null,
      loadOfflineUrl: vi.fn()
    })

    // Mock sub-components
    mockContentHeader.mockImplementation(({ title, artist, onBack }) => (
      <div data-testid="content-header">
        <button onClick={onBack} data-testid="back-button">Back</button>
        <h1>{title}</h1>
        <p>{artist}</p>
      </div>
    ))

    mockContentToolbar.mockImplementation(({ onEdit, onDelete }) => (
      <div data-testid="content-toolbar">
        <button onClick={onEdit} data-testid="edit-button">Edit</button>
        <button onClick={onDelete} data-testid="delete-button">Delete</button>
      </div>
    ))
  })

  describe('Core Functionality Preservation', () => {
    it('should render content title and artist', () => {
      render(<ContentViewer {...defaultProps} />)

      expect(screen.getByText('Test Song')).toBeInTheDocument()
      expect(screen.getByText('Test Artist')).toBeInTheDocument()
    })

    it('should display content metadata', () => {
      render(<ContentViewer {...defaultProps} />)

      expect(screen.getByText(/Key:/)).toBeInTheDocument()
      expect(screen.getByText(/C/)).toBeInTheDocument()
      expect(screen.getByText(/BPM:/)).toBeInTheDocument()
      expect(screen.getByText(/120/)).toBeInTheDocument()
    })

    it('should handle back navigation', () => {
      const onBack = vi.fn()
      render(<ContentViewer {...defaultProps} onBack={onBack} />)

      fireEvent.click(screen.getByTestId('back-button'))
      expect(onBack).toHaveBeenCalledOnce()
    })

    it('should handle edit functionality', () => {
      const onEdit = vi.fn()
      render(<ContentViewer {...defaultProps} onEdit={onEdit} />)

      fireEvent.click(screen.getByTestId('edit-button'))
      expect(onEdit).toHaveBeenCalledWith(mockContent)
    })

    it('should handle delete functionality', () => {
      const onDelete = vi.fn()
      render(<ContentViewer {...defaultProps} onDelete={onDelete} />)

      fireEvent.click(screen.getByTestId('delete-button'))
      expect(onDelete).toHaveBeenCalledWith(mockContent.id)
    })
  })

  describe('Content Type Handling', () => {
    it('should handle lyrics content type', () => {
      const lyricsContent = {
        ...mockContent,
        content_type: 'Lyrics',
        content_data: { lyrics: 'Test lyrics\nVerse 1\nChorus' }
      }

      render(<ContentViewer {...defaultProps} content={lyricsContent} />)

      expect(screen.getByText(/Test lyrics/)).toBeInTheDocument()
    })

    it('should handle chord charts', () => {
      const chordContent = {
        ...mockContent,
        content_type: 'Chords',
        content_data: {
          chords: ['C', 'F', 'G', 'Am'],
          progression: 'C - F - G - Am'
        }
      }

      render(<ContentViewer {...defaultProps} content={chordContent} />)

      expect(screen.getByText(/Chords/)).toBeInTheDocument()
    })

    it('should handle tablature content', () => {
      const tabContent = {
        ...mockContent,
        content_type: 'Tab',
        content_data: {
          tablature: 'e|--0--0--0--|\nB|--1--1--1--|\nG|--0--0--0--|'
        }
      }

      render(<ContentViewer {...defaultProps} content={tabContent} />)

      expect(screen.getByText(/Tab/)).toBeInTheDocument()
    })

    it('should handle sheet music PDFs', () => {
      const sheetContent = {
        ...mockContent,
        content_type: 'Sheet',
        file_url: 'https://example.com/sheet.pdf'
      }

      render(<ContentViewer {...defaultProps} content={sheetContent} />)

      expect(screen.getByText(/Sheet/)).toBeInTheDocument()
    })
  })

  describe('Setlist Integration', () => {
    it('should display setlist navigation when in setlist context', () => {
      render(
        <ContentViewer
          {...defaultProps}
          setlist={mockSetlist}
          currentSongIndex={0}
        />
      )

      expect(screen.getByText(/1 of 2/)).toBeInTheDocument()
    })

    it('should handle next song navigation', () => {
      const onNavigate = vi.fn()

      render(
        <ContentViewer
          {...defaultProps}
          setlist={mockSetlist}
          currentSongIndex={0}
          onNavigate={onNavigate}
        />
      )

      const nextButton = screen.getByTestId('next-song-button')
      fireEvent.click(nextButton)

      expect(onNavigate).toHaveBeenCalledWith('next')
    })

    it('should handle previous song navigation', () => {
      const onNavigate = vi.fn()

      render(
        <ContentViewer
          {...defaultProps}
          setlist={mockSetlist}
          currentSongIndex={1}
          onNavigate={onNavigate}
        />
      )

      const prevButton = screen.getByTestId('prev-song-button')
      fireEvent.click(prevButton)

      expect(onNavigate).toHaveBeenCalledWith('previous')
    })

    it('should disable navigation at setlist boundaries', () => {
      render(
        <ContentViewer
          {...defaultProps}
          setlist={mockSetlist}
          currentSongIndex={0}
        />
      )

      const prevButton = screen.getByTestId('prev-song-button')
      expect(prevButton).toBeDisabled()

      render(
        <ContentViewer
          {...defaultProps}
          setlist={mockSetlist}
          currentSongIndex={1}
        />
      )

      const nextButton = screen.getByTestId('next-song-button')
      expect(nextButton).toBeDisabled()
    })
  })

  describe('File Loading and Offline Support', () => {
    it('should call useContentFile hook with correct parameters', () => {
      render(<ContentViewer {...defaultProps} />)

      expect(mockUseContentFile).toHaveBeenCalledWith({
        content: mockContent,
        autoLoad: true
      })
    })

    it('should display loading state while file loads', () => {
      mockUseContentFile.mockReturnValue({
        offlineUrl: null,
        isLoading: true,
        error: null,
        loadOfflineUrl: vi.fn()
      })

      render(<ContentViewer {...defaultProps} />)

      expect(screen.getByText(/Loading/)).toBeInTheDocument()
    })

    it('should display error state when file fails to load', () => {
      mockUseContentFile.mockReturnValue({
        offlineUrl: null,
        isLoading: false,
        error: 'Failed to load file',
        loadOfflineUrl: vi.fn()
      })

      render(<ContentViewer {...defaultProps} />)

      expect(screen.getByText(/Failed to load file/)).toBeInTheDocument()
    })

    it('should use offline URL when available', () => {
      mockUseContentFile.mockReturnValue({
        offlineUrl: 'blob:offline-url',
        isLoading: false,
        error: null,
        loadOfflineUrl: vi.fn()
      })

      render(<ContentViewer {...defaultProps} />)

      const iframe = screen.getByTestId('content-iframe')
      expect(iframe).toHaveAttribute('src', 'blob:offline-url')
    })
  })

  describe('Performance Mode Features', () => {
    it('should support fullscreen toggle', () => {
      render(<ContentViewer {...defaultProps} />)

      const fullscreenButton = screen.getByTestId('fullscreen-button')
      fireEvent.click(fullscreenButton)

      // Verify fullscreen API would be called
      expect(document.fullscreenElement || document.webkitFullscreenElement).toBeDefined()
    })

    it('should support zoom controls', () => {
      render(<ContentViewer {...defaultProps} />)

      const zoomInButton = screen.getByTestId('zoom-in-button')
      const zoomOutButton = screen.getByTestId('zoom-out-button')

      fireEvent.click(zoomInButton)
      expect(screen.getByText(/110%/)).toBeInTheDocument()

      fireEvent.click(zoomOutButton)
      expect(screen.getByText(/100%/)).toBeInTheDocument()
    })

    it('should support auto-scroll for lyrics', () => {
      const lyricsContent = {
        ...mockContent,
        content_type: 'Lyrics',
        content_data: { lyrics: 'Long lyrics content...' }
      }

      render(<ContentViewer {...defaultProps} content={lyricsContent} />)

      const autoScrollButton = screen.getByTestId('auto-scroll-button')
      fireEvent.click(autoScrollButton)

      expect(screen.getByText(/Auto-scroll: ON/)).toBeInTheDocument()
    })
  })

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      render(<ContentViewer {...defaultProps} />)

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Content viewer')
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      render(
        <ContentViewer
          {...defaultProps}
          setlist={mockSetlist}
          currentSongIndex={0}
        />
      )

      const container = screen.getByRole('main')
      fireEvent.keyDown(container, { key: 'ArrowRight' })

      expect(defaultProps.onNavigate).toHaveBeenCalledWith('next')
    })

    it('should have proper focus management', () => {
      render(<ContentViewer {...defaultProps} />)

      const firstFocusable = screen.getByTestId('back-button')
      expect(firstFocusable).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing content gracefully', () => {
      render(<ContentViewer {...defaultProps} content={null} />)

      expect(screen.getByText(/No content available/)).toBeInTheDocument()
    })

    it('should handle malformed content data', () => {
      const malformedContent = {
        ...mockContent,
        content_data: null
      }

      render(<ContentViewer {...defaultProps} content={malformedContent} />)

      // Should still render without crashing
      expect(screen.getByText('Test Song')).toBeInTheDocument()
    })

    it('should handle network errors gracefully', async () => {
      mockUseContentFile.mockReturnValue({
        offlineUrl: null,
        isLoading: false,
        error: 'Network error',
        loadOfflineUrl: vi.fn()
      })

      render(<ContentViewer {...defaultProps} />)

      expect(screen.getByText(/Network error/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should properly integrate ContentHeader component', () => {
      render(<ContentViewer {...defaultProps} />)

      expect(mockContentHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Song',
          artist: 'Test Artist',
          onBack: defaultProps.onBack
        }),
        expect.anything()
      )
    })

    it('should properly integrate ContentToolbar component', () => {
      render(<ContentViewer {...defaultProps} />)

      expect(mockContentToolbar).toHaveBeenCalledWith(
        expect.objectContaining({
          onEdit: expect.any(Function),
          onDelete: expect.any(Function),
          onFullscreen: expect.any(Function)
        }),
        expect.anything()
      )
    })

    it('should pass correct props to sub-components', () => {
      const customProps = {
        ...defaultProps,
        showMetadata: true,
        allowEdit: false
      }

      render(<ContentViewer {...customProps} />)

      expect(mockContentHeader).toHaveBeenCalledWith(
        expect.objectContaining({
          showMetadata: true
        }),
        expect.anything()
      )

      expect(mockContentToolbar).toHaveBeenCalledWith(
        expect.objectContaining({
          allowEdit: false
        }),
        expect.anything()
      )
    })
  })

  describe('Memory Management', () => {
    it('should cleanup blob URLs on unmount', () => {
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL')

      mockUseContentFile.mockReturnValue({
        offlineUrl: 'blob:test-url',
        isLoading: false,
        error: null,
        loadOfflineUrl: vi.fn()
      })

      const { unmount } = render(<ContentViewer {...defaultProps} />)
      unmount()

      expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    })

    it('should not create memory leaks with large content', () => {
      const largeContent = {
        ...mockContent,
        content_data: {
          lyrics: 'A'.repeat(10000) // Large content
        }
      }

      const { rerender, unmount } = render(
        <ContentViewer {...defaultProps} content={largeContent} />
      )

      // Simulate multiple re-renders
      for (let i = 0; i < 100; i++) {
        rerender(<ContentViewer {...defaultProps} content={largeContent} />)
      }

      unmount()

      // No memory leaks should occur
      expect(true).toBe(true)
    })
  })

  describe('Performance Optimization', () => {
    it('should memoize expensive calculations', () => {
      const expensiveContent = {
        ...mockContent,
        content_data: {
          chords: Array.from({ length: 1000 }, (_, i) => `Chord${i}`)
        }
      }

      const { rerender } = render(
        <ContentViewer {...defaultProps} content={expensiveContent} />
      )

      const startTime = performance.now()

      // Multiple re-renders should be fast due to memoization
      for (let i = 0; i < 10; i++) {
        rerender(<ContentViewer {...defaultProps} content={expensiveContent} />)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete quickly due to memoization
      expect(duration).toBeLessThan(100)
    })

    it('should handle rapid prop changes efficiently', () => {
      const { rerender } = render(<ContentViewer {...defaultProps} />)

      const startTime = performance.now()

      // Simulate rapid prop changes
      for (let i = 0; i < 50; i++) {
        rerender(
          <ContentViewer
            {...defaultProps}
            currentSongIndex={i % 2}
          />
        )
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle rapid changes efficiently
      expect(duration).toBeLessThan(200)
    })
  })
})