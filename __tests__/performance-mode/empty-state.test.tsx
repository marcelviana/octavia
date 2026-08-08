import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { OptimizedPerformanceMode as PerformanceMode } from '@/components/optimized-performance-mode'

/**
 * Prod crash: opening /performance with no contentId/setlistId renders the
 * performance mode with an empty songs list, so currentSongData is null and
 * the controls hook crashed with "Cannot read properties of null (reading 'bpm')".
 * Evidence: docs/ux/capture/performance/*.png (harvest B1).
 *
 * Expected behavior: an empty state ("No song selected") with a way back,
 * instead of a crash or an infinite loading screen.
 */
describe('Performance mode without content', () => {
  it('renders an empty state instead of crashing when no content is selected', () => {
    const mockOnExit = vi.fn()

    expect(() =>
      render(<PerformanceMode onExitPerformance={mockOnExit} />)
    ).not.toThrow()

    expect(screen.getByText(/no song selected/i)).toBeInTheDocument()
  })

  it('renders the empty state when content and setlist are explicitly null', () => {
    const mockOnExit = vi.fn()

    render(
      <PerformanceMode
        onExitPerformance={mockOnExit}
        selectedContent={undefined}
        selectedSetlist={undefined}
      />
    )

    expect(screen.getByText(/no song selected/i)).toBeInTheDocument()
  })

  it('offers a way back that calls onExitPerformance', async () => {
    const user = userEvent.setup()
    const mockOnExit = vi.fn()

    render(<PerformanceMode onExitPerformance={mockOnExit} />)

    await user.click(screen.getByRole('button', { name: /go back/i }))

    expect(mockOnExit).toHaveBeenCalledTimes(1)
  })
})
