import { auth } from "@/lib/firebase"

export async function testStoragePermissions(): Promise<{ canUpload: boolean; error?: string }> {
  try {
    const user = auth?.currentUser;
    if (!user) {
      return {
        canUpload: false,
        error: 'User not authenticated. Please log in to upload files.'
      };
    }

    console.log('User authenticated:', user.email);
    
    // Try to upload a small test file via secure API
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFilename = `test-${Date.now()}.txt`;
    
    try {
      const firebaseToken = await user.getIdToken();
      
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('filename', testFilename);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          return { 
            canUpload: false, 
            error: 'Authentication failed. Please try logging out and back in.' 
          };
        } else if (response.status === 500 && errorData.error?.includes('Bucket not found')) {
          return { 
            canUpload: false, 
            error: 'Storage bucket not found. Please run the setup process to create the storage bucket.' 
          };
        } else {
          return { 
            canUpload: false, 
            error: errorData.error || `Storage test failed with status ${response.status}` 
          };
        }
      }

      // Clean up test file by trying to delete it
      try {
        await fetch('/api/storage/delete', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firebaseToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ filename: testFilename })
        });
      } catch (deleteError) {
        console.warn('Could not clean up test file:', deleteError);
      }

      return { canUpload: true };
    } catch (tokenError) {
      return {
        canUpload: false,
        error: 'Failed to get authentication token. Please try logging out and back in.'
      };
    }
    
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

  try {
    const user = auth?.currentUser;
    if (!user) {
      throw new Error('User not authenticated. Please log in to upload files.');
    }

    console.log(`User authenticated (${user.email}), uploading: ${filename}`);
    
    // Get Firebase auth token
    const firebaseToken = await user.getIdToken();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);

    // Upload via secure API
    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging out and back in.');
      } else if (response.status === 500 && errorData.error?.includes('Bucket not found')) {
        throw new Error(`Storage bucket not found. Please create the bucket in your Supabase project dashboard under Storage section, or run the setup script to create it automatically.`);
      } else {
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
    }

    const result = await response.json();
    
    if (!result.url) {
      throw new Error("Failed to get public URL for uploaded file");
    }
    
    console.log(`Upload completed successfully: ${result.url}`);
    return { url: result.url, path: result.path };
    
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
