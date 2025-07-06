import { getSupabaseServiceClient } from "@/lib/supabase-service"
import logger from "@/lib/logger"
import type { Database } from "@/types/supabase"

type SetlistSong = Database["public"]["Tables"]["setlist_songs"]["Row"]
type Content = Database["public"]["Tables"]["content"]["Row"]

export interface ValidationResult {
  isValid: boolean
  orphanedSongs: SetlistSong[]
  missingContent: string[]
  errors: string[]
}

/**
 * Validates setlist data integrity by checking for orphaned songs
 * and missing content references
 */
export async function validateSetlistIntegrity(userId: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    orphanedSongs: [],
    missingContent: [],
    errors: []
  }

  try {
    const supabase = getSupabaseServiceClient()

    // Get all setlist songs for the user
    const { data: setlistSongs, error: songsError } = await supabase
      .from("setlist_songs")
      .select(`
        *,
        setlists!inner (
          id,
          user_id
        )
      `)
      .eq("setlists.user_id", userId)

    if (songsError) {
      result.errors.push(`Failed to fetch setlist songs: ${songsError.message}`)
      result.isValid = false
      return result
    }

    if (!setlistSongs || setlistSongs.length === 0) {
      // No setlist songs to validate
      return result
    }

    // Get all unique content IDs referenced by setlist songs
    const contentIds = [...new Set(setlistSongs.map((song: any) => song.content_id))]

    // Get all existing content for these IDs
    const { data: existingContent, error: contentError } = await supabase
      .from("content")
      .select("id")
      .in("id", contentIds)
      .eq("user_id", userId)

    if (contentError) {
      result.errors.push(`Failed to fetch content: ${contentError.message}`)
      result.isValid = false
      return result
    }

    // Create a set of existing content IDs for fast lookup
    const existingContentIds = new Set(existingContent?.map((c: any) => c.id) || [])

    // Find orphaned songs (songs that reference non-existent content)
    const orphanedSongs = setlistSongs.filter((song: any) => !existingContentIds.has(song.content_id))
    const missingContentIds = [...new Set(orphanedSongs.map((song: any) => song.content_id))] as string[]

    result.orphanedSongs = orphanedSongs as SetlistSong[]
    result.missingContent = missingContentIds
    result.isValid = orphanedSongs.length === 0

    if (orphanedSongs.length > 0) {
      logger.warn(`Found ${orphanedSongs.length} orphaned setlist songs for user ${userId}`)
    }

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    result.errors.push(`Validation failed: ${errorMessage}`)
    result.isValid = false
    logger.error("Error validating setlist integrity:", error)
    return result
  }
}

/**
 * Cleans up orphaned setlist songs by removing them from the database
 */
export async function cleanupOrphanedSongs(userId: string): Promise<{
  success: boolean
  removedCount: number
  errors: string[]
}> {
  const result = {
    success: false,
    removedCount: 0,
    errors: [] as string[]
  }

  try {
    // First validate to find orphaned songs
    const validation = await validateSetlistIntegrity(userId)
    
    if (!validation.isValid && validation.errors.length > 0) {
      result.errors = validation.errors
      return result
    }

    if (validation.orphanedSongs.length === 0) {
      result.success = true
      return result
    }

    const supabase = getSupabaseServiceClient()
    const orphanedSongIds = validation.orphanedSongs.map(song => song.id)

    logger.log(`Cleaning up ${orphanedSongIds.length} orphaned setlist songs for user ${userId}`)

    // Remove orphaned songs
    const { error: deleteError } = await supabase
      .from("setlist_songs")
      .delete()
      .in("id", orphanedSongIds)

    if (deleteError) {
      result.errors.push(`Failed to delete orphaned songs: ${deleteError.message}`)
      return result
    }

    result.success = true
    result.removedCount = orphanedSongIds.length
    logger.log(`Successfully removed ${orphanedSongIds.length} orphaned setlist songs`)

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    result.errors.push(`Cleanup failed: ${errorMessage}`)
    logger.error("Error cleaning up orphaned songs:", error)
    return result
  }
}

/**
 * Validates that a content ID exists before adding it to a setlist
 */
export async function validateContentExists(contentId: string, userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServiceClient()

    const { data, error } = await supabase
      .from("content")
      .select("id")
      .eq("id", contentId)
      .eq("user_id", userId)
      .single()

    if (error) {
      logger.warn(`Content validation failed for ID ${contentId}:`, error)
      return false
    }

    return !!data
  } catch (error) {
    logger.error("Error validating content existence:", error)
    return false
  }
}

/**
 * Gets a summary of setlist data integrity issues
 */
export async function getSetlistIntegritySummary(userId: string): Promise<{
  totalSetlists: number
  totalSongs: number
  orphanedSongs: number
  missingContent: number
  isHealthy: boolean
}> {
  try {
    const supabase = getSupabaseServiceClient()

    // Get total setlists count
    const { count: setlistCount } = await supabase
      .from("setlists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Get total setlist songs count
    const { count: songCount } = await supabase
      .from("setlist_songs")
      .select(`
        *,
        setlists!inner (
          user_id
        )
      `, { count: "exact", head: true })
      .eq("setlists.user_id", userId)

    // Validate integrity
    const validation = await validateSetlistIntegrity(userId)

    return {
      totalSetlists: setlistCount || 0,
      totalSongs: songCount || 0,
      orphanedSongs: validation.orphanedSongs.length,
      missingContent: validation.missingContent.length,
      isHealthy: validation.isValid
    }
  } catch (error) {
    logger.error("Error getting setlist integrity summary:", error)
    return {
      totalSetlists: 0,
      totalSongs: 0,
      orphanedSongs: 0,
      missingContent: 0,
      isHealthy: false
    }
  }
}
