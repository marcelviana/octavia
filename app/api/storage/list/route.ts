import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseServiceClient } from '@/lib/supabase-service'
import { requireAuthServerSecure } from '@/lib/secure-auth-utils'
import logger from '@/lib/logger'
import { authRequired, internalError, validationError } from '@/lib/api-errors'
import { enforceUserLimit, RATE_LIMITS } from '@/lib/user-rate-limit'

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'content-files'

// B5 PR-3 (B5-DESENHO.md §5.1): schema de QUERY — não-strict por decisão
// do B2 (cachebuster/utm não pode dar 400); só as chaves conhecidas são
// lidas. Param inválido → 400 com field nomeando o param.
const listQuerySchema = z.object({
  prefix: z.string().max(255).default(''),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

const listHandler = async (request: NextRequest) => {
  try {
    const user = await requireAuthServerSecure(request)
    if (!user) {
      return authRequired()
    }
    // Família storage existente (60/h por uid) — sem família nova (§5.1)
    const limited = enforceUserLimit(user.uid, 'storage', RATE_LIMITS.STORAGE)
    if (limited) return limited

    const params = request.nextUrl.searchParams
    const queryValidation = listQuerySchema.safeParse({
      prefix: params.get('prefix') ?? undefined,
      limit: params.get('limit') ?? undefined,
      offset: params.get('offset') ?? undefined,
    })
    if (!queryValidation.success) {
      return validationError(queryValidation.error)
    }
    const { prefix, limit, offset } = queryValidation.data

    const supabase = getSupabaseServiceClient()
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: 'name', order: 'asc' } })

    if (error) {
      // Regra de sentinela (D6): detalhe do upstream fica no log; o
      // cliente recebe o envelope genérico.
      logger.error('Supabase list error:', error)
      return internalError('Failed to list storage objects')
    }

    // Entradas com id === null são "pastas" virtuais da list API — fora
    // do shape (o bucket é flat por contrato; docs/api/STORAGE.md).
    const objects = (data ?? [])
      .filter((item) => item.id !== null)
      .map((item) => ({
        path: prefix ? `${prefix}/${item.name}` : item.name,
        size: (item.metadata as { size?: number } | null)?.size ?? null,
        contentType: (item.metadata as { mimetype?: string } | null)?.mimetype ?? null,
        createdAt: item.created_at ?? null,
        updatedAt: item.updated_at ?? null,
      }))

    return NextResponse.json({ objects, count: objects.length })
  } catch (error) {
    logger.error('Storage list API error:', error)
    return internalError('Failed to list storage objects')
  }
}

export const GET = listHandler
