import type { Content } from '@/types/performance'
import { TEST_USER } from '@/lib/__tests__/api-test-helpers'

/**
 * Mock data factory for Chords content used in bug reproduction tests
 * Matches exact Supabase database schema for Content table
 */
export function createMockChordsContent(overrides?: Partial<Content>): Content {
  const defaultContent: Content = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Wonderwall',
    artist: 'Oasis',
    album: '(What\'s the Story) Morning Glory?',
    content_type: 'Chords',
    content_data: {
      sections: [
        {
          id: 'verse-1',
          name: 'Verse 1',
          chords: 'C F G Am',
          lyrics: 'Today is gonna be the day\nThat they\'re gonna throw it back to you'
        },
        {
          id: 'chorus',
          name: 'Chorus',
          chords: 'F C G Am',
          lyrics: 'Because maybe\nYou\'re gonna be the one that saves me'
        },
        {
          id: 'verse-2',
          name: 'Verse 2',
          chords: 'C F G Am',
          lyrics: 'Backbeat, the word is on the street\nThat the fire in your heart is out'
        }
      ]
    },
    user_id: TEST_USER.uid,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    file_url: null,
    thumbnail_url: null,
    key: 'Em',
    bpm: 87,
    capo: 2,
    time_signature: '4/4',
    tuning: 'Standard',
    difficulty: 'Intermediate',
    genre: 'Rock',
    notes: null,
    tags: ['britpop', 'rock', 'classic'],
    is_favorite: false,
    is_public: false
  }

  return {
    ...defaultContent,
    ...overrides,
    // Merge content_data sections if provided
    content_data: overrides?.content_data
      ? {
          ...defaultContent.content_data,
          ...overrides.content_data
        }
      : defaultContent.content_data
  }
}

/**
 * Create mock Chords content with custom sections
 */
export function createMockChordsContentWithSections(
  sections: Array<{ id: string; name: string; chords: string; lyrics: string }>
): Content {
  return createMockChordsContent({
    content_data: { sections }
  })
}

/**
 * Create mock Chords content with minimal data (title and artist only)
 * Used to test bug scenario where sections might not render
 */
export function createMockChordsContentMinimal(): Content {
  return createMockChordsContent({
    content_data: {
      sections: [
        {
          id: 'intro',
          name: 'Intro',
          chords: 'G D Em C',
          lyrics: 'La la la la'
        }
      ]
    }
  })
}
