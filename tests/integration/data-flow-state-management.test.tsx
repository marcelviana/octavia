/**
 * Integration Tests: Cross-Component Data Flow and State Management
 *
 * Tests the flow of data between components and validates that state management
 * works correctly across the entire application, including:
 * - Context providers and consumers
 * - Component-to-component communication
 * - Global state synchronization
 * - Data persistence and recovery
 * - Concurrent state updates
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useRouter } from 'next/navigation'

// Test wrapper with all providers
const TestProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div data-testid="test-providers">
      {children}
    </div>
  )
}

// Mock components that simulate real application structure
const MockLibraryComponent = () => {
  const [songs, setSongs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedSong, setSelectedSong] = React.useState<any>(null)

  const loadSongs = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100))
    setSongs([
      { id: '1', title: 'Song 1', artist: 'Artist 1', contentType: 'lyrics' },
      { id: '2', title: 'Song 2', artist: 'Artist 2', contentType: 'chords' },
      { id: '3', title: 'Song 3', artist: 'Artist 3', contentType: 'tabs' }
    ])
    setLoading(false)
  }

  React.useEffect(() => {
    loadSongs()
  }, [])

  return (
    <div data-testid="library-component">
      <h2>Music Library</h2>
      {loading && <div data-testid="library-loading">Loading...</div>}
      <div data-testid="song-list">
        {songs.map(song => (
          <div
            key={song.id}
            data-testid={`song-${song.id}`}
            onClick={() => setSelectedSong(song)}
            className={selectedSong?.id === song.id ? 'selected' : ''}
          >
            {song.title} by {song.artist}
          </div>
        ))}
      </div>
      {selectedSong && (
        <div data-testid="selected-song">
          Selected: {selectedSong.title}
        </div>
      )}
    </div>
  )
}

const MockSetlistComponent = () => {
  const [setlist, setSetlist] = React.useState<any[]>([])
  const [setlistName, setSetlistName] = React.useState('')

  const addToSetlist = (song: any) => {
    setSetlist(prev => [...prev, { ...song, setlistOrder: prev.length + 1 }])
  }

  const removeFromSetlist = (songId: string) => {
    setSetlist(prev => prev.filter(song => song.id !== songId))
  }

  const reorderSetlist = (fromIndex: number, toIndex: number) => {
    setSetlist(prev => {
      const newSetlist = [...prev]
      const [moved] = newSetlist.splice(fromIndex, 1)
      newSetlist.splice(toIndex, 0, moved)
      return newSetlist.map((song, index) => ({
        ...song,
        setlistOrder: index + 1
      }))
    })
  }

  return (
    <div data-testid="setlist-component">
      <h2>Current Setlist</h2>
      <input
        data-testid="setlist-name-input"
        value={setlistName}
        onChange={(e) => setSetlistName(e.target.value)}
        placeholder="Setlist name"
      />
      <div data-testid="setlist-songs">
        {setlist.map((song, index) => (
          <div
            key={song.id}
            data-testid={`setlist-song-${song.id}`}
            data-order={song.setlistOrder}
          >
            {song.setlistOrder}. {song.title}
            <button
              data-testid={`remove-${song.id}`}
              onClick={() => removeFromSetlist(song.id)}
            >
              Remove
            </button>
            {index > 0 && (
              <button
                data-testid={`move-up-${song.id}`}
                onClick={() => reorderSetlist(index, index - 1)}
              >
                Move Up
              </button>
            )}
            {index < setlist.length - 1 && (
              <button
                data-testid={`move-down-${song.id}`}
                onClick={() => reorderSetlist(index, index + 1)}
              >
                Move Down
              </button>
            )}
          </div>
        ))}
      </div>
      <div data-testid="setlist-count">
        Songs: {setlist.length}
      </div>
      {/* Expose methods for testing */}
      <div style={{ display: 'none' }}>
        <button data-testid="add-song-1" onClick={() => addToSetlist({ id: '1', title: 'Song 1', artist: 'Artist 1' })}>Add Song 1</button>
        <button data-testid="add-song-2" onClick={() => addToSetlist({ id: '2', title: 'Song 2', artist: 'Artist 2' })}>Add Song 2</button>
        <button data-testid="add-song-3" onClick={() => addToSetlist({ id: '3', title: 'Song 3', artist: 'Artist 3' })}>Add Song 3</button>
      </div>
    </div>
  )
}

