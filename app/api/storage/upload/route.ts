import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'
import '@/lib/logger'
import { 
  allowedMimeTypes, 
  allowedExtensions,
  fileUploadSchema 
} from '@/lib/validation-schemas'
import { 
  validateFileUpload,
  sanitizeFilename,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createServerErrorResponse
} from '@/lib/validation-utils'
import { withRateLimit } from '@/lib/rate-limit'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const uploadFileHandler = async (request: NextRequest) => {
  try {
    // Verify Firebase authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return createUnauthorizedResponse('Missing or invalid authorization header')
    }

    const firebaseToken = authHeader.substring(7)
    const validation = await validateFirebaseTokenServer(firebaseToken, request.url)
    
    if (!validation.isValid || !validation.user) {
      return createUnauthorizedResponse('Invalid or expired Firebase token')
    }

    console.log(`Upload request from authenticated user: ${validation.user.email}`)

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      return createValidationErrorResponse(['No file provided'])
    }

    if (!filename) {
      return createValidationErrorResponse(['No filename provided'])
    }

    // Comprehensive file validation
    const fileValidation = validateFileUpload(
      file,
      filename,
      allowedMimeTypes,
      allowedExtensions,
      MAX_FILE_SIZE
    )

    if (!fileValidation.valid) {
      return createValidationErrorResponse(fileValidation.errors)
    }

    // Additional security checks
    const sanitizedFilename = sanitizeFilename(filename)
    if (sanitizedFilename.length === 0) {
      return createValidationErrorResponse(['Invalid filename after sanitization'])
    }

    // Check file content consistency (MIME type vs file extension)
    const fileExtension = sanitizedFilename.toLowerCase().split('.').pop()
    const mimeTypeValid = (() => {
      switch (fileExtension) {
        case 'pdf':
          return file.type === 'application/pdf'
        case 'txt':
          return file.type === 'text/plain'
        case 'docx':
          return file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        case 'png':
          return file.type === 'image/png'
        case 'jpg':
        case 'jpeg':
          return file.type === 'image/jpeg' || file.type === 'image/jpg'
        default:
          return false
      }
    })()

    if (!mimeTypeValid) {
      return createValidationErrorResponse(['File extension does not match MIME type'])
    }

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Create unique filename with timestamp to prevent conflicts and directory traversal
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`

    // Upload to Supabase using service client with service role
    const supabase = getSupabaseServiceClient()
    
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueFilename, uint8Array, {
        upsert: false, // Don't overwrite existing files for security
        contentType: file.type,
        cacheControl: '3600',
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return createServerErrorResponse(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uniqueFilename)

    if (!urlData?.publicUrl) {
      return createServerErrorResponse('Failed to get public URL')
    }

    console.log(`Upload successful: ${urlData.publicUrl}`)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: uniqueFilename,
      originalFilename: filename,
      size: file.size,
      type: file.type,
      success: true
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return createServerErrorResponse('File upload failed')
  }
}

export const POST = withRateLimit(uploadFileHandler, 5, true) 