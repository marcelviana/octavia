import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NavigationContainer } from '../navigation-container'
import { FileUpload } from '../file-upload'
import { ChordEditor } from '../chord-editor'
import { ContentType } from '@/types/content'

// Mock external dependencies
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

vi.mock('@/lib/storage-service', () => ({
  uploadFileToStorage: vi.fn().mockResolvedValue({ url: 'https://example.com/test.pdf' }),
  testStoragePermissions: vi.fn().mockResolvedValue({ canUpload: true })
}))

vi.mock('@/lib/content-type-styles', () => ({
  getContentTypeStyle: vi.fn(() => ({
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    ring: 'ring-blue-500'
  }))
}))

vi.mock('@/components/sidebar', () => ({
  Sidebar: ({ activeScreen, onNavigate }: any) => (
    <div data-testid="sidebar">
      <button onClick={() => onNavigate('library')}>Library</button>
      <button onClick={() => onNavigate('editor')}>Editor</button>
      <button onClick={() => onNavigate('performance')}>Performance</button>
      <span data-testid="current-screen">{activeScreen}</span>
    </div>
  )
}))

vi.mock('@/components/bottom-nav', () => ({
  BottomNav: ({ activeScreen, onNavigate }: any) => (
    <div data-testid="bottom-nav">
      <button onClick={() => onNavigate('library')}>Library</button>
      <button onClick={() => onNavigate('editor')}>Editor</button>
      <button onClick={() => onNavigate('performance')}>Performance</button>
      <span data-testid="current-screen">{activeScreen}</span>
    </div>
  )
}))

vi.mock('@/components/music-text', () => ({
  MusicText: ({ text, className }: any) => (
    <div data-testid="music-text" className={className}>
      {text}
    </div>
  )
}))

// Mock window.matchMedia for responsive navigation
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

