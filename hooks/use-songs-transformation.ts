/**
 * Songs Transformation Hook
 *
 * Transforms setlist or content data into normalized SongData format
 * for performance mode consumption. Memoizes transformation for performance.
 */

import { useMemo } from 'react'
import type { SongData } from '@/types/performance'
import type { Content } from '@/types/content'

// Simplified Setlist type for transformation
interface Setlist {
  setlist_songs?: Array<{
    content: Content
  }>
}

interface UseSongsTransformationProps {
  selectedSetlist?: Setlist | null
  selectedContent?: Content | null
}

/**
 * Transforms setlist or content data into normalized SongData array
 */
export function useSongsTransformation({
  selectedSetlist,
  selectedContent
}: UseSongsTransformationProps): SongData[] {
  return useMemo(() => {
    // Transform setlist songs
    if (selectedSetlist?.setlist_songs) {
      return selectedSetlist.setlist_songs.map(s => ({
        id: s.content.id,
        title: s.content.title,
        artist: s.content.artist,
        key: s.content.key,
        bpm: s.content.bpm,
        content_type: s.content.content_type,
        file_url: s.content.file_url,
        content_data: s.content.content_data ? {
          lyrics: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'lyrics' in s.content.content_data
            ? s.content.content_data.lyrics as string
            : undefined,
          file: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'file' in s.content.content_data
            ? s.content.content_data.file as string
            : undefined,
          chords: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'chords' in s.content.content_data
            ? s.content.content_data.chords
            : undefined,
          sections: typeof s.content.content_data === 'object' && s.content.content_data !== null && 'sections' in s.content.content_data
            ? s.content.content_data.sections
            : undefined
        } : null
      }))
    }

    // Transform single content
    if (selectedContent) {
      return [{
        id: selectedContent.id,
        title: selectedContent.title,
        artist: selectedContent.artist,
        key: selectedContent.key,
        bpm: selectedContent.bpm,
        content_type: selectedContent.content_type,
        file_url: selectedContent.file_url,
        content_data: selectedContent.content_data ? {
          lyrics: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'lyrics' in selectedContent.content_data
            ? selectedContent.content_data.lyrics as string
            : undefined,
          file: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'file' in selectedContent.content_data
            ? selectedContent.content_data.file as string
            : undefined,
          chords: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'chords' in selectedContent.content_data
            ? selectedContent.content_data.chords
            : undefined,
          sections: typeof selectedContent.content_data === 'object' && selectedContent.content_data !== null && 'sections' in selectedContent.content_data
            ? selectedContent.content_data.sections
            : undefined
        } : null
      }]
    }

    return []
  }, [selectedSetlist, selectedContent])
}