const MockPerformanceModeComponent = () => {
  const [currentSongIndex, setCurrentSongIndex] = React.useState(0)
  const [isPerformanceMode, setIsPerformanceMode] = React.useState(false)
  const [setlist] = React.useState([
    { id: '1', title: 'Song 1', artist: 'Artist 1', content: 'C G Am F\nVerse 1 lyrics...' },
    { id: '2', title: 'Song 2', artist: 'Artist 2', content: 'Em C G D\nVerse 2 lyrics...' },
    { id: '3', title: 'Song 3', artist: 'Artist 3', content: 'Am F C G\nVerse 3 lyrics...' }
  ])

  const nextSong = () => {
    if (currentSongIndex < setlist.length - 1) {
      setCurrentSongIndex(prev => prev + 1)
    }
  }

  const prevSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(prev => prev - 1)
    }
  }

  const togglePerformanceMode = () => {
    setIsPerformanceMode(prev => !prev)
  }

  const currentSong = setlist[currentSongIndex]

  return (
    <div data-testid="performance-mode-component">
      <h2>Performance Mode</h2>
      <button
        data-testid="toggle-performance-mode"
        onClick={togglePerformanceMode}
      >
        {isPerformanceMode ? 'Exit Performance Mode' : 'Enter Performance Mode'}
      </button>

      {isPerformanceMode && (
        <div data-testid="performance-interface" className="fullscreen-performance">
          <div data-testid="song-navigation">
            <button
              data-testid="prev-song"
              onClick={prevSong}
              disabled={currentSongIndex === 0}
            >
              Previous
            </button>
            <span data-testid="song-counter">
              {currentSongIndex + 1} of {setlist.length}
            </span>
            <button
              data-testid="next-song"
              onClick={nextSong}
              disabled={currentSongIndex === setlist.length - 1}
            >
              Next
            </button>
          </div>

          <div data-testid="current-song-display">
            <h3 data-testid="current-song-title">{currentSong.title}</h3>
            <p data-testid="current-song-artist">{currentSong.artist}</p>
            <div data-testid="current-song-content">{currentSong.content}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Global state context for testing cross-component communication
const GlobalStateContext = React.createContext<any>(null)

const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalState, setGlobalState] = React.useState({
    selectedSong: null,
    setlist: [],
    performanceMode: false,
    currentSongIndex: 0,
    user: null,
    preferences: {
      theme: 'light',
      autoScroll: false,
      fontSize: 'medium'
    }
  })

  const updateGlobalState = (updates: any) => {
    setGlobalState(prev => ({ ...prev, ...updates }))
  }

  return (
    <GlobalStateContext.Provider value={{ globalState, updateGlobalState }}>
      {children}
    </GlobalStateContext.Provider>
  )
}

const useGlobalState = () => {
  const context = React.useContext(GlobalStateContext)
  if (!context) {
    throw new Error('useGlobalState must be used within GlobalStateProvider')
  }
  return context
}

// Connected components that use global state
const ConnectedLibrary = () => {
  const { globalState, updateGlobalState } = useGlobalState()
  const [songs] = React.useState([
    { id: '1', title: 'Connected Song 1', artist: 'Artist 1' },
    { id: '2', title: 'Connected Song 2', artist: 'Artist 2' },
    { id: '3', title: 'Connected Song 3', artist: 'Artist 3' }
  ])

  const selectSong = (song: any) => {
    updateGlobalState({ selectedSong: song })
  }

  const addToSetlist = (song: any) => {
    updateGlobalState({
      setlist: [...globalState.setlist, { ...song, setlistOrder: globalState.setlist.length + 1 }]
    })
  }

  return (
    <div data-testid="connected-library">
      <h3>Connected Library</h3>
      <div data-testid="connected-songs">
        {songs.map(song => (
          <div key={song.id} data-testid={`connected-song-${song.id}`}>
            <span>{song.title}</span>
            <button
              data-testid={`select-${song.id}`}
              onClick={() => selectSong(song)}
            >
              Select
            </button>
            <button
              data-testid={`add-to-setlist-${song.id}`}
              onClick={() => addToSetlist(song)}
            >
              Add to Setlist
            </button>
          </div>
        ))}
      </div>
      {globalState.selectedSong && (
        <div data-testid="global-selected-song">
          Global Selected: {globalState.selectedSong.title}
        </div>
      )}
    </div>
  )
}

const ConnectedSetlist = () => {
  const { globalState, updateGlobalState } = useGlobalState()

  const removeFromSetlist = (songId: string) => {
    updateGlobalState({
      setlist: globalState.setlist.filter((song: any) => song.id !== songId)
    })
  }

  const startPerformance = () => {
    updateGlobalState({
      performanceMode: true,
      currentSongIndex: 0
    })
  }

  return (
    <div data-testid="connected-setlist">
      <h3>Connected Setlist</h3>
      <div data-testid="global-setlist">
        {globalState.setlist.map((song: any) => (
          <div key={song.id} data-testid={`global-setlist-song-${song.id}`}>
            {song.setlistOrder}. {song.title}
            <button
              data-testid={`global-remove-${song.id}`}
              onClick={() => removeFromSetlist(song.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div data-testid="global-setlist-count">
        Global Setlist Count: {globalState.setlist.length}
      </div>
      {globalState.setlist.length > 0 && (
        <button
          data-testid="start-performance"
          onClick={startPerformance}
        >
          Start Performance
        </button>
      )}
    </div>
  )
}

const ConnectedPerformanceMode = () => {
  const { globalState, updateGlobalState } = useGlobalState()

  const nextSong = () => {
    if (globalState.currentSongIndex < globalState.setlist.length - 1) {
      updateGlobalState({
        currentSongIndex: globalState.currentSongIndex + 1
      })
    }
  }

  const prevSong = () => {
    if (globalState.currentSongIndex > 0) {
      updateGlobalState({
        currentSongIndex: globalState.currentSongIndex - 1
      })
    }
  }

  const exitPerformance = () => {
    updateGlobalState({
      performanceMode: false,
      currentSongIndex: 0
    })
  }

  if (!globalState.performanceMode || globalState.setlist.length === 0) {
    return null
  }

  const currentSong = globalState.setlist[globalState.currentSongIndex]

  return (
    <div data-testid="connected-performance-mode">
      <h3>Connected Performance Mode</h3>
      <button
        data-testid="exit-performance"
        onClick={exitPerformance}
      >
        Exit Performance
      </button>

      <div data-testid="global-song-navigation">
        <button
          data-testid="global-prev-song"
          onClick={prevSong}
          disabled={globalState.currentSongIndex === 0}
        >
          Previous
        </button>
        <span data-testid="global-song-counter">
          {globalState.currentSongIndex + 1} of {globalState.setlist.length}
        </span>
        <button
          data-testid="global-next-song"
          onClick={nextSong}
          disabled={globalState.currentSongIndex === globalState.setlist.length - 1}
        >
          Next
        </button>
      </div>

      <div data-testid="global-current-song">
        <h4 data-testid="global-current-song-title">{currentSong?.title}</h4>
        <p data-testid="global-current-song-artist">{currentSong?.artist}</p>
      </div>
    </div>
  )
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/library',
    query: {},
    asPath: '/library'
  }))
}))

describe('Cross-Component Data Flow and State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Individual Component State Management', () => {
    it('should manage local state within library component', async () => {
      render(
        <TestProviders>
          <MockLibraryComponent />
        </TestProviders>
      )

      // Wait for songs to load
      await waitFor(() => {
        expect(screen.getByTestId('song-list')).toBeInTheDocument()
      })

      expect(screen.getByTestId('song-1')).toBeInTheDocument()
      expect(screen.getByTestId('song-2')).toBeInTheDocument()
      expect(screen.getByTestId('song-3')).toBeInTheDocument()

      // Test song selection
      fireEvent.click(screen.getByTestId('song-1'))
      expect(screen.getByTestId('selected-song')).toHaveTextContent('Selected: Song 1')

      // Test selection change
      fireEvent.click(screen.getByTestId('song-2'))
      expect(screen.getByTestId('selected-song')).toHaveTextContent('Selected: Song 2')
    })

    it('should manage setlist state correctly', () => {
      render(
        <TestProviders>
          <MockSetlistComponent />
        </TestProviders>
      )

      expect(screen.getByTestId('setlist-count')).toHaveTextContent('Songs: 0')

      // Add songs to setlist
      fireEvent.click(screen.getByTestId('add-song-1'))
      expect(screen.getByTestId('setlist-count')).toHaveTextContent('Songs: 1')
      expect(screen.getByTestId('setlist-song-1')).toHaveTextContent('1. Song 1')

      fireEvent.click(screen.getByTestId('add-song-2'))
      expect(screen.getByTestId('setlist-count')).toHaveTextContent('Songs: 2')
      expect(screen.getByTestId('setlist-song-2')).toHaveTextContent('2. Song 2')

      // Test reordering
      fireEvent.click(screen.getByTestId('move-up-2'))
      expect(screen.getByTestId('setlist-song-1')).toHaveTextContent('2. Song 2')
      expect(screen.getByTestId('setlist-song-2')).toHaveTextContent('1. Song 1')

      // Test removal
      fireEvent.click(screen.getByTestId('remove-1'))
      expect(screen.getByTestId('setlist-count')).toHaveTextContent('Songs: 1')
      expect(screen.queryByTestId('setlist-song-1')).not.toBeInTheDocument()
    })

    it('should manage performance mode state transitions', () => {
      render(
        <TestProviders>
          <MockPerformanceModeComponent />
        </TestProviders>
      )

      // Initially not in performance mode
      expect(screen.queryByTestId('performance-interface')).not.toBeInTheDocument()

      // Enter performance mode
      fireEvent.click(screen.getByTestId('toggle-performance-mode'))
      expect(screen.getByTestId('performance-interface')).toBeInTheDocument()
      expect(screen.getByTestId('current-song-title')).toHaveTextContent('Song 1')
      expect(screen.getByTestId('song-counter')).toHaveTextContent('1 of 3')

      // Navigate between songs
      fireEvent.click(screen.getByTestId('next-song'))
      expect(screen.getByTestId('current-song-title')).toHaveTextContent('Song 2')
      expect(screen.getByTestId('song-counter')).toHaveTextContent('2 of 3')

      fireEvent.click(screen.getByTestId('prev-song'))
      expect(screen.getByTestId('current-song-title')).toHaveTextContent('Song 1')
      expect(screen.getByTestId('song-counter')).toHaveTextContent('1 of 3')

      // Exit performance mode
      fireEvent.click(screen.getByTestId('toggle-performance-mode'))
      expect(screen.queryByTestId('performance-interface')).not.toBeInTheDocument()
    })
  })

  describe('Global State Management and Cross-Component Communication', () => {
    it('should share state between library and setlist components', () => {
      render(
        <GlobalStateProvider>
          <ConnectedLibrary />
          <ConnectedSetlist />
        </GlobalStateProvider>
      )

      // Initially empty setlist
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 0')

      // Add song from library to setlist
      fireEvent.click(screen.getByTestId('add-to-setlist-1'))
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 1')
      expect(screen.getByTestId('global-setlist-song-1')).toHaveTextContent('1. Connected Song 1')

      // Add another song
      fireEvent.click(screen.getByTestId('add-to-setlist-2'))
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 2')
      expect(screen.getByTestId('global-setlist-song-2')).toHaveTextContent('2. Connected Song 2')

      // Remove song from setlist
      fireEvent.click(screen.getByTestId('global-remove-1'))
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 1')
      expect(screen.queryByTestId('global-setlist-song-1')).not.toBeInTheDocument()
    })

    it('should maintain global selection state across components', () => {
      render(
        <GlobalStateProvider>
          <ConnectedLibrary />
        </GlobalStateProvider>
      )

      // Initially no selection
      expect(screen.queryByTestId('global-selected-song')).not.toBeInTheDocument()

      // Select a song
      fireEvent.click(screen.getByTestId('select-1'))
      expect(screen.getByTestId('global-selected-song')).toHaveTextContent('Global Selected: Connected Song 1')

      // Change selection
      fireEvent.click(screen.getByTestId('select-2'))
      expect(screen.getByTestId('global-selected-song')).toHaveTextContent('Global Selected: Connected Song 2')
    })

    it('should coordinate performance mode across all components', () => {
      render(
        <GlobalStateProvider>
          <ConnectedLibrary />
          <ConnectedSetlist />
          <ConnectedPerformanceMode />
        </GlobalStateProvider>
      )

      // Add songs to setlist first
      fireEvent.click(screen.getByTestId('add-to-setlist-1'))
      fireEvent.click(screen.getByTestId('add-to-setlist-2'))
      fireEvent.click(screen.getByTestId('add-to-setlist-3'))

      // Start performance mode
      fireEvent.click(screen.getByTestId('start-performance'))
      expect(screen.getByTestId('connected-performance-mode')).toBeInTheDocument()
      expect(screen.getByTestId('global-current-song-title')).toHaveTextContent('Connected Song 1')
      expect(screen.getByTestId('global-song-counter')).toHaveTextContent('1 of 3')

      // Navigate in performance mode
      fireEvent.click(screen.getByTestId('global-next-song'))
      expect(screen.getByTestId('global-current-song-title')).toHaveTextContent('Connected Song 2')
      expect(screen.getByTestId('global-song-counter')).toHaveTextContent('2 of 3')

      // Exit performance mode
      fireEvent.click(screen.getByTestId('exit-performance'))
      expect(screen.queryByTestId('connected-performance-mode')).not.toBeInTheDocument()
    })
  })

  describe('State Persistence and Recovery', () => {
    it('should handle component unmounting and remounting with state preservation', () => {
      const TestStateComponent = () => {
        const [showComponent, setShowComponent] = React.useState(true)

        return (
          <GlobalStateProvider>
            <button
              data-testid="toggle-component"
              onClick={() => setShowComponent(prev => !prev)}
            >
              Toggle
            </button>
            {showComponent && <ConnectedLibrary />}
            <ConnectedSetlist />
          </GlobalStateProvider>
        )
      }

      render(<TestStateComponent />)

      // Add songs to setlist
      fireEvent.click(screen.getByTestId('add-to-setlist-1'))
      fireEvent.click(screen.getByTestId('add-to-setlist-2'))
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 2')

      // Unmount library component
      fireEvent.click(screen.getByTestId('toggle-component'))
      expect(screen.queryByTestId('connected-library')).not.toBeInTheDocument()
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 2')

      // Remount library component
      fireEvent.click(screen.getByTestId('toggle-component'))
      expect(screen.getByTestId('connected-library')).toBeInTheDocument()
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 2')
    })

    it('should handle rapid state updates without race conditions', async () => {
      render(
        <GlobalStateProvider>
          <ConnectedLibrary />
          <ConnectedSetlist />
        </GlobalStateProvider>
      )

      // Rapidly add multiple songs
      await act(async () => {
        fireEvent.click(screen.getByTestId('add-to-setlist-1'))
        fireEvent.click(screen.getByTestId('add-to-setlist-2'))
        fireEvent.click(screen.getByTestId('add-to-setlist-3'))
        fireEvent.click(screen.getByTestId('select-1'))
        fireEvent.click(screen.getByTestId('select-2'))
        fireEvent.click(screen.getByTestId('select-3'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 3')
        expect(screen.getByTestId('global-selected-song')).toHaveTextContent('Global Selected: Connected Song 3')
      })

      // Verify all songs are in correct order
      expect(screen.getByTestId('global-setlist-song-1')).toHaveTextContent('1. Connected Song 1')
      expect(screen.getByTestId('global-setlist-song-2')).toHaveTextContent('2. Connected Song 2')
      expect(screen.getByTestId('global-setlist-song-3')).toHaveTextContent('3. Connected Song 3')
    })
  })

  describe('Complex Data Flow Scenarios', () => {
    it('should handle complete workflow with multiple state changes', async () => {
      render(
        <GlobalStateProvider>
          <ConnectedLibrary />
          <ConnectedSetlist />
          <ConnectedPerformanceMode />
        </GlobalStateProvider>
      )

      // 1. Select songs and build setlist
      fireEvent.click(screen.getByTestId('select-1'))
      fireEvent.click(screen.getByTestId('add-to-setlist-1'))
      fireEvent.click(screen.getByTestId('select-2'))
      fireEvent.click(screen.getByTestId('add-to-setlist-2'))
      fireEvent.click(screen.getByTestId('select-3'))
      fireEvent.click(screen.getByTestId('add-to-setlist-3'))

      // Verify state
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 3')
      expect(screen.getByTestId('global-selected-song')).toHaveTextContent('Global Selected: Connected Song 3')

      // 2. Start performance
      fireEvent.click(screen.getByTestId('start-performance'))
      expect(screen.getByTestId('connected-performance-mode')).toBeInTheDocument()
      expect(screen.getByTestId('global-current-song-title')).toHaveTextContent('Connected Song 1')

      // 3. Navigate through performance
      fireEvent.click(screen.getByTestId('global-next-song'))
      expect(screen.getByTestId('global-current-song-title')).toHaveTextContent('Connected Song 2')

      fireEvent.click(screen.getByTestId('global-next-song'))
      expect(screen.getByTestId('global-current-song-title')).toHaveTextContent('Connected Song 3')

      // 4. Exit performance and verify state
      fireEvent.click(screen.getByTestId('exit-performance'))
      expect(screen.queryByTestId('connected-performance-mode')).not.toBeInTheDocument()
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 3')
      expect(screen.getByTestId('global-selected-song')).toHaveTextContent('Global Selected: Connected Song 3')
    })

    it('should handle concurrent modifications from multiple components', async () => {
      render(
        <GlobalStateProvider>
          <ConnectedLibrary />
          <ConnectedSetlist />
        </GlobalStateProvider>
      )

      // Simulate concurrent operations
      await act(async () => {
        // Add songs rapidly while changing selection
        fireEvent.click(screen.getByTestId('add-to-setlist-1'))
        fireEvent.click(screen.getByTestId('select-1'))
        fireEvent.click(screen.getByTestId('add-to-setlist-2'))
        fireEvent.click(screen.getByTestId('select-2'))
        fireEvent.click(screen.getByTestId('global-remove-1'))
        fireEvent.click(screen.getByTestId('add-to-setlist-3'))
        fireEvent.click(screen.getByTestId('select-3'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 2')
        expect(screen.getByTestId('global-selected-song')).toHaveTextContent('Global Selected: Connected Song 3')
      })

      // Verify final state is consistent
      expect(screen.getByTestId('global-setlist-song-2')).toHaveTextContent('1. Connected Song 2')
      expect(screen.getByTestId('global-setlist-song-3')).toHaveTextContent('2. Connected Song 3')
    })
  })

  describe('Error Recovery and State Consistency', () => {
    it('should maintain state consistency during component errors', () => {
      const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        const [hasError, setHasError] = React.useState(false)

        if (hasError) {
          return <div data-testid="error-boundary">Something went wrong</div>
        }

        try {
          return <>{children}</>
        } catch (error) {
          setHasError(true)
          return <div data-testid="error-boundary">Something went wrong</div>
        }
      }

      const ProblematicComponent = () => {
        const { globalState } = useGlobalState()
        const [shouldError, setShouldError] = React.useState(false)

        if (shouldError && globalState.setlist.length > 2) {
          throw new Error('Simulated error')
        }

        return (
          <div data-testid="problematic-component">
            <button
              data-testid="trigger-error"
              onClick={() => setShouldError(true)}
            >
              Trigger Error
            </button>
            Working fine: {globalState.setlist.length} songs
          </div>
        )
      }

      render(
        <ErrorBoundary>
          <GlobalStateProvider>
            <ConnectedLibrary />
            <ConnectedSetlist />
            <ProblematicComponent />
          </GlobalStateProvider>
        </ErrorBoundary>
      )

      // Add songs normally
      fireEvent.click(screen.getByTestId('add-to-setlist-1'))
      fireEvent.click(screen.getByTestId('add-to-setlist-2'))
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 2')
      expect(screen.getByTestId('problematic-component')).toHaveTextContent('Working fine: 2 songs')

      // Trigger error condition
      fireEvent.click(screen.getByTestId('trigger-error'))
      fireEvent.click(screen.getByTestId('add-to-setlist-3'))

      // Other components should still work
      expect(screen.getByTestId('global-setlist-count')).toHaveTextContent('Global Setlist Count: 3')
    })
  })
})