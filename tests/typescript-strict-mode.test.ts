/**
 * TypeScript Strict Mode Validation Tests
 *
 * This file tests that our TypeScript interfaces work correctly
 * with strict mode enabled and that type safety is maintained.
 */

import { describe, it, expect } from 'vitest'
import type { Database } from '@/types/database'
import { ContentType } from '@/types/content'

// Test basic type definitions work
describe('TypeScript Strict Mode Validation', () => {
  describe('Database Types', () => {
    it('should correctly type Content table', () => {
      type ContentRow = Database['public']['Tables']['content']['Row']

      const testContent: ContentRow = {
        id: 'test-id',
        user_id: 'user-123',
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        genre: 'Rock',
        content_type: 'Lyrics',
        key: 'C',
        bpm: 120,
        time_signature: '4/4',
        difficulty: 'Intermediate',
        tags: ['rock', 'test'],
        notes: 'Test notes',
        content_data: { lyrics: 'Test lyrics' },
        file_url: null,
        capo: null,
        tuning: null,
        thumbnail_url: null,
        is_favorite: false,
        is_public: false,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }

      expect(testContent.id).toBe('test-id')
      expect(testContent.title).toBe('Test Song')
    })

    it('should correctly type Setlist table', () => {
      type SetlistRow = Database['public']['Tables']['setlists']['Row']

      const testSetlist: SetlistRow = {
        id: 'setlist-id',
        user_id: 'user-123',
        name: 'My Setlist',
        description: 'Test setlist',
        performance_date: null,
        venue: null,
        notes: null,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z'
      }

      expect(testSetlist.id).toBe('setlist-id')
      expect(testSetlist.name).toBe('My Setlist')
    })
  })

  describe('Content Types', () => {
    it('should enforce ContentType enum values', () => {
      const validTypes: ContentType[] = [
        ContentType.LYRICS,
        ContentType.CHORDS,
        ContentType.TAB,
        ContentType.SHEET,
        ContentType.PIANO,
        ContentType.DRUMS
      ]

      expect(validTypes).toContain(ContentType.LYRICS)
      expect(validTypes).toContain(ContentType.SHEET)
    })

    it('should work with content type strings', () => {
      const contentType: string = ContentType.LYRICS
      expect(contentType).toBe('Lyrics')
    })
  })

  describe('Function Signatures', () => {
    it('should enforce strict null checks', () => {
      // This should compile without errors
      const handleNullableValue = (value: string | null): string => {
        if (value === null) {
          return 'default'
        }
        return value.toUpperCase()
      }

      expect(handleNullableValue('test')).toBe('TEST')
      expect(handleNullableValue(null)).toBe('default')
    })

    it('should enforce strict function types', () => {
      // This tests that function parameters are strictly typed
      const processContent = (
        content: { id: string; title: string },
        callback: (id: string) => void
      ): void => {
        callback(content.id)
      }

      let callbackValue = ''
      processContent(
        { id: 'test-id', title: 'Test' },
        (id) => { callbackValue = id }
      )

      expect(callbackValue).toBe('test-id')
    })
  })

  describe('Strict Object Property Access', () => {
    it('should handle optional properties correctly', () => {
      interface TestInterface {
        required: string
        optional?: string
        nullable: string | null
      }

      const testObj: TestInterface = {
        required: 'value',
        nullable: null
      }

      // This should work with optional chaining
      const optionalValue = testObj.optional?.toUpperCase()
      expect(optionalValue).toBeUndefined()

      // This should work with null checks
      const nullableValue = testObj.nullable?.toUpperCase()
      expect(nullableValue).toBeUndefined()
    })

    it('should prevent access to undefined array elements', () => {
      const array: string[] = ['a', 'b', 'c']

      // With noUncheckedIndexedAccess, this should be string | undefined
      const element: string | undefined = array[10]
      expect(element).toBeUndefined()

      // Safe access pattern
      const safeElement = array[0]
      if (safeElement !== undefined) {
        expect(safeElement.toUpperCase()).toBe('A')
      }
    })
  })

  describe('Error Handling with Strict Types', () => {
    it('should handle unknown error types', () => {
      const handleError = (error: unknown): string => {
        if (error instanceof Error) {
          return error.message
        }
        if (typeof error === 'string') {
          return error
        }
        return 'Unknown error'
      }

      expect(handleError(new Error('Test error'))).toBe('Test error')
      expect(handleError('String error')).toBe('String error')
      expect(handleError({ custom: 'object' })).toBe('Unknown error')
    })
  })

  describe('API Response Types', () => {
    it('should correctly type API responses', () => {
      interface ApiResponse<T> {
        data: T | null
        error: string | null
        success: boolean
      }

      const successResponse: ApiResponse<{ id: string; name: string }> = {
        data: { id: '1', name: 'Test' },
        error: null,
        success: true
      }

      const errorResponse: ApiResponse<never> = {
        data: null,
        error: 'Something went wrong',
        success: false
      }

      expect(successResponse.success).toBe(true)
      expect(errorResponse.success).toBe(false)
    })
  })

  describe('Component Props Type Safety', () => {
    it('should enforce strict component prop types', () => {
      interface ComponentProps {
        title: string
        description?: string
        onClick: (id: string) => void
        isActive: boolean
      }

      // This simulates a component that receives strictly typed props
      const processProps = (props: ComponentProps): string => {
        let result = props.title
        if (props.description) {
          result += `: ${props.description}`
        }
        return result
      }

      const validProps: ComponentProps = {
        title: 'Test Title',
        description: 'Test Description',
        onClick: (id: string) => console.log(id),
        isActive: true
      }

      expect(processProps(validProps)).toBe('Test Title: Test Description')
    })
  })
})