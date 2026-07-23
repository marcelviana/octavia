import { renderHook, act } from '@testing-library/react'
import { useContentLoading } from '@/hooks/use-content-loading'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SongData } from '@/types/performance'

// Mock dependencies
// As APIs mockadas precisam de identidade estável entre renders: o hook real
// as coloca nas deps do useEffect (o real usa useCallback([]) — estável).
// Retornar vi.fn() novos a cada render re-dispara o effect em loop até OOM.
vi.mock('@/lib/advanced-content-cache', () => {
  const cacheApi = {
    getCachedContent: vi.fn().mockResolvedValue({
      data: new Blob(['test content'], { type: 'application/pdf' }),
      mimeType: 'application/pdf'
    }),
    preloadForCurrentSetlist: vi.fn()
  }
  return { useAdvancedContentCache: () => cacheApi }
})

vi.mock('@/lib/memory-management', () => {
  const memoryApi = {
    trackResource: vi.fn(),
    getMemoryStats: vi.fn().mockReturnValue({ trackedResources: 0 })
  }
  return { useMemoryManagement: () => memoryApi }
})

describe('useContentLoading', () => {
  // Referência estável: `[]` inline criaria um array novo por render e, como
  // `songs` está nas deps do useEffect (que sempre faz setState com arrays
  // novos), o render loop nunca estabiliza. Em produção o caller memoiza
  // (useSongsTransformation usa useMemo).
  const emptySongs: SongData[] = []

  const mockSongs: SongData[] = [
    {
      id: 'song-1',
      title: 'Test Song 1',
      artist: 'Test Artist',
      content_type: 'Chords',
      file_url: 'https://example.com/song1.pdf',
      content_data: {
        lyrics: 'Test lyrics 1',
        chords: { C: 'x32010' },
        sections: [{ name: 'Verse', chords: ['C', 'G'] }]
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useContentLoading(emptySongs))

    expect(result.current.sheetUrls).toEqual([])
    expect(result.current.sheetMimeTypes).toEqual([])
    expect(result.current.lyricsData).toEqual([])
    expect(result.current.chordsData).toEqual([])
  })

  it('should provide all required properties', () => {
    const { result } = renderHook(() => useContentLoading(mockSongs))

    expect(result.current).toHaveProperty('sheetUrls')
    expect(result.current).toHaveProperty('sheetMimeTypes')
    expect(result.current).toHaveProperty('lyricsData')
    expect(result.current).toHaveProperty('chordsData')
    expect(result.current).toHaveProperty('isLoading')
    expect(typeof result.current.isLoading).toBe('boolean')
  })

  it('should handle empty songs array', () => {
    const { result } = renderHook(() => useContentLoading(emptySongs))

    expect(result.current.sheetUrls).toEqual([])
    expect(result.current.lyricsData).toEqual([])
    expect(result.current.chordsData).toEqual([])
  })
})
