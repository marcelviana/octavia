import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { createMockChordsContent } from './bug-reproduction-helpers'
import { PerformanceMode } from '@/components/performance-mode'

/**
 * Bug #1: Chords Content Display Missing Chart
 *
 * CURRENT BEHAVIOR: When Chords content is displayed in performance mode,
 * only the title and artist appear. The chord chart sections (Verse 1, Chorus, etc.)
 * with chord progressions and lyrics do not render.
 *
 * EXPECTED BEHAVIOR: Full chord chart should display with section names
 * (e.g., "Verse 1", "Chorus") and their chord progressions (e.g., "C F G Am").
 *
 * This test reproduces the bug using progressive isolation pattern.
 * The test is expected to FAIL until the bug is fixed in Phase 2.
 */
describe('Bug #1: Chords Display Missing Chart', () => {
  it('should display full chord chart in performance mode', async () => {
    const chordsContent = createMockChordsContent()
    const mockOnExit = vi.fn()

    render(
      <PerformanceMode
        selectedContent={chordsContent}
        onExitPerformance={mockOnExit}
      />
    )

    // Assert: Title displays (currently working)
    expect(screen.getByText(chordsContent.title)).toBeInTheDocument()

    // Assert: Artist displays (currently working)
    if (chordsContent.artist) {
      expect(screen.getByText(chordsContent.artist)).toBeInTheDocument()
    }

    // Assert: Chord chart sections display (currently FAILING)
    // These assertions will fail until the bug is fixed
    await waitFor(() => {
      // Verify section names render
      // The sections array contains: Verse 1, Chorus, Verse 2
      expect(screen.getByText(/Verse 1/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText(/Chorus/i)).toBeInTheDocument()
    expect(screen.getByText(/Verse 2/i)).toBeInTheDocument()

    // Verify chord progressions render
    // Mock data has "C F G Am" chords in Verse 1
    expect(screen.getByText(/C.*F.*G.*Am/)).toBeInTheDocument()
  })

  it('should display section lyrics along with chords', async () => {
    const chordsContent = createMockChordsContent()
    const mockOnExit = vi.fn()

    render(
      <PerformanceMode
        selectedContent={chordsContent}
        onExitPerformance={mockOnExit}
      />
    )

    // Assert: Section lyrics render (currently FAILING)
    await waitFor(() => {
      // Check for lyrics from Verse 1
      expect(screen.getByText(/Today is gonna be the day/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check for lyrics from Chorus
    expect(screen.getByText(/Because maybe/i)).toBeInTheDocument()
  })

  it('should handle multiple chord chart sections', async () => {
    const chordsContent = createMockChordsContent({
      content_data: {
        sections: [
          {
            id: 'intro',
            name: 'Intro',
            chords: 'Em G D A',
            lyrics: 'Instrumental intro'
          },
          {
            id: 'verse-1',
            name: 'Verse 1',
            chords: 'Em G D A',
            lyrics: 'First verse lyrics here'
          },
          {
            id: 'bridge',
            name: 'Bridge',
            chords: 'C G Am F',
            lyrics: 'Bridge section lyrics'
          }
        ]
      }
    })
    const mockOnExit = vi.fn()

    render(
      <PerformanceMode
        selectedContent={chordsContent}
        onExitPerformance={mockOnExit}
      />
    )

    // Assert: All sections render (currently FAILING)
    await waitFor(() => {
      expect(screen.getByText(/Intro/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText(/Verse 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Bridge/i)).toBeInTheDocument()

    // Verify different chord progressions render
    expect(screen.getByText(/Em.*G.*D.*A/)).toBeInTheDocument()
    expect(screen.getByText(/C.*G.*Am.*F/)).toBeInTheDocument()
  })
})
