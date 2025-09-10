import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ContentDisplay } from '../content-display'
import { ContentRenderInfo } from '@/hooks/use-content-renderer'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className, style, priority, placeholder, blurDataURL, ...props }: any) => (
    <img 
      src={src}
      alt={alt}
      className={className}
      style={style}
      data-priority={priority}
      data-placeholder={placeholder}
      data-blur={blurDataURL}
      {...props}
    />
  )
}))

// Mock PdfViewer component
vi.mock('@/components/pdf-viewer', () => ({
  default: ({ url, className, fullscreen }: any) => (
    <div 
      data-testid="pdf-viewer" 
      data-url={url}
      data-fullscreen={fullscreen}
      className={className}
    >
      PDF Viewer: {url}
    </div>
  )
}))

// Mock MusicText component
vi.mock('@/components/music-text', () => ({
  MusicText: ({ text, className }: any) => (
    <div data-testid="music-text" className={className}>
      {text}
    </div>
  )
}))

const mockSongData = {
  id: 1,
  title: "Test Song",
  artist: "Test Artist",
  content_type: "lyrics"
}

describe('ContentDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PDF Content Display', () => {
    it('renders PDF viewer when renderType is pdf', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'pdf',
        url: 'https://example.com/test.pdf',
        lyricsText: null,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      const pdfViewer = screen.getByTestId('pdf-viewer')
      expect(pdfViewer).toBeInTheDocument()
      expect(pdfViewer).toHaveAttribute('data-url', 'https://example.com/test.pdf')
      expect(pdfViewer).toHaveAttribute('data-fullscreen', 'true')
      expect(pdfViewer).toHaveClass('h-[calc(100vh-220px)]')
    })
  })

  describe('Image Content Display', () => {
    it('renders image when renderType is image', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'image',
        url: 'https://example.com/sheet.jpg',
        lyricsText: null,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      const image = screen.getByRole('img')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/sheet.jpg')
      expect(image).toHaveAttribute('alt', 'Test Song')
    })

    it('prioritizes loading for first song', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'image',
        url: 'https://example.com/sheet.jpg',
        lyricsText: null,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('data-priority', 'true')
    })

    it('does not prioritize loading for non-first songs', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'image',
        url: 'https://example.com/sheet.jpg',
        lyricsText: null,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={1}
          zoom={100}
        />
      )

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('data-priority', 'false')
    })

    it('uses song title as alt text fallback', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'image',
        url: 'https://example.com/sheet.jpg',
        lyricsText: null,
        errorInfo: null
      }

      const songDataWithoutTitle = { ...mockSongData, title: undefined }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={songDataWithoutTitle}
          currentSong={0}
          zoom={100}
        />
      )

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('alt', 'Sheet Music')
    })
  })

  describe('Lyrics Content Display', () => {
    it('renders lyrics when renderType is lyrics', () => {
      const lyricsText = "Verse 1:\nTest lyrics here\nMore lyrics"
      const renderInfo: ContentRenderInfo = {
        renderType: 'lyrics',
        url: null,
        lyricsText,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      const musicText = screen.getByTestId('music-text')
      expect(musicText).toBeInTheDocument()
      expect(musicText).toHaveTextContent("Verse 1: Test lyrics here More lyrics")
      expect(musicText).toHaveClass('text-lg', 'leading-relaxed')
    })
  })

  describe('Error States', () => {
    it('displays unsupported format message', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'unsupported',
        url: null,
        lyricsText: null,
        errorInfo: {
          url: 'https://example.com/very-long-filename-that-should-be-truncated.unknown',
          mimeType: 'application/unknown'
        }
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      expect(screen.getByText('Unsupported file format')).toBeInTheDocument()
      expect(screen.getByText('Please check that the file is a valid PDF or image')).toBeInTheDocument()
      expect(screen.getByText(/URL:.*MIME: application\/unknown/)).toBeInTheDocument()
    })

    it('displays no sheet music message', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'no-sheet',
        url: null,
        lyricsText: null,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      expect(screen.getByText('No sheet music available')).toBeInTheDocument()
    })

    it('displays no lyrics message', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'no-lyrics',
        url: null,
        lyricsText: null,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      expect(screen.getByText('No lyrics available for this song')).toBeInTheDocument()
    })
  })

  describe('Zoom Functionality', () => {
    it('applies correct zoom transform at 100% zoom', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'lyrics',
        url: null,
        lyricsText: 'Test lyrics',
        errorInfo: null
      }

      const { container } = render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      const contentDiv = container.firstChild as HTMLElement
      expect(contentDiv).toHaveStyle({
        transform: 'scale(1)',
        transformOrigin: 'top center',
        width: '100%',
        maxWidth: '100%'
      })
    })

    it('applies correct zoom transform at 150% zoom', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'lyrics',
        url: null,
        lyricsText: 'Test lyrics',
        errorInfo: null
      }

      const { container } = render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={150}
        />
      )

      const contentDiv = container.firstChild as HTMLElement
      expect(contentDiv).toHaveStyle({
        transform: 'scale(1.5)',
        transformOrigin: 'top center'
      })
      expect(contentDiv.style.width).toMatch(/66\.666666666666\d*%/)
      expect(contentDiv.style.maxWidth).toMatch(/66\.666666666666\d*%/)
    })

    it('applies correct zoom transform at 50% zoom', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'lyrics',
        url: null,
        lyricsText: 'Test lyrics',
        errorInfo: null
      }

      const { container } = render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={50}
        />
      )

      const contentDiv = container.firstChild as HTMLElement
      expect(contentDiv).toHaveStyle({
        transform: 'scale(0.5)',
        transformOrigin: 'top center',
        width: '100%',
        maxWidth: '100%'
      })
    })

    it('applies correct zoom transform at 200% zoom', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'lyrics',
        url: null,
        lyricsText: 'Test lyrics',
        errorInfo: null
      }

      const { container } = render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={200}
        />
      )

      const contentDiv = container.firstChild as HTMLElement
      expect(contentDiv).toHaveStyle({
        transform: 'scale(2)',
        transformOrigin: 'top center',
        width: '50%', // 10000 / 200
        maxWidth: '50%'
      })
    })
  })

  describe('Live Performance Critical Scenarios', () => {
    it('handles rapid content type switching', () => {
      const lyricsRenderInfo: ContentRenderInfo = {
        renderType: 'lyrics',
        url: null,
        lyricsText: 'Test lyrics',
        errorInfo: null
      }

      const { rerender } = render(
        <ContentDisplay 
          renderInfo={lyricsRenderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      expect(screen.getByTestId('music-text')).toBeInTheDocument()

      const pdfRenderInfo: ContentRenderInfo = {
        renderType: 'pdf',
        url: 'https://example.com/test.pdf',
        lyricsText: null,
        errorInfo: null
      }

      rerender(
        <ContentDisplay 
          renderInfo={pdfRenderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()
      expect(screen.queryByTestId('music-text')).not.toBeInTheDocument()
    })

    it('maintains performance with high zoom levels', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'image',
        url: 'https://example.com/large-sheet.jpg',
        lyricsText: null,
        errorInfo: null
      }

      const { container } = render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={300}
        />
      )

      const contentDiv = container.firstChild as HTMLElement
      expect(contentDiv).toHaveStyle({
        transform: 'scale(3)',
        width: '33.333333333333336%' // 10000 / 300
      })

      const image = screen.getByRole('img')
      expect(image).toBeInTheDocument()
    })

    it('handles missing URLs gracefully during live performance', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'image',
        url: '', // Empty URL
        lyricsText: null,
        errorInfo: null
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      const image = screen.getByRole('img')
      expect(image).toHaveAttribute('src', '')
    })

    it('shows appropriate error details for debugging during performance', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'unsupported',
        url: null,
        lyricsText: null,
        errorInfo: {
          url: 'https://example.com/problematic-file-with-very-long-name-that-needs-truncation.badformat',
          mimeType: 'application/octet-stream'
        }
      }

      render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      // Should show truncated URL for debugging without overwhelming the UI
      const errorText = screen.getByText(/URL:.*MIME: application\/octet-stream/)
      expect(errorText).toBeInTheDocument()
      expect(errorText.textContent).toContain('https://example.com/problematic-file-with-very-')
    })
  })

  describe('Content Container Properties', () => {
    it('applies consistent container styling', () => {
      const renderInfo: ContentRenderInfo = {
        renderType: 'lyrics',
        url: null,
        lyricsText: 'Test lyrics',
        errorInfo: null
      }

      const { container } = render(
        <ContentDisplay 
          renderInfo={renderInfo}
          currentSongData={mockSongData}
          currentSong={0}
          zoom={100}
        />
      )

      const contentDiv = container.firstChild as HTMLElement
      expect(contentDiv).toHaveClass('space-y-6', 'max-w-3xl', 'mx-auto', 'w-full')
    })

    it('maintains container properties across different render types', () => {
      const testCases = [
        { renderType: 'pdf' as const, url: 'test.pdf', lyricsText: null },
        { renderType: 'image' as const, url: 'test.jpg', lyricsText: null },
        { renderType: 'lyrics' as const, url: null, lyricsText: 'test lyrics' },
        { renderType: 'no-sheet' as const, url: null, lyricsText: null },
        { renderType: 'no-lyrics' as const, url: null, lyricsText: null }
      ]

      testCases.forEach((testCase) => {
        const renderInfo: ContentRenderInfo = {
          ...testCase,
          errorInfo: null
        }

        const { container } = render(
          <ContentDisplay 
            renderInfo={renderInfo}
            currentSongData={mockSongData}
            currentSong={0}
            zoom={100}
          />
        )

        const contentDiv = container.firstChild as HTMLElement
        expect(contentDiv).toHaveClass('space-y-6', 'max-w-3xl', 'mx-auto', 'w-full')
      })
    })
  })
})