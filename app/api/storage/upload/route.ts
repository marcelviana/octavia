import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
import logger from '@/lib/logger'
import { storageSchemas } from '@/lib/api-validation-middleware'
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const uploadFileHandler = async (request: NextRequest) => {
  try {
    // Verify Firebase authentication using secure utilities
    const user = await requireAuthServerSecure(request)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    logger.log(`Upload request from authenticated user: ${user.email}`)

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!filename) {
      return new Response(
        JSON.stringify({ error: 'No filename provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate file using storage schema
    const fileValidation = storageSchemas.upload.safeParse({
      filename,
      contentType: file.type,
      size: file.size
    })

    if (!fileValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'File validation failed',
          details: fileValidation.error.issues.map(issue => issue.message)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Additional security checks - basic filename sanitization
    const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').trim()
    if (sanitizedFilename.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid filename after sanitization' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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
      return new Response(
        JSON.stringify({ error: 'File extension does not match MIME type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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
      logger.error('Supabase upload error:', error)
      return new Response(
        JSON.stringify({ error: `Upload failed: ${error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uniqueFilename)

    if (!urlData?.publicUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to get public URL' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    logger.log(`Upload successful: ${urlData.publicUrl}`)

    return new Response(JSON.stringify({
      url: urlData.publicUrl,
      path: uniqueFilename,
      originalFilename: filename,
      size: file.size,
      type: file.type,
      success: true
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    logger.error('Upload API error:', error)
    return new Response(
      JSON.stringify({ error: 'File upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const POST = withRateLimit(RATE_LIMIT_CONFIGS.UPLOAD)(uploadFileHandler) 