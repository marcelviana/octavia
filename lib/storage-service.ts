import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase"

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "content-files"

export async function uploadFileToStorage(file: File | Blob, filename: string) {
  if (!file) throw new Error("No file provided")
  if (!filename) filename = `${Date.now()}`

  if (!isSupabaseConfigured) {
    // Demo mode - pretend upload succeeded
    const url = `https://example.com/${filename}`
    return { url, path: filename }
  }

  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: true })
  if (error) {
    throw error
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return { url: data.publicUrl, path: filename }
}
