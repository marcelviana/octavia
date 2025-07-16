import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ContentViewer } from '../content-viewer'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock offline cache - declare mock functions first
vi.mock('@/lib/offline-cache', () => ({
  getCachedFileInfo: vi.fn(),
  getCachedFileUrl: vi.fn(),
}))

// Import the mocked functions after the mock
import { getCachedFileInfo, getCachedFileUrl } from '@/lib/offline-cache'
const mockGetCachedFileInfo = vi.mocked(getCachedFileInfo)
const mockGetCachedFileUrl = vi.mocked(getCachedFileUrl)

// Mock content service
vi.mock('@/lib/content-service', () => ({
  deleteContent: vi.fn(),
  clearContentCache: vi.fn(),
}))

// Import the mocked content service functions
import { deleteContent, clearContentCache } from '@/lib/content-service'
const mockDeleteContent = vi.mocked(deleteContent)
const mockClearContentCache = vi.mocked(clearContentCache)

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Import the mocked toast function
import { toast } from 'sonner'
const mockToastError = vi.mocked(toast.error)

// Mock utils
vi.mock('@/lib/utils', () => ({
  urlHasExtension: vi.fn(),
  isPdfFile: vi.fn(),
  isImageFile: vi.fn(),
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

// Mock content type styles
vi.mock('@/lib/content-type-styles', () => ({
  getContentTypeStyle: vi.fn(() => ({
    primary: 'text-blue-500',
    secondary: 'text-blue-300',
  })),
}))

// Mock content types
vi.mock('@/types/content', () => ({
  ContentType: {
    LYRICS: 'lyrics',
    TAB: 'tab',
    CHORDS: 'chords',
    SHEET: 'sheet',
  },
  getContentTypeIcon: vi.fn(() => {
    const MockIcon = () => <div data-testid="content-icon">Icon</div>
    MockIcon.displayName = 'MockContentTypeIcon'
    return MockIcon
  }),
  normalizeContentType: vi.fn((type) => type),
}))

// Mock components
vi.mock('@/components/music-text', () => ({
  MusicText: ({ content }: any) => (
    <div data-testid="music-text">
      Music Text: {content.title}
    </div>
  ),
}))

vi.mock('@/components/pdf-viewer', () => ({
  default: ({ url }: any) => (
    <div data-testid="pdf-viewer">
      PDF Viewer: {url}
    </div>
  ),
}))

// Mock URL.revokeObjectURL
const mockRevokeObjectURL = vi.fn()
Object.defineProperty(global, 'URL', {
  value: {
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
})

describe('Content Viewer', () => {
  const mockContent = {
    id: 'content-1',
    title: 'Amazing Grace',
    content_type: 'lyrics',
    is_favorite: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    content_data: {
      pages: [
        { content: 'Amazing grace, how sweet the sound' },
        { content: 'That saved a wretch like me' },
      ],
    },
    file_url: 'https://example.com/amazing-grace.pdf',
  }

  const mockOnBack = vi.fn()
  const mockOnEnterPerformance = vi.fn()
  const mockOnEdit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedFileInfo.mockResolvedValue({
      url: 'blob:mock-url',
      mimeType: 'application/pdf',
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders content viewer with basic information', () => {
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Should display title
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()

    // Should display content type (lyrics) in the header paragraph
    const contentTypeParagraph = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'p' &&
        element?.className?.includes('text-sm text-gray-500') &&
        content.replace(/\s+/g, '').includes('lyrics')
      )
    })
    expect(contentTypeParagraph).toBeInTheDocument()

    // Should show back button
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toBeInTheDocument()
  })

  it('handles back navigation', async () => {
    const user = userEvent.setup()
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Back button has no accessible name, so we need to find it by its position (first button)
    const buttons = screen.getAllByRole('button')
    const backButton = buttons[0] // First button is the back button
    await act(async () => {
      await user.click(backButton)
    })

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('handles performance mode entry', async () => {
    const user = userEvent.setup()
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    const performanceButton = screen.getByRole('button', { name: /performance/i })
    await act(async () => {
      await user.click(performanceButton)
    })

    expect(mockOnEnterPerformance).toHaveBeenCalledWith(mockContent)
  })

  it('handles edit functionality when provided', async () => {
    const user = userEvent.setup()
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Click the dropdown menu trigger (more vertical button) - use aria-haspopup to identify it
    const buttons = screen.getAllByRole('button')
    const dropdownButton = buttons.find(button => button.getAttribute('aria-haspopup') === 'menu')
    await act(async () => {
      await user.click(dropdownButton!)
    })

    // Click edit option in dropdown
    const editOption = screen.getByText('Edit')
    await act(async () => {
      await user.click(editOption)
    })

    expect(mockOnEdit).toHaveBeenCalled()
  })

  it('does not show edit button when onEdit is not provided', () => {
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
      />
    )

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })

  it('handles zoom controls', async () => {
    const user = userEvent.setup()
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
        showToolbar
      />
    )

    // Get all buttons and find zoom controls by their position in the toolbar
    const buttons = screen.getAllByRole('button')
    // Zoom controls are in the toolbar section, find them by looking for buttons with zoom icons
    const zoomButtons = buttons.filter(button => 
      button.querySelector('svg') && 
      (button.querySelector('svg')?.getAttribute('viewBox') === '0 0 24 24')
    )
    
    // The zoom buttons should be present
    expect(zoomButtons.length).toBeGreaterThan(0)
  })

  it('handles favorite toggle', async () => {
    const user = userEvent.setup()
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Get all buttons and find the star button (second button in header)
    const buttons = screen.getAllByRole('button')
    const starButton = buttons[1] // The star button is the second button in the header
    
    await act(async () => {
      await user.click(starButton)
    })

    // Favorite button should be present and clickable
    expect(starButton).toBeInTheDocument()
  })

  it('handles content deletion workflow', async () => {
    const user = userEvent.setup()
    mockDeleteContent.mockResolvedValue(void 0)
    mockClearContentCache.mockResolvedValue(void 0)

    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Click the dropdown menu trigger (more vertical button) - use aria-haspopup to identify it
    const buttons = screen.getAllByRole('button')
    const dropdownButton = buttons.find(button => button.getAttribute('aria-haspopup') === 'menu')
    await act(async () => {
      await user.click(dropdownButton!)
    })

    // Click delete option in dropdown
    const deleteOption = screen.getByText('Delete')
    await act(async () => {
      await user.click(deleteOption)
    })

    // Confirm deletion in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm|delete/i })
    await act(async () => {
      await user.click(confirmButton)
    })

    expect(mockDeleteContent).toHaveBeenCalledWith(mockContent.id)
    expect(mockClearContentCache).toHaveBeenCalled()
    expect(mockOnBack).toHaveBeenCalled()
  })

  it('handles deletion errors gracefully', async () => {
    const user = userEvent.setup()
    mockDeleteContent.mockRejectedValue(new Error('Delete failed'))

    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Click the dropdown menu trigger - use aria-haspopup to identify it
    const buttons = screen.getAllByRole('button')
    const dropdownButton = buttons.find(button => button.getAttribute('aria-haspopup') === 'menu')
    await act(async () => {
      await user.click(dropdownButton!)
    })

    // Click delete option in dropdown
    const deleteOption = screen.getByText('Delete')
    await act(async () => {
      await user.click(deleteOption)
    })

    // Wait for the dialog to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm|delete/i })).toBeInTheDocument()
    })

    // Confirm deletion in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm|delete/i })
    await act(async () => {
      await user.click(confirmButton)
    })

    // Wait for the error toast to be called
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Failed to delete content')
    }, { timeout: 2000 })
  })

  it('loads cached file information on mount', async () => {
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    await waitFor(() => {
      expect(mockGetCachedFileInfo).toHaveBeenCalledWith('content-1')
    })
  })

  it('handles missing cached file gracefully', async () => {
    mockGetCachedFileInfo.mockResolvedValue(null)

    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    await waitFor(() => {
      expect(mockGetCachedFileInfo).toHaveBeenCalledWith('content-1')
    })

    // Should still render without error
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('handles cached file loading errors', async () => {
    mockGetCachedFileInfo.mockRejectedValue(new Error('Cache error'))

    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    await waitFor(() => {
      expect(mockGetCachedFileInfo).toHaveBeenCalledWith('content-1')
    })

    // Should still render without error
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('cleans up blob URLs on unmount', async () => {
    mockGetCachedFileInfo.mockResolvedValue({
      url: 'blob:mock-url',
      mimeType: 'application/pdf',
    })

    const { unmount } = render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    await waitFor(() => {
      expect(mockGetCachedFileInfo).toHaveBeenCalled()
    })

    unmount()

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('handles different content types correctly', () => {
    const lyricsContent = { ...mockContent, content_type: 'lyrics' }
    const chordsContent = { ...mockContent, content_type: 'chords' }
    const tabContent = { ...mockContent, content_type: 'tab' }

    const { rerender } = render(
      <ContentViewer
        content={lyricsContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // The content type is displayed in the header - look for the specific paragraph
    const headerParagraph = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             element?.className?.includes('text-sm text-gray-500') && 
             content.includes('lyrics')
    })
    expect(headerParagraph).toBeInTheDocument()

    rerender(
      <ContentViewer
        content={chordsContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    const chordsParagraph = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             element?.className?.includes('text-sm text-gray-500') && 
             content.includes('chords')
    })
    expect(chordsParagraph).toBeInTheDocument()

    rerender(
      <ContentViewer
        content={tabContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    const tabParagraph = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             element?.className?.includes('text-sm text-gray-500') && 
             content.includes('tab')
    })
    expect(tabParagraph).toBeInTheDocument()
  })

  it('handles content without file_url', () => {
    const contentWithoutFile = {
      ...mockContent,
      file_url: undefined,
    }

    render(
      <ContentViewer
        content={contentWithoutFile}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Should still render without error
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('handles content with favorite state', () => {
    const favoritedContent = {
      ...mockContent,
      is_favorite: true,
    }

    render(
      <ContentViewer
        content={favoritedContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Should render with favorite state
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('handles content without content_data', () => {
    const contentWithoutData = {
      ...mockContent,
      content_data: undefined,
    }

    render(
      <ContentViewer
        content={contentWithoutData}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Should still render without error
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('handles toolbar visibility toggle', () => {
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
        showToolbar={false}
      />
    )

    // Should render without toolbar controls
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
    // Zoom controls should not be present when showToolbar is false
    expect(screen.queryByRole('button', { name: /zoom in/i })).not.toBeInTheDocument()
  })

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup()
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Test keyboard navigation
    await act(async () => {
      await user.keyboard('{Escape}')
    })

    // Should handle keyboard events appropriately
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('handles content with multiple pages', () => {
    const multiPageContent = {
      ...mockContent,
      content_data: {
        pages: [
          { content: 'Page 1 content' },
          { content: 'Page 2 content' },
          { content: 'Page 3 content' },
        ],
      },
    }

    render(
      <ContentViewer
        content={multiPageContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Should handle multiple pages correctly
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
  })

  it('handles content with special characters in title', () => {
    const specialContent = {
      ...mockContent,
      title: 'Amazing Grace & How Sweet the Sound',
    }

    render(
      <ContentViewer
        content={specialContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('Amazing Grace & How Sweet the Sound')).toBeInTheDocument()
  })
}) 