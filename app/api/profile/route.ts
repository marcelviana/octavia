import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { createProfileSchema, updateProfileSchema } from '@/lib/validation-schemas'
import { 
  validateRequestBody,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createServerErrorResponse
} from '@/lib/validation-utils'

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
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    
    // Validate request body
    const bodyValidation = await validateRequestBody(body, createProfileSchema)
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const validatedData = bodyValidation.data
    const supabase = getSupabaseServiceClient()
    
    const profileData = {
      id: user.uid,
      ...validatedData,
      email: user.email || validatedData.email, // Use Firebase email if available, otherwise validated email
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
    return createServerErrorResponse('Failed to create profile')
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return createUnauthorizedResponse()
    }

    const body = await request.json()
    
    // Validate request body
    const bodyValidation = await validateRequestBody(body, updateProfileSchema)
    if (!bodyValidation.success) {
      return createValidationErrorResponse(bodyValidation.errors)
    }

    const validatedData = bodyValidation.data
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

    return NextResponse.json(profile)
  } catch (error: any) {
    logger.error('Error updating profile:', error)
    return createServerErrorResponse('Failed to update profile')
  }
} 