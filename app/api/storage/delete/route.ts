import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { validateFirebaseTokenServer } from '@/lib/firebase-server-utils'
import '@/lib/logger'
import { storageSchemas } from '@/lib/api-schemas'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'
import { authRequired, internalError, validationError } from '@/lib/api-errors'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'

const deleteFileHandler = async (request: NextRequest) => {
  try {
    // Verify Firebase authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return authRequired()
    }

    const firebaseToken = authHeader.substring(7)
    const validation = await validateFirebaseTokenServer(firebaseToken, request.url)
    
    if (!validation.isValid || !validation.user) {
      return authRequired()
    }
    const limited = enforceUserLimit(validation.user.uid, 'storage', RATE_LIMITS.STORAGE)
    if (limited) return limited

    // Parse and validate request body
    const body = await request.json()
    const bodyValidation = storageSchemas.delete.safeParse(body)

    if (!bodyValidation.success) {
      return validationError(bodyValidation.error)
    }

    const { filename } = bodyValidation.data

    // Additional security checks for path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return validationError([
        { code: 'custom', path: ['filename'], message: 'Invalid filename: path traversal detected' } as never,
      ])
    }

    // Only allow deletion of files that follow our naming convention (timestamp-filename)
    if (!filename.match(/^\d+-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/)) {
      return validationError([
        { code: 'custom', path: ['filename'], message: 'Invalid filename format' } as never,
      ])
    }

    // Delete from Supabase using service client
    const supabase = getSupabaseServiceClient()
    
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filename])

    if (error) {
      // B3 PR-1/D6 (achado de segurança nº 5 do pre-check): a mensagem
      // crua do Supabase ia para o cliente — era o ÚNICO ponto do repo
      // interpolando error.message de dependência na resposta. Detalhe
      // fica no log; o cliente recebe o envelope genérico.
      console.error('Supabase delete error:', error)
      return internalError('File deletion failed')
    }

    console.log(`File deleted successfully: ${filename}`)

    return NextResponse.json({
      success: true,
      filename
    })

  } catch (error) {
    console.error('Delete API error:', error)
    return internalError('File deletion failed')
  }
}

export const POST = deleteFileHandler
