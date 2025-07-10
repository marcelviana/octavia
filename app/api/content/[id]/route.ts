import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'

// GET /api/content/[id] - Get specific content by ID
const getContentByIdHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServiceClient()
    
    const { data: content, error } = await supabase
      .from('content')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.uid)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content not found or access denied' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(content)
  } catch (error: any) {
    logger.error('Error fetching content by ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrapper to handle the dynamic route parameters
const wrappedGetHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
  }
  
  // Create params object to match the expected signature
  const params = Promise.resolve({ id })
  return getContentByIdHandler(request, { params })
}

// PUT /api/content/[id] - Update specific content by ID
const updateContentByIdHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    const updateData = await request.json()
    
    // Validate update data
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Validation failed' },
        { status: 400 }
      )
    }

    // Add timestamp for update
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    const supabase = getSupabaseServiceClient()
    
    const { data: content, error } = await supabase
      .from('content')
      .update(dataToUpdate)
      .eq('id', id)
      .eq('user_id', user.uid)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content not found or access denied' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(content)
  } catch (error: any) {
    logger.error('Error updating content by ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/content/[id] - Delete specific content by ID
const deleteContentByIdHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseServiceClient()
    
    const { data: content, error } = await supabase
      .from('content')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Content not found or access denied' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Content deleted successfully',
      deletedContent: content
    })
  } catch (error: any) {
    logger.error('Error deleting content by ID:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Wrapper to handle the dynamic route parameters for PUT
const wrappedPutHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
  }
  
  const params = Promise.resolve({ id })
  return updateContentByIdHandler(request, { params })
}

// Wrapper to handle the dynamic route parameters for DELETE
const wrappedDeleteHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
  }
  
  const params = Promise.resolve({ id })
  return deleteContentByIdHandler(request, { params })
}

export const GET = withRateLimit(wrappedGetHandler, 100)
export const PUT = withRateLimit(wrappedPutHandler, 50)
export const DELETE = withRateLimit(wrappedDeleteHandler, 50) 