/**
 * Content Repository
 * 
 * Domain-specific repository for content management operations.
 * Extends the base Supabase repository with content-specific methods.
 */

import { SupabaseRepository } from '@/domains/shared/services/supabase-repository'
import { QueryOptions, RepositoryResponse } from '@/domains/shared/services/base-repository'
import type { Database } from '@/types/supabase'

type ContentRow = Database['public']['Tables']['content']['Row']
type ContentInsert = Database['public']['Tables']['content']['Insert']
type ContentUpdate = Database['public']['Tables']['content']['Update']

export interface ContentFilters {
  user_id?: string
  content_type?: string
  is_favorite?: boolean
  is_public?: boolean
  search?: string
}

export interface ContentQueryOptions extends QueryOptions {
  filters?: ContentFilters
}

export class ContentRepository extends SupabaseRepository<ContentRow> {
  constructor() {
    super('content', {
      enableCache: true,
      cacheTimeout: 10 * 60 * 1000, // 10 minutes for content
    })
  }

  async findByContentType(
    userId: string,
    contentType: string,
    options: ContentQueryOptions = {}
  ): Promise<RepositoryResponse<ContentRow[]>> {
    return this.findMany({
      ...options,
      filters: {
        user_id: userId,
        content_type: contentType,
        ...options.filters
      }
    })
  }

  async findFavorites(userId: string, options: ContentQueryOptions = {}): Promise<RepositoryResponse<ContentRow[]>> {
    return this.findMany({
      ...options,
      filters: {
        user_id: userId,
        is_favorite: true,
        ...options.filters
      },
      orderBy: 'updated_at',
      orderDirection: 'desc'
    })
  }

  async findRecent(userId: string, limit = 10): Promise<RepositoryResponse<ContentRow[]>> {
    return this.findMany({
      filters: { user_id: userId },
      orderBy: 'updated_at',
      orderDirection: 'desc',
      limit
    })
  }

  async searchContent(
    userId: string,
    searchTerm: string,
    options: ContentQueryOptions = {}
  ): Promise<RepositoryResponse<ContentRow[]>> {
    try {
      // Use Supabase full-text search
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)

      // Apply additional filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (key !== 'search' && value !== undefined) {
            query = query.eq(key, value)
          }
        })
      }

      // Apply ordering and pagination
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        return this.handleError(error, 'searchContent')
      }

      return { data: data || [] }
    } catch (error) {
      return this.handleError(error, 'searchContent')
    }
  }

  async getContentStats(userId: string): Promise<RepositoryResponse<{
    totalContent: number
    favoriteContent: number
    contentByType: Record<string, number>
  }>> {
    try {
      // Get total count
      const totalResult = await this.count({ user_id: userId })
      if (totalResult.error) {
        return totalResult
      }

      // Get favorite count
      const favoriteResult = await this.count({ user_id: userId, is_favorite: true })
      if (favoriteResult.error) {
        return favoriteResult
      }

      // Get content by type
      const { data: contentByTypeData, error: contentByTypeError } = await this.supabase
        .from(this.tableName)
        .select('content_type')
        .eq('user_id', userId)

      if (contentByTypeError) {
        return this.handleError(contentByTypeError, 'getContentStats')
      }

      const contentByType: Record<string, number> = {}
      contentByTypeData?.forEach((item) => {
        const type = item.content_type || 'unknown'
        contentByType[type] = (contentByType[type] || 0) + 1
      })

      return {
        data: {
          totalContent: totalResult.data,
          favoriteContent: favoriteResult.data,
          contentByType
        }
      }
    } catch (error) {
      return this.handleError(error, 'getContentStats')
    }
  }

  async updateFavoriteStatus(id: string, isFavorite: boolean): Promise<RepositoryResponse<ContentRow>> {
    return this.update(id, { is_favorite: isFavorite })
  }

  async updatePublicStatus(id: string, isPublic: boolean): Promise<RepositoryResponse<ContentRow>> {
    return this.update(id, { is_public: isPublic })
  }

  // Bulk operations for better performance
  async bulkCreate(items: ContentInsert[]): Promise<RepositoryResponse<ContentRow[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(items)
        .select()

      if (error) {
        return this.handleError(error, 'bulkCreate')
      }

      // Cache all new items
      data?.forEach(item => {
        const cacheKey = this.getCacheKey(item.id)
        this.setCache(cacheKey, item)
      })

      return { data: data || [] }
    } catch (error) {
      return this.handleError(error, 'bulkCreate')
    }
  }

  async bulkDelete(ids: string[]): Promise<RepositoryResponse<void>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .in('id', ids)

      if (error) {
        return this.handleError(error, 'bulkDelete')
      }

      // Clear from cache
      ids.forEach(id => {
        const cacheKey = this.getCacheKey(id)
        this.cache.delete(cacheKey)
      })

      return { data: undefined as void }
    } catch (error) {
      return this.handleError(error, 'bulkDelete')
    }
  }

  // Override to clear related cache patterns
  public clearCache(pattern?: string): void {
    super.clearCache(pattern || this.tableName)
  }
}