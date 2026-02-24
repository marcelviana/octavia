/**
 * Content Renderer Hook Unit Tests
 *
 * Tests renderType determination logic for isolating Bug #1 root cause.
 * Progressive isolation debugging: Step 2 - Hook unit test.
 *
 * Purpose: Determine if useContentRenderer correctly identifies Chords content
 * and returns proper data structure for ContentDisplay component.
 */

import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useContentRenderer } from '../use-content-renderer'
import type { UseContentRendererProps } from '../use-content-renderer'

describe('useContentRenderer - Chords Content', () => {
  it('should return chords renderType for Chords content with sections', () => {
    // Arrange: Create Chords data matching production structure
    const chordsData = [{
      sections: [
        { id: '1', name: 'Verse 1', chords: 'C F G Am', lyrics: 'First verse lyrics here' },
        { id: '2', name: 'Chorus', chords: 'F C G', lyrics: 'Chorus lyrics here' }
      ],
      chords: null
    }]

    const props: UseContentRendererProps = {
      currentSong: 0,
      currentSongData: {
        id: 'test-1',
        title: 'Test Song',
        artist: 'Test Artist',
        content_type: 'Chords',
        content_data: { sections: chordsData[0].sections }
      },
      sheetUrls: [null],
      sheetMimeTypes: [null],
      lyricsData: [],
      chordsData
    }

    // Act: Render hook with Chords content
    const { result } = renderHook(() => useContentRenderer(props))

    // Document actual hook output for debugging
    console.log('Hook result:', {
      renderType: result.current.renderType,
      hasContent: result.current.hasContent,
      chordsData: result.current.chordsData,
      contentType: result.current.contentType
    })

    // Assert: Expected behavior for Chords content
    expect(result.current.renderType).toBe('chords')
    expect(result.current.hasContent).toBe(true)
    expect(result.current.chordsData).toBeDefined()
    expect(result.current.contentType).toBe('Chords')

    // Verify sections array passed through correctly
    if (result.current.chordsData && Array.isArray(result.current.chordsData)) {
      expect(result.current.chordsData).toHaveLength(2)
      expect(result.current.chordsData[0].name).toBe('Verse 1')
      expect(result.current.chordsData[0].chords).toBe('C F G Am')
      expect(result.current.chordsData[1].name).toBe('Chorus')
    } else {
      console.log('WARNING: chordsData is not an array:', result.current.chordsData)
    }
  })

  it('should handle Chords content with empty sections', () => {
    // Arrange: Edge case - Chords content with empty sections array
    const chordsData = [{ sections: [], chords: null }]

    const props: UseContentRendererProps = {
      currentSong: 0,
      currentSongData: {
        id: 'test-2',
        title: 'Empty Chords',
        content_type: 'Chords',
        content_data: { sections: [] }
      },
      sheetUrls: [null],
      sheetMimeTypes: [null],
      lyricsData: [],
      chordsData
    }

    // Act: Render hook with empty sections
    const { result } = renderHook(() => useContentRenderer(props))

    console.log('Empty sections result:', {
      renderType: result.current.renderType,
      hasContent: result.current.hasContent
    })

    // Assert: Should still recognize as Chords type but no content
    // Based on hook logic (lines 103-112), empty sections should NOT match the condition
    // because `chordInfo.sections.length > 0` is required
    // So it should fall through to 'no-lyrics' case
    expect(result.current.renderType).toBe('no-lyrics')
    expect(result.current.hasContent).toBe(false)
  })

  it('should handle Chords content with string chords format', () => {
    // Arrange: Alternative format - simple chords string
    const chordsData = [{
      chords: 'C F G Am | F C G',
      sections: null
    }]

    const props: UseContentRendererProps = {
      currentSong: 0,
      currentSongData: {
        id: 'test-3',
        title: 'String Chords',
        content_type: 'Chords',
        content_data: { chords: 'C F G Am | F C G' }
      },
      sheetUrls: [null],
      sheetMimeTypes: [null],
      lyricsData: [],
      chordsData
    }

    // Act: Render hook with string chords
    const { result } = renderHook(() => useContentRenderer(props))

    console.log('String chords result:', {
      renderType: result.current.renderType,
      chordsData: result.current.chordsData
    })

    // Assert: Should recognize as Chords and pass through string
    expect(result.current.renderType).toBe('chords')
    expect(result.current.hasContent).toBe(true)
    expect(result.current.chordsData).toBe('C F G Am | F C G')
  })

  it('should handle Tab content type (normalized to CHORDS)', () => {
    // Arrange: Tab content type should also use chords rendering
    const chordsData = [{
      sections: [
        { id: '1', name: 'Intro', chords: 'E|--0--2--3--', lyrics: '' }
      ],
      chords: null
    }]

    const props: UseContentRendererProps = {
      currentSong: 0,
      currentSongData: {
        id: 'test-4',
        title: 'Tab Song',
        content_type: 'Tab',
        content_data: { sections: chordsData[0].sections }
      },
      sheetUrls: [null],
      sheetMimeTypes: [null],
      lyricsData: [],
      chordsData
    }

    // Act: Render hook with Tab content type
    const { result } = renderHook(() => useContentRenderer(props))

    console.log('Tab content result:', {
      renderType: result.current.renderType,
      contentType: result.current.contentType
    })

    // Assert: Tab should also render as 'chords'
    expect(result.current.renderType).toBe('chords')
    expect(result.current.hasContent).toBe(true)
    expect(result.current.contentType).toBe('Tab')
  })

  it('should prioritize sections over string chords when both present', () => {
    // Arrange: Both sections and chords string present
    const chordsData = [{
      sections: [
        { id: '1', name: 'Verse', chords: 'C F G', lyrics: 'Verse lyrics' }
      ],
      chords: 'C F G Am | F C G' // This should be ignored
    }]

    const props: UseContentRendererProps = {
      currentSong: 0,
      currentSongData: {
        id: 'test-5',
        title: 'Both Formats',
        content_type: 'Chords',
        content_data: {
          sections: chordsData[0].sections,
          chords: chordsData[0].chords
        }
      },
      sheetUrls: [null],
      sheetMimeTypes: [null],
      lyricsData: [],
      chordsData
    }

    // Act: Render hook
    const { result } = renderHook(() => useContentRenderer(props))

    console.log('Priority test result:', {
      renderType: result.current.renderType,
      chordsData: result.current.chordsData
    })

    // Assert: Should prioritize sections format (line 103 check comes first)
    expect(result.current.renderType).toBe('chords')
    expect(Array.isArray(result.current.chordsData)).toBe(true)
    if (Array.isArray(result.current.chordsData)) {
      expect(result.current.chordsData[0].name).toBe('Verse')
    }
  })
})
