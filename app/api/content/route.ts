import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'

// GET /api/content - Get user's content
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseServiceClient()
    
    const { data: content, error } = await supabase
      .from('content')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(content || [])
  } catch (error: any) {
    logger.error('Error fetching content:', error)
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