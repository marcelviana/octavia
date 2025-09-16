/**
 * Database Optimization Utilities
 *
 * Tools for optimizing database queries and preventing N+1 problems,
 * with focus on performance for live music applications.
 */

import { getSupabaseServiceClient } from './supabase-service'
import logger from './logger'

// Query result caching
export class QueryCache {
  private static cache: Map<string, { data: unknown; expiry: number }> = new Map()
  private static defaultTTL = 5 * 60 * 1000 // 5 minutes

  static set(key: string, data: unknown, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  static get(key: string): unknown | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  static invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  static clear(): void {
    this.cache.clear()
  }
}

// Batch query utilities to prevent N+1 problems
export interface BatchQueryOptions {
  batchSize?: number
  delayMs?: number
}

export class BatchQueryManager {
  private static pendingQueries: Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
    timestamp: number
  }[]> = new Map()

  private static batchTimeouts: Map<string, NodeJS.Timeout> = new Map()

  static async query<T>(
    queryKey: string,
    queryFn: (ids: string[]) => Promise<T[]>,
    id: string,
    options: BatchQueryOptions = {}
  ): Promise<T | null> {
    const { delayMs = 10 } = options

    return new Promise<T | null>((resolve, reject) => {
      // Add to pending queries
      const pending = this.pendingQueries.get(queryKey) || []
      pending.push({ resolve, reject, timestamp: Date.now() })
      this.pendingQueries.set(queryKey, pending)

      // Clear existing timeout
      const existingTimeout = this.batchTimeouts.get(queryKey)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Set new timeout to execute batch
      const timeout = setTimeout(async () => {
        await this.executeBatch(queryKey, queryFn, options)
      }, delayMs)

      this.batchTimeouts.set(queryKey, timeout)
    })
  }

  private static async executeBatch<T>(
    queryKey: string,
    queryFn: (ids: string[]) => Promise<T[]>,
    options: BatchQueryOptions
  ): Promise<void> {
    const pending = this.pendingQueries.get(queryKey) || []
    if (pending.length === 0) return

    // Clear pending queries
    this.pendingQueries.delete(queryKey)
    this.batchTimeouts.delete(queryKey)

    try {
      // Extract IDs from pending queries
      const ids = pending.map((_, index) => index.toString()) // This is simplified

      // Execute batched query
      const results = await queryFn(ids)

      // Resolve all pending promises
      pending.forEach((query, index) => {
        const result = results[index] || null
        query.resolve(result)
      })
    } catch (error) {
      // Reject all pending promises
      pending.forEach(query => {
        query.reject(error as Error)
      })
    }
  }
}

// Optimized content queries with joins and batching
export class OptimizedContentQueries {
  private static supabase = getSupabaseServiceClient()

  // Get content with all related data in a single query
  static async getContentWithRelations(contentId: string) {
    const cacheKey = `content:${contentId}:full`
    const cached = QueryCache.get(cacheKey)
    if (cached) return cached

    try {
      const { data, error } = await this.supabase
        .from('content')
        .select(`
          *,
          user_profiles!inner(id, full_name, avatar_url),
          content_tags(tag_name),
          content_collaborators(
            collaborator_id,
            role,
            user_profiles!content_collaborators_collaborator_id_fkey(full_name)
          )
        `)
        .eq('id', contentId)
        .single()

      if (error) throw error

      QueryCache.set(cacheKey, data, 10 * 60 * 1000) // 10 minutes
      return data
    } catch (error) {
      logger.error('Error fetching content with relations:', error)
      throw error
    }
  }

  // Get multiple content items with optimized joins
  static async getContentBatch(contentIds: string[]) {
    if (contentIds.length === 0) return []

    const cacheKey = `content:batch:${contentIds.sort().join(',')}`
    const cached = QueryCache.get(cacheKey)
    if (cached) return cached as unknown[]

    try {
      const { data, error } = await this.supabase
        .from('content')
        .select(`
          id,
          title,
          artist,
          content_type,
          key,
          bpm,
          difficulty,
          file_url,
          content_data,
          created_at,
          updated_at,
          is_favorite,
          user_profiles!inner(id, full_name)
        `)
        .in('id', contentIds)
        .order('title')

      if (error) throw error

      QueryCache.set(cacheKey, data, 5 * 60 * 1000) // 5 minutes
      return data || []
    } catch (error) {
      logger.error('Error fetching content batch:', error)
      throw error
    }
  }

  // Get setlist with all songs and content in optimized query
  static async getSetlistWithContent(setlistId: string) {
    const cacheKey = `setlist:${setlistId}:full`
    const cached = QueryCache.get(cacheKey)
    if (cached) return cached

    try {
      // First get the setlist
      const { data: setlist, error: setlistError } = await this.supabase
        .from('setlists')
        .select('*')
        .eq('id', setlistId)
        .single()

      if (setlistError) throw setlistError

      // Then get all setlist songs with content in a single query
      const { data: setlistSongs, error: songsError } = await this.supabase
        .from('setlist_songs')
        .select(`
          id,
          position,
          notes,
          content:content_id(
            id,
            title,
            artist,
            content_type,
            key,
            bpm,
            file_url,
            content_data
          )
        `)
        .eq('setlist_id', setlistId)
        .order('position')

      if (songsError) throw songsError

      const result = {
        ...setlist,
        setlist_songs: setlistSongs || []
      }

      QueryCache.set(cacheKey, result, 10 * 60 * 1000) // 10 minutes
      return result
    } catch (error) {
      logger.error('Error fetching setlist with content:', error)
      throw error
    }
  }

