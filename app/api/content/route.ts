import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import type { ContentQueryParams } from '@/lib/content-types'

// GET /api/content - Get user's content with pagination support
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const search = searchParams.get('search') || ''
    const sortBy = (searchParams.get('sortBy') || 'recent') as 'recent' | 'title' | 'artist'
    
    // Parse filters
    const contentTypeParam = searchParams.get('contentType')
    const difficultyParam = searchParams.get('difficulty')
    const keyParam = searchParams.get('key')
    const favorite = searchParams.get('favorite') === 'true'
    
    const filters = {
      contentType: contentTypeParam ? contentTypeParam.split(',') : [],
      difficulty: difficultyParam ? difficultyParam.split(',') : [],
      key: keyParam ? keyParam.split(',') : [],
      favorite
    }

    const queryParams: ContentQueryParams = {
      page,
      pageSize,
      search,
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

    // Apply search
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,artist.ilike.%${search}%,album.ilike.%${search}%`
      )
    }

    // Apply filters
    if (filters.contentType?.length) {
      const validTypes = ['Lyrics', 'Chord Chart', 'Guitar Tab', 'Sheet Music']
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/content - Create new content
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = getSupabaseServiceClient()
    
    const contentData = {
      ...body,
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
      throw error
    }

    return NextResponse.json(content)
  } catch (error: any) {
    logger.error('Error creating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/content - Update existing content
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
    }

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
        return NextResponse.json(
          { error: 'Content not found or access denied' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json(content)
  } catch (error: any) {
    logger.error('Error updating content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/content - Delete content
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      )
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 