import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import type { ContentQueryParams } from '@/lib/content-types'
import { 
  contentQuerySchema, 
  createContentSchema, 
  updateContentSchema 
} from '@/lib/validation-schemas'
import { 
  validateRequestBody,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createServerErrorResponse,
  createNotFoundResponse
} from '@/lib/validation-utils'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'

// GET /api/content - Get user's content with pagination support
const getContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });
    
    let validatedParams;
    try {
      validatedParams = contentQuerySchema.parse(rawParams);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err: any) => {
          const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
          return `${path}${err.message}`;
        });
        return createValidationErrorResponse(errorMessages);
      }
      return createValidationErrorResponse(['Query parameter validation failed']);
    }

    const { page, pageSize, search, sortBy, contentType: contentTypeParam, difficulty: difficultyParam, key: keyParam, favorite } = validatedParams
    
    // Parse filters safely
    const filters = {
      contentType: contentTypeParam ? contentTypeParam.split(',').filter(Boolean) : [],
      difficulty: difficultyParam ? difficultyParam.split(',').filter(Boolean) : [],
      key: keyParam ? keyParam.split(',').filter(Boolean) : [],
      favorite: favorite === 'true'
    }

    const queryParams: ContentQueryParams = {
      page,
      pageSize,
      search: search || '',
      sortBy,
      filters,
      useCache: false // Always fetch fresh data for API calls
    }

    const supabase = getSupabaseServiceClient()
    
    // Use the same logic as getUserContentPageServer but inline
    let query = supabase
      .from('content')
      .select('*', { count: 'exact' })
      .eq('user_id', user.uid)

    // Apply search with sanitized input
    if (search && search.trim()) {
      // Escape any special characters for SQL ILIKE to prevent injection
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
      query = query.or(
        `title.ilike.%${sanitizedSearch}%,artist.ilike.%${sanitizedSearch}%,album.ilike.%${sanitizedSearch}%`
      )
    }

    // Apply filters
    if (filters.contentType?.length) {
      const validTypes = ['Lyrics', 'Chords', 'Tab', 'Sheet']
      const filteredTypes = filters.contentType.filter((type: string) => validTypes.includes(type))
      if (filteredTypes.length > 0) {
        query = query.in('content_type', filteredTypes)
      }
    }

    if (filters.difficulty?.length) {
      const validDifficulties = ['Beginner', 'Intermediate', 'Advanced']
      const filteredDifficulties = filters.difficulty.filter((diff: string) => validDifficulties.includes(diff))
      if (filteredDifficulties.length > 0) {
        query = query.in('difficulty', filteredDifficulties)
      }
    }

    if (filters.key?.length) {
      query = query.in('key', filters.key)
    }

    if (filters.favorite) {
      query = query.eq('is_favorite', true)
    }

    // Apply sorting
    const sortMap = {
      recent: ['created_at', false],
      title: ['title', true],
      artist: ['artist', true],
      updated: ['updated_at', false]
    } as const

    const [sortColumn, ascending] = sortMap[sortBy] || sortMap.recent
    query = query.order(sortColumn, { ascending })

    // Apply pagination
    const safePage = Math.max(1, page)
    const safePageSize = Math.min(Math.max(1, pageSize), 100)
    const from = (safePage - 1) * safePageSize
    const to = from + safePageSize - 1

    const { data: content, error, count } = await query.range(from, to)

    if (error) {
      logger.error('Error fetching content:', error)
      throw error
    }

    const result = {
      data: content || [],
      total: count || 0,
      page: safePage,
      pageSize: safePageSize,
      hasMore: (count || 0) > safePage * safePageSize,
      totalPages: Math.ceil((count || 0) / safePageSize)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('Error in content API:', error)
    return createServerErrorResponse('Failed to fetch content')
  }
}

export const GET = withRateLimit(getContentHandler, 100)

// POST /api/content - Create new content
const createContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    
    // Validate request body
    const bodyValidation = await validateRequestBody(body, createContentSchema)
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const validatedData = bodyValidation.data
    const supabase = getSupabaseServiceClient()
    
    const contentData = {
      ...validatedData,
      user_id: user.uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: content, error } = await supabase
      .from('content')
      .insert(contentData)
      .select()
      .single()

    if (error) {
      logger.error('Database error creating content:', error)
      throw error
    }

    return NextResponse.json(content)
  } catch (error: any) {
    logger.error('Error creating content:', error)
    return createServerErrorResponse('Failed to create content')
  }
}

export const POST = withRateLimit(createContentHandler, 100)

// PUT /api/content - Update existing content
const updateContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    
    // Validate request body
    const bodyValidation = await validateRequestBody(body, updateContentSchema)
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const { id, ...updateData } = bodyValidation.data
    
    const supabase = getSupabaseServiceClient()
    
    const contentData = {
      ...updateData,
      updated_at: new Date().toISOString(),
    }

    const { data: content, error } = await supabase
      .from('content')
      .update(contentData)
      .eq('id', id)
      .eq('user_id', user.uid)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return createNotFoundResponse('Content not found or access denied')
      }
      logger.error('Database error updating content:', error)
      throw error
    }

    return NextResponse.json(content)
  } catch (error: any) {
    logger.error('Error updating content:', error)
    return createServerErrorResponse('Failed to update content')
  }
}

export const PUT = withRateLimit(updateContentHandler, 100)

// DELETE /api/content - Delete content
const deleteContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    // Validate the ID parameter
    if (!id || !id.match(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/)) {
      return createValidationErrorResponse(['Valid content ID is required'])
    }

    const supabase = getSupabaseServiceClient()
    
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id)
      .eq('user_id', user.uid)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error deleting content:', error)
    return createServerErrorResponse('Failed to delete content')
  }
}

export const DELETE = withRateLimit(deleteContentHandler, 100) 