/**
 * Service Layer Mocks
 * 
 * Mock implementations of the service layer for testing components
 * without requiring actual database operations.
 */

import { vi } from 'vitest'
import type { Database } from '@/types/supabase'
import { mockContentItem, mockRepositorySuccess, mockRepositoryError } from './test-utils'

type ContentRow = Database['public']['Tables']['content']['Row']
type ContentInsert = Database['public']['Tables']['content']['Insert']

// Mock repository responses
const mockContentList: ContentRow[] = [
  mockContentItem,
  {
    ...mockContentItem,
    id: 'test-content-2',
    title: 'Another Test Song',
    is_favorite: true,
  },
]

// Mock Content Repository
export const mockContentRepository = {
  findById: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findByUserId: vi.fn(),
  findByContentType: vi.fn(),
  findFavorites: vi.fn(),
  findRecent: vi.fn(),
  searchContent: vi.fn(),
  getContentStats: vi.fn(),
  updateFavoriteStatus: vi.fn(),
  updatePublicStatus: vi.fn(),
  bulkCreate: vi.fn(),
  bulkDelete: vi.fn(),
  count: vi.fn(),
  clearCache: vi.fn(),
}

// Mock Content Service
export const mockContentService = {
  getContent: vi.fn(),
  getUserContent: vi.fn(),
  getRecentContent: vi.fn(),
  createContent: vi.fn(),
  updateContent: vi.fn(),
  deleteContent: vi.fn(),
  toggleFavorite: vi.fn(),
  togglePublic: vi.fn(),
  getContentStats: vi.fn(),
  bulkCreateContent: vi.fn(),
  bulkDeleteContent: vi.fn(),
  clearCache: vi.fn(),
}

// Mock offline cache service
export const mockOfflineCacheService = {
  getCachedFileInfo: vi.fn(),
  cacheFile: vi.fn(),
  removeCachedFile: vi.fn(),
  clearCache: vi.fn(),
  getCacheStats: vi.fn(),
  preloadContent: vi.fn(),
  warmCache: vi.fn(),
  initializeCache: vi.fn(),
  getStorageQuota: vi.fn(),
  cleanup: vi.fn(),
}

// Setup default mock behaviors
export const setupServiceMocks = () => {
  // Repository mocks
  mockContentRepository.findById.mockImplementation((id: string) => {
    const item = mockContentList.find(c => c.id === id)
    return Promise.resolve(item ? mockRepositorySuccess(item) : mockRepositorySuccess(null))
  })

  mockContentRepository.findMany.mockResolvedValue(mockRepositorySuccess(mockContentList))
  
  mockContentRepository.findByUserId.mockResolvedValue(mockRepositorySuccess(mockContentList))
  
  mockContentRepository.findFavorites.mockImplementation(() => {
    const favorites = mockContentList.filter(c => c.is_favorite)
    return Promise.resolve(mockRepositorySuccess(favorites))
  })

  mockContentRepository.findRecent.mockResolvedValue(mockRepositorySuccess(mockContentList.slice(0, 5)))

  mockContentRepository.create.mockImplementation((data: ContentInsert) => {
    const newItem: ContentRow = {
      ...mockContentItem,
      ...data,
      id: `test-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return Promise.resolve(mockRepositorySuccess(newItem))
  })

  mockContentRepository.update.mockImplementation((id: string, updates: any) => {
    const existing = mockContentList.find(c => c.id === id)
    if (existing) {
      const updated = { ...existing, ...updates, updated_at: new Date().toISOString() }
      return Promise.resolve(mockRepositorySuccess(updated))
    }
    return Promise.resolve(mockRepositoryError('Content not found'))
  })

  mockContentRepository.delete.mockResolvedValue(mockRepositorySuccess(undefined))

  mockContentRepository.searchContent.mockImplementation((userId: string, searchTerm: string) => {
    const results = mockContentList.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.artist?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return Promise.resolve(mockRepositorySuccess(results))
  })

  mockContentRepository.getContentStats.mockResolvedValue(mockRepositorySuccess({
    totalContent: mockContentList.length,
    favoriteContent: mockContentList.filter(c => c.is_favorite).length,
    contentByType: {
      'Lyrics': mockContentList.filter(c => c.content_type === 'Lyrics').length,
      'Chords': mockContentList.filter(c => c.content_type === 'Chords').length,
    }
  }))

  // Service mocks
  mockContentService.getContent.mockImplementation(async (id: string) => {
    const result = await mockContentRepository.findById(id)
    if (result.error) throw new Error(result.error.message)
    return result.data
  })

  mockContentService.getUserContent.mockImplementation(async (userId: string, options = {}) => {
    let result
    if (options.favorites) {
      result = await mockContentRepository.findFavorites(userId, options)
    } else if (options.search) {
      result = await mockContentRepository.searchContent(userId, options.search, options)
    } else {
      result = await mockContentRepository.findByUserId(userId, options)
    }
    
    if (result.error) throw new Error(result.error.message)
    return result.data
  })

  mockContentService.createContent.mockImplementation(async (data: ContentInsert) => {
    const result = await mockContentRepository.create(data)
    if (result.error) throw new Error(result.error.message)
    return result.data
  })

  mockContentService.updateContent.mockImplementation(async (id: string, updates: any) => {
    const result = await mockContentRepository.update(id, updates)
    if (result.error) throw new Error(result.error.message)
    return result.data
  })

  mockContentService.deleteContent.mockImplementation(async (id: string) => {
    const result = await mockContentRepository.delete(id)
    if (result.error) throw new Error(result.error.message)
  })

  mockContentService.toggleFavorite.mockImplementation(async (id: string) => {
    const content = mockContentList.find(c => c.id === id)
    if (!content) throw new Error('Content not found')
    return mockContentService.updateContent(id, { is_favorite: !content.is_favorite })
  })

  mockContentService.getContentStats.mockImplementation(async (userId: string) => {
    const result = await mockContentRepository.getContentStats(userId)
    if (result.error) throw new Error(result.error.message)
    return result.data
  })

  // Offline cache mocks
  mockOfflineCacheService.getCachedFileInfo.mockResolvedValue({
    url: 'blob:cached-content',
    mimeType: 'application/pdf',
  })
  
  mockOfflineCacheService.cacheFile.mockResolvedValue()
  mockOfflineCacheService.removeCachedFile.mockResolvedValue()
  mockOfflineCacheService.clearCache.mockResolvedValue()
  mockOfflineCacheService.warmCache.mockResolvedValue()
  mockOfflineCacheService.initializeCache.mockResolvedValue()
  mockOfflineCacheService.cleanup.mockResolvedValue()
  
  mockOfflineCacheService.getCacheStats.mockResolvedValue({
    totalSize: 1024 * 1024, // 1MB
    itemCount: 5,
    lastCleanup: new Date().toISOString(),
  })
  
  mockOfflineCacheService.getStorageQuota.mockResolvedValue({
    quota: 1024 * 1024 * 1024, // 1GB
    usage: 1024 * 1024 * 100,  // 100MB
  })
}

// Utility to simulate service errors
export const simulateServiceError = (methodName: keyof typeof mockContentService, error: Error) => {
  mockContentService[methodName].mockRejectedValueOnce(error)
}

export const simulateRepositoryError = (methodName: keyof typeof mockContentRepository, error: any) => {
  mockContentRepository[methodName].mockResolvedValueOnce(mockRepositoryError(error))
}

// Reset all mocks
export const resetServiceMocks = () => {
  vi.clearAllMocks()
  setupServiceMocks()
}