/**
 * Base Repository Pattern Implementation
 * 
 * Provides a standardized interface for data access operations
 * with consistent error handling and caching strategies.
 */

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface RepositoryOptions {
  enableCache?: boolean
  cacheTimeout?: number
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface RepositoryResult<T> {
  data: T
  error?: never
}

export interface RepositoryError {
  data?: never
  error: {
    message: string
    code?: string
    statusCode?: number
  }
}

export type RepositoryResponse<T> = RepositoryResult<T> | RepositoryError

export abstract class BaseRepository<T extends BaseEntity> {
  protected tableName: string
  protected options: RepositoryOptions
  protected cache = new Map<string, { data: T; timestamp: number }>()

  constructor(tableName: string, options: RepositoryOptions = {}) {
    this.tableName = tableName
    this.options = {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      ...options
    }
  }

  protected getCacheKey(id: string, suffix?: string): string {
    return suffix ? `${this.tableName}:${id}:${suffix}` : `${this.tableName}:${id}`
  }

  protected setCache(key: string, data: T): void {
    if (this.options.enableCache) {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      })
    }
  }

  protected getCache(key: string): T | null {
    if (!this.options.enableCache) return null

    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    const timeout = this.options.cacheTimeout || 5 * 60 * 1000

    if (now - cached.timestamp > timeout) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  public clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  protected handleError(error: any, operation: string): RepositoryError {
    console.error(`${this.tableName} ${operation} error:`, error)
    
    return {
      error: {
        message: error.message || `Failed to ${operation.toLowerCase()}`,
        code: error.code,
        statusCode: error.statusCode || 500
      }
    }
  }

  // Abstract methods that must be implemented by concrete repositories
  abstract findById(id: string): Promise<RepositoryResponse<T | null>>
  abstract findMany(options?: QueryOptions): Promise<RepositoryResponse<T[]>>
  abstract create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<RepositoryResponse<T>>
  abstract update(id: string, data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>): Promise<RepositoryResponse<T>>
  abstract delete(id: string): Promise<RepositoryResponse<void>>
}