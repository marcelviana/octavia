import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import type { Database } from '@/types/supabase'
import { withBodyValidation, contentSchemas, commonSchemas } from '@/lib/api-validation-middleware'
import { z } from 'zod'

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

// PUT /api/content/[id] - Update specific content by ID
const updateContentByIdHandler = withBodyValidation(contentSchemas.update, {
  rateLimit: { familia: 'content-mutate', config: RATE_LIMITS.MUTATE }
})(
  async (request: Request, validatedData: unknown, user: any, params: { id: string }) => {
    try {
      const { id } = params

      // Validate the ID parameter
      const idValidation = commonSchemas.objectId.safeParse(id)
      if (!idValidation.success) {
        return new Response(
          JSON.stringify({ error: 'Invalid content ID format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Add timestamp for update and ensure proper typing
      const supabase = getSupabaseServiceClient()
      const v = validatedData as z.infer<typeof contentSchemas.update>

      const updateData = {
        ...(v.title !== undefined && { title: v.title }),
        ...(v.artist !== undefined && { artist: v.artist ?? null }),
        ...(v.album !== undefined && { album: v.album ?? null }),
        ...(v.content_type !== undefined && { content_type: v.content_type }),
        ...(v.content_data !== undefined && { content_data: v.content_data as Database['public']['Tables']['content']['Update']['content_data'] }),
        ...(v.key !== undefined && { key: v.key ?? null }),
        ...(v.bpm !== undefined && { bpm: v.bpm ?? null }),
        ...(v.difficulty !== undefined && { difficulty: v.difficulty ?? null }),
        ...(v.tags !== undefined && { tags: v.tags ?? null }),
        ...(v.is_favorite !== undefined && { is_favorite: v.is_favorite }),
        ...(v.notes !== undefined && { notes: v.notes ?? null }),
        updated_at: new Date().toISOString(),
      } as Database['public']['Tables']['content']['Update'];

      const { data: content, error } = await (supabase
        .from('content') as any)
        .update(updateData as Database['public']['Tables']['content']['Update'])
        .eq('id', id)
        .eq('user_id', user.uid)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Content not found or access denied' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          )
        }
        throw error
      }

      return new Response(JSON.stringify(content), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      logger.error('Error updating content by ID:', error)
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
)

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

// Wrapper to handle the dynamic route parameters for PUT
const wrappedPutHandler = async (request: NextRequest): Promise<NextResponse> => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ error: 'Content ID is required' }, { status: 400 })
  }

  const response = await updateContentByIdHandler(request, { id })
  // Convert Response to NextResponse
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
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
export const PUT = wrappedPutHandler
export const DELETE = wrappedDeleteHandler
