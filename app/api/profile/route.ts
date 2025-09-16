import { NextRequest, NextResponse } from 'next/server'
import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { withBodyValidation, authSchemas } from '@/lib/api-validation-middleware'
import { withRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs' // Explicitly use Node.js runtime

// Use the secure authentication utilities instead of custom auth function

// GET /api/profile - Get user profile
const getProfileHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServerSecure(request)

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

export const GET = withRateLimit(getProfileHandler, 25)

// POST /api/profile - Create user profile
const createProfileHandler = withBodyValidation(authSchemas.profileUpdate)(
  async (request: Request, validatedData: any, user: any) => {
    try {
      const supabase = getSupabaseServiceClient()

      const profileData = {
        id: user.uid,
        ...validatedData,
        email: user.email || validatedData.email,
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

      return new Response(JSON.stringify(profile), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      logger.error('Error creating profile:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
)

export const POST = withRateLimit(createProfileHandler, 25)

// PATCH /api/profile - Update user profile
const updateProfileHandler = withBodyValidation(authSchemas.profileUpdate)(
  async (request: Request, validatedData: any, user: any) => {
    try {
      const supabase = getSupabaseServiceClient()

      const updateData = {
        ...validatedData,
        updated_at: new Date().toISOString(),
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.uid)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json' }
      })
    } catch (error: any) {
      logger.error('Error updating profile:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
)

export const PATCH = withRateLimit(updateProfileHandler, 25) 