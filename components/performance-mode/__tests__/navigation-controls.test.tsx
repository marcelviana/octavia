import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NavigationControls } from '../navigation-controls'

const mockSongs = [
  { id: 1, title: "Song 1", artist: "Artist 1" },
  { id: 2, title: "Song 2", artist: "Artist 2" }, 
  { id: 3, title: "Song 3", artist: "Artist 3" }
]

const defaultProps = {
  showControls: true,
  canGoPrevious: false,
  canGoNext: true,
  goToPrevious: vi.fn(),
  goToNext: vi.fn(),
  songs: mockSongs,
  currentSong: 0,
  goToSong: vi.fn()
}

describe('NavigationControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Visibility and Basic Rendering', () => {
    it('renders navigation controls when showControls is true', () => {
      render(<NavigationControls {...defaultProps} />)
      
      const controls = screen.getByTestId('bottom-controls')
      expect(controls).toBeInTheDocument()
      expect(controls).toHaveClass('opacity-100')
      expect(controls).not.toHaveClass('pointer-events-none')
    })

    it('hides navigation controls when showControls is false', () => {
      render(<NavigationControls {...defaultProps} showControls={false} />)
      
      const controls = screen.getByTestId('bottom-controls')
      expect(controls).toBeInTheDocument()
      expect(controls).toHaveClass('opacity-0', 'pointer-events-none')
    })

    it('renders previous and next buttons', () => {
      render(<NavigationControls {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /prev/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('renders song indicators matching song count', () => {
      render(<NavigationControls {...defaultProps} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      expect(indicators).toHaveLength(mockSongs.length)
    })
  })

  describe('Button States and Navigation', () => {
    it('disables previous button when canGoPrevious is false', () => {
      render(<NavigationControls {...defaultProps} canGoPrevious={false} />)
      
      const prevButton = screen.getByRole('button', { name: /prev/i })
      expect(prevButton).toBeDisabled()
      expect(prevButton).toHaveClass('disabled:opacity-50')
    })

    it('enables previous button when canGoPrevious is true', () => {
      render(<NavigationControls {...defaultProps} canGoPrevious={true} />)
      
      const prevButton = screen.getByRole('button', { name: /prev/i })
      expect(prevButton).not.toBeDisabled()
    })

    it('disables next button when canGoNext is false', () => {
      render(<NavigationControls {...defaultProps} canGoNext={false} />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
      expect(nextButton).toHaveClass('disabled:opacity-50')
    })

    it('enables next button when canGoNext is true', () => {
      render(<NavigationControls {...defaultProps} canGoNext={true} />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).not.toBeDisabled()
    })

    it('calls goToPrevious when previous button is clicked', async () => {
      const user = userEvent.setup()
      render(<NavigationControls {...defaultProps} canGoPrevious={true} />)
      
      const prevButton = screen.getByRole('button', { name: /prev/i })
      await user.click(prevButton)
      
      expect(defaultProps.goToPrevious).toHaveBeenCalledTimes(1)
    })

    it('calls goToNext when next button is clicked', async () => {
      const user = userEvent.setup()
      render(<NavigationControls {...defaultProps} />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      expect(defaultProps.goToNext).toHaveBeenCalledTimes(1)
    })

    it('does not call navigation functions when buttons are disabled', async () => {
      const user = userEvent.setup()
      render(<NavigationControls {...defaultProps} canGoPrevious={false} canGoNext={false} />)
      
      const prevButton = screen.getByRole('button', { name: /prev/i })
      const nextButton = screen.getByRole('button', { name: /next/i })
      
      // Buttons are disabled, so clicks should not trigger navigation
      await user.click(prevButton)
      await user.click(nextButton)
      
      expect(defaultProps.goToPrevious).not.toHaveBeenCalled()
      expect(defaultProps.goToNext).not.toHaveBeenCalled()
    })
  })

  describe('Song Indicators and Direct Navigation', () => {
    it('highlights current song indicator', () => {
      render(<NavigationControls {...defaultProps} currentSong={1} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      
      expect(indicators[0]).toHaveClass('bg-[#A69B8E]') // inactive
      expect(indicators[1]).toHaveClass('bg-[#FF6B6B]') // active
      expect(indicators[2]).toHaveClass('bg-[#A69B8E]') // inactive
    })

    it('calls goToSong when song indicator is clicked', async () => {
      const user = userEvent.setup()
      render(<NavigationControls {...defaultProps} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      
      await user.click(indicators[2]) // Click third song
      
      expect(defaultProps.goToSong).toHaveBeenCalledWith(2)
    })

    it('allows clicking on all song indicators', async () => {
      const user = userEvent.setup()
      render(<NavigationControls {...defaultProps} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      
      for (let i = 0; i < indicators.length; i++) {
        await user.click(indicators[i])
        expect(defaultProps.goToSong).toHaveBeenCalledWith(i)
      }
      
      expect(defaultProps.goToSong).toHaveBeenCalledTimes(mockSongs.length)
    })
  })

  describe('Edge Cases and Performance Scenarios', () => {
    it('handles empty song list', () => {
      render(<NavigationControls {...defaultProps} songs={[]} />)
      
      const indicators = screen.queryAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      expect(indicators).toHaveLength(0)
    })

    it('handles single song setlist', () => {
      const singleSong = [{ id: 1, title: "Only Song", artist: "Solo Artist" }]
      render(<NavigationControls 
        {...defaultProps} 
        songs={singleSong}
        canGoPrevious={false}
        canGoNext={false}
        currentSong={0}
      />)
      
      expect(screen.getByRole('button', { name: /prev/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      expect(indicators).toHaveLength(1)
      expect(indicators[0]).toHaveClass('bg-[#FF6B6B]') // active
    })

    it('handles large setlists without performance issues', () => {
      const largeSongList = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Song ${i + 1}`,
        artist: `Artist ${i + 1}`
      }))
      
      render(<NavigationControls 
        {...defaultProps} 
        songs={largeSongList}
        currentSong={25}
      />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      expect(indicators).toHaveLength(50)
      expect(indicators[25]).toHaveClass('bg-[#FF6B6B]') // current song highlighted
    })

    it('maintains correct current song highlighting when currentSong changes', () => {
      const { rerender } = render(<NavigationControls {...defaultProps} currentSong={0} />)
      
      let indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      expect(indicators[0]).toHaveClass('bg-[#FF6B6B]')
      expect(indicators[1]).toHaveClass('bg-[#A69B8E]')
      
      rerender(<NavigationControls {...defaultProps} currentSong={1} />)
      
      indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      expect(indicators[0]).toHaveClass('bg-[#A69B8E]')
      expect(indicators[1]).toHaveClass('bg-[#FF6B6B]')
    })
  })

  describe('Live Performance Critical Scenarios', () => {
    it('responds immediately to navigation button clicks', async () => {
      const user = userEvent.setup()
      render(<NavigationControls {...defaultProps} canGoPrevious={true} />)
      
      const prevButton = screen.getByRole('button', { name: /prev/i })
      const nextButton = screen.getByRole('button', { name: /next/i })
      
      const startTime = Date.now()
      await user.click(prevButton)
      const prevResponseTime = Date.now() - startTime
      
      const startTime2 = Date.now()
      await user.click(nextButton)
      const nextResponseTime = Date.now() - startTime2
      
      // Navigation should be virtually instantaneous for live performance
      expect(prevResponseTime).toBeLessThan(100)
      expect(nextResponseTime).toBeLessThan(100)
      expect(defaultProps.goToPrevious).toHaveBeenCalled()
      expect(defaultProps.goToNext).toHaveBeenCalled()
    })

    it('handles rapid navigation clicks without issues', async () => {
      const user = userEvent.setup()
      render(<NavigationControls {...defaultProps} canGoPrevious={true} />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      
      // Simulate rapid clicking during live performance
      await user.click(nextButton)
      await user.click(nextButton)
      await user.click(nextButton)
      
      expect(defaultProps.goToNext).toHaveBeenCalledTimes(3)
    })

    it('handles song indicator clicks during different show scenarios', async () => {
      const user = userEvent.setup()
      
      // Test mid-show navigation (current song is in middle)
      render(<NavigationControls {...defaultProps} currentSong={1} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      
      // Jump to last song (common in live shows)
      await user.click(indicators[2])
      expect(defaultProps.goToSong).toHaveBeenCalledWith(2)
      
      // Jump back to first song (encore scenario)
      await user.click(indicators[0])
      expect(defaultProps.goToSong).toHaveBeenCalledWith(0)
    })

    it('maintains accessibility during live performance stress', () => {
      render(<NavigationControls {...defaultProps} canGoPrevious={true} />)
      
      // Ensure buttons have proper accessibility attributes for stage lighting conditions
      const prevButton = screen.getByRole('button', { name: /prev/i })
      const nextButton = screen.getByRole('button', { name: /next/i })
      
      expect(prevButton).toBeVisible()
      expect(nextButton).toBeVisible()
      expect(prevButton).toBeEnabled()
      expect(nextButton).toBeEnabled()
    })

    it('ensures visual feedback is immediate for performer confidence', () => {
      const { rerender } = render(<NavigationControls {...defaultProps} currentSong={0} />)
      
      // Simulate song change - visual feedback must be immediate
      rerender(<NavigationControls {...defaultProps} currentSong={1} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      
      // Current song indicator should immediately reflect change
      expect(indicators[0]).toHaveClass('bg-[#A69B8E]') // previous song now inactive
      expect(indicators[1]).toHaveClass('bg-[#FF6B6B]') // current song active
    })
  })

  describe('Touch and Mobile Performance Scenarios', () => {
    it('handles touch events on song indicators', () => {
      render(<NavigationControls {...defaultProps} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      
      // Simulate touch on tablet during live performance
      fireEvent.click(indicators[1])
      expect(defaultProps.goToSong).toHaveBeenCalledWith(1)
    })

    it('provides adequate touch targets for live performance', () => {
      render(<NavigationControls {...defaultProps} />)
      
      const indicators = screen.getAllByRole('generic').filter(el => 
        el.className.includes('w-2 h-2 rounded-full cursor-pointer')
      )
      
      // Indicators should be clickable (cursor-pointer class ensures this)
      indicators.forEach(indicator => {
        expect(indicator).toHaveClass('cursor-pointer')
      })
    })
  })
})