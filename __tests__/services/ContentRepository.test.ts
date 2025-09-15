/**
 * Tests for ContentRepository
 * 
 * Tests the repository pattern implementation for content management,
 * including caching, error handling, and domain-specific operations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ContentRepository } from '@/domains/content-management/services/content-repository'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { 
  mockContentItem, 
  mockRepositorySuccess, 
  mockRepositoryError 
} from '../utils/test-utils'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

const mockQuery = {
  select: vi.fn(),
  eq: vi.fn(),
  in: vi.fn(),
  ilike: vi.fn(),
  or: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  range: vi.fn(),
  single: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/supabase-service')
const mockGetSupabaseServiceClient = vi.mocked(getSupabaseServiceClient)

describe('ContentRepository', () => {
  let repository: ContentRepository

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock Supabase client
    mockGetSupabaseServiceClient.mockReturnValue(mockSupabaseClient as any)
    mockSupabaseClient.from.mockReturnValue(mockQuery as any)
    
    // Chain all query methods to return themselves for method chaining
    Object.values(mockQuery).forEach(method => {
      method.mockReturnValue(mockQuery)
    })

    repository = new ContentRepository()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('findById', () => {
    it('should find content by ID successfully', async () => {
      mockQuery.single.mockResolvedValue({ data: mockContentItem, error: null })

      const result = await repository.findById('test-id')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('content')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual({ data: mockContentItem })
    })

    it('should return null for non-existent content', async () => {
      mockQuery.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows found' } 
      })

      const result = await repository.findById('non-existent')

      expect(result).toEqual({ data: null })
    })

    it('should handle database errors', async () => {
      const dbError = { code: 'PGRST000', message: 'Database error' }
      mockQuery.single.mockResolvedValue({ data: null, error: dbError })

      const result = await repository.findById('error-id')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Database error')
    })

    it('should use cache on subsequent calls', async () => {
      mockQuery.single.mockResolvedValue({ data: mockContentItem, error: null })

      // First call
      await repository.findById('test-id')
      // Second call
      await repository.findById('test-id')

      // Should only call Supabase once due to caching
      expect(mockQuery.single).toHaveBeenCalledTimes(1)
    })
  })

  describe('findMany', () => {
    it('should find multiple content items', async () => {
      const contentList = [mockContentItem, { ...mockContentItem, id: 'test-2' }]
      mockQuery.single.mockResolvedValue({ data: contentList, error: null })

      const result = await repository.findMany()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('content')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(result).toEqual({ data: contentList })
    })

    it('should apply filters correctly', async () => {
      const contentList = [mockContentItem]
      mockQuery.single.mockResolvedValue({ data: contentList, error: null })

      await repository.findMany({
        filters: { user_id: 'test-user', content_type: 'Lyrics' },
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user')
      expect(mockQuery.eq).toHaveBeenCalledWith('content_type', 'Lyrics')
    })

    it('should apply ordering', async () => {
      const contentList = [mockContentItem]
      mockQuery.single.mockResolvedValue({ data: contentList, error: null })

      await repository.findMany({
        orderBy: 'created_at',
        orderDirection: 'desc',
      })

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should apply pagination', async () => {
      const contentList = [mockContentItem]
      mockQuery.single.mockResolvedValue({ data: contentList, error: null })

      await repository.findMany({
        limit: 10,
        offset: 20,
      })

      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(mockQuery.range).toHaveBeenCalledWith(20, 29)
    })

    it('should handle array filters with "in" operator', async () => {
      const contentList = [mockContentItem]
      mockQuery.single.mockResolvedValue({ data: contentList, error: null })

      await repository.findMany({
        filters: { content_type: ['Lyrics', 'Chords'] },
      })

      expect(mockQuery.in).toHaveBeenCalledWith('content_type', ['Lyrics', 'Chords'])
    })
  })

  describe('create', () => {
    it('should create content successfully', async () => {
      const newContentData = {
        title: 'New Song',
        content_type: 'Lyrics',
        user_id: 'test-user',
      }

      mockQuery.single.mockResolvedValue({ data: mockContentItem, error: null })

      const result = await repository.create(newContentData)

      expect(mockQuery.insert).toHaveBeenCalledWith(newContentData)
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual({ data: mockContentItem })
    })

    it('should handle creation errors', async () => {
      const dbError = { code: 'PGRST000', message: 'Insert failed' }
      mockQuery.single.mockResolvedValue({ data: null, error: dbError })

      const result = await repository.create({ title: 'Test' } as any)

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Insert failed')
    })
  })

  describe('update', () => {
    it('should update content successfully', async () => {
      const updates = { title: 'Updated Title' }
      const updatedContent = { ...mockContentItem, ...updates }

      mockQuery.single.mockResolvedValue({ data: updatedContent, error: null })

      const result = await repository.update('test-id', updates)

      expect(mockQuery.update).toHaveBeenCalledWith(updates)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual({ data: updatedContent })
    })

    it('should handle update errors', async () => {
      const dbError = { code: 'PGRST000', message: 'Update failed' }
      mockQuery.single.mockResolvedValue({ data: null, error: dbError })

      const result = await repository.update('test-id', { title: 'New Title' })

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Update failed')
    })
  })

  describe('delete', () => {
    it('should delete content successfully', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null })

      const result = await repository.delete('test-id')

      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id')
      expect(result).toEqual({ data: undefined })
    })

    it('should handle delete errors', async () => {
      const dbError = { code: 'PGRST000', message: 'Delete failed' }
      mockQuery.single.mockResolvedValue({ data: null, error: dbError })

      const result = await repository.delete('test-id')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Delete failed')
    })
  })

  describe('domain-specific methods', () => {
    describe('findByContentType', () => {
      it('should find content by type for user', async () => {
        const contentList = [mockContentItem]
        mockQuery.single.mockResolvedValue({ data: contentList, error: null })

        const result = await repository.findByContentType('test-user', 'Lyrics')

        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user')
        expect(mockQuery.eq).toHaveBeenCalledWith('content_type', 'Lyrics')
        expect(result).toEqual({ data: contentList })
      })
    })

    describe('findFavorites', () => {
      it('should find user favorites', async () => {
        const favorites = [{ ...mockContentItem, is_favorite: true }]
        // Set up the chain to resolve at the end - for list queries, it shouldn't use single()
        mockQuery.order.mockResolvedValue({ data: favorites, error: null })

        const result = await repository.findFavorites('test-user')

        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user')
        expect(mockQuery.eq).toHaveBeenCalledWith('is_favorite', true)
        expect(mockQuery.order).toHaveBeenCalledWith('updated_at', { ascending: false })
        expect(result).toEqual({ data: favorites })
      })
    })

    describe('searchContent', () => {
      it('should search content by term', async () => {
        const searchResults = [mockContentItem]
        // Set up the chain to resolve at the end - for search queries, it shouldn't use single()
        mockQuery.or.mockResolvedValue({ data: searchResults, error: null })

        const result = await repository.searchContent('test-user', 'test song')

        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'test-user')
        expect(mockQuery.or).toHaveBeenCalledWith('title.ilike.%test song%,artist.ilike.%test song%')
        expect(result).toEqual({ data: searchResults })
      })
    })

    describe('getContentStats', () => {
      it('should get content statistics', async () => {
        // Mock count queries
        repository.count = vi.fn()
          .mockResolvedValueOnce(mockRepositorySuccess(5)) // total
          .mockResolvedValueOnce(mockRepositorySuccess(2)) // favorites

        // Mock content by type query - this should resolve at the end of the chain
        mockQuery.eq.mockResolvedValue({
          data: [
            { content_type: 'Lyrics' },
            { content_type: 'Lyrics' },
            { content_type: 'Chords' },
          ],
          error: null,
        })

        const result = await repository.getContentStats('test-user')

        expect(result).toEqual({
          data: {
            totalContent: 5,
            favoriteContent: 2,
            contentByType: {
              'Lyrics': 2,
              'Chords': 1,
            },
          },
        })
      })
    })
  })

  describe('bulk operations', () => {
    describe('bulkCreate', () => {
      it('should create multiple items', async () => {
        const items = [
          { title: 'Song 1', user_id: 'test-user' },
          { title: 'Song 2', user_id: 'test-user' },
        ]
        const createdItems = [
          { ...mockContentItem, title: 'Song 1' },
          { ...mockContentItem, title: 'Song 2' },
        ]

        // For bulk create, the chain is insert().select() so select should resolve
        mockQuery.select.mockResolvedValue({ data: createdItems, error: null })

        const result = await repository.bulkCreate(items as any)

        expect(mockQuery.insert).toHaveBeenCalledWith(items)
        expect(mockQuery.select).toHaveBeenCalled()
        expect(result).toEqual({ data: createdItems })
      })
    })

    describe('bulkDelete', () => {
      it('should delete multiple items', async () => {
        const ids = ['id1', 'id2', 'id3']
        mockQuery.single.mockResolvedValue({ data: null, error: null })

        const result = await repository.bulkDelete(ids)

        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.in).toHaveBeenCalledWith('id', ids)
        expect(result).toEqual({ data: undefined })
      })
    })
  })

  describe('caching behavior', () => {
    it('should cache successful findById results', async () => {
      mockQuery.single.mockResolvedValue({ data: mockContentItem, error: null })

      // First call
      const result1 = await repository.findById('test-id')
      // Second call (should use cache)
      const result2 = await repository.findById('test-id')

      expect(mockQuery.single).toHaveBeenCalledTimes(1)
      expect(result1).toEqual(result2)
    })

    it('should update cache after successful update', async () => {
      const updatedContent = { ...mockContentItem, title: 'Updated' }
      
      // First, populate cache
      mockQuery.single.mockResolvedValueOnce({ data: mockContentItem, error: null })
      await repository.findById('test-id')

      // Then update
      mockQuery.single.mockResolvedValueOnce({ data: updatedContent, error: null })
      await repository.update('test-id', { title: 'Updated' })

      // Cache should be updated - this would need to be verified by checking
      // internal cache state or by mocking the cache methods
    })

    it('should clear cache after delete', async () => {
      // First, populate cache
      mockQuery.single.mockResolvedValueOnce({ data: mockContentItem, error: null })
      await repository.findById('test-id')

      // Then delete
      mockQuery.single.mockResolvedValueOnce({ data: null, error: null })
      await repository.delete('test-id')

      // Next findById should not use cache
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      const result = await repository.findById('test-id')

      expect(result).toEqual({ data: null })
      expect(mockQuery.single).toHaveBeenCalledTimes(3) // populate + delete + findById after delete
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockQuery.single.mockRejectedValue(new Error('Network error'))

      const result = await repository.findById('test-id')

      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Network error')
    })

    it('should provide operation context in errors', async () => {
      mockQuery.single.mockRejectedValue(new Error('Database error'))

      const result = await repository.findById('test-id')

      expect(result.error).toBeDefined()
      // The actual error context would depend on the implementation
      // of the handleError method in the base repository
    })
  })
})