import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'
import '@/lib/logger'
import { fileDeleteSchema } from '@/lib/validation-schemas'
import { 
  validateRequestBody,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createServerErrorResponse
} from '@/lib/validation-utils'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const bodyValidation = await validateRequestBody(body, fileDeleteSchema)
    
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const { filename } = bodyValidation.data

    // Additional security checks for path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return createValidationErrorResponse(['Invalid filename: path traversal detected'])
    }

    // Only allow deletion of files that follow our naming convention (timestamp-filename)
    if (!filename.match(/^\d+-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/)) {
      return createValidationErrorResponse(['Invalid filename format'])
    }

    // Delete from Supabase using service client
    const supabase = getSupabaseServiceClient()
    
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filename])

    if (error) {
      console.error('Supabase delete error:', error)
      return createServerErrorResponse(`Delete failed: ${error.message}`)
    }

    console.log(`File deleted successfully: ${filename}`)

    return NextResponse.json({
      success: true,
      filename
    })

  } catch (error) {
    console.error('Delete API error:', error)
    return createServerErrorResponse('File deletion failed')
  }
} 