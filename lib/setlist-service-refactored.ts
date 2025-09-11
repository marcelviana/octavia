/**
 * Setlist Service (Refactored)
 * 
 * Handles all setlist-related operations using consistent service patterns.
 * Built on BaseService for unified authentication, error handling, and logging.
 */

import { BaseService, type ServiceResult, type ServiceContext } from "./base-service"
import { contentService } from "./content-service-refactored"
import type { Database } from "@/types/supabase"
import type { SetlistWithSongs, SetlistFormData } from "@/types/performance"

// Setlist types from Supabase
type Setlist = Database["public"]["Tables"]["setlists"]["Row"]
type SetlistInsert = Database["public"]["Tables"]["setlists"]["Insert"]
type SetlistUpdate = Database["public"]["Tables"]["setlists"]["Update"]
type SetlistSong = Database["public"]["Tables"]["setlist_songs"]["Row"]
type SetlistSongInsert = Database["public"]["Tables"]["setlist_songs"]["Insert"]

// Setlist service specific types
export interface SetlistCreateData {
  name: string
  description?: string
  performance_date?: string
  venue?: string
  notes?: string
}

export interface SetlistUpdateData {
  name?: string
  description?: string
  performance_date?: string
  venue?: string
  notes?: string
}

export interface AddSongToSetlistData {
  content_id: string
  position: number
  notes?: string
}

class SetlistService extends BaseService {
  constructor() {
    super("SetlistService")
  }

