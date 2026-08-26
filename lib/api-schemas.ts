// ---------------------------------------------------------------------------
// B2 PR-4b — módulo único de schemas de API (D3): content + storage.
// (setlist + session migram na PR-4c; api-validation-middleware.ts fica
// só com o middleware ao final.)
//
// Estilo obrigatório (docs/ux/B2-DESENHO.md §PR-4):
// - .nullish() em todo campo opcional: null = "limpar", undefined = "não
//   mexer" (semântica SET-23). A classe "optional() rejeita null" fica
//   impossível por construção.
// - Política D1: .strict() + withIgnoredKeys com lista escrita — chave
//   desconhecida → 400; campo ignorado é decisão declarada, nunca acidente.
// - Texto via commonSchemas.createSafeText (SAN-01): passa LITERAL ou 400
//   nomeando o campo; nunca alteração silenciosa.
// - Limites de string derivados do banco real (supabase/schema.dump.sql) —
//   o gate contract-drift.test.ts trava schema aceitando o que a coluna
//   não guarda (classe c1).
// ---------------------------------------------------------------------------
import { z } from 'zod'
import type { Json } from '@/types/database.types'
import { ContentType } from '@/types/content'
import { commonSchemas, withIgnoredKeys } from './api-validation-middleware'

// content_data é jsonb: valores devem ser JSON puro; o TOPO é objeto-ou-null.
// D5 (decisão de Marcel, 2026-08-24): o batch import da web envia STRING aqui
// e leva 400 ("Expected object") — NÃO consertar; o batch morre com a web e o
// contrato correto (objeto) é o que o cliente nativo herda. Não "corrija"
// isso alargando o topo para Json.
export const jsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
)

// Enum canônico ÚNICO (D4): types/content.ts é a fonte — Lyrics|Chords|Tab|
// Sheet. Os quatro enums divergentes do achado c2 (10 valores fantasma como
// 'song'/'pdf' num; 'Tabs'/'Piano'/'Drums' noutro) morrem aqui. Contagem no
// banco (2026-08-24): 194 linhas, TODAS dentro deste enum — sem migration.
export const contentTypeSchema = z.nativeEnum(ContentType)

// Campos editáveis de content — limites das colunas reais (dump):
// title/artist/album varchar(255) · genre varchar(100) · key/time_signature
// varchar(10) · difficulty varchar(20) · tuning varchar(50)
const contentEditableFields = {
  title: commonSchemas.createSafeText(1, 255),
  artist: commonSchemas.createSafeText(0, 255).nullish(),
  album: commonSchemas.createSafeText(0, 255).nullish(),
  genre: commonSchemas.createSafeText(0, 100).nullish(),
  content_type: contentTypeSchema,
  content_data: z.record(jsonValueSchema).nullish(),
  file_url: z.string().url().nullish(),
  key: z.string().max(10).nullish(),
  bpm: z.number().int().min(1).max(999).nullish(), // faixa única 1-999 (aval, ponto 3)
  time_signature: z.string().max(10).nullish(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).nullish(),
  capo: z.number().int().nullish(),
  tuning: commonSchemas.createSafeText(0, 50).nullish(),
  tags: z.array(commonSchemas.createSafeText(1, 50)).max(20).nullish(),
  notes: commonSchemas.createSafeText(0, 2000).nullish(),
  is_public: z.boolean().nullish(),
}

// user_id/created_at/updated_at vêm do servidor; a UI os envia hoje
// (useAddContentLogic manda user_id; content-editor manda updated_at) —
// ignorados por decisão escrita (D1), nunca gravados do body.
const CONTENT_IGNORED_KEYS = ['user_id', 'created_at', 'updated_at'] as const

export const contentSchemas = {
  create: withIgnoredKeys(
    z.object({
      ...contentEditableFields,
      is_favorite: z.boolean().default(false),
    }).strict(),
    CONTENT_IGNORED_KEYS
  ),

  // update canônico: PUT /api/content com id NO CORPO (o PUT /api/content/[id]
  // foi removido na PR-3 — decisão D6)
  update: withIgnoredKeys(
    z.object({
      id: commonSchemas.objectId,
      ...contentEditableFields,
      title: commonSchemas.createSafeText(1, 255).optional(),
      content_type: contentTypeSchema.optional(),
      is_favorite: z.boolean().nullish(),
    }).strict(),
    CONTENT_IGNORED_KEYS
  ),

  // Query de listagem (GET /api/content). Sem transform no search (SAN-01:
  // busca com < > passa literal para o ILIKE escapado do handler).
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
    pageSize: z.string().regex(/^\d+$/, 'Page size must be a number').transform(Number).default('20'),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['recent', 'title', 'artist', 'updated']).default('recent'),
    contentType: z.string().max(100).optional(),
    difficulty: z.string().max(100).optional(),
    key: z.string().max(100).optional(),
    favorite: z.enum(['true', 'false']).optional(),
  }),
} as const

// ---------------------------------------------------------------------------
// Storage — UMA lista de tipos permitidos (resolve b8: as três listas
// divergentes — regex do storageSchemas.upload sem image/jpg mas com
// gif/webp/html/msword; allowedMimeTypes; e o switch do route — viram esta
// tabela). gif/webp/html/msword saem declaradamente: o switch de extensão do
// route já os rejeitava, então NUNCA passaram ponta a ponta.
// ---------------------------------------------------------------------------
export const ALLOWED_UPLOADS: ReadonlyArray<{ ext: string; mimes: readonly string[] }> = [
  { ext: 'pdf', mimes: ['application/pdf'] },
  { ext: 'txt', mimes: ['text/plain'] },
  { ext: 'docx', mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
  { ext: 'png', mimes: ['image/png'] },
  // image/jpg não é MIME oficial, mas navegadores o reportam — aceito (b8)
  { ext: 'jpg', mimes: ['image/jpeg', 'image/jpg'] },
  { ext: 'jpeg', mimes: ['image/jpeg', 'image/jpg'] },
]

export const ALLOWED_UPLOAD_EXTENSIONS = ALLOWED_UPLOADS.map((u) => u.ext)
export const ALLOWED_UPLOAD_MIMES = [...new Set(ALLOWED_UPLOADS.flatMap((u) => u.mimes))]

export function mimeMatchesExtension(filename: string, mime: string): boolean {
  const ext = filename.toLowerCase().split('.').pop()
  const entry = ALLOWED_UPLOADS.find((u) => u.ext === ext)
  return !!entry && entry.mimes.includes(mime)
}

export const storageSchemas = {
  upload: z.object({
    filename: commonSchemas.filename.refine(
      (f) => ALLOWED_UPLOAD_EXTENSIONS.includes(f.toLowerCase().split('.').pop() ?? ''),
      'File type not allowed'
    ),
    contentType: z.string().refine(
      (m) => ALLOWED_UPLOAD_MIMES.includes(m),
      'Unsupported file type'
    ),
    size: z.number().int().min(1).max(50 * 1024 * 1024),
  }).strict(),

  // rota real de delete usa filename (o schema órfão que esperava fileUrl
  // morre na PR-4c)
  delete: z.object({
    filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._/-]+$/, 'Invalid filename format'),
  }).strict(),
} as const
