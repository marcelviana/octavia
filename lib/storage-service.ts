import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase"

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "content-files"

export async function testStoragePermissions(): Promise<{ canUpload: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { canUpload: true }; // Demo mode
  }

  try {
    const supabase = getSupabaseBrowserClient();
    
    // First check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return { 
        canUpload: false, 
        error: `Authentication error: ${authError.message}` 
      };
    }
    
    if (!user) {
      return { 
        canUpload: false, 
        error: 'User not authenticated. Please log in to upload files.' 
      };
    }
    
    console.log('User authenticated:', user.email);
    
    // Try to upload a small test file
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFilename = `test-${Date.now()}.txt`;
    
    const { error } = await supabase.storage.from(BUCKET).upload(testFilename, testFile);
    
    if (error) {
      // Clean up test file if it was created
      await supabase.storage.from(BUCKET).remove([testFilename]);
      
      if (error.message?.includes('Bucket not found')) {
        return { 
          canUpload: false, 
          error: 'Storage bucket not found. Please run the setup process to create the storage bucket.' 
        };
      } else if (error.message?.includes('permission') || error.message?.includes('policy') || error.message?.includes('row-level security')) {
        return { 
          canUpload: false, 
          error: 'Storage permissions not configured. Please set up storage policies in your Supabase dashboard to allow authenticated users to upload files.' 
        };
      } else {
        return { 
          canUpload: false, 
          error: `Storage test failed: ${error.message}` 
        };
      }
    }
    
    // Clean up test file
    await supabase.storage.from(BUCKET).remove([testFilename]);
    
    return { canUpload: true };
  } catch (error) {
    return { 
      canUpload: false, 
      error: `Storage test error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function uploadFileToStorage(file: File | Blob, filename: string) {
  console.log(`Starting upload to storage: ${filename}, size: ${file.size} bytes`);
  
  if (!file) throw new Error("No file provided")
  if (!filename) filename = `${Date.now()}`

  if (!isSupabaseConfigured) {
    console.log("Supabase not configured - using demo mode");
    // Demo mode - pretend upload succeeded
    const url = `https://example.com/${filename}`
    return { url, path: filename }
  }

  try {
    const supabase = getSupabaseBrowserClient()
    
    // Check authentication before upload
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated. Please log in to upload files.');
    }
    
    console.log(`User authenticated (${user.email}), uploading to bucket: ${BUCKET}`);
    
    const { data, error } = await supabase.storage.from(BUCKET).upload(filename, file, { upsert: true })
    
    if (error) {
      console.error("Storage upload error:", error);
      if (error.message?.includes("Bucket not found")) {
        throw new Error(`Storage bucket "${BUCKET}" not found. Please create the bucket in your Supabase project dashboard under Storage section, or run the setup script to create it automatically.`)
      } else if (error.message?.includes("permission") || error.message?.includes("policy") || error.message?.includes("row-level security")) {
        throw new Error(`Upload failed due to missing storage policies. Please set up Row Level Security (RLS) policies in your Supabase dashboard. Go to Storage → Policies and create policies to allow authenticated users to upload files to the 'content-files' bucket.`)
      }
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    console.log("Upload successful, getting public URL...");
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    
    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded file")
    }
    
    console.log(`Upload completed successfully: ${urlData.publicUrl}`);
    return { url: urlData.publicUrl, path: filename }
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
