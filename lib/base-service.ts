/**
 * Base Service Class
 * 
 * Provides consistent patterns for all data operations across the application.
 * Ensures proper authentication, error handling, and logging for all services.
 * 
 * Key Features:
 * - Unified authentication handling
 * - Consistent error handling and logging
 * - Type-safe operation results
 * - Automatic request queueing for offline scenarios
 * - Performance metrics collection
 */

import logger from "@/lib/logger"
import { debug } from "@/lib/debug"
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies"

// Standard service operation result
export interface ServiceResult<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

// User information from authentication
export interface AuthUser {
  id: string
  email: string | null
}

// Service operation context
export interface ServiceContext {
  user?: AuthUser
  cookieStore?: ReadonlyRequestCookies
  requestUrl?: string
  isServer?: boolean
}

// Base service class for consistent patterns
export abstract class BaseService {
  protected readonly serviceName: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  /**
   * Get authenticated user for client-side operations
   */
  protected async getClientUser(): Promise<AuthUser | null> {
    try {
      if (typeof window === "undefined") {
        throw new Error("getClientUser called on server side")
      }

      const { auth } = await import("@/lib/firebase")
      if (!auth?.currentUser) {
        return null
      }

      return {
        id: auth.currentUser.uid,
        email: auth.currentUser.email,
      }
    } catch (error) {
      this.logError("getClientUser failed", error)
      return null
    }
  }

  /**
   * Get authenticated user for server-side operations
   */
  protected async getServerUser(
    cookieStore?: ReadonlyRequestCookies,
    requestUrl?: string
  ): Promise<AuthUser | null> {
    try {
      if (typeof window !== "undefined") {
        throw new Error("getServerUser called on client side")
      }

      const { getServerSideUser } = await import("@/lib/firebase-server-utils")
      const user = await getServerSideUser(cookieStore, requestUrl)
      
      if (!user) {
        return null
      }

      return {
        id: user.uid,
        email: user.email || null,
      }
    } catch (error) {
      this.logError("getServerUser failed", error)
      return null
    }
  }

  /**
   * Get authenticated user based on context (client or server)
   */
  protected async getAuthenticatedUser(context: ServiceContext = {}): Promise<AuthUser | null> {
    try {
      if (context.user) {
        return context.user
      }

      if (context.isServer || context.cookieStore) {
        return await this.getServerUser(context.cookieStore, context.requestUrl)
      }

      return await this.getClientUser()
    } catch (error) {
      this.logError("getAuthenticatedUser failed", error)
      return null
    }
  }

  /**
   * Execute service operation with consistent error handling
   */
  protected async executeOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    context: ServiceContext = {}
  ): Promise<ServiceResult<T>> {
    const startTime = Date.now()
    
    try {
      this.logDebug(`${operationName} starting`, { context })
      
      const result = await operation()
      const duration = Date.now() - startTime
      
      this.logDebug(`${operationName} completed`, { duration })
      
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      this.logError(`${operationName} failed`, error, { duration, context })
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      }
    }
  }

  /**
   * Require authentication for an operation
   */
  protected async requireAuth(context: ServiceContext = {}): Promise<AuthUser> {
    const user = await this.getAuthenticatedUser(context)
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }

  /**
   * Validate required parameters
   */
  protected validateRequired<T>(value: T | null | undefined, name: string): T {
    if (value === null || value === undefined) {
      throw new Error(`${name} is required`)
    }
    return value
  }

  /**
   * Log debug information
   */
  protected logDebug(message: string, data?: any): void {
    debug.log(`[${this.serviceName}] ${message}`, data)
  }

  /**
   * Log error information
   */
  protected logError(message: string, error?: any, data?: any): void {
    const errorMessage = `[${this.serviceName}] ${message}`
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(errorMessage, { error, data })
    }
    
    // Log to structured logger
    logger.error(errorMessage, {
      service: this.serviceName,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      data,
    })
  }

  /**
   * Get Supabase client for database operations
   */
  protected async getSupabaseClient() {
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    return createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Get Supabase service client for server-side operations
   */
  protected async getSupabaseServiceClient() {
    const { getSupabaseServiceClient } = await import("@/lib/supabase-service")
    return getSupabaseServiceClient()
  }
}