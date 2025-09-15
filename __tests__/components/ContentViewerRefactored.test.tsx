/**
 * Tests for Refactored ContentViewer Component
 * 
 * Tests the refactored content viewer that uses the new domain-driven architecture,
 * including error boundaries, state management integration, and component interactions.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentViewer } from '@/components/content-viewer-refactored'
import { 
  renderWithStore, 
  mockContentItem, 
  simulateAsyncError 
} from '../utils/test-utils'
import { deleteContent, clearContentCache } from '@/lib/content-service'
import { getCachedFileInfo } from '@/lib/offline-cache'

// Mock external dependencies
vi.mock('@/lib/content-service')
vi.mock('@/lib/offline-cache')
vi.mock('@/domains/shared/components/DomainErrorBoundary', () => ({
  DomainErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="error-boundary">{children}</div>
}))

const mockDeleteContent = vi.mocked(deleteContent)
const mockClearContentCache = vi.mocked(clearContentCache)
const mockGetCachedFileInfo = vi.mocked(getCachedFileInfo)

describe('ContentViewer (Refactored)', () => {
  const mockOnBack = vi.fn()
  const mockOnEnterPerformance = vi.fn()
  const mockOnEdit = vi.fn()

  const defaultProps = {
    content: mockContentItem,
    onBack: mockOnBack,
    onEnterPerformance: mockOnEnterPerformance,
    onEdit: mockOnEdit,
    showToolbar: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockGetCachedFileInfo.mockResolvedValue({
      url: 'blob:test-url',
      mimeType: 'application/pdf',
    })
    mockDeleteContent.mockResolvedValue()
    mockClearContentCache.mockResolvedValue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render content viewer with error boundary', async () => {
      await act(async () => {
        renderWithStore(<ContentViewer {...defaultProps} />)
      })

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })

    it('should render content header with title and artist', async () => {
      await act(async () => {
        renderWithStore(<ContentViewer {...defaultProps} />)
      })

      expect(screen.getByText(mockContentItem.title)).toBeInTheDocument()
      expect(screen.getByText(`${mockContentItem.artist} • ${mockContentItem.content_type}`)).toBeInTheDocument()
    })

    it('should render toolbar when showToolbar is true', () => {
      renderWithStore(<ContentViewer {...defaultProps} />)

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument() // Zoom indicator
    })

    it('should not render toolbar when showToolbar is false', () => {
      renderWithStore(<ContentViewer {...defaultProps} showToolbar={false} />)

      expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument()
      expect(screen.queryByText('100%')).not.toBeInTheDocument()
    })

    it('should render content display area', () => {
      renderWithStore(<ContentViewer {...defaultProps} />)

      // Content display should be present
      expect(screen.getByText(/Song Details/i)).toBeInTheDocument()
      expect(screen.getByText(/Performance Notes/i)).toBeInTheDocument()
    })

    it('should render sidebar with content metadata', () => {
      renderWithStore(<ContentViewer {...defaultProps} />)

      expect(screen.getByText(mockContentItem.genre)).toBeInTheDocument()
      expect(screen.getByText(mockContentItem.key)).toBeInTheDocument()
      expect(screen.getByText(`${mockContentItem.bpm} BPM`)).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should call onEnterPerformance when performance button is clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      const performanceButton = screen.getByRole('button', { name: /performance/i })
      await user.click(performanceButton)

      expect(mockOnEnterPerformance).toHaveBeenCalledWith(mockContentItem)
    })

    it('should toggle favorite status when star button is clicked', async () => {
      const user = userEvent.setup()
      const initialState = {
        content: { selectedContent: mockContentItem }
      }
      
      renderWithStore(<ContentViewer {...defaultProps} />, { initialState })

      const favoriteButton = screen.getByRole('button', { name: /star/i })
      await user.click(favoriteButton)

      // Should update state and show notification
      await waitFor(() => {
        expect(screen.getByText(/Added to favorites|Removed from favorites/)).toBeInTheDocument()
      })
    })

    it('should open edit menu when more options is clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      const moreButton = screen.getByRole('button', { name: /more/i })
      await user.click(moreButton)

      expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument()
    })
  })

  describe('toolbar controls', () => {
    it('should toggle play/pause when play button is clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      const playButton = screen.getByRole('button', { name: /play/i })
      await user.click(playButton)

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })

    it('should change zoom when zoom buttons are clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      expect(screen.getByText('100%')).toBeInTheDocument()

      const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
      await user.click(zoomInButton)

      expect(screen.getByText('125%')).toBeInTheDocument()

      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i })
      await user.click(zoomOutButton)
      await user.click(zoomOutButton)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should navigate pages when page buttons are clicked', async () => {
      const user = userEvent.setup()
      const contentWithPages = {
        ...mockContentItem,
        content_data: { pages: ['page1', 'page2', 'page3'] }
      }
      
      renderWithStore(<ContentViewer {...defaultProps} content={contentWithPages} />)

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()

      const prevButton = screen.getByRole('button', { name: /previous/i })
      await user.click(prevButton)

      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })
  })

  describe('delete functionality', () => {
    it('should open delete dialog when delete is clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      // Open menu
      const moreButton = screen.getByRole('button', { name: /more/i })
      await user.click(moreButton)

      // Click delete
      const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteButton)

      // Dialog should appear
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/delete content/i)).toBeInTheDocument()
      expect(screen.getByText(mockContentItem.title)).toBeInTheDocument()
    })

    it('should cancel delete when cancel is clicked', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      // Open delete dialog
      const moreButton = screen.getByRole('button', { name: /more/i })
      await user.click(moreButton)
      const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteButton)

      // Cancel delete
      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should delete content when confirmed', async () => {
      const user = userEvent.setup()
      const initialState = {
        content: { selectedContent: mockContentItem }
      }
      
      renderWithStore(<ContentViewer {...defaultProps} />, { initialState })

      // Open delete dialog
      const moreButton = screen.getByRole('button', { name: /more/i })
      await user.click(moreButton)
      const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteButton)

      // Confirm delete
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Should call delete services
      await waitFor(() => {
        expect(mockDeleteContent).toHaveBeenCalledWith(mockContentItem.id)
        expect(mockClearContentCache).toHaveBeenCalled()
        expect(mockOnBack).toHaveBeenCalled()
      })
    })

    it('should handle delete errors gracefully', async () => {
      const user = userEvent.setup()
      mockDeleteContent.mockRejectedValue(new Error('Delete failed'))
      
      renderWithStore(<ContentViewer {...defaultProps} />)

      // Trigger delete
      const moreButton = screen.getByRole('button', { name: /more/i })
      await user.click(moreButton)
      const deleteButton = screen.getByRole('menuitem', { name: /delete/i })
      await user.click(deleteButton)
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Should show error notification
      await waitFor(() => {
        expect(screen.getByText(/failed to delete content/i)).toBeInTheDocument()
      })

      expect(mockOnBack).not.toHaveBeenCalled()
    })
  })

  describe('content loading', () => {
    it('should show loading state while loading cached content', () => {
      mockGetCachedFileInfo.mockImplementation(() => new Promise(() => {})) // Never resolves
      
      renderWithStore(<ContentViewer {...defaultProps} />)

      // Should show loading content
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should handle cached content loading errors', async () => {
      mockGetCachedFileInfo.mockRejectedValue(new Error('Cache error'))
      
      renderWithStore(<ContentViewer {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText(/cache error/i)).toBeInTheDocument()
      })
    })

    it('should display cached content when available', async () => {
      mockGetCachedFileInfo.mockResolvedValue({
        url: 'blob:cached-content',
        mimeType: 'application/pdf',
      })
      
      renderWithStore(<ContentViewer {...defaultProps} />)

      await waitFor(() => {
        expect(mockGetCachedFileInfo).toHaveBeenCalledWith(mockContentItem.id)
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      renderWithStore(<ContentViewer {...defaultProps} />)

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /performance/i })).toBeInTheDocument()
      
      if (defaultProps.showToolbar) {
        expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
      }
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      // Should be able to tab through interactive elements
      await user.tab()
      expect(screen.getByRole('button', { name: /back/i })).toHaveFocus()

      await user.tab()
      expect(screen.getByRole('button', { name: /star/i })).toHaveFocus()
    })

    it('should support keyboard shortcuts for common actions', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      // Focus the container first
      const container = screen.getByTestId('error-boundary')
      await user.click(container)

      // Should support space bar for play/pause
      await user.keyboard(' ')
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      })

      renderWithStore(<ContentViewer {...defaultProps} />)

      // On mobile, performance button should not show text
      const performanceButton = screen.getByRole('button', { name: /performance/i })
      expect(performanceButton).not.toHaveTextContent('Performance')
    })
  })

  describe('state management integration', () => {
    it('should update centralized state when content changes', async () => {
      const user = userEvent.setup()
      const initialState = {
        content: { selectedContent: null }
      }
      
      const { container } = renderWithStore(<ContentViewer {...defaultProps} />, { initialState })

      // Trigger favorite toggle
      const favoriteButton = screen.getByRole('button', { name: /star/i })
      await user.click(favoriteButton)

      // Should update the centralized state through the hook
      // This would be verified by checking if the store actions were called
      // The exact verification would depend on how we mock the store
    })

    it('should show notifications through centralized state', async () => {
      const user = userEvent.setup()
      renderWithStore(<ContentViewer {...defaultProps} />)

      const favoriteButton = screen.getByRole('button', { name: /star/i })
      await user.click(favoriteButton)

      // Notification should appear through the centralized notification system
      await waitFor(() => {
        expect(screen.getByText(/added to favorites|removed from favorites/i)).toBeInTheDocument()
      })
    })
  })

  describe('error boundary integration', () => {
    it('should wrap content in domain error boundary', () => {
      renderWithStore(<ContentViewer {...defaultProps} />)

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })

    it('should handle component errors gracefully', () => {
      // This test would need to simulate a component error
      // to verify that the error boundary catches it properly
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Component with error would be rendered here
      // and we'd verify the error boundary displays

      consoleError.mockRestore()
    })
  })
})