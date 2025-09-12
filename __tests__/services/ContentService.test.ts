/**
 * Tests for ContentService
 * 
 * Tests the service layer that orchestrates content operations,
 * including business logic, error handling, and repository integration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ContentService } from '@/domains/content-management/services/content-service'
import { ContentRepository } from '@/domains/content-management/services/content-repository'
import { logger } from '@/lib/logger'
import { 
  mockContentItem, 
  mockRepositorySuccess, 
  mockRepositoryError 
} from '../utils/test-utils'

// Mock dependencies
vi.mock('@/domains/content-management/services/content-repository')
vi.mock('@/lib/logger')

const MockedContentRepository = vi.mocked(ContentRepository)
const mockLogger = vi.mocked(logger)

describe('ContentService', () => {
  let service: ContentService
  let mockRepository: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock repository instance
    mockRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findFavorites: vi.fn(),
      findRecent: vi.fn(),
      findByContentType: vi.fn(),
      searchContent: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getContentStats: vi.fn(),
      bulkCreate: vi.fn(),
      bulkDelete: vi.fn(),
      clearCache: vi.fn(),
    }

    MockedContentRepository.mockImplementation(() => mockRepository)
    service = new ContentService()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getContent', () => {
    it('should get content by ID successfully', async () => {
      mockRepository.findById.mockResolvedValue(mockRepositorySuccess(mockContentItem))

      const result = await service.getContent('test-id')

      expect(mockRepository.findById).toHaveBeenCalledWith('test-id')
      expect(result).toBe(mockContentItem)
    })

    it('should return null for non-existent content', async () => {
      mockRepository.findById.mockResolvedValue(mockRepositorySuccess(null))

      const result = await service.getContent('non-existent')

      expect(result).toBeNull()
    })

    it('should handle repository errors', async () => {
      const error = mockRepositoryError('Database error')
      mockRepository.findById.mockResolvedValue(error)

      await expect(service.getContent('error-id')).rejects.toThrow('Database error')
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get content',
        { id: 'error-id', error: error.error }
      )
    })
  })

  describe('getUserContent', () => {
    const userId = 'test-user'
    const contentList = [mockContentItem]

    it('should get all user content by default', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockRepositorySuccess(contentList))

      const result = await service.getUserContent(userId)

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, {
        orderBy: 'updated_at',
        orderDirection: 'desc',
        limit: undefined,
        offset: undefined,
      })
      expect(result).toBe(contentList)
    })

    it('should get user favorites when requested', async () => {
      mockRepository.findFavorites.mockResolvedValue(mockRepositorySuccess(contentList))

      const result = await service.getUserContent(userId, { favorites: true })

      expect(mockRepository.findFavorites).toHaveBeenCalledWith(userId, {
        limit: undefined,
        offset: undefined,
      })
      expect(result).toBe(contentList)
    })

    it('should filter by content type when requested', async () => {
      mockRepository.findByContentType.mockResolvedValue(mockRepositorySuccess(contentList))

      const result = await service.getUserContent(userId, { contentType: 'Lyrics' })

      expect(mockRepository.findByContentType).toHaveBeenCalledWith(userId, 'Lyrics', {
        limit: undefined,
        offset: undefined,
      })
      expect(result).toBe(contentList)
    })

    it('should search content when search term provided', async () => {
      mockRepository.searchContent.mockResolvedValue(mockRepositorySuccess(contentList))

      const result = await service.getUserContent(userId, { search: 'test song' })

      expect(mockRepository.searchContent).toHaveBeenCalledWith(userId, 'test song', {
        limit: undefined,
        offset: undefined,
      })
      expect(result).toBe(contentList)
    })

    it('should apply pagination options', async () => {
      mockRepository.findByUserId.mockResolvedValue(mockRepositorySuccess(contentList))

      const result = await service.getUserContent(userId, { 
        limit: 10, 
        offset: 20 
      })

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, {
        orderBy: 'updated_at',
        orderDirection: 'desc',
        limit: 10,
        offset: 20,
      })
      expect(result).toBe(contentList)
    })

    it('should handle repository errors and log them', async () => {
      const error = mockRepositoryError('Query failed')
      mockRepository.findByUserId.mockResolvedValue(error)

      await expect(service.getUserContent(userId)).rejects.toThrow('Query failed')
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get user content',
        { userId, options: {}, error: error.error }
      )
    })
  })

  describe('getRecentContent', () => {
    it('should get recent content with default limit', async () => {
      const recentContent = [mockContentItem]
      mockRepository.findRecent.mockResolvedValue(mockRepositorySuccess(recentContent))

      const result = await service.getRecentContent('test-user')

      expect(mockRepository.findRecent).toHaveBeenCalledWith('test-user', 5)
      expect(result).toBe(recentContent)
    })

    it('should get recent content with custom limit', async () => {
      const recentContent = [mockContentItem]
      mockRepository.findRecent.mockResolvedValue(mockRepositorySuccess(recentContent))

      const result = await service.getRecentContent('test-user', 10)

      expect(mockRepository.findRecent).toHaveBeenCalledWith('test-user', 10)
      expect(result).toBe(recentContent)
    })
  })

  describe('createContent', () => {
    const validContentData = {
      user_id: 'test-user',
      title: 'New Song',
      content_type: 'Lyrics',
      content_data: { lyrics: 'Song lyrics' },
    }

    it('should create content successfully', async () => {
      mockRepository.create.mockResolvedValue(mockRepositorySuccess(mockContentItem))

      const result = await service.createContent(validContentData)

      expect(mockRepository.create).toHaveBeenCalledWith(validContentData)
      expect(result).toBe(mockContentItem)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Content created successfully',
        { id: mockContentItem.id, title: mockContentItem.title }
      )
    })

    it('should validate required fields', async () => {
      const invalidData = { title: 'Test' } // Missing user_id and content_type

      await expect(service.createContent(invalidData as any)).rejects.toThrow(
        'Missing required fields: user_id, title, or content_type'
      )

      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should handle repository creation errors', async () => {
      const error = mockRepositoryError('Creation failed')
      mockRepository.create.mockResolvedValue(error)

      await expect(service.createContent(validContentData)).rejects.toThrow('Creation failed')
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create content',
        { data: validContentData, error: error.error }
      )
    })
  })

  describe('updateContent', () => {
    it('should update content successfully', async () => {
      const updates = { title: 'Updated Title' }
      const updatedContent = { ...mockContentItem, ...updates }
      
      mockRepository.update.mockResolvedValue(mockRepositorySuccess(updatedContent))

      const result = await service.updateContent('test-id', updates)

      expect(mockRepository.update).toHaveBeenCalledWith('test-id', updates)
      expect(result).toBe(updatedContent)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Content updated successfully',
        { id: 'test-id' }
      )
    })

    it('should handle update errors', async () => {
      const error = mockRepositoryError('Update failed')
      mockRepository.update.mockResolvedValue(error)

      await expect(service.updateContent('test-id', { title: 'New' })).rejects.toThrow('Update failed')
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update content',
        { id: 'test-id', updates: { title: 'New' }, error: error.error }
      )
    })
  })

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      mockRepository.delete.mockResolvedValue(mockRepositorySuccess(undefined))

      await service.deleteContent('test-id')

      expect(mockRepository.delete).toHaveBeenCalledWith('test-id')
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Content deleted successfully',
        { id: 'test-id' }
      )
    })

    it('should handle delete errors', async () => {
      const error = mockRepositoryError('Delete failed')
      mockRepository.delete.mockResolvedValue(error)

      await expect(service.deleteContent('test-id')).rejects.toThrow('Delete failed')
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete content',
        { id: 'test-id', error: error.error }
      )
    })
  })

  describe('specialized operations', () => {
    describe('toggleFavorite', () => {
      it('should toggle favorite status from false to true', async () => {
        const content = { ...mockContentItem, is_favorite: false }
        const updatedContent = { ...content, is_favorite: true }

        mockRepository.findById.mockResolvedValue(mockRepositorySuccess(content))
        mockRepository.update.mockResolvedValue(mockRepositorySuccess(updatedContent))

        const result = await service.toggleFavorite('test-id')

        expect(mockRepository.findById).toHaveBeenCalledWith('test-id')
        expect(mockRepository.update).toHaveBeenCalledWith('test-id', { is_favorite: true })
        expect(result).toBe(updatedContent)
      })

      it('should toggle favorite status from true to false', async () => {
        const content = { ...mockContentItem, is_favorite: true }
        const updatedContent = { ...content, is_favorite: false }

        mockRepository.findById.mockResolvedValue(mockRepositorySuccess(content))
        mockRepository.update.mockResolvedValue(mockRepositorySuccess(updatedContent))

        const result = await service.toggleFavorite('test-id')

        expect(mockRepository.update).toHaveBeenCalledWith('test-id', { is_favorite: false })
        expect(result).toBe(updatedContent)
      })

      it('should handle content not found', async () => {
        mockRepository.findById.mockResolvedValue(mockRepositorySuccess(null))

        await expect(service.toggleFavorite('non-existent')).rejects.toThrow('Content not found')
      })
    })

    describe('togglePublic', () => {
      it('should toggle public status', async () => {
        const content = { ...mockContentItem, is_public: false }
        const updatedContent = { ...content, is_public: true }

        mockRepository.findById.mockResolvedValue(mockRepositorySuccess(content))
        mockRepository.update.mockResolvedValue(mockRepositorySuccess(updatedContent))

        const result = await service.togglePublic('test-id')

        expect(mockRepository.update).toHaveBeenCalledWith('test-id', { is_public: true })
        expect(result).toBe(updatedContent)
      })
    })
  })

  describe('getContentStats', () => {
    it('should get content statistics', async () => {
      const stats = {
        totalContent: 10,
        favoriteContent: 3,
        contentByType: { Lyrics: 5, Chords: 3, Tabs: 2 },
      }
      
      mockRepository.getContentStats.mockResolvedValue(mockRepositorySuccess(stats))

      const result = await service.getContentStats('test-user')

      expect(mockRepository.getContentStats).toHaveBeenCalledWith('test-user')
      expect(result).toBe(stats)
    })

    it('should handle stats retrieval errors', async () => {
      const error = mockRepositoryError('Stats query failed')
      mockRepository.getContentStats.mockResolvedValue(error)

      await expect(service.getContentStats('test-user')).rejects.toThrow('Stats query failed')
    })
  })

  describe('bulk operations', () => {
    describe('bulkCreateContent', () => {
      it('should create multiple content items', async () => {
        const items = [
          { user_id: 'test-user', title: 'Song 1', content_type: 'Lyrics' },
          { user_id: 'test-user', title: 'Song 2', content_type: 'Chords' },
        ]
        const createdItems = [
          { ...mockContentItem, title: 'Song 1' },
          { ...mockContentItem, title: 'Song 2' },
        ]

        mockRepository.bulkCreate.mockResolvedValue(mockRepositorySuccess(createdItems))

        const result = await service.bulkCreateContent(items as any)

        expect(mockRepository.bulkCreate).toHaveBeenCalledWith(items)
        expect(result).toBe(createdItems)
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Bulk content created successfully',
          { count: 2 }
        )
      })

      it('should handle empty arrays', async () => {
        const result = await service.bulkCreateContent([])

        expect(result).toEqual([])
        expect(mockRepository.bulkCreate).not.toHaveBeenCalled()
      })

      it('should handle bulk creation errors', async () => {
        const error = mockRepositoryError('Bulk creation failed')
        mockRepository.bulkCreate.mockResolvedValue(error)

        await expect(service.bulkCreateContent([{} as any])).rejects.toThrow('Bulk creation failed')
        
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to bulk create content',
          { count: 1, error: error.error }
        )
      })
    })

    describe('bulkDeleteContent', () => {
      it('should delete multiple content items', async () => {
        const ids = ['id1', 'id2', 'id3']
        mockRepository.bulkDelete.mockResolvedValue(mockRepositorySuccess(undefined))

        await service.bulkDeleteContent(ids)

        expect(mockRepository.bulkDelete).toHaveBeenCalledWith(ids)
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Bulk content deleted successfully',
          { count: 3 }
        )
      })

      it('should handle empty arrays', async () => {
        await service.bulkDeleteContent([])

        expect(mockRepository.bulkDelete).not.toHaveBeenCalled()
      })
    })
  })

  describe('cache management', () => {
    it('should clear cache', () => {
      service.clearCache()

      expect(mockRepository.clearCache).toHaveBeenCalled()
      expect(mockLogger.info).toHaveBeenCalledWith('Content cache cleared')
    })
  })

  describe('error handling and logging', () => {
    it('should catch and rethrow repository errors', async () => {
      mockRepository.findById.mockResolvedValue(mockRepositoryError('Repository error'))

      await expect(service.getContent('test-id')).rejects.toThrow('Repository error')
    })

    it('should catch and rethrow unexpected errors', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Unexpected error'))

      await expect(service.getContent('test-id')).rejects.toThrow('Unexpected error')
    })

    it('should log all errors with appropriate context', async () => {
      const error = mockRepositoryError('Test error')
      mockRepository.findById.mockResolvedValue(error)

      try {
        await service.getContent('test-id')
      } catch (e) {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get content',
        expect.objectContaining({
          id: 'test-id',
          error: error.error,
        })
      )
    })
  })
})