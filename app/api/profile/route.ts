import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database.types'
import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import logger from '@/lib/logger'
import { withBodyValidation } from '@/lib/api-validation-middleware'
import { authSchemas } from '@/lib/api-schemas'
import { authRequired, internalError } from '@/lib/api-errors'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { z } from 'zod'

export const runtime = 'nodejs' // Explicitly use Node.js runtime

// Use the secure authentication utilities instead of custom auth function

// GET /api/profile - Get user profile
const getProfileHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServerSecure(request)

    if (!user) {
      return authRequired()
    }
    const limited = enforceUserLimit(user.uid, 'profile', RATE_LIMITS.PROFILE)
    if (limited) return limited

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
    return internalError()
  }
}

export const GET = getProfileHandler

// POST /api/profile - Create user profile
// allowUnverifiedEmail: no signup o usuário Firebase acabou de ser criado e
// ainda não verificou o email — sem isso o perfil nunca seria criado em prod
const createProfileHandlerRaw = withBodyValidation(authSchemas.profileCreate, {
  allowUnverifiedEmail: true,
  rateLimit: { familia: 'profile', config: RATE_LIMITS.PROFILE }
})(
  async (
    request: Request,
    validatedData: z.infer<typeof authSchemas.profileCreate>,
    user?: NonNullable<Awaited<ReturnType<typeof requireAuthServerSecure>>>
  ) => {
    try {
      if (!user) {
        return authRequired()
      }

      // D9/PR-2 (item E4): o tipo gerado expôs o que o `as any` escondia —
      // user.email é string | undefined no token e profiles.email é NOT NULL.
      // Antes, este caso estourava como violação de NOT NULL no Postgres e
      // caía no catch com o MESMO 500 abaixo; o guard só torna o caminho
      // explícito e logável. Inalcançável com os provedores atuais
      // (email/senha e Google sempre trazem email).
      if (!user.email) {
        logger.error('Profile creation without email in token', { uid: user.uid })
        return internalError('Failed to create profile')
      }

      const supabase = getSupabaseServiceClient()

      // Política D1: campos enumerados — nada de espalhar validatedData
      // (o spread gravaria qualquer campo futuro do schema sem decisão
      // escrita aqui). id/email vêm SEMPRE do token, nunca do body.
      const profileData = {
        id: user.uid,
        email: user.email,
        full_name: validatedData.full_name ?? null,
        first_name: validatedData.first_name ?? null,
        last_name: validatedData.last_name ?? null,
        primary_instrument: validatedData.primary_instrument ?? null,
        avatar_url: validatedData.avatar_url ?? null,
        bio: validatedData.bio ?? null,
        website: validatedData.website ?? null,
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

      return NextResponse.json(profile, { status: 201 })
    } catch (error: any) {
      logger.error('Error creating profile:', error)
      return internalError('Failed to create profile')
    }
  }
)

// Wrap handler to match withRateLimit signature
const createProfileHandler = async (request: NextRequest): Promise<NextResponse> => {
  const response = await createProfileHandlerRaw(request)
  return response as NextResponse
}

export const POST = createProfileHandler

// PATCH /api/profile - Update user profile
const updateProfileHandlerRaw = withBodyValidation(authSchemas.profileUpdate, {
  rateLimit: { familia: 'profile', config: RATE_LIMITS.PROFILE }
})(
  async (
    request: Request,
    validatedData: z.infer<typeof authSchemas.profileUpdate>,
    user?: NonNullable<Awaited<ReturnType<typeof requireAuthServerSecure>>>
  ) => {
    try {
      if (!user) {
        return authRequired()
      }

      const supabase = getSupabaseServiceClient()

      // Política D1: campos enumerados. Semântica SET-23 por campo:
      // undefined = "não mexer" (fica fora do UPDATE), null = "limpar".
      const updateData: Database['public']['Tables']['profiles']['Update'] = {
        updated_at: new Date().toISOString(),
      }
      if (validatedData.full_name !== undefined) updateData.full_name = validatedData.full_name
      if (validatedData.first_name !== undefined) updateData.first_name = validatedData.first_name
      if (validatedData.last_name !== undefined) updateData.last_name = validatedData.last_name
      if (validatedData.primary_instrument !== undefined) updateData.primary_instrument = validatedData.primary_instrument
      if (validatedData.avatar_url !== undefined) updateData.avatar_url = validatedData.avatar_url
      if (validatedData.bio !== undefined) updateData.bio = validatedData.bio
      if (validatedData.website !== undefined) updateData.website = validatedData.website

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
      return internalError('Failed to update profile')
    }
  }
)

// Wrap handler to match withRateLimit signature
const updateProfileHandler = async (request: NextRequest): Promise<NextResponse> => {
  const response = await updateProfileHandlerRaw(request)
  return response as NextResponse
}

export const PATCH = updateProfileHandler 