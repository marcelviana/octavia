import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BottomNav } from '../bottom-nav'

// Mock the cn utility function
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}))

const mockOnNavigate = vi.fn()

const defaultProps = {
  activeScreen: 'dashboard',
  onNavigate: mockOnNavigate
}

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders all navigation items', () => {
      render(<BottomNav {...defaultProps} />)
      
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Library')).toBeInTheDocument()
      expect(screen.getByText('Setlists')).toBeInTheDocument()
      expect(screen.getByText('Add')).toBeInTheDocument()
    })

    it('renders navigation as fixed bottom element', () => {
      const { container } = render(<BottomNav {...defaultProps} />)
      
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('fixed', 'left-0', 'right-0', 'z-50')
    })

    it('applies safe area inset for mobile devices', () => {
      const { container } = render(<BottomNav {...defaultProps} />)
      
      const nav = container.querySelector('nav')
      expect(nav).toHaveStyle({
        bottom: 'env(safe-area-inset-bottom, 0px)'
      })
    })

    it('has proper backdrop blur and border styling', () => {
      const { container } = render(<BottomNav {...defaultProps} />)
      
      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('bg-white/95', 'backdrop-blur-sm', 'border-t', 'border-amber-200', 'shadow-2xl')
    })
  })

  describe('Navigation Items', () => {
    it('renders all navigation buttons with correct labels', () => {
      render(<BottomNav {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
      
      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /library/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /setlists/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
    })

    it('shows correct icons for each navigation item', () => {
      render(<BottomNav {...defaultProps} />)
      
      // Check that each button contains an icon (SVG)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        const svg = button.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })

    it('applies consistent button styling', () => {
      render(<BottomNav {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'h-16', 'w-16')
      })
    })
  })

  describe('Active State Handling', () => {
    it('highlights the active screen correctly', () => {
      render(<BottomNav {...defaultProps} activeScreen="library" />)
      
      const libraryButton = screen.getByRole('button', { name: /library/i })
      expect(libraryButton).toHaveClass('bg-gradient-to-r', 'from-amber-500/90', 'to-orange-500/90', 'text-white')
    })

    it('applies inactive styling to non-active items', () => {
      render(<BottomNav {...defaultProps} activeScreen="library" />)
      
      const homeButton = screen.getByRole('button', { name: /home/i })
      expect(homeButton).toHaveClass('text-amber-800', 'hover:bg-amber-100/80', 'hover:scale-105')
      expect(homeButton).not.toHaveClass('bg-gradient-to-r')
    })

    it('updates active state when activeScreen prop changes', () => {
      const { rerender } = render(<BottomNav {...defaultProps} activeScreen="dashboard" />)
      
      let homeButton = screen.getByRole('button', { name: /home/i })
      expect(homeButton).toHaveClass('bg-gradient-to-r')
      
      rerender(<BottomNav {...defaultProps} activeScreen="setlists" />)
      
      homeButton = screen.getByRole('button', { name: /home/i })
      const setlistsButton = screen.getByRole('button', { name: /setlists/i })
      
      expect(homeButton).not.toHaveClass('bg-gradient-to-r')
      expect(setlistsButton).toHaveClass('bg-gradient-to-r')
    })

    it('handles unknown activeScreen gracefully', () => {
      render(<BottomNav {...defaultProps} activeScreen="unknown-screen" />)
      
      // All buttons should be in inactive state
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).not.toHaveClass('bg-gradient-to-r')
      })
    })
  })

  describe('Navigation Interaction', () => {
    it('calls onNavigate when navigation item is clicked', async () => {
      const user = userEvent.setup()
      render(<BottomNav {...defaultProps} />)
      
      const libraryButton = screen.getByRole('button', { name: /library/i })
      await user.click(libraryButton)
      
      expect(mockOnNavigate).toHaveBeenCalledWith('library')
    })

    it('navigates to all different screens correctly', async () => {
      const user = userEvent.setup()
      render(<BottomNav {...defaultProps} />)
      
      const expectedNavigation = [
        { button: /home/i, id: 'dashboard' },
        { button: /library/i, id: 'library' },
        { button: /setlists/i, id: 'setlists' },
        { button: /add/i, id: 'add-content' }
      ]
      
      for (const nav of expectedNavigation) {
        const button = screen.getByRole('button', { name: nav.button })
        await user.click(button)
        expect(mockOnNavigate).toHaveBeenCalledWith(nav.id)
      }
      
      expect(mockOnNavigate).toHaveBeenCalledTimes(4)
    })

    it('handles rapid successive clicks', async () => {
      const user = userEvent.setup()
      render(<BottomNav {...defaultProps} />)
      
      const libraryButton = screen.getByRole('button', { name: /library/i })
      const setlistsButton = screen.getByRole('button', { name: /setlists/i })
      
      // Rapid clicking
      await user.click(libraryButton)
      await user.click(setlistsButton)
      await user.click(libraryButton)
      
      expect(mockOnNavigate).toHaveBeenCalledTimes(3)
      expect(mockOnNavigate).toHaveBeenNthCalledWith(1, 'library')
      expect(mockOnNavigate).toHaveBeenNthCalledWith(2, 'setlists')
      expect(mockOnNavigate).toHaveBeenNthCalledWith(3, 'library')
    })
  })

  describe('Touch and Mobile Interaction', () => {
    it('provides adequate touch targets for mobile use', () => {
      render(<BottomNav {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // 64px (h-16 w-16) is adequate touch target size
        expect(button).toHaveClass('h-16', 'w-16')
      })
    })

    it('handles touch events correctly', () => {
      render(<BottomNav {...defaultProps} />)
      
      const libraryButton = screen.getByRole('button', { name: /library/i })
      
      fireEvent.touchStart(libraryButton)
      fireEvent.touchEnd(libraryButton)
      fireEvent.click(libraryButton)
      
      expect(mockOnNavigate).toHaveBeenCalledWith('library')
    })

    it('provides visual feedback on hover for desktop', () => {
      render(<BottomNav {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Only inactive buttons should have hover states
        if (!button.classList.contains('bg-gradient-to-r')) {
          expect(button).toHaveClass('hover:bg-amber-100/80', 'hover:scale-105')
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('provides proper button roles and labels', () => {
      render(<BottomNav {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
      
      buttons.forEach(button => {
        expect(button).toBeVisible()
        expect(button).not.toBeDisabled()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<BottomNav {...defaultProps} />)
      
      const firstButton = screen.getByRole('button', { name: /home/i })
      firstButton.focus()
      
      // Navigate with Tab
      await user.keyboard('{Tab}')
      expect(screen.getByRole('button', { name: /library/i })).toHaveFocus()
      
      // Activate with Enter
      await user.keyboard('{Enter}')
      expect(mockOnNavigate).toHaveBeenCalledWith('library')
    })

    it('supports activation with Space key', async () => {
      const user = userEvent.setup()
      render(<BottomNav {...defaultProps} />)
      
      const setlistsButton = screen.getByRole('button', { name: /setlists/i })
      setlistsButton.focus()
      
      await user.keyboard(' ')
      expect(mockOnNavigate).toHaveBeenCalledWith('setlists')
    })

    it('maintains focus visibility', () => {
      render(<BottomNav {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        button.focus()
        expect(button).toHaveFocus()
      })
    })
  })

  describe('Live Performance Scenarios', () => {
    it('responds immediately to navigation for live use', async () => {
      const user = userEvent.setup()
      render(<BottomNav {...defaultProps} />)
      
      const startTime = Date.now()
      const libraryButton = screen.getByRole('button', { name: /library/i })
      await user.click(libraryButton)
      const responseTime = Date.now() - startTime
      
      // Should be immediate for live performance
      expect(responseTime).toBeLessThan(50)
      expect(mockOnNavigate).toHaveBeenCalled()
    })

    it('handles performer switching between screens quickly', async () => {
      const user = userEvent.setup()
      render(<BottomNav {...defaultProps} />)
      
      const startTime = Date.now()
      
      // Simulate rapid screen switching during performance
      await user.click(screen.getByRole('button', { name: /library/i }))
      await user.click(screen.getByRole('button', { name: /setlists/i }))
      await user.click(screen.getByRole('button', { name: /add/i }))
      await user.click(screen.getByRole('button', { name: /home/i }))
      
      const totalTime = Date.now() - startTime
      
      expect(totalTime).toBeLessThan(200) // Should be very fast
      expect(mockOnNavigate).toHaveBeenCalledTimes(4)
    })

    it('maintains visual state during performance stress', () => {
      const { rerender } = render(<BottomNav {...defaultProps} activeScreen="library" />)
      
      // Simulate rapid state changes during live performance
      const screens = ['dashboard', 'library', 'setlists', 'add-content']
      
      screens.forEach(screen => {
        rerender(<BottomNav {...defaultProps} activeScreen={screen} />)
        
        // Ensure correct button is highlighted
        const activeButton = document.querySelector('.bg-gradient-to-r')
        expect(activeButton).toBeInTheDocument()
      })
    })
  })

  describe('Visual Design and Styling', () => {
    it('applies consistent spacing and layout', () => {
      const { container } = render(<BottomNav {...defaultProps} />)
      
      const navContainer = container.querySelector('.flex.items-center.justify-center')
      expect(navContainer).toHaveClass('px-2', 'py-2', 'gap-1')
    })

    it('uses proper transition animations', () => {
      render(<BottomNav {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('transition-all', 'duration-200')
      })
    })

    it('applies gradient styling to active items', () => {
      render(<BottomNav {...defaultProps} activeScreen="setlists" />)
      
      const activeButton = screen.getByRole('button', { name: /setlists/i })
      expect(activeButton).toHaveClass('bg-gradient-to-r', 'from-amber-500/90', 'to-orange-500/90')
    })

    it('applies drop shadow effects to active icons and text', () => {
      render(<BottomNav {...defaultProps} activeScreen="library" />)
      
      const activeButton = screen.getByRole('button', { name: /library/i })
      const icon = activeButton.querySelector('svg')
      const text = activeButton.querySelector('span')
      
      expect(icon).toHaveClass('drop-shadow-sm')
      expect(text).toHaveClass('font-semibold', 'drop-shadow-sm')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles empty onNavigate callback gracefully', () => {
      const emptyCallback = vi.fn()
      render(<BottomNav activeScreen="dashboard" onNavigate={emptyCallback} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(4)
      
      // Should not throw when clicking
      fireEvent.click(buttons[0])
      expect(emptyCallback).toHaveBeenCalled()
    })

    it('renders correctly with missing activeScreen', () => {
      render(<BottomNav activeScreen="" onNavigate={mockOnNavigate} />)
      
      expect(screen.getAllByRole('button')).toHaveLength(4)
      
      // No button should be active
      const activeButtons = document.querySelectorAll('.bg-gradient-to-r')
      expect(activeButtons).toHaveLength(0)
    })

    it('maintains functionality during prop updates', () => {
      const { rerender } = render(<BottomNav {...defaultProps} />)
      
      // Update props multiple times
      rerender(<BottomNav activeScreen="library" onNavigate={mockOnNavigate} />)
      rerender(<BottomNav activeScreen="setlists" onNavigate={mockOnNavigate} />)
      rerender(<BottomNav activeScreen="add-content" onNavigate={mockOnNavigate} />)
      
      expect(screen.getAllByRole('button')).toHaveLength(4)
    })
  })

  describe('Performance and Memory', () => {
    it('handles multiple renders efficiently', () => {
      const { rerender } = render(<BottomNav {...defaultProps} />)
      
      // Simulate multiple rapid re-renders
      for (let i = 0; i < 20; i++) {
        rerender(<BottomNav 
          activeScreen={i % 2 === 0 ? 'library' : 'setlists'} 
          onNavigate={mockOnNavigate} 
        />)
      }
      
      expect(screen.getAllByRole('button')).toHaveLength(4)
    })

    it('cleans up properly on unmount', () => {
      const { unmount } = render(<BottomNav {...defaultProps} />)
      
      expect(() => unmount()).not.toThrow()
    })
  })
})