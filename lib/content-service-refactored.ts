/**
 * Content Service (Refactored)
 * 
 * Handles all content-related operations using consistent service patterns.
 * Built on BaseService for unified authentication, error handling, and logging.
 */

import { BaseService, type ServiceResult, type ServiceContext } from "./base-service"
import { enqueueRequest } from "@/lib/offline-queue"
import type { Database } from "@/types/supabase"
import type { ContentQueryParams } from "./content-types"

// Content types from Supabase
type Content = Database["public"]["Tables"]["content"]["Row"]
type ContentInsert = Database["public"]["Tables"]["content"]["Insert"]
type ContentUpdate = Database["public"]["Tables"]["content"]["Update"]

// Content service specific types
export interface ContentCreateData {
  title: string
  artist?: string
  content_type: string
  file_url?: string
  content_data?: any
  key?: string
  bpm?: number
  notes?: string
}

export interface ContentUpdateData {
  title?: string
  artist?: string
  content_type?: string
  file_url?: string
  content_data?: any
  key?: string
  bpm?: number
  notes?: string
}

export interface ContentListResponse {
  content: Content[]
  total: number
  page: number
  hasMore: boolean
}

class ContentService extends BaseService {
  constructor() {
    super("ContentService")
  }

  /**
   * Get user's content with pagination and filtering
   */
  async getUserContent(
    params: ContentQueryParams = {},
    context: ServiceContext = {}
  ): Promise<ServiceResult<ContentListResponse>> {
    return this.executeOperation("getUserContent", async () => {
      const user = await this.requireAuth(context)
      
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = "created_at",
        sortOrder = "desc",
        contentType,
      } = params

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      let query = supabase
        .from("content")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)

      // Apply filters
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,artist.ilike.%${search}%,notes.ilike.%${search}%`
        )
      }

      if (contentType) {
        query = query.eq("content_type", contentType)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" })

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch content: ${error.message}`)
      }

      return {
        content: data || [],
        total: count || 0,
        page,
        hasMore: (count || 0) > page * limit,
      }
    }, context)
  }

  /**
   * Get content by ID
   */
  async getContentById(
    id: string,
    context: ServiceContext = {}
  ): Promise<ServiceResult<Content>> {
    return this.executeOperation("getContentById", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(id, "content ID")

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Content not found")
        }
        throw new Error(`Failed to fetch content: ${error.message}`)
      }

      if (!data) {
        throw new Error("Content not found")
      }

      return data
    }, context)
  }

  /**
   * Create new content
   */
  async createContent(
    contentData: ContentCreateData,
    context: ServiceContext = {}
  ): Promise<ServiceResult<Content>> {
    return this.executeOperation("createContent", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(contentData.title, "title")
      this.validateRequired(contentData.content_type, "content_type")

      const insertData: ContentInsert = {
        user_id: user.id,
        title: contentData.title,
        artist: contentData.artist || null,
        content_type: contentData.content_type,
        file_url: contentData.file_url || null,
        content_data: contentData.content_data || null,
        key: contentData.key || null,
        bpm: contentData.bpm || null,
        notes: contentData.notes || null,
      }

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("content")
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create content: ${error.message}`)
      }

      if (!data) {
        throw new Error("Failed to create content: No data returned")
      }

      // Queue for offline sync if on client
      if (typeof window !== "undefined") {
        try {
          await enqueueRequest("POST", "/api/content", insertData)
        } catch (error) {
          this.logError("Failed to queue content creation for offline sync", error)
        }
      }

      return data
    }, context)
  }

  /**
   * Update existing content
   */
  async updateContent(
    id: string,
    updates: ContentUpdateData,
    context: ServiceContext = {}
  ): Promise<ServiceResult<Content>> {
    return this.executeOperation("updateContent", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(id, "content ID")

      // First verify the content exists and belongs to user
      const existingResult = await this.getContentById(id, context)
      if (!existingResult.success) {
        throw new Error(existingResult.error || "Content not found")
      }

      const updateData: ContentUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("content")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update content: ${error.message}`)
      }

      if (!data) {
        throw new Error("Failed to update content: No data returned")
      }

      // Queue for offline sync if on client
      if (typeof window !== "undefined") {
        try {
          await enqueueRequest("PATCH", `/api/content/${id}`, updateData)
        } catch (error) {
          this.logError("Failed to queue content update for offline sync", error)
        }
      }

      return data
    }, context)
  }

  /**
   * Delete content
   */
  async deleteContent(
    id: string,
    context: ServiceContext = {}
  ): Promise<ServiceResult<void>> {
    return this.executeOperation("deleteContent", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(id, "content ID")

      // First verify the content exists and belongs to user
      const existingResult = await this.getContentById(id, context)
      if (!existingResult.success) {
        throw new Error(existingResult.error || "Content not found")
      }

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { error } = await supabase
        .from("content")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        throw new Error(`Failed to delete content: ${error.message}`)
      }

      // Queue for offline sync if on client
      if (typeof window !== "undefined") {
        try {
          await enqueueRequest("DELETE", `/api/content/${id}`, {})
        } catch (error) {
          this.logError("Failed to queue content deletion for offline sync", error)
        }
      }
    }, context)
  }

  /**
   * Get content statistics
   */
  async getContentStats(
    context: ServiceContext = {}
  ): Promise<ServiceResult<{
    totalCount: number
    contentTypeBreakdown: Record<string, number>
    recentCount: number
  }>> {
    return this.executeOperation("getContentStats", async () => {
      const user = await this.requireAuth(context)

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      // Get total count
      const { count: totalCount } = await supabase
        .from("content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      // Get content type breakdown
      const { data: contentTypes } = await supabase
        .from("content")
        .select("content_type")
        .eq("user_id", user.id)

      const contentTypeBreakdown: Record<string, number> = {}
      contentTypes?.forEach((item) => {
        const type = item.content_type || "unknown"
        contentTypeBreakdown[type] = (contentTypeBreakdown[type] || 0) + 1
      })

      // Get recent count (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: recentCount } = await supabase
        .from("content")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())

      return {
        totalCount: totalCount || 0,
        contentTypeBreakdown,
        recentCount: recentCount || 0,
      }
    }, context)
  }
}

// Export singleton instance
export const contentService = new ContentService()

// Export individual functions for backward compatibility
export const getUserContent = (params: ContentQueryParams = {}, context: ServiceContext = {}) =>
  contentService.getUserContent(params, context)

export const getContentById = (id: string, context: ServiceContext = {}) =>
  contentService.getContentById(id, context)

export const createContent = (data: ContentCreateData, context: ServiceContext = {}) =>
  contentService.createContent(data, context)

export const updateContent = (id: string, data: ContentUpdateData, context: ServiceContext = {}) =>
  contentService.updateContent(id, data, context)

export const deleteContent = (id: string, context: ServiceContext = {}) =>
  contentService.deleteContent(id, context)

export const getContentStats = (context: ServiceContext = {}) =>
  contentService.getContentStats(context)