describe('User Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Navigation Flow', () => {
    it('allows user to navigate between different screens', async () => {
      const user = userEvent.setup()
      const mockOnNavigate = vi.fn()
      
      render(
        <NavigationContainer
          activeScreen="home"
          onNavigate={mockOnNavigate}
        />
      )
      
      // Navigate to library
      await user.click(screen.getByText('Library'))
      expect(mockOnNavigate).toHaveBeenCalledWith('library')
      
      // Navigate to editor
      await user.click(screen.getByText('Editor'))
      expect(mockOnNavigate).toHaveBeenCalledWith('editor')
      
      // Navigate to performance
      await user.click(screen.getByText('Performance'))
      expect(mockOnNavigate).toHaveBeenCalledWith('performance')
    })

    it('maintains navigation state across screen changes', () => {
      const mockOnNavigate = vi.fn()
      const { rerender } = render(
        <NavigationContainer
          activeScreen="library"
          onNavigate={mockOnNavigate}
        />
      )
      
      expect(screen.getByTestId('current-screen')).toHaveTextContent('library')
      
      rerender(
        <NavigationContainer
          activeScreen="editor"
          onNavigate={mockOnNavigate}
        />
      )
      
      expect(screen.getByTestId('current-screen')).toHaveTextContent('editor')
    })
  })

  describe('Content Creation Flow', () => {
    it('enables complete content creation workflow', async () => {
      const user = userEvent.setup()
      const mockOnFilesUploaded = vi.fn()
      const mockOnChange = vi.fn()
      
      // Step 1: File Upload
      const uploadContainer = render(
        <FileUpload
          onFilesUploaded={mockOnFilesUploaded}
          contentType={ContentType.LYRICS}
        />
      )
      
      expect(screen.getByText('Upload your music files')).toBeInTheDocument()
      expect(screen.getByText('Choose Files')).toBeInTheDocument()
      
      uploadContainer.unmount()
      
      // Step 2: Content Editing
      const mockContent = {
        title: 'New Song',
        artist: 'Test Artist',
        key: 'C',
        sections: [
          { id: 1, name: 'Verse 1', chords: 'C G Am F', lyrics: 'Test lyrics' }
        ]
      }
      
      render(
        <ChordEditor
          content={mockContent}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByDisplayValue('New Song')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Artist')).toBeInTheDocument()
      expect(screen.getByDisplayValue('C G Am F')).toBeInTheDocument()
      
      // Test editing functionality
      const titleInput = screen.getByDisplayValue('New Song')
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Song Title')
      
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles content type switching in upload workflow', () => {
      const mockOnFilesUploaded = vi.fn()
      const { rerender } = render(
        <FileUpload
          onFilesUploaded={mockOnFilesUploaded}
          contentType={ContentType.LYRICS}
        />
      )
      
      expect(screen.getByText('Supports PDF, DOCX, and text files')).toBeInTheDocument()
      
      rerender(
        <FileUpload
          onFilesUploaded={mockOnFilesUploaded}
          contentType={ContentType.SHEET}
        />
      )
      
      expect(screen.getByText('Supports PDF and image files (PNG, JPG, JPEG)')).toBeInTheDocument()
    })
  })

  describe('Multi-Component Interaction', () => {
    it('demonstrates component independence and modularity', () => {
      // Test that components can be rendered independently
      
      // Test navigation component
      const navContainer = render(
        <NavigationContainer
          activeScreen="editor"
          onNavigate={() => {}}
        />
      )
      
      expect(screen.getByTestId('current-screen')).toHaveTextContent('editor')
      navContainer.unmount()
      
      // Test chord editor component
      const content = {
        title: 'Test Song',
        artist: 'Test Artist',
        sections: [{ id: 1, name: 'Verse', chords: 'C G', lyrics: 'Test' }]
      }
      
      const editorContainer = render(
        <ChordEditor
          content={content}
          onChange={() => {}}
        />
      )
      
      expect(screen.getByDisplayValue('Test Song')).toBeInTheDocument()
      editorContainer.unmount()
      
      // Test file upload component
      render(
        <FileUpload
          onFilesUploaded={() => {}}
          contentType={ContentType.LYRICS}
        />
      )
      
      expect(screen.getByText('Upload your music files')).toBeInTheDocument()
    })
  })

  describe('Performance and Responsiveness', () => {
    it('handles rapid component switching without performance issues', async () => {
      const user = userEvent.setup()
      const mockOnNavigate = vi.fn()
      
      render(
        <NavigationContainer
          activeScreen="home"
          onNavigate={mockOnNavigate}
        />
      )
      
      const startTime = Date.now()
      
      // Rapidly click between navigation items
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByText('Library'))
        await user.click(screen.getByText('Editor'))
        await user.click(screen.getByText('Performance'))
      }
      
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      // Should handle rapid interactions efficiently
      expect(totalTime).toBeLessThan(1000)
      expect(mockOnNavigate).toHaveBeenCalledTimes(15)
    })

    it('maintains component stability under stress conditions', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      
      const content = {
        title: 'Stress Test Song',
        artist: 'Test Artist',
        sections: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Section ${i + 1}`,
          chords: 'C G Am F',
          lyrics: `Lyrics for section ${i + 1}`
        }))
      }
      
      render(
        <ChordEditor
          content={content}
          onChange={mockOnChange}
        />
      )
      
      // Should render complex content without issues
      expect(screen.getByDisplayValue('Stress Test Song')).toBeInTheDocument()
      expect(screen.getAllByText(/Section \d+/)).toHaveLength(10)
      
      // Test rapid editing
      const titleInput = screen.getByDisplayValue('Stress Test Song')
      
      for (let i = 0; i < 5; i++) {
        await user.type(titleInput, ' Updated')
      }
      
      // Should handle rapid edits without crashing
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Error Boundaries and Resilience', () => {
    it('gracefully handles missing or invalid props', () => {
      // Test components with minimal props
      expect(() => {
        render(
          <NavigationContainer
            activeScreen="test"
            onNavigate={() => {}}
          />
        )
      }).not.toThrow()
      
      expect(() => {
        render(
          <FileUpload
            onFilesUploaded={() => {}}
          />
        )
      }).not.toThrow()
      
      expect(() => {
        render(
          <ChordEditor
            content={{}}
            onChange={() => {}}
          />
        )
      }).not.toThrow()
    })

    it('handles component unmounting cleanly', () => {
      const components = [
        () => (
          <NavigationContainer
            activeScreen="test"
            onNavigate={() => {}}
          />
        ),
        () => (
          <FileUpload
            onFilesUploaded={() => {}}
          />
        ),
        () => (
          <ChordEditor
            content={{ title: 'Test' }}
            onChange={() => {}}
          />
        )
      ]
      
      components.forEach(Component => {
        const { unmount } = render(<Component />)
        expect(() => unmount()).not.toThrow()
      })
    })
  })

  describe('Live Performance Readiness', () => {
    it('demonstrates components work together for live music scenarios', () => {
      // Test each component in sequence to demonstrate workflow
      
      // Step 1: File Upload
      const uploadContainer = render(
        <FileUpload
          onFilesUploaded={() => {}}
          contentType={ContentType.LYRICS}
        />
      )
      
      expect(screen.getByText('Upload your music files')).toBeInTheDocument()
      uploadContainer.unmount()
      
      // Step 2: Content Editing
      const content = {
        title: 'Live Song',
        artist: 'Live Artist',
        sections: [{ id: 1, name: 'Verse', chords: 'G D Em C', lyrics: 'Live performance lyrics' }]
      }
      
      const editorContainer = render(
        <ChordEditor
          content={content}
          onChange={() => {}}
        />
      )
      
      expect(screen.getByDisplayValue('Live Song')).toBeInTheDocument()
      editorContainer.unmount()
      
      // Step 3: Navigation
      render(
        <NavigationContainer
          activeScreen="performance"
          onNavigate={() => {}}
        />
      )
      
      expect(screen.getByTestId('current-screen')).toHaveTextContent('performance')
    })

    it('ensures components respond quickly for live performance', async () => {
      const user = userEvent.setup()
      const mockOnNavigate = vi.fn()
      
      render(
        <NavigationContainer
          activeScreen="performance"
          onNavigate={mockOnNavigate}
        />
      )
      
      const startTime = Date.now()
      await user.click(screen.getByText('Library'))
      const responseTime = Date.now() - startTime
      
      // Navigation should be immediate for live performance
      expect(responseTime).toBeLessThan(50)
      expect(mockOnNavigate).toHaveBeenCalledWith('library')
    })
  })
})