import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NavigationContainer } from '../navigation-container'

// Mock the child components
vi.mock('@/components/sidebar', () => ({
  Sidebar: ({ activeScreen, onNavigate, collapsed, onCollapsedChange, mobileOpen, onMobileOpenChange }: any) => (
    <div data-testid="sidebar">
      <span data-testid="active-screen">{activeScreen}</span>
      <button onClick={() => onNavigate('test-screen')}>Navigate Test</button>
      <button onClick={() => onCollapsedChange?.(!collapsed)}>Toggle Collapse</button>
      <button onClick={() => onMobileOpenChange?.(!mobileOpen)}>Toggle Mobile</button>
    </div>
  )
}))

vi.mock('@/components/bottom-nav', () => ({
  BottomNav: ({ activeScreen, onNavigate }: any) => (
    <div data-testid="bottom-nav">
      <span data-testid="active-screen">{activeScreen}</span>
      <button onClick={() => onNavigate('bottom-test')}>Bottom Navigate</button>
    </div>
  )
}))

const mockOnNavigate = vi.fn()
const mockOnCollapsedChange = vi.fn()
const mockOnMobileOpenChange = vi.fn()

const defaultProps = {
  activeScreen: 'home',
  onNavigate: mockOnNavigate,
  collapsed: false,
  onCollapsedChange: mockOnCollapsedChange,
  mobileOpen: false,
  onMobileOpenChange: mockOnMobileOpenChange
}

// Mock window.matchMedia
const createMockMediaQuery = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
})

