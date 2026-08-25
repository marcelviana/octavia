import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import type { ContentQueryParams } from '@/lib/content-types'
import type { Database } from '@/types/database.types'
import { contentSchemas } from '@/lib/api-schemas'
import { ContentType } from '@/types/content'
import { 
  validateRequestBody,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createServerErrorResponse,
  createNotFoundResponse
} from '@/lib/validation-utils'
import { z } from 'zod'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'

// GET /api/content - Get user's content with pagination support
const getContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const limited = enforceUserLimit(user.uid, 'content-read', RATE_LIMITS.READ)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      rawParams[key] = value;
    });
    
    let validatedParams;
    try {
      validatedParams = contentSchemas.query.parse(rawParams);
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
      // enum canônico único (D4) — mesma fonte do schema de escrita
      const validTypes = Object.values(ContentType) as string[]
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

export const GET = getContentHandler

// POST /api/content - Create new content
const createContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const limited = enforceUserLimit(user.uid, 'content-mutate', RATE_LIMITS.MUTATE)
    if (limited) return limited

    const body = await request.json()

    // Validate request body
    const bodyValidation = await validateRequestBody(body, contentSchemas.create)
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const validatedData = bodyValidation.data
    const supabase = getSupabaseServiceClient()

    // Política D1: campos enumerados — nada de espalhar validatedData.
    // user_id/timestamps vêm SEMPRE do servidor (a lista de ignorados do
    // schema garante que versões do body nunca chegam aqui).
    const contentData = {
      user_id: user.uid,
      title: validatedData.title,
      artist: validatedData.artist ?? null,
      album: validatedData.album ?? null,
      genre: validatedData.genre ?? null,
      content_type: validatedData.content_type,
      content_data: validatedData.content_data ?? null,
      file_url: validatedData.file_url ?? null,
      key: validatedData.key ?? null,
      bpm: validatedData.bpm ?? null,
      time_signature: validatedData.time_signature ?? null,
      difficulty: validatedData.difficulty ?? null,
      capo: validatedData.capo ?? null,
      tuning: validatedData.tuning ?? null,
      tags: validatedData.tags ?? null,
      notes: validatedData.notes ?? null,
      is_favorite: validatedData.is_favorite,
      is_public: validatedData.is_public ?? false,
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

    return NextResponse.json(content, { status: 201 })
  } catch (error: any) {
    logger.error('Error creating content:', error)
    return createServerErrorResponse('Failed to create content')
  }
}

export const POST = createContentHandler

// PUT /api/content - Update existing content
const updateContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const limited = enforceUserLimit(user.uid, 'content-mutate', RATE_LIMITS.MUTATE)
    if (limited) return limited

    const body = await request.json()

    // Validate request body
    const bodyValidation = await validateRequestBody(body, contentSchemas.update)
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const v = bodyValidation.data
    const id = v.id

    const supabase = getSupabaseServiceClient()

    // Política D1 + semântica SET-23 por campo: undefined = "não mexer"
    // (fica fora do UPDATE), null = "limpar".
    const contentData: Database['public']['Tables']['content']['Update'] = {
      updated_at: new Date().toISOString(),
    }
    if (v.title !== undefined) contentData.title = v.title
    if (v.artist !== undefined) contentData.artist = v.artist
    if (v.album !== undefined) contentData.album = v.album
    if (v.genre !== undefined) contentData.genre = v.genre
    if (v.content_type !== undefined) contentData.content_type = v.content_type
    if (v.content_data !== undefined) contentData.content_data = v.content_data
    if (v.file_url !== undefined) contentData.file_url = v.file_url
    if (v.key !== undefined) contentData.key = v.key
    if (v.bpm !== undefined) contentData.bpm = v.bpm
    if (v.time_signature !== undefined) contentData.time_signature = v.time_signature
    if (v.difficulty !== undefined) contentData.difficulty = v.difficulty
    if (v.capo !== undefined) contentData.capo = v.capo
    if (v.tuning !== undefined) contentData.tuning = v.tuning
    if (v.tags !== undefined) contentData.tags = v.tags
    if (v.notes !== undefined) contentData.notes = v.notes
    if (v.is_favorite !== undefined && v.is_favorite !== null) contentData.is_favorite = v.is_favorite
    if (v.is_public !== undefined && v.is_public !== null) contentData.is_public = v.is_public

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

export const PUT = updateContentHandler

// DELETE /api/content - Delete content
const deleteContentHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const limited = enforceUserLimit(user.uid, 'content-mutate', RATE_LIMITS.MUTATE)
    if (limited) return limited

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

export const DELETE = deleteContentHandler 