  // Optimized library query with pagination and filtering
  static async getLibraryPage(
    userId: string,
    options: {
      page?: number
      pageSize?: number
      search?: string
      contentType?: string
      sortBy?: 'recent' | 'title' | 'artist'
      favorite?: boolean
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      search,
      contentType,
      sortBy = 'recent',
      favorite
    } = options

    const cacheKey = `library:${userId}:${JSON.stringify(options)}`
    const cached = QueryCache.get(cacheKey)
    if (cached) return cached

    try {
      let query = this.supabase
        .from('content')
        .select(`
          id,
          title,
          artist,
          album,
          content_type,
          key,
          bpm,
          difficulty,
          file_url,
          thumbnail_url,
          created_at,
          updated_at,
          is_favorite,
          is_public
        `)
        .eq('user_id', userId)

      // Apply filters
      if (search) {
        query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`)
      }

      if (contentType) {
        query = query.eq('content_type', contentType)
      }

      if (favorite !== undefined) {
        query = query.eq('is_favorite', favorite)
      }

      // Apply sorting
      switch (sortBy) {
        case 'title':
          query = query.order('title')
          break
        case 'artist':
          query = query.order('artist').order('title')
          break
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      const result = {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }

      QueryCache.set(cacheKey, result, 2 * 60 * 1000) // 2 minutes
      return result
    } catch (error) {
      logger.error('Error fetching library page:', error)
      throw error
    }
  }

  // Get user's recent activity efficiently
  static async getRecentActivity(userId: string, limit: number = 10) {
    const cacheKey = `activity:${userId}:${limit}`
    const cached = QueryCache.get(cacheKey)
    if (cached) return cached

    try {
      // Combine multiple activity types in parallel
      const [recentContent, recentSetlists, recentEdits] = await Promise.all([
        // Recent content creation
        this.supabase
          .from('content')
          .select('id, title, content_type, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit),

        // Recent setlist activity
        this.supabase
          .from('setlists')
          .select('id, name, updated_at')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(limit),

        // Recent content edits (if you have an audit table)
        this.supabase
          .from('content')
          .select('id, title, updated_at')
          .eq('user_id', userId)
          .neq('created_at', 'updated_at')
          .order('updated_at', { ascending: false })
          .limit(limit)
      ])

      const activities = [
        ...(recentContent.data || []).map(item => ({
          type: 'content_created',
          ...item,
          timestamp: item.created_at
        })),
        ...(recentSetlists.data || []).map(item => ({
          type: 'setlist_updated',
          ...item,
          timestamp: item.updated_at
        })),
        ...(recentEdits.data || []).map(item => ({
          type: 'content_edited',
          ...item,
          timestamp: item.updated_at
        }))
      ]

      // Sort by timestamp and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

      QueryCache.set(cacheKey, sortedActivities, 5 * 60 * 1000) // 5 minutes
      return sortedActivities
    } catch (error) {
      logger.error('Error fetching recent activity:', error)
      throw error
    }
  }

  // Invalidate cache when content changes
  static invalidateContentCache(contentId?: string, userId?: string): void {
    if (contentId) {
      QueryCache.invalidate(`content:${contentId}`)
    }
    if (userId) {
      QueryCache.invalidate(`library:${userId}`)
      QueryCache.invalidate(`activity:${userId}`)
    }
    // Invalidate batch queries
    QueryCache.invalidate('content:batch')
  }
}

// Database connection pooling and optimization
export class DatabaseOptimizer {
  // Prepare frequently used queries
  static preparedQueries = {
    getUserContent: `
      SELECT id, title, artist, content_type, created_at
      FROM content
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `,

    getSetlistSongs: `
      SELECT
        ss.id, ss.position, ss.notes,
        c.id as content_id, c.title, c.artist, c.key, c.bpm
      FROM setlist_songs ss
      JOIN content c ON ss.content_id = c.id
      WHERE ss.setlist_id = $1
      ORDER BY ss.position
    `,

    searchContent: `
      SELECT id, title, artist, content_type,
             ts_rank(search_vector, plainto_tsquery($2)) as rank
      FROM content
      WHERE user_id = $1
        AND search_vector @@ plainto_tsquery($2)
      ORDER BY rank DESC, created_at DESC
      LIMIT $3
    `
  }

  // Monitor query performance
  static async executeWithTiming<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()

    try {
      const result = await queryFn()
      const duration = performance.now() - start

      // Log slow queries
      if (duration > 1000) { // 1 second
        logger.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      logger.error(`Query failed: ${queryName} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
}

// Export utilities for global access
export { QueryCache, BatchQueryManager, OptimizedContentQueries, DatabaseOptimizer }