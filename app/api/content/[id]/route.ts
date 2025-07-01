import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'

// GET /api/content/[id] - Get specific content by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuthServer(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    
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