import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
import logger from '@/lib/logger'
import { storageSchemas, mimeMatchesExtension } from '@/lib/api-schemas'
import { contentMatchesDeclaredMime } from '@/lib/file-signatures'
import { authRequired, internalError, validationError } from '@/lib/api-errors'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'

const uploadFileHandler = async (request: NextRequest) => {
  try {
    // Verify Firebase authentication using secure utilities
    const user = await requireAuthServerSecure(request)
    if (!user) {
      return authRequired()
    }
    const limited = enforceUserLimit(user.uid, 'storage', RATE_LIMITS.STORAGE)
    if (limited) return limited

    logger.log(`Upload request from authenticated user: ${user.email}`)

    // Parse the multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      return validationError([
        { code: 'invalid_type', path: ['file'], message: 'No file provided' } as never,
      ])
    }

    if (!filename) {
      return validationError([
        { code: 'invalid_type', path: ['filename'], message: 'No filename provided' } as never,
      ])
    }

    // Validate file using storage schema
    const fileValidation = storageSchemas.upload.safeParse({
      filename,
      contentType: file.type,
      size: file.size
    })

    if (!fileValidation.success) {
      // details:string[] viraram estruturados — issues do schema têm path
      // real (filename/contentType/size)
      return validationError(fileValidation.error)
    }

    // B6-D5' (emenda da D5/B5-D11): a PARIDADE upload→delete é o
    // contrato — todo path produzido aqui DEVE casar a regex do delete
    // (delete/route.ts:46, [a-zA-Z0-9._-]). NFD + remoção de marcas
    // diacríticas preserva o legível (coração→coracao); o resto vira '_'
    // (flag u: 1 '_' por code point — emoji vira UM '_').
    const sanitizedFilename = filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/gu, '')
      .replace(/[^a-zA-Z0-9._-]/gu, '_')
    if (sanitizedFilename.length === 0) {
      return validationError([
        { code: 'custom', path: ['filename'], message: 'Invalid filename after sanitization' } as never,
      ])
    }

    // Consistência extensão × MIME — MESMA tabela do schema (b8: as três
    // listas divergentes viram uma, lib/api-schemas.ts ALLOWED_UPLOADS)
    if (!mimeMatchesExtension(sanitizedFilename, file.type)) {
      return validationError([
        { code: 'custom', path: ['contentType'], message: 'File extension does not match MIME type' } as never,
      ])
    }

    // Convert File to ArrayBuffer then to Uint8Array for Supabase
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // B5 PR-2: magic bytes — os bytes precisam SER o que o MIME declara
    // (tabela única em lib/file-signatures.ts; B5-DESENHO.md §4). Roda
    // ANTES do upload ao Supabase, sobre os bytes já em memória. O MIME
    // interpolado na mensagem é dado do REQUEST, não de dependência —
    // sem violação da regra de sentinela (D6).
    const sniff = contentMatchesDeclaredMime(uint8Array, file.type)
    if (!sniff.ok) {
      return validationError([
        { code: 'custom', path: ['file'], message: `File content does not match declared type (${file.type})` } as never,
      ])
    }

    // Create unique filename with timestamp to prevent conflicts and directory traversal
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`

    // Upload to Supabase using service client with service role
    const supabase = getSupabaseServiceClient()
    
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueFilename, uint8Array, {
        upsert: false, // Don't overwrite existing files for security
        contentType: file.type,
        cacheControl: '3600',
      })

    if (error) {
      // B3 PR-2 (achado): SEGUNDA instância da classe D6 — error.message
      // do Supabase ia interpolada ao cliente (o pre-check §2.9 declarava
      // o delete como ponto único; corrigido). Detalhe fica no log.
      logger.error('Supabase upload error:', error)
      return internalError('File upload failed')
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uniqueFilename)

    if (!urlData?.publicUrl) {
      return internalError('Failed to get public URL')
    }

    logger.log(`Upload successful: ${urlData.publicUrl}`)

    return new Response(JSON.stringify({
      url: urlData.publicUrl,
      path: uniqueFilename,
      originalFilename: filename,
      size: file.size,
      type: file.type,
      success: true
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    logger.error('Upload API error:', error)
    return internalError('File upload failed')
  }
}

export const POST = uploadFileHandler
