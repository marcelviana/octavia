import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { commonSchemas } from '@/lib/api-schemas'

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
    const limited = enforceUserLimit(user.uid, 'content-read', RATE_LIMITS.READ)
    if (limited) return limited

    const { id } = await params

    // Validate the ID parameter
    const idValidation = commonSchemas.objectId.safeParse(id)
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid content ID format' },
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
    const limited = enforceUserLimit(user.uid, 'content-mutate', RATE_LIMITS.MUTATE)
    if (limited) return limited

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

export const GET = wrappedGetHandler
export const DELETE = wrappedDeleteHandler
