/**
 * Supabase Repository Implementation
 * 
 * Concrete implementation of the repository pattern using Supabase
 * for database operations with proper error handling and caching.
 */

import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { BaseRepository, BaseEntity, QueryOptions, RepositoryResponse } from './base-repository'

export class SupabaseRepository<T extends BaseEntity> extends BaseRepository<T> {
  protected supabase = getSupabaseServiceClient()

  async findById(id: string): Promise<RepositoryResponse<T | null>> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(id)
      const cached = this.getCache(cacheKey)
      if (cached) {
        return { data: cached }
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null }
        }
        return this.handleError(error, 'findById')
      }

      // Cache the result
      this.setCache(cacheKey, data)

      return { data }
    } catch (error) {
      return this.handleError(error, 'findById')
    }
  }

  async findMany(options: QueryOptions = {}): Promise<RepositoryResponse<T[]>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else {
            query = query.eq(key, value)
          }
        })
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        })
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 100)) - 1)
      }

      const { data, error } = await query

      if (error) {
        return this.handleError(error, 'findMany')
      }

      return { data: data || [] }
    } catch (error) {
      return this.handleError(error, 'findMany')
    }
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<RepositoryResponse<T>> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()

      if (error) {
        return this.handleError(error, 'create')
      }

      // Cache the new item
      const cacheKey = this.getCacheKey(result.id)
      this.setCache(cacheKey, result)

      return { data: result }
    } catch (error) {
      return this.handleError(error, 'create')
    }
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<RepositoryResponse<T>> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return this.handleError(error, 'update')
      }

      // Update cache
      const cacheKey = this.getCacheKey(id)
      this.setCache(cacheKey, result)

      return { data: result }
    } catch (error) {
      return this.handleError(error, 'update')
    }
  }

  async delete(id: string): Promise<RepositoryResponse<void>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        return this.handleError(error, 'delete')
      }

      // Clear from cache
      const cacheKey = this.getCacheKey(id)
      this.cache.delete(cacheKey)

      return { data: undefined as void }
    } catch (error) {
      return this.handleError(error, 'delete')
    }
  }

  // Additional Supabase-specific methods
  async findByUserId(userId: string, options: QueryOptions = {}): Promise<RepositoryResponse<T[]>> {
    return this.findMany({
      ...options,
      filters: { user_id: userId, ...options.filters }
    })
  }

  async count(filters?: Record<string, any>): Promise<RepositoryResponse<number>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      const { count, error } = await query

      if (error) {
        return this.handleError(error, 'count')
      }

      return { data: count || 0 }
    } catch (error) {
      return this.handleError(error, 'count')
    }
  }
}