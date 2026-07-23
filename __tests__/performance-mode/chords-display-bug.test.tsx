import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { createMockChordsContent } from './bug-reproduction-helpers'
// P1-B: retargeted from the dead twin (components/performance-mode) to the
// live twin mounted at app/performance/page.tsx. Assertions unchanged.
import { OptimizedPerformanceMode as PerformanceMode } from '@/components/optimized-performance-mode'

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
    // Note: Mock data has "C F G Am" in both Verse 1 and Verse 2 (realistic for repeating chord progressions)
    const chordsMatches = screen.getAllByText(/C F G Am/)
    expect(chordsMatches.length).toBe(2) // Verse 1 and Verse 2
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
      // Note: "Intro" appears in both section name AND lyrics text "Instrumental intro"
      // Using getAllByText to handle both occurrences
      const introMatches = screen.getAllByText(/Intro/i)
      expect(introMatches.length).toBeGreaterThan(0)
    }, { timeout: 3000 })

    expect(screen.getByText(/Verse 1/i)).toBeInTheDocument()
    // Note: "Bridge" appears in both section name AND lyrics "Bridge section lyrics"
    const bridgeMatches = screen.getAllByText(/Bridge/i)
    expect(bridgeMatches.length).toBeGreaterThan(0)

    // Verify different chord progressions render
    // Note: "Em G D A" appears twice (Intro and Verse 1 both have this progression)
    const emChordsMatches = screen.getAllByText(/Em.*G.*D.*A/)
    expect(emChordsMatches.length).toBe(2)

    // "C G Am F" is unique to Bridge section
    expect(screen.getByText(/C.*G.*Am.*F/)).toBeInTheDocument()
  })
})
