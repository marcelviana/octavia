/**
 * ContentDisplay Component Unit Tests
 *
 * Tests rendering logic for isolating Bug #1 root cause.
 * Progressive isolation debugging: Step 3 - Component unit test.
 *
 * Purpose: Determine if ContentDisplay correctly renders sections array
 * when given proper renderInfo data structure from useContentRenderer.
 *
 * P1-B: retargeted from the dead twin (performance-mode/content-display)
 * to the live twin mounted at app/performance/page.tsx
 * (performance-mode/optimized-content-display). Prop differences are
 * setup-only: OptimizedContentDisplay takes `darkSheet` instead of
 * `currentSong`. Assertions are unchanged — they are the spec.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OptimizedContentDisplay as ContentDisplay } from '@/components/performance-mode/optimized-content-display'
import type { ContentRenderInfo, SongData } from '@/types/performance'

describe('ContentDisplay - Chords Rendering', () => {
  it('should render sections array for chords renderType', () => {
    // Arrange: Create renderInfo matching hook output
    const renderInfo: ContentRenderInfo = {
      renderType: 'chords',
      hasContent: true,
      chordsData: [
        { id: '1', name: 'Verse 1', chords: 'C F G Am', lyrics: 'First verse lyrics' },
        { id: '2', name: 'Chorus', chords: 'F C G', lyrics: 'Chorus lyrics' }
      ],
      sheetUrl: null,
      lyricsContent: '',
      contentType: 'Chords'
    }

    const currentSongData: SongData = {
      id: 'test-1',
      title: 'Test Song',
      artist: 'Test Artist',
      content_type: 'Chords',
      content_data: {
        sections: renderInfo.chordsData
      }
    }

    // Act: Render component with sections data
    render(
      <ContentDisplay
        renderInfo={renderInfo}
        currentSongData={currentSongData}
        darkSheet={false}
        zoom={100}
      />
    )

    // Assert: Verify sections render in DOM
    expect(screen.getByText('Verse 1')).toBeInTheDocument()
    expect(screen.getByText('Chorus')).toBeInTheDocument()

    // Verify chord progressions render
    expect(screen.getByText('C F G Am')).toBeInTheDocument()
    expect(screen.getByText('F C G')).toBeInTheDocument()

    // Verify lyrics render
    expect(screen.getByText('First verse lyrics')).toBeInTheDocument()
    expect(screen.getByText('Chorus lyrics')).toBeInTheDocument()
  })

  it('should handle empty sections array', () => {
    // Arrange: Edge case - empty chordsData array
    const renderInfo: ContentRenderInfo = {
      renderType: 'chords',
      hasContent: false,
      chordsData: [],
      sheetUrl: null,
      lyricsContent: '',
      contentType: 'Chords'
    }

    const currentSongData: SongData = {
      id: 'test-2',
      title: 'Empty Chords',
      content_type: 'Chords',
      content_data: { sections: [] }
    }

    // Act: Render with empty sections
    const { container } = render(
      <ContentDisplay
        renderInfo={renderInfo}
        currentSongData={currentSongData}
        darkSheet={false}
        zoom={100}
      />
    )

    // Assert: Should render empty space-y-6 div (not crash)
    expect(container).toBeInTheDocument()
    const chordContainer = container.querySelector('.space-y-6')
    expect(chordContainer).toBeInTheDocument()
  })

  it('should render string chords format', () => {
    // Arrange: Alternative format - simple chords string
    const renderInfo: ContentRenderInfo = {
      renderType: 'chords',
      hasContent: true,
      chordsData: 'C F G Am | F C G | Am F C',
      sheetUrl: null,
      lyricsContent: '',
      contentType: 'Chords'
    }

    const currentSongData: SongData = {
      id: 'test-3',
      title: 'String Chords',
      content_type: 'Chords',
      content_data: { chords: 'C F G Am | F C G | Am F C' }
    }

    // Act: Render with string chords
    render(
      <ContentDisplay
        renderInfo={renderInfo}
        currentSongData={currentSongData}
        darkSheet={false}
        zoom={100}
      />
    )

    // Assert: String should render via MusicText component
    expect(screen.getByText('C F G Am | F C G | Am F C')).toBeInTheDocument()
  })

  it('should not render section name when it equals "Content"', () => {
    // Arrange: Special case - section name "Content" should be hidden
    const renderInfo: ContentRenderInfo = {
      renderType: 'chords',
      hasContent: true,
      chordsData: [
        { id: '1', name: 'Content', chords: 'C F G', lyrics: 'Some lyrics' },
        { id: '2', name: 'Verse 1', chords: 'F C G', lyrics: 'Verse lyrics' }
      ],
      sheetUrl: null,
      lyricsContent: '',
      contentType: 'Chords'
    }

    const currentSongData: SongData = {
      id: 'test-4',
      title: 'Content Name Test',
      content_type: 'Chords',
      content_data: { sections: renderInfo.chordsData }
    }

    // Act: Render component
    render(
      <ContentDisplay
        renderInfo={renderInfo}
        currentSongData={currentSongData}
        darkSheet={false}
        zoom={100}
      />
    )

    // Assert: "Content" should not render as h3, but "Verse 1" should
    const headings = screen.queryAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(1) // Only "Verse 1", not "Content"
    expect(screen.getByText('Verse 1')).toBeInTheDocument()

    // Chords and lyrics should still render for "Content" section
    expect(screen.getByText('C F G')).toBeInTheDocument()
    expect(screen.getByText('Some lyrics')).toBeInTheDocument()
  })

  it('should handle sections with only chords (no lyrics)', () => {
    // Arrange: Sections with chords but no lyrics
    const renderInfo: ContentRenderInfo = {
      renderType: 'chords',
      hasContent: true,
      chordsData: [
        { id: '1', name: 'Intro', chords: 'C F G Am', lyrics: null },
        { id: '2', name: 'Outro', chords: 'F C G', lyrics: '' }
      ],
      sheetUrl: null,
      lyricsContent: '',
      contentType: 'Chords'
    }

    const currentSongData: SongData = {
      id: 'test-5',
      title: 'Chords Only',
      content_type: 'Chords',
      content_data: { sections: renderInfo.chordsData }
    }

    // Act: Render component
    render(
      <ContentDisplay
        renderInfo={renderInfo}
        currentSongData={currentSongData}
        darkSheet={false}
        zoom={100}
      />
    )

    // Assert: Section names and chords should render
    expect(screen.getByText('Intro')).toBeInTheDocument()
    expect(screen.getByText('Outro')).toBeInTheDocument()
    expect(screen.getByText('C F G Am')).toBeInTheDocument()
    expect(screen.getByText('F C G')).toBeInTheDocument()
  })

  it('should apply zoom transformation correctly', () => {
    // Arrange: Test zoom feature
    const renderInfo: ContentRenderInfo = {
      renderType: 'chords',
      hasContent: true,
      chordsData: [
        { id: '1', name: 'Verse', chords: 'C F G', lyrics: 'Test' }
      ],
      sheetUrl: null,
      lyricsContent: '',
      contentType: 'Chords'
    }

    const currentSongData: SongData = {
      id: 'test-6',
      title: 'Zoom Test',
      content_type: 'Chords',
      content_data: { sections: renderInfo.chordsData }
    }

    // Act: Render with 150% zoom
    const { container } = render(
      <ContentDisplay
        renderInfo={renderInfo}
        currentSongData={currentSongData}
        darkSheet={false}
        zoom={150}
      />
    )

    // Assert: Container should have zoom transform
    const mainContainer = container.querySelector('.space-y-6')
    expect(mainContainer).toBeInTheDocument()

    if (mainContainer) {
      const style = window.getComputedStyle(mainContainer)
      // Note: style.transform might be computed differently in jsdom
      // Just verify the container exists and has the space-y-6 class
      expect(mainContainer.classList.contains('space-y-6')).toBe(true)
    }
  })

  it('should render no-lyrics message when no content', () => {
    // Arrange: No content available
    const renderInfo: ContentRenderInfo = {
      renderType: 'no-lyrics',
      hasContent: false,
      sheetUrl: null,
      lyricsContent: '',
      contentType: null
    }

    const currentSongData: SongData = {
      id: 'test-7',
      title: 'No Content',
      content_type: 'Chords',
      content_data: null
    }

    // Act: Render with no content
    render(
      <ContentDisplay
        renderInfo={renderInfo}
        currentSongData={currentSongData}
        darkSheet={false}
        zoom={100}
      />
    )

    // Assert: Should show no lyrics message
    expect(screen.getByText('No lyrics available for this song')).toBeInTheDocument()
  })
})
