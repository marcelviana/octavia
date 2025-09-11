/**
 * Performance Mode Integration Tests
 * 
 * Complete user journey tests for performance mode functionality.
 * Tests the critical path from content selection to live performance.
 * 
 * Test Coverage:
 * - Content selection and loading
 * - Performance mode initialization
 * - Navigation between songs during performance
 * - Offline cache integration
 * - Error recovery during live performance
 * - Cross-component state management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PerformanceMode } from '@/components/performance-mode'
import { TEST_USER, createTestContent, performanceMonitor, networkSimulator } from './test-setup'
import type { SetlistWithSongs, SongData } from '@/types/performance'

// Test setlist with multiple songs
const createTestSetlist = (): SetlistWithSongs => ({
  id: 'test-setlist-1',
  user_id: TEST_USER.uid,
  name: 'Live Performance Test Setlist',
  description: 'Integration test setlist',
  performance_date: new Date().toISOString(),
  venue: 'Test Venue',
  notes: 'Integration test notes',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  setlist_songs: [
    {
      id: 'setlist-song-1',
      position: 1,
      notes: 'Opening song',
      content: createTestContent({
        id: 'content-1',
        title: 'Opening Song',
        content_type: 'LYRICS',
        content_data: { lyrics: 'Opening song lyrics\nVerse 1\nChorus 1' }
      })
    },
    {
      id: 'setlist-song-2',
      position: 2,
      notes: 'Main song with chords',
      content: createTestContent({
        id: 'content-2',
        title: 'Main Song',
        content_type: 'CHORDS',
        file_url: 'https://example.com/main-song.pdf'
      })
    },
    {
      id: 'setlist-song-3',
      position: 3,
      notes: 'Closing song',
      content: createTestContent({
        id: 'content-3',
        title: 'Closing Song',
        content_type: 'TABS',
        file_url: 'https://example.com/closing-song.jpg'
      })
    }
  ]
})

describe('Performance Mode - Complete User Journey', () => {
  let testSetlist: SetlistWithSongs
  let mockOnExitPerformance: vi.Mock

  beforeEach(() => {
    testSetlist = createTestSetlist()
    mockOnExitPerformance = vi.fn()
    
    // Mock performance-critical functions
    vi.mock('@/hooks/use-wake-lock', () => ({
      useWakeLock: () => ({ isSupported: true, isActive: true })
    }))
    
    vi.mock('@/lib/offline-cache', () => ({
      getCachedFileInfo: vi.fn().mockResolvedValue({
        url: 'blob:cached-file-url',
        mimeType: 'application/pdf'
      }),
      cacheFilesForContent: vi.fn().mockResolvedValue(undefined),
      warmCache: vi.fn().mockResolvedValue(undefined),
      preloadContent: vi.fn().mockResolvedValue(undefined),
    }))
  })

  describe('Performance Mode Initialization', () => {
    it('should initialize performance mode with setlist', async () => {
      performanceMonitor.start('performance-mode-init')
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
          startingSongIndex={0}
        />
      )

      // Should show the first song initially
      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      const initDuration = performanceMonitor.end('performance-mode-init')
      
      // Performance requirement: Initialize within 100ms
      expect(initDuration).toBeLessThan(100)
    })

    it('should show loading state while content loads', async () => {
      const { rerender } = render(
        <PerformanceMode
          selectedSetlist={undefined}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      // Should show loading initially
      expect(screen.getByText('Loading performance mode...')).toBeInTheDocument()

      // Should show content when setlist is provided
      rerender(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })
    })

    it('should start with specified song index', async () => {
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
          startingSongIndex={1} // Start with second song
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Main Song')).toBeInTheDocument()
      })

      // Should not show the first song
      expect(screen.queryByText('Opening Song')).not.toBeInTheDocument()
    })
  })

  describe('Song Navigation During Performance', () => {
    it('should navigate between songs with keyboard shortcuts', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      performanceMonitor.start('song-navigation')

      // Navigate to next song with arrow key
      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByText('Main Song')).toBeInTheDocument()
      })

      // Navigate to previous song
      await user.keyboard('{ArrowLeft}')

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      const navigationDuration = performanceMonitor.end('song-navigation')
      
      // Performance requirement: Navigate within 100ms
      expect(navigationDuration).toBeLessThan(100)
    })

    it('should navigate using song indicators', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Find and click the third song indicator (index 2)
      const bottomControls = screen.getByTestId('bottom-controls')
      const songIndicators = within(bottomControls).getAllByRole('generic')
      
      // Click third indicator (should be index 2 in the array)
      await user.click(songIndicators[2])

      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      })
    })

    it('should handle rapid navigation without lag', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      performanceMonitor.start('rapid-navigation')

      // Rapidly navigate through all songs
      for (let i = 0; i < 3; i++) {
        await user.keyboard('{ArrowRight}')
        await new Promise(resolve => setTimeout(resolve, 50)) // 50ms between navigations
      }

      const rapidNavDuration = performanceMonitor.end('rapid-navigation')

      // Should handle rapid navigation smoothly
      expect(rapidNavDuration).toBeLessThan(500)
      
      // Should end up at the last song (wrapping around)
      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      })
    })

    it('should prevent navigation beyond setlist bounds', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
          startingSongIndex={2} // Start at last song
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      })

      // Try to navigate to next song (should stay at last)
      await user.keyboard('{ArrowRight}')

      // Should still be at the last song
      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      })

      // Previous/Next buttons should reflect the state
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Content Display Integration', () => {
    it('should display different content types correctly', async () => {
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      // First song: Lyrics content
      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })
      
      // Should show lyrics text
      expect(screen.getByTestId('music-text')).toBeInTheDocument()

      // Navigate to second song: PDF content
      const user = userEvent.setup()
      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByText('Main Song')).toBeInTheDocument()
      })

      // Should show PDF viewer for CHORDS content type
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument()

      // Navigate to third song: Image content
      await user.keyboard('{ArrowRight}')

      await waitFor(() => {
        expect(screen.getByText('Closing Song')).toBeInTheDocument()
      })

      // Should show image for TABS content type
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('should handle content loading errors gracefully', async () => {
      // Mock a content item that will fail to load
      const setlistWithError = {
        ...testSetlist,
        setlist_songs: [
          {
            id: 'setlist-song-error',
            position: 1,
            notes: 'Song with error',
            content: createTestContent({
              id: 'content-error',
              title: 'Error Song',
              file_url: 'https://broken-url.com/broken.pdf'
            })
          }
        ]
      }

      render(
        <PerformanceMode
          selectedSetlist={setlistWithError}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      // Should still show the song title even if content fails
      await waitFor(() => {
        expect(screen.getByText('Error Song')).toBeInTheDocument()
      })

      // Should show some fallback content or error message
      // (Implementation depends on how errors are handled)
    })
  })

  describe('Performance Controls Integration', () => {
    it('should control zoom functionality', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Find zoom controls
      const zoomOutButton = screen.getByRole('button', { name: /zoom out/i })
      const zoomInButton = screen.getByRole('button', { name: /zoom in/i })

      // Test zoom out
      await user.click(zoomOutButton)
      
      // Should show updated zoom percentage
      expect(screen.getByText('90%')).toBeInTheDocument()

      // Test zoom in
      await user.click(zoomInButton)
      await user.click(zoomInButton)

      // Should show increased zoom
      expect(screen.getByText('110%')).toBeInTheDocument()
    })

    it('should toggle play/pause state', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      const playPauseButton = screen.getByTestId('play-pause-button')

      // Should start in paused state
      expect(within(playPauseButton).getByTestId('play-icon')).toBeInTheDocument()

      // Click to play
      await user.click(playPauseButton)

      // Should switch to playing state
      expect(within(playPauseButton).getByTestId('pause-icon')).toBeInTheDocument()
    })

    it('should handle BPM controls', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Find BPM controls
      const bpmIncButton = screen.getByRole('button', { name: /increase bpm/i })
      const bpmDecButton = screen.getByRole('button', { name: /decrease bpm/i })

      // Test BPM increase
      await user.click(bpmIncButton)

      // Should show updated BPM (original was 120)
      expect(screen.getByText('121 BPM')).toBeInTheDocument()

      // Test BPM decrease
      await user.click(bpmDecButton)
      await user.click(bpmDecButton)

      // Should show decreased BPM
      expect(screen.getByText('119 BPM')).toBeInTheDocument()
    })
  })

  describe('Exit and Error Handling', () => {
    it('should handle exit performance correctly', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Find and click exit button
      const exitButton = screen.getByTestId('exit-button')
      await user.click(exitButton)

      // Should call the exit callback
      expect(mockOnExitPerformance).toHaveBeenCalledTimes(1)
    })

    it('should handle keyboard exit (Escape)', async () => {
      const user = userEvent.setup()
      
      render(
        <PerformanceMode
          selectedSetlist={testSetlist}
          onExitPerformance={mockOnExitPerformance}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Opening Song')).toBeInTheDocument()
      })

      // Press Escape key
      await user.keyboard('{Escape}')

      // Should call the exit callback
      expect(mockOnExitPerformance).toHaveBeenCalledTimes(1)
    })
  })
})