/**
 * Content Service Layer
 * 
 * High-level service that orchestrates content operations using the repository pattern.
 * Provides a clean API for the UI layer while handling business logic and state management.
 */

import { ContentRepository } from './content-repository'
import { logger } from '@/lib/logger'
import type { Database } from '@/types/supabase'

type ContentRow = Database['public']['Tables']['content']['Row']
type ContentInsert = Database['public']['Tables']['content']['Insert']

export class ContentService {
  private repository: ContentRepository

  constructor() {
    this.repository = new ContentRepository()
  }

  // Content CRUD operations
  async getContent(id: string): Promise<ContentRow | null> {
    const result = await this.repository.findById(id)
    
    if (result.error) {
      logger.error('Failed to get content', { id, error: result.error })
      throw new Error(result.error.message)
    }

    return result.data
  }

  async getUserContent(
    userId: string,
    options?: {
      contentType?: string
      search?: string
      favorites?: boolean
      limit?: number
      offset?: number
    }
  ): Promise<ContentRow[]> {
    try {
      let result

      if (options?.favorites) {
        result = await this.repository.findFavorites(userId, {
          limit: options.limit,
          offset: options.offset
        })
      } else if (options?.contentType) {
        result = await this.repository.findByContentType(userId, options.contentType, {
          limit: options.limit,
          offset: options.offset
        })
      } else if (options?.search) {
        result = await this.repository.searchContent(userId, options.search, {
          limit: options.limit,
          offset: options.offset
        })
      } else {
        result = await this.repository.findByUserId(userId, {
          orderBy: 'updated_at',
          orderDirection: 'desc',
          limit: options?.limit,
          offset: options?.offset
        })
      }

      if (result.error) {
        logger.error('Failed to get user content', { userId, options, error: result.error })
        throw new Error(result.error.message)
      }

      return result.data
    } catch (error) {
      logger.error('Content service error', { userId, options, error })
      throw error
    }
  }

  async getRecentContent(userId: string, limit = 5): Promise<ContentRow[]> {
    const result = await this.repository.findRecent(userId, limit)
    
    if (result.error) {
      logger.error('Failed to get recent content', { userId, error: result.error })
      throw new Error(result.error.message)
    }

    return result.data
  }

  async createContent(data: ContentInsert): Promise<ContentRow> {
    // Validate required fields
    if (!data.user_id || !data.title || !data.content_type) {
      throw new Error('Missing required fields: user_id, title, or content_type')
    }

    // Sanitize data - convert undefined to null to match database schema
    const sanitizedData: Omit<ContentRow, 'id' | 'created_at' | 'updated_at'> = {
      user_id: data.user_id,
      title: data.title,
      content_type: data.content_type,
      content_data: data.content_data ?? {},
      artist: data.artist ?? null,
      album: data.album ?? null,
      genre: data.genre ?? null,
      key: data.key ?? null,
      bpm: data.bpm ?? null,
      time_signature: data.time_signature ?? null,
      difficulty: data.difficulty ?? null,
      notes: data.notes ?? null,
      is_favorite: data.is_favorite ?? false,
      is_public: data.is_public ?? false,
      capo: data.capo ?? null,
      tuning: data.tuning ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      file_url: data.file_url ?? null,
      tags: data.tags ?? null,
    }

    const result = await this.repository.create(sanitizedData)
    
    if (result.error) {
      logger.error('Failed to create content', { data, error: result.error })
      throw new Error(result.error.message)
    }

    logger.log('Content created successfully', { id: result.data.id, title: result.data.title })
    return result.data
  }

  async updateContent(id: string, updates: Partial<ContentRow>): Promise<ContentRow> {
    const result = await this.repository.update(id, updates)
    
    if (result.error) {
      logger.error('Failed to update content', { id, updates, error: result.error })
      throw new Error(result.error.message)
    }

    logger.log('Content updated successfully', { id })
    return result.data
  }

  async deleteContent(id: string): Promise<void> {
    const result = await this.repository.delete(id)
    
    if (result.error) {
      logger.error('Failed to delete content', { id, error: result.error })
      throw new Error(result.error.message)
    }

    logger.log('Content deleted successfully', { id })
  }

  // Specialized operations
  async toggleFavorite(id: string): Promise<ContentRow> {
    // Get current content
    const content = await this.getContent(id)
    if (!content) {
      throw new Error('Content not found')
    }

    // Toggle favorite status
    const newFavoriteStatus = !content.is_favorite
    return this.updateContent(id, { is_favorite: newFavoriteStatus })
  }

  async togglePublic(id: string): Promise<ContentRow> {
    // Get current content
    const content = await this.getContent(id)
    if (!content) {
      throw new Error('Content not found')
    }

    // Toggle public status
    const newPublicStatus = !content.is_public
    return this.updateContent(id, { is_public: newPublicStatus })
  }

  async getContentStats(userId: string): Promise<{
    totalContent: number
    favoriteContent: number
    contentByType: Record<string, number>
  }> {
    const result = await this.repository.getContentStats(userId)
    
    if (result.error) {
      logger.error('Failed to get content stats', { userId, error: result.error })
      throw new Error(result.error.message)
    }

    return result.data
  }

  // Bulk operations
  async bulkCreateContent(items: ContentInsert[]): Promise<ContentRow[]> {
    if (!items.length) {
      return []
    }

    const result = await this.repository.bulkCreate(items)
    
    if (result.error) {
      logger.error('Failed to bulk create content', { count: items.length, error: result.error })
      throw new Error(result.error.message)
    }

    logger.log('Bulk content created successfully', { count: result.data.length })
    return result.data
  }

  async bulkDeleteContent(ids: string[]): Promise<void> {
    if (!ids.length) {
      return
    }

    const result = await this.repository.bulkDelete(ids)
    
    if (result.error) {
      logger.error('Failed to bulk delete content', { ids, error: result.error })
      throw new Error(result.error.message)
    }

    logger.log('Bulk content deleted successfully', { count: ids.length })
  }

  // Cache management
  clearCache(): void {
    this.repository.clearCache()
    logger.log('Content cache cleared')
  }
}

// Export singleton instance
export const contentService = new ContentService()