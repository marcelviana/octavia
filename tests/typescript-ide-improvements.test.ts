/**
 * TypeScript IDE Improvements Test
 *
 * This file demonstrates the IDE improvements and autocomplete
 * functionality with strict mode enabled.
 */

import { describe, it, expect } from 'vitest'
import type { Database } from '@/types/database'
import { ContentType } from '@/types/content'

// Test autocomplete and type safety improvements
describe('TypeScript IDE Improvements with Strict Mode', () => {
  describe('Enhanced Autocomplete', () => {
    it('should provide accurate autocomplete for database types', () => {
      type ContentRow = Database['public']['Tables']['content']['Row']

      // This should provide full autocomplete for all content properties
      const content: ContentRow = {} as ContentRow

      // The IDE should now show all available properties with their correct types
      const allProperties = {
        id: content.id, // string
        user_id: content.user_id, // string
        title: content.title, // string
        artist: content.artist, // string | null
        album: content.album, // string | null
        genre: content.genre, // string | null
        content_type: content.content_type, // string
        key: content.key, // string | null
        bpm: content.bpm, // number | null
        time_signature: content.time_signature, // string | null
        difficulty: content.difficulty, // string | null
        tags: content.tags, // string[] | null
        notes: content.notes, // string | null
        content_data: content.content_data, // Json | null
        file_url: content.file_url, // string | null
        capo: content.capo, // number | null (required by strict mode)
        tuning: content.tuning, // string | null (required by strict mode)
        thumbnail_url: content.thumbnail_url, // string | null (required by strict mode)
        is_favorite: content.is_favorite, // boolean
        is_public: content.is_public, // boolean
        created_at: content.created_at, // string
        updated_at: content.updated_at // string
      }

      expect(typeof allProperties).toBe('object')
    })

    it('should catch null/undefined access with strict null checks', () => {
      type ContentRow = Database['public']['Tables']['content']['Row']
      const content: ContentRow | null = null

      // This should now require null checking
      const safeAccess = content?.title // string | undefined
      expect(safeAccess).toBeUndefined()

      // Direct access would cause TypeScript error (caught by IDE)
      // const unsafeAccess = content.title // ❌ Object is possibly 'null'
    })

    it('should provide strict function parameter checking', () => {
      // Function with strict parameter types
      const processContent = (
        content: Database['public']['Tables']['content']['Row'],
        callback: (title: string) => string
      ): string => {
        // IDE should show full autocomplete for content properties
        return callback(content.title)
      }

      const mockContent: Database['public']['Tables']['content']['Row'] = {
        id: 'test',
        user_id: 'user',
        title: 'Test Song',
        artist: null,
        album: null,
        genre: null,
        content_type: 'Lyrics',
        key: null,
        bpm: null,
        time_signature: null,
        difficulty: null,
        tags: null,
        notes: null,
        content_data: null,
        file_url: null,
        capo: null,
        tuning: null,
        thumbnail_url: null,
        is_favorite: false,
        is_public: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const result = processContent(mockContent, (title) => title.toUpperCase())
      expect(result).toBe('TEST SONG')
    })
  })

  describe('Array Index Safety', () => {
    it('should enforce safe array access with noUncheckedIndexedAccess', () => {
      const contentArray: Database['public']['Tables']['content']['Row'][] = []

      // With noUncheckedIndexedAccess, this is now ContentRow | undefined
      const firstItem = contentArray[0]
      expect(firstItem).toBeUndefined()

      // Safe access pattern enforced by TypeScript
      if (firstItem) {
        const title = firstItem.title // Now safely accessed
        expect(typeof title).toBe('string')
      }
    })

    it('should handle optional chaining correctly', () => {
      const data: { items?: string[] } = {}

      // TypeScript now enforces optional chaining
      const firstItem = data.items?.[0] // string | undefined
      expect(firstItem).toBeUndefined()

      // Unsafe access would show TypeScript error
      // const unsafeItem = data.items[0] // ❌ Object is possibly 'undefined'
    })
  })

  describe('Enum and Union Type Safety', () => {
    it('should provide strict enum checking', () => {
      // ContentType enum should provide autocomplete
      const validTypes: ContentType[] = [
        ContentType.LYRICS, // Should autocomplete
        ContentType.CHORDS,
        ContentType.TAB,
        ContentType.SHEET,
        ContentType.PIANO,
        ContentType.DRUMS
      ]

      expect(validTypes).toContain(ContentType.LYRICS)

      // Invalid enum value should show TypeScript error
      // const invalid: ContentType = 'InvalidType' // ❌ Type error
    })

    it('should enforce discriminated union types', () => {
      type ApiResponse<T> =
        | { success: true; data: T; error?: never }
        | { success: false; data?: never; error: string }

      const successResponse: ApiResponse<string> = {
        success: true,
        data: 'Hello World'
        // error is automatically excluded by TypeScript
      }

      const errorResponse: ApiResponse<string> = {
        success: false,
        error: 'Something went wrong'
        // data is automatically excluded by TypeScript
      }

      if (successResponse.success) {
        // TypeScript knows data is available here
        expect(successResponse.data).toBe('Hello World')
      }

      if (!errorResponse.success) {
        // TypeScript knows error is available here
        expect(errorResponse.error).toBe('Something went wrong')
      }
    })
  })

  describe('Generic Type Constraints', () => {
    it('should enforce proper generic constraints', () => {
      // Generic function with constraints
      function updateRecord<T extends { id: string; updated_at: string }>(
        record: T,
        updates: Partial<Omit<T, 'id' | 'created_at'>>
      ): T {
        return {
          ...record,
          ...updates,
          updated_at: new Date().toISOString()
        }
      }

      type ContentRow = Database['public']['Tables']['content']['Row']
      const content: ContentRow = {
        id: 'test',
        user_id: 'user',
        title: 'Original Title',
        artist: 'Original Artist',
        album: null,
        genre: null,
        content_type: 'Lyrics',
        key: null,
        bpm: null,
        time_signature: null,
        difficulty: null,
        tags: null,
        notes: null,
        content_data: null,
        file_url: null,
        capo: null,
        tuning: null,
        thumbnail_url: null,
        is_favorite: false,
        is_public: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const updated = updateRecord(content, {
        title: 'Updated Title',
        artist: 'Updated Artist'
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.artist).toBe('Updated Artist')
    })
  })

  describe('Error Handling Improvements', () => {
    it('should provide better error type inference', () => {
      const handleApiError = (error: unknown): string => {
        // Strict mode requires proper type narrowing
        if (error instanceof Error) {
          return `Error: ${error.message}`
        }

        if (typeof error === 'string') {
          return `String error: ${error}`
        }

        if (error && typeof error === 'object' && 'message' in error) {
          return `Object error: ${(error as { message: string }).message}`
        }

        return 'Unknown error occurred'
      }

      expect(handleApiError(new Error('Test'))).toContain('Error: Test')
      expect(handleApiError('String error')).toContain('String error')
      expect(handleApiError({ message: 'Object error' })).toContain('Object error')
      expect(handleApiError(123)).toBe('Unknown error occurred')
    })
  })

  describe('IDE Autocomplete Features', () => {
    it('should demonstrate enhanced autocomplete for API types', () => {
      // When typing in IDE, these should show full autocomplete
      type ContentInsert = Database['public']['Tables']['content']['Insert']
      type ContentUpdate = Database['public']['Tables']['content']['Update']
      type SetlistRow = Database['public']['Tables']['setlists']['Row']

      const insertData: ContentInsert = {
        user_id: 'user-123',
        title: 'New Song',
        content_type: 'Lyrics'
        // IDE should show all optional properties available
      }

      const updateData: ContentUpdate = {
        title: 'Updated Song'
        // Only updatable fields should be suggested
      }

      const setlist: SetlistRow = {
        id: 'setlist-1',
        user_id: 'user-123',
        name: 'My Setlist',
        description: null,
        performance_date: null,
        venue: null,
        notes: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      expect(insertData.title).toBe('New Song')
      expect(updateData.title).toBe('Updated Song')
      expect(setlist.name).toBe('My Setlist')
    })
  })
})