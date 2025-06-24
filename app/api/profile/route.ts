import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'

export const runtime = 'nodejs' // Explicitly use Node.js runtime

async function getAuthenticatedUser(request: NextRequest) {
  let idToken: string | null = null

  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    idToken = authHeader.substring(7)
  } else {
    // Fall back to session cookie if no Authorization header
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookie = cookieHeader
        .split(';')
        .find(c => c.trim().startsWith('firebase-session='))
      if (cookie) {
        idToken = cookie.trim().substring('firebase-session='.length)
      }
    }
  }

  if (!idToken) {
    return null
  }

  try {
    const decodedToken = await verifyFirebaseToken(idToken)
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    }
  } catch (error) {
    logger.warn('Token verification failed:', error)
    return null
  }
}

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseServiceClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.uid)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, return null
        return NextResponse.json(null)
      }
      throw error
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    logger.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/profile - Create user profile
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = getSupabaseServiceClient()
    
    const profileData = {
      id: user.uid,
      email: user.email || body.email,
      full_name: body.full_name || null,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      avatar_url: body.avatar_url || null,
      primary_instrument: body.primary_instrument || null,
      bio: body.bio || null,
      website: body.website || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    logger.error('Error creating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = getSupabaseServiceClient()
    
    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    }

    // Remove id and email from update data as they shouldn't be changed
    delete updateData.id
    delete updateData.email

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.uid)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    logger.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 