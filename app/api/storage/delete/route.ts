import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'

export async function POST(request: NextRequest) {
  try {
    // Verify Firebase authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const firebaseToken = authHeader.substring(7)
    const validation = await validateFirebaseTokenServer(firebaseToken, request.url)
    
    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { error: 'Invalid or expired Firebase token' },
        { status: 401 }
      )
    }

    // Parse request body
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { error: 'No filename provided' },
        { status: 400 }
      )
    }

    // Delete from Supabase using service client
    const supabase = getSupabaseServiceClient()
    
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filename])

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`File deleted successfully: ${filename}`)

    return NextResponse.json({
      success: true,
      filename
    })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 