  /**
   * Get user's setlists with songs
   */
  async getUserSetlists(
    context: ServiceContext = {}
  ): Promise<ServiceResult<SetlistWithSongs[]>> {
    return this.executeOperation("getUserSetlists", async () => {
      const user = await this.requireAuth(context)

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("setlists")
        .select(`
          *,
          setlist_songs (
            id,
            position,
            notes,
            content (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .order("position", { foreignTable: "setlist_songs", ascending: true })

      if (error) {
        throw new Error(`Failed to fetch setlists: ${error.message}`)
      }

      return (data || []) as SetlistWithSongs[]
    }, context)
  }

  /**
   * Get setlist by ID with songs
   */
  async getSetlistById(
    id: string,
    context: ServiceContext = {}
  ): Promise<ServiceResult<SetlistWithSongs>> {
    return this.executeOperation("getSetlistById", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(id, "setlist ID")

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("setlists")
        .select(`
          *,
          setlist_songs (
            id,
            position,
            notes,
            content (*)
          )
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("Setlist not found")
        }
        throw new Error(`Failed to fetch setlist: ${error.message}`)
      }

      if (!data) {
        throw new Error("Setlist not found")
      }

      return data as SetlistWithSongs
    }, context)
  }

  /**
   * Create new setlist
   */
  async createSetlist(
    setlistData: SetlistCreateData,
    context: ServiceContext = {}
  ): Promise<ServiceResult<Setlist>> {
    return this.executeOperation("createSetlist", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(setlistData.name, "setlist name")

      const insertData: SetlistInsert = {
        user_id: user.id,
        name: setlistData.name,
        description: setlistData.description || null,
        performance_date: setlistData.performance_date || null,
        venue: setlistData.venue || null,
        notes: setlistData.notes || null,
      }

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("setlists")
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create setlist: ${error.message}`)
      }

      if (!data) {
        throw new Error("Failed to create setlist: No data returned")
      }

      return data
    }, context)
  }

  /**
   * Update existing setlist
   */
  async updateSetlist(
    id: string,
    updates: SetlistUpdateData,
    context: ServiceContext = {}
  ): Promise<ServiceResult<Setlist>> {
    return this.executeOperation("updateSetlist", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(id, "setlist ID")

      // First verify the setlist exists and belongs to user
      const existingResult = await this.getSetlistById(id, context)
      if (!existingResult.success) {
        throw new Error(existingResult.error || "Setlist not found")
      }

      const updateData: SetlistUpdate = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("setlists")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update setlist: ${error.message}`)
      }

      if (!data) {
        throw new Error("Failed to update setlist: No data returned")
      }

      return data
    }, context)
  }

  /**
   * Delete setlist
   */
  async deleteSetlist(
    id: string,
    context: ServiceContext = {}
  ): Promise<ServiceResult<void>> {
    return this.executeOperation("deleteSetlist", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(id, "setlist ID")

      // First verify the setlist exists and belongs to user
      const existingResult = await this.getSetlistById(id, context)
      if (!existingResult.success) {
        throw new Error(existingResult.error || "Setlist not found")
      }

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      // Delete setlist (cascade will handle setlist_songs)
      const { error } = await supabase
        .from("setlists")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) {
        throw new Error(`Failed to delete setlist: ${error.message}`)
      }
    }, context)
  }

  /**
   * Add song to setlist
   */
  async addSongToSetlist(
    setlistId: string,
    songData: AddSongToSetlistData,
    context: ServiceContext = {}
  ): Promise<ServiceResult<SetlistSong>> {
    return this.executeOperation("addSongToSetlist", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(setlistId, "setlist ID")
      this.validateRequired(songData.content_id, "content ID")
      this.validateRequired(songData.position, "position")

      // Verify setlist belongs to user
      const setlistResult = await this.getSetlistById(setlistId, context)
      if (!setlistResult.success) {
        throw new Error(setlistResult.error || "Setlist not found")
      }

      // Verify content belongs to user
      const contentResult = await contentService.getContentById(songData.content_id, context)
      if (!contentResult.success) {
        throw new Error(contentResult.error || "Content not found")
      }

      const insertData: SetlistSongInsert = {
        setlist_id: setlistId,
        content_id: songData.content_id,
        position: songData.position,
        notes: songData.notes || null,
      }

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      const { data, error } = await supabase
        .from("setlist_songs")
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to add song to setlist: ${error.message}`)
      }

      if (!data) {
        throw new Error("Failed to add song to setlist: No data returned")
      }

      return data
    }, context)
  }

  /**
   * Remove song from setlist
   */
  async removeSongFromSetlist(
    setlistSongId: string,
    context: ServiceContext = {}
  ): Promise<ServiceResult<void>> {
    return this.executeOperation("removeSongFromSetlist", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(setlistSongId, "setlist song ID")

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      // First verify the setlist song exists and user owns the setlist
      const { data: setlistSong, error: fetchError } = await supabase
        .from("setlist_songs")
        .select(`
          id,
          setlist_id,
          setlists!inner (user_id)
        `)
        .eq("id", setlistSongId)
        .single()

      if (fetchError || !setlistSong) {
        throw new Error("Setlist song not found")
      }

      // Check ownership through the setlist
      const setlist = setlistSong.setlists as any
      if (setlist?.user_id !== user.id) {
        throw new Error("Unauthorized to modify this setlist")
      }

      const { error } = await supabase
        .from("setlist_songs")
        .delete()
        .eq("id", setlistSongId)

      if (error) {
        throw new Error(`Failed to remove song from setlist: ${error.message}`)
      }
    }, context)
  }

  /**
   * Reorder song in setlist
   */
  async updateSongPosition(
    setlistSongId: string,
    newPosition: number,
    context: ServiceContext = {}
  ): Promise<ServiceResult<void>> {
    return this.executeOperation("updateSongPosition", async () => {
      const user = await this.requireAuth(context)
      this.validateRequired(setlistSongId, "setlist song ID")
      this.validateRequired(newPosition, "new position")

      const supabase = context.isServer
        ? await this.getSupabaseServiceClient()
        : await this.getSupabaseClient()

      // First verify the setlist song exists and user owns the setlist
      const { data: setlistSong, error: fetchError } = await supabase
        .from("setlist_songs")
        .select(`
          id,
          position,
          setlist_id,
          setlists!inner (user_id)
        `)
        .eq("id", setlistSongId)
        .single()

      if (fetchError || !setlistSong) {
        throw new Error("Setlist song not found")
      }

      // Check ownership through the setlist
      const setlist = setlistSong.setlists as any
      if (setlist?.user_id !== user.id) {
        throw new Error("Unauthorized to modify this setlist")
      }

      // Update the position
      const { error } = await supabase
        .from("setlist_songs")
        .update({ position: newPosition })
        .eq("id", setlistSongId)

      if (error) {
        throw new Error(`Failed to update song position: ${error.message}`)
      }
    }, context)
  }
}

// Export singleton instance
export const setlistService = new SetlistService()

// Export individual functions for backward compatibility
export const getUserSetlists = (context: ServiceContext = {}) =>
  setlistService.getUserSetlists(context)

export const getSetlistById = (id: string, context: ServiceContext = {}) =>
  setlistService.getSetlistById(id, context)

export const createSetlist = (data: SetlistCreateData, context: ServiceContext = {}) =>
  setlistService.createSetlist(data, context)

export const updateSetlist = (id: string, data: SetlistUpdateData, context: ServiceContext = {}) =>
  setlistService.updateSetlist(id, data, context)

export const deleteSetlist = (id: string, context: ServiceContext = {}) =>
  setlistService.deleteSetlist(id, context)

export const addSongToSetlist = (setlistId: string, data: AddSongToSetlistData, context: ServiceContext = {}) =>
  setlistService.addSongToSetlist(setlistId, data, context)

export const removeSongFromSetlist = (id: string, context: ServiceContext = {}) =>
  setlistService.removeSongFromSetlist(id, context)

export const updateSongPosition = (id: string, position: number, context: ServiceContext = {}) =>
  setlistService.updateSongPosition(id, position, context)