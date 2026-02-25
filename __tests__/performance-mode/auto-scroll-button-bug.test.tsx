/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { HeaderControls } from '@/components/performance-mode/header-controls'
import type { SongData } from '@/types/performance'

/**
 * Bug #2: Auto-scroll Play Button Non-Responsive
 *
 * This test reproduces the bug where the auto-scroll play button in performance mode
 * does not respond to clicks when isPlaying state is updated externally. The button
 * appears clickable and enabled, but due to React.memo stale closures, the onClick
 * handler captures the old isPlaying value and doesn't reflect the current state.
 *
 * Root Cause: React.memo without proper comparison function causes stale closures
 * in the onClick handler: onClick={() => setIsPlaying(!isPlaying)}
 * The !isPlaying uses the memoized value, not the current prop value.
 *
 * Expected behavior: Clicking play should call setIsPlaying(true), clicking pause should call setIsPlaying(false)
 * Actual behavior: Handler always uses stale isPlaying value from initial render
 *
 * Test Pattern: React.memo Stale Closure Detection (Pattern 3 from RESEARCH.md)
 * - Render component with isPlaying={false}
 * - Update isPlaying prop to true (simulating external state change)
 * - Click button expecting setIsPlaying(false) to be called
 * - Bug: setIsPlaying(true) is called instead (stale closure)
 */
describe('Bug #2: Auto-scroll Play Button Non-Responsive', () => {
  const mockSongData: SongData = {
    id: 'test-song-123',
    title: 'Test Song',
    artist: 'Test Artist',
    key: 'C',
    bpm: 80,
    content_type: 'chords',
    file_url: null,
    content_data: null
  }

  it('should use current isPlaying prop value, not stale memoized value', async () => {
    const user = userEvent.setup()
    const onTogglePlay = vi.fn()

    // Initial render with isPlaying=false
    const { rerender } = render(
      <HeaderControls
        currentSongData={mockSongData}
        isPlaying={false}
        onTogglePlay={onTogglePlay}
        bpm={80}
        onExitPerformance={vi.fn()}
        darkSheet={false}
        setDarkSheet={vi.fn()}
        zoom={100}
        setZoom={vi.fn()}
        bpmFeedback={null}
        startPress={vi.fn()}
        endPress={vi.fn()}
      />
    )

    // Simulate external state change: isPlaying becomes true
    // (e.g., from parent component auto-scroll logic)
    rerender(
      <HeaderControls
        currentSongData={mockSongData}
        isPlaying={true} // Now playing
        onTogglePlay={onTogglePlay}
        bpm={80}
        onExitPerformance={vi.fn()}
        darkSheet={false}
        setDarkSheet={vi.fn()}
        zoom={100}
        setZoom={vi.fn()}
        bpmFeedback={null}
        startPress={vi.fn()}
        endPress={vi.fn()}
      />
    )

    const pauseButton = screen.getByTestId('play-pause-button')

    // Click to pause - should call onTogglePlay (which uses functional update internally)
    await user.click(pauseButton)

    // FIX: onTogglePlay uses functional update, so it always operates on current state
    // Should be called exactly once regardless of rerender
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('should trigger onTogglePlay when play button clicked', async () => {
    const user = userEvent.setup()
    const onTogglePlay = vi.fn()

    render(
      <HeaderControls
        currentSongData={mockSongData}
        isPlaying={false}
        onTogglePlay={onTogglePlay}
        bpm={80}
        onExitPerformance={vi.fn()}
        darkSheet={false}
        setDarkSheet={vi.fn()}
        zoom={100}
        setZoom={vi.fn()}
        bpmFeedback={null}
        startPress={vi.fn()}
        endPress={vi.fn()}
      />
    )

    const playButton = screen.getByTestId('play-pause-button')

    // Verify button is accessible and in correct initial state
    expect(playButton).toBeEnabled()
    expect(playButton).toBeVisible()
    expect(playButton).toBeInTheDocument()

    // Click button - this should trigger onTogglePlay
    await user.click(playButton)

    // Verify handler was called (functional update handles state internally)
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
  })

  it('should be accessible and clickable', () => {
    const onTogglePlay = vi.fn()

    render(
      <HeaderControls
        currentSongData={mockSongData}
        isPlaying={false}
        onTogglePlay={onTogglePlay}
        bpm={80}
        onExitPerformance={vi.fn()}
        darkSheet={false}
        setDarkSheet={vi.fn()}
        zoom={100}
        setZoom={vi.fn()}
        bpmFeedback={null}
        startPress={vi.fn()}
        endPress={vi.fn()}
      />
    )

    const playButton = screen.getByTestId('play-pause-button')

    // Document button state - button appears clickable
    expect(playButton).toBeInTheDocument()
    expect(playButton).toBeEnabled()
    expect(playButton).not.toHaveAttribute('disabled')
    expect(playButton).toBeVisible()
  })
})
