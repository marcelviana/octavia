import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'
import '@/lib/logger'

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

    console.log(`Upload request from authenticated user: ${validation.user.email}`)

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!filename) {
      return NextResponse.json(
        { error: 'No filename provided' },
        { status: 400 }
      )
    }

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to Supabase using service client with service role
    const supabase = getSupabaseServiceClient()
    
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, uint8Array, {
        upsert: true,
        contentType: file.type
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      )
    }

    console.log(`Upload successful: ${urlData.publicUrl}`)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filename,
      success: true
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 