import { getSupabaseBrowserClient } from "@/lib/supabase"

const BUCKET_NAME = "content-files"

export async function createContentFilesBucket() {
  const supabase = getSupabaseBrowserClient()
  
  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  
  if (listError) {
    console.error("Error listing buckets:", listError)
    return { success: false, error: listError }
  }
  
  const existingBucket = buckets?.find((bucket: any) => bucket.name === BUCKET_NAME)
  
  if (existingBucket) {
    console.log(`Bucket "${BUCKET_NAME}" already exists`)
    return { success: true, bucket: existingBucket }
  }
  
  // Create the bucket
  const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true, // Make it public so files can be accessed directly
    allowedMimeTypes: ['application/pdf', 'image/*'], // Allow PDFs and images for sheet music
    fileSizeLimit: '10MB' // 10MB limit for sheet music files
  })
  
  if (error) {
    console.error("Error creating bucket:", error)
    return { success: false, error }
  }
  
  console.log(`Bucket "${BUCKET_NAME}" created successfully`)
  
  // Create storage policies for the bucket
  await createStoragePolicies()
  
  return { success: true, bucket: data }
}

export async function createStoragePolicies() {
  // Storage policies need to be created manually in Supabase dashboard
  // or via direct SQL execution with elevated permissions
  console.log('Storage policies need to be created manually - see setup instructions')
  return { success: true, needsManualSetup: true }
} 