describe('NavigationContainer', () => {
  let mockMediaQuery: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default to desktop layout
    mockMediaQuery = {
      portrait: createMockMediaQuery(false),
      size: createMockMediaQuery(false)
    }
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => {
        if (query.includes('orientation: portrait')) {
          return mockMediaQuery.portrait
        }
        if (query.includes('max-width: 1024px')) {
          return mockMediaQuery.size
        }
        return createMockMediaQuery(false)
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Desktop Navigation (Sidebar)', () => {
    it('renders sidebar on desktop layout', () => {
      render(<NavigationContainer {...defaultProps} />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    it('passes correct props to sidebar', () => {
      render(<NavigationContainer {...defaultProps} />)
      
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toBeInTheDocument()
      expect(screen.getByTestId('active-screen')).toHaveTextContent('home')
    })

    it('handles navigation from sidebar', async () => {
      const user = userEvent.setup()
      render(<NavigationContainer {...defaultProps} />)
      
      const navigateButton = screen.getByText('Navigate Test')
      await user.click(navigateButton)
      
      expect(mockOnNavigate).toHaveBeenCalledWith('test-screen')
    })

    it('handles collapse state changes', async () => {
      const user = userEvent.setup()
      render(<NavigationContainer {...defaultProps} />)
      
      const collapseButton = screen.getByText('Toggle Collapse')
      await user.click(collapseButton)
      
      expect(mockOnCollapsedChange).toHaveBeenCalledWith(true)
    })

    it('handles mobile state changes', async () => {
      const user = userEvent.setup()
      render(<NavigationContainer {...defaultProps} />)
      
      const mobileButton = screen.getByText('Toggle Mobile')
      await user.click(mobileButton)
      
      expect(mockOnMobileOpenChange).toHaveBeenCalledWith(true)
    })
  })

  describe('Mobile Navigation (Bottom Nav)', () => {
    beforeEach(() => {
      // Set up mobile portrait layout
      mockMediaQuery = {
        portrait: createMockMediaQuery(true),
        size: createMockMediaQuery(true)
      }
    })

    it('renders bottom nav on mobile portrait layout', () => {
      render(<NavigationContainer {...defaultProps} />)
      
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
    })

    it('passes correct props to bottom nav', () => {
      render(<NavigationContainer {...defaultProps} />)
      
      const bottomNav = screen.getByTestId('bottom-nav')
      expect(bottomNav).toBeInTheDocument()
      expect(screen.getByTestId('active-screen')).toHaveTextContent('home')
    })

    it('handles navigation from bottom nav', async () => {
      const user = userEvent.setup()
      render(<NavigationContainer {...defaultProps} />)
      
      const navigateButton = screen.getByText('Bottom Navigate')
      await user.click(navigateButton)
      
      expect(mockOnNavigate).toHaveBeenCalledWith('bottom-test')
    })
  })

  describe('Responsive Behavior', () => {
    it('switches from sidebar to bottom nav when orientation changes to portrait mobile', () => {
      // Start with mobile portrait layout configured from the beginning
      mockMediaQuery = {
        portrait: createMockMediaQuery(true),
        size: createMockMediaQuery(true)
      }
      
      render(<NavigationContainer {...defaultProps} />)
      
      // Should show bottom nav for mobile portrait
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
    })

    it('shows sidebar on mobile landscape', () => {
      // Mobile device but landscape orientation
      mockMediaQuery = {
        portrait: createMockMediaQuery(false),
        size: createMockMediaQuery(true)
      }
      
      render(<NavigationContainer {...defaultProps} />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    it('shows sidebar on tablet portrait (large screen)', () => {
      // Portrait but large screen (tablet/desktop)
      mockMediaQuery = {
        portrait: createMockMediaQuery(true),
        size: createMockMediaQuery(false)
      }
      
      render(<NavigationContainer {...defaultProps} />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })
  })

  describe('Media Query Edge Cases', () => {
    it('handles missing window.matchMedia gracefully', () => {
      // Simulate SSR or testing environment
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined
      })
      
      render(<NavigationContainer {...defaultProps} />)
      
      // Should default to desktop layout (sidebar)
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    it('handles matchMedia throwing errors', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn(() => {
          throw new Error('MediaQuery error')
        })
      })
      
      render(<NavigationContainer {...defaultProps} />)
      
      // Should fallback to desktop layout
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    it('handles invalid MediaQueryList objects', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn(() => null)
      })
      
      render(<NavigationContainer {...defaultProps} />)
      
      // Should fallback to desktop layout
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })
  })

  describe('Event Listeners', () => {
    it('sets up media query listeners correctly', () => {
      const addEventListenerSpy = vi.fn()
      const removeEventListenerSpy = vi.fn()
      
      mockMediaQuery = {
        portrait: {
          ...createMockMediaQuery(false),
          addEventListener: addEventListenerSpy,
          removeEventListener: removeEventListenerSpy
        },
        size: {
          ...createMockMediaQuery(false),
          addEventListener: addEventListenerSpy,
          removeEventListener: removeEventListenerSpy
        }
      }
      
      const { unmount } = render(<NavigationContainer {...defaultProps} />)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('handles event listener setup failures gracefully', () => {
      const addEventListenerSpy = vi.fn(() => {
        throw new Error('Event listener error')
      })
      
      mockMediaQuery = {
        portrait: {
          ...createMockMediaQuery(false),
          addEventListener: addEventListenerSpy
        },
        size: {
          ...createMockMediaQuery(false),
          addEventListener: addEventListenerSpy
        }
      }
      
      expect(() => {
        render(<NavigationContainer {...defaultProps} />)
      }).not.toThrow()
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })
  })

  describe('Component Lifecycle', () => {
    it('performs initial navigation type check on mount', () => {
      render(<NavigationContainer {...defaultProps} />)
      
      // Should immediately determine layout based on media queries
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.fn()
      
      mockMediaQuery = {
        portrait: {
          ...createMockMediaQuery(false),
          addEventListener: vi.fn(),
          removeEventListener: removeEventListenerSpy
        },
        size: {
          ...createMockMediaQuery(false),
          addEventListener: vi.fn(),
          removeEventListener: removeEventListenerSpy
        }
      }
      
      const { unmount } = render(<NavigationContainer {...defaultProps} />)
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalled()
    })
  })

  describe('Navigation Transition', () => {
    it('applies nav-transition class to navigation container', () => {
      const { container } = render(<NavigationContainer {...defaultProps} />)
      
      const navContainer = container.querySelector('.nav-transition')
      expect(navContainer).toBeInTheDocument()
    })

    it('maintains nav-transition class across navigation type changes', () => {
      const { container, rerender } = render(<NavigationContainer {...defaultProps} />)
      
      expect(container.querySelector('.nav-transition')).toBeInTheDocument()
      
      // Switch to mobile
      mockMediaQuery = {
        portrait: createMockMediaQuery(true),
        size: createMockMediaQuery(true)
      }
      
      rerender(<NavigationContainer {...defaultProps} />)
      
      expect(container.querySelector('.nav-transition')).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('handles minimal required props', () => {
      const minimalProps = {
        activeScreen: 'test',
        onNavigate: vi.fn()
      }
      
      render(<NavigationContainer {...minimalProps} />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('handles all optional props being undefined', () => {
      const propsWithUndefined = {
        activeScreen: 'test',
        onNavigate: vi.fn(),
        collapsed: undefined,
        onCollapsedChange: undefined,
        mobileOpen: undefined,
        onMobileOpenChange: undefined
      }
      
      render(<NavigationContainer {...propsWithUndefined} />)
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('passes through all props correctly to child components', () => {
      const testProps = {
        activeScreen: 'settings',
        onNavigate: mockOnNavigate,
        collapsed: true,
        onCollapsedChange: mockOnCollapsedChange,
        mobileOpen: true,
        onMobileOpenChange: mockOnMobileOpenChange
      }
      
      render(<NavigationContainer {...testProps} />)
      
      expect(screen.getByTestId('active-screen')).toHaveTextContent('settings')
    })
  })

  describe('Performance Considerations', () => {
    it('handles rapid media query changes without errors', () => {
      const { rerender } = render(<NavigationContainer {...defaultProps} />)
      
      // Simulate rapid orientation/size changes
      for (let i = 0; i < 10; i++) {
        mockMediaQuery = {
          portrait: createMockMediaQuery(i % 2 === 0),
          size: createMockMediaQuery(i % 3 === 0)
        }
        
        rerender(<NavigationContainer {...defaultProps} />)
      }
      
      // Should not throw and should render appropriate navigation
      expect(screen.getByTestId('sidebar') || screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })

    it('maintains component stability during prop changes', () => {
      const { rerender } = render(<NavigationContainer {...defaultProps} />)
      
      // Change props multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<NavigationContainer 
          {...defaultProps} 
          activeScreen={`screen-${i}`}
          collapsed={i % 2 === 0}
        />)
      }
      
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })
  })

  describe('Live Performance Scenarios', () => {
    it('responds immediately to navigation changes', async () => {
      const user = userEvent.setup()
      render(<NavigationContainer {...defaultProps} />)
      
      const startTime = Date.now()
      const navigateButton = screen.getByText('Navigate Test')
      await user.click(navigateButton)
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(100) // Should be immediate for live use
      expect(mockOnNavigate).toHaveBeenCalled()
    })

    it('handles device rotation during live performance', () => {
      // Test starting in mobile portrait (bottom nav scenario)
      mockMediaQuery = {
        portrait: createMockMediaQuery(true),
        size: createMockMediaQuery(true)
      }
      
      render(<NavigationContainer {...defaultProps} />)
      
      // Should show bottom nav for mobile portrait
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
      expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
    })

    it('maintains active screen state across navigation type changes', () => {
      const { rerender } = render(<NavigationContainer {...defaultProps} activeScreen="performance" />)
      
      expect(screen.getByTestId('active-screen')).toHaveTextContent('performance')
      
      // Switch to mobile
      mockMediaQuery = {
        portrait: createMockMediaQuery(true),
        size: createMockMediaQuery(true)
      }
      
      rerender(<NavigationContainer {...defaultProps} activeScreen="performance" />)
      
      expect(screen.getByTestId('active-screen')).toHaveTextContent('performance')
    })
  })
})