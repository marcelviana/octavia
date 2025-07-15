import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ContentViewer } from '../content-viewer'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

// Mock offline cache
const mockGetCachedFileInfo = vi.fn()
const mockGetCachedFileUrl = vi.fn()
vi.mock('@/lib/offline-cache', () => ({
  getCachedFileInfo: mockGetCachedFileInfo,
  getCachedFileUrl: mockGetCachedFileUrl,
}))

// Mock content service
const mockDeleteContent = vi.fn()
const mockClearContentCache = vi.fn()
vi.mock('@/lib/content-service', () => ({
  deleteContent: mockDeleteContent,
  clearContentCache: mockClearContentCache,
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: mockToast,
    error: mockToast,
  },
}))

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
  getContentTypeIcon: vi.fn(() => () => <div data-testid="content-icon">Icon</div>),
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

  it('renders content viewer with basic information', async () => {
    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Should display content title
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument()

    // Should display content type
    expect(screen.getByText('lyrics')).toBeInTheDocument()

    // Should show back button
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
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

    const backButton = screen.getByRole('button', { name: /back/i })
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

    const editButton = screen.getByRole('button', { name: /edit/i })
    await act(async () => {
      await user.click(editButton)
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
      />
    )

    // Find zoom controls
    const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
    const zoomOutButton = screen.getByRole('button', { name: /zoom out/i })

    await act(async () => {
      await user.click(zoomInButton)
    })

    await act(async () => {
      await user.click(zoomOutButton)
    })

    // Zoom controls should be present and clickable
    expect(zoomInButton).toBeInTheDocument()
    expect(zoomOutButton).toBeInTheDocument()
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

    const favoriteButton = screen.getByRole('button', { name: /favorite/i })
    await act(async () => {
      await user.click(favoriteButton)
    })

    // Favorite button should be present and clickable
    expect(favoriteButton).toBeInTheDocument()
  })

  it('handles content deletion workflow', async () => {
    const user = userEvent.setup()
    mockDeleteContent.mockResolvedValue(undefined)
    mockClearContentCache.mockResolvedValue(undefined)

    render(
      <ContentViewer
        content={mockContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await act(async () => {
      await user.click(deleteButton)
    })

    // Should show confirmation dialog
    expect(screen.getByText(/delete.*content/i)).toBeInTheDocument()

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm|delete/i })
    await act(async () => {
      await user.click(confirmButton)
    })

    expect(mockDeleteContent).toHaveBeenCalledWith('content-1')
    expect(mockClearContentCache).toHaveBeenCalled()
    expect(mockOnBack).toHaveBeenCalled()
    expect(mockToast).toHaveBeenCalledWith('Content deleted successfully')
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

    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await act(async () => {
      await user.click(deleteButton)
    })

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm|delete/i })
    await act(async () => {
      await user.click(confirmButton)
    })

    expect(mockToast).toHaveBeenCalledWith('Failed to delete content')
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

    expect(screen.getByText('lyrics')).toBeInTheDocument()

    rerender(
      <ContentViewer
        content={chordsContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('chords')).toBeInTheDocument()

    rerender(
      <ContentViewer
        content={tabContent}
        onBack={mockOnBack}
        onEnterPerformance={mockOnEnterPerformance}
        onEdit={mockOnEdit}
      />
    )

    expect(screen.getByText('tab')).toBeInTheDocument()
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