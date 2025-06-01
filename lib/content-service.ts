import { getSupabaseBrowserClient } from "./supabase"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]
type ContentInsert = Database["public"]["Tables"]["content"]["Insert"]
type ContentUpdate = Database["public"]["Tables"]["content"]["Update"]

export async function getUserContent() {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.from("content").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching content:", error)
    throw error
  }

  return data
}

export async function getContentById(id: string) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.from("content").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching content:", error)
    throw error
  }

  return data
}

export async function createContent(content: ContentInsert) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.from("content").insert(content).select().single()

  if (error) {
    console.error("Error creating content:", error)
    throw error
  }

  return data
}

export async function updateContent(id: string, content: ContentUpdate) {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase.from("content").update(content).eq("id", id).select().single()

  if (error) {
    console.error("Error updating content:", error)
    throw error
  }

  return data
}

export async function deleteContent(id: string) {
  const supabase = getSupabaseBrowserClient()

  const { error } = await supabase.from("content").delete().eq("id", id)

  if (error) {
    console.error("Error deleting content:", error)
    throw error
  }

  return true
}

export async function toggleFavorite(id: string, isFavorite: boolean) {
  return updateContent(id, { is_favorite: isFavorite })
}
