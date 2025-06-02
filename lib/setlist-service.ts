import { getSupabaseBrowserClient } from "./supabase"
import type { Database } from "@/types/supabase"

type Setlist = Database["public"]["Tables"]["setlists"]["Row"]
type SetlistInsert = Database["public"]["Tables"]["setlists"]["Insert"]
type SetlistUpdate = Database["public"]["Tables"]["setlists"]["Update"]
type SetlistSong = Database["public"]["Tables"]["setlist_songs"]["Row"]
type SetlistSongInsert = Database["public"]["Tables"]["setlist_songs"]["Insert"]

export async function getUserSetlists() {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("setlists")
    .select(`
      *,
      setlist_songs (
        id,
        position,
        notes,
        content (
          id,
          title,
          artist,
          album,
          genre,
          content_type,
          key,
          bpm,
          time_signature,
          difficulty,
          tags,
          is_favorite
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching setlists:", error)
    throw error
  }

  return data
}

export async function getSetlistById(id: string) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("setlists")
    .select(`
      *,
      setlist_songs (
        id,
        position,
        notes,
        content (
          id,
          title,
          artist,
          album,
          genre,
          content_type,
          key,
          bpm,
          time_signature,
          difficulty,
          tags,
          is_favorite
        )
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching setlist:", error)
    throw error
  }

  return data
}

export async function createSetlist(setlist: SetlistInsert) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.from("setlists").insert(setlist).select().single()

  if (error) {
    console.error("Error creating setlist:", error)
    throw error
  }

  return data
}

export async function updateSetlist(id: string, setlist: SetlistUpdate) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.from("setlists").update(setlist).eq("id", id).select().single()

  if (error) {
    console.error("Error updating setlist:", error)
    throw error
  }

  return data
}

export async function deleteSetlist(id: string) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.from("setlists").delete().eq("id", id)

  if (error) {
    console.error("Error deleting setlist:", error)
    throw error
  }

  return true
}

export async function addSongToSetlist(setlistId: string, contentId: string, position: number) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("setlist_songs")
    .insert({
      setlist_id: setlistId,
      content_id: contentId,
      position,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding song to setlist:", error)
    throw error
  }

  return data
}

export async function removeSongFromSetlist(setlistSongId: string) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.from("setlist_songs").delete().eq("id", setlistSongId)

  if (error) {
    console.error("Error removing song from setlist:", error)
    throw error
  }

  return true
}

export async function updateSongPosition(setlistSongId: string, newPosition: number) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from("setlist_songs")
    .update({ position: newPosition })
    .eq("id", setlistSongId)
    .select()
    .single()

  if (error) {
    console.error("Error updating song position:", error)
    throw error
  }

  return data
}
