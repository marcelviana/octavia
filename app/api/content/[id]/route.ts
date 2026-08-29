import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { commonSchemas } from '@/lib/api-schemas'
import { authRequired, internalError, notFound, validationError } from '@/lib/api-errors'

// GET /api/content/[id] - Get specific content by ID
const getContentByIdHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const user = await requireAuthServer(request)

    if (!user) {
      return authRequired()
    }
    const limited = enforceUserLimit(user.uid, 'content-read', RATE_LIMITS.READ)
    if (limited) return limited

    const { id } = await params

    // Validate the ID parameter
    // Emenda 4: id de path malformado → VALIDATION_ERROR com field:"id"
    const idValidation = commonSchemas.objectId.safeParse(id)
    if (!idValidation.success) {
      return validationError(idValidation.error.issues.map((i) => ({ ...i, path: ['id'] })))
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
        // Emenda 5 (mudança declarada): "or access denied" morreu
        return notFound('Content not found')
      }
      throw error
    }

    return NextResponse.json(content)
  } catch (error: any) {
    logger.error('Error fetching content by ID:', error)
    return internalError()
  }
}

// Wrapper to handle the dynamic route parameters
const wrappedGetHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return validationError([
      { code: 'invalid_type', path: ['id'], message: 'Content ID is required' } as never,
    ])
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
      return authRequired()
    }
    const limited = enforceUserLimit(user.uid, 'content-mutate', RATE_LIMITS.MUTATE)
    if (limited) return limited

    const { id } = await params

    // Paridade com o GET (nota do desenho §3.PR-3a: content/[id] alinha ao
    // migrar): id malformado era 22P02 no Postgres → 500; agora 400 field:"id"
    const idValidation = commonSchemas.objectId.safeParse(id)
    if (!idValidation.success) {
      return validationError(idValidation.error.issues.map((i) => ({ ...i, path: ['id'] })))
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
        // Emenda 5 (mudança declarada): "or access denied" morreu
        return notFound('Content not found')
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
    return internalError()
  }
}

// Wrapper to handle the dynamic route parameters for DELETE
const wrappedDeleteHandler = async (request: NextRequest) => {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return validationError([
      { code: 'invalid_type', path: ['id'], message: 'Content ID is required' } as never,
    ])
  }
  
  const params = Promise.resolve({ id })
  return deleteContentByIdHandler(request, { params })
}

export const GET = wrappedGetHandler
export const DELETE = wrappedDeleteHandler
