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

// Common validation schemas
export const commonSchemas = {
  // UUID pattern (Supabase default)
  objectId: z.string().uuid('Invalid ID format'),

  // Firebase UID pattern
  firebaseUid: z.string().min(1).max(128),

  // Email validation
  email: z.string().email('Invalid email format'),

  // Content types enum
  contentType: z.enum(['Lyrics', 'Chords', 'Tabs', 'Piano', 'Drums'], {
    errorMap: () => ({ message: 'Invalid content type' })
  }),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),

  // Search query
  search: z.string().min(1).max(200).optional(),

  // File validation
  filename: z.string().min(1).max(255).regex(/^[^<>:"/\\|?*]+$/, 'Invalid filename'),

  // SAN-01 (B2 PR-4a): validação SEM alteração silenciosa — o texto ou passa
  // (e persiste LITERAL), ou o parse falha nomeando o campo (→ 400). Antes,
  // sanitizeInput em nível strict ZERAVA a string inteira (e moderate REMOVIA
  // caracteres) quando COMMAND_INJECTION casava ()[]{};&| — texto comum de
  // música ("Show (acústico)") era gravado como "" com 200. Esses caracteres
  // NÃO são ameaça aqui: o destino é varchar/jsonb via PostgREST
  // parametrizado, e o React escapa na renderização. A ÚNICA normalização é
  // .trim() (pré-existente no caminho antigo, declarada aqui). Vetores reais
  // (script/javascript:/data:/vbscript:) continuam REJEITADOS pelo refine —
  // que produz issue com o path do campo, não sanitização muda.
  safeText: z.string().trim().max(1000).refine(
    (text) => !/<script|javascript:|data:|vbscript:/i.test(text),
    'Potentially unsafe content detected'
  ),

  // Factory com min/max — mesma semântica SAN-01 do safeText
  createSafeText: (minLength?: number, maxLength?: number) => {
    let schema = z.string().trim()
    if (minLength !== undefined) schema = schema.min(minLength)
    if (maxLength !== undefined) schema = schema.max(maxLength)
    return schema.refine(
      (text) => !/<script|javascript:|data:|vbscript:/i.test(text),
      'Potentially unsafe content detected'
    )
  },

  // Conteúdo longo (description/notes ricos) — mesma semântica SAN-01;
  // regex amplia com on*= (handlers inline)
  safeHtml: z.string().trim().max(50000).refine(
    (html) => !/<script|javascript:|data:|vbscript:|on\w+\s*=/i.test(html),
    'Potentially unsafe HTML content detected'
  )
} as const

// ---------------------------------------------------------------------------
// Política D1 (B2, docs/ux/B2-DESENHO.md §PR-1): strip explícito por lista +
// .strict() no resto. Campo ignorado deliberadamente (id/email/user_id/
// updated_at vindos do cliente — o servidor os deriva do token) é declarado
// na lista ao lado do schema; chave desconhecida fora da lista → 400.
// Nenhum .passthrough() em lugar nenhum.
// ---------------------------------------------------------------------------
export function withIgnoredKeys<T extends z.ZodTypeAny>(
  schema: T,
  ignoredKeys: readonly string[]
) {
  return z.preprocess((raw) => {
    if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
      const clean: Record<string, unknown> = { ...(raw as Record<string, unknown>) }
      for (const key of ignoredKeys) delete clean[key]
      return clean
    }
    return raw
  }, schema)
}

// URL de formulário: "" (campo vazio) vira null em vez de 400 — b1 do B2
// (z.string().url() rejeita string vazia; a UI envia "" quando o campo não
// é preenchido — ProfileForm.tsx e photoURL de provedores sociais).
const emptyableUrl = z.preprocess(
  (v) => (v === '' ? null : v),
  z.string().url().nullish()
)


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

// ---------------------------------------------------------------------------
// Profile (migrado do api-validation-middleware na PR-4c; semântica da PR-1)
// ---------------------------------------------------------------------------
// Campos editáveis de profiles (colunas reais do banco — supabase/schema.dump.sql).
// .nullish() em tudo: null = "limpar o campo" (b2 do B2 — o login social envia
// null quando o provedor não tem displayName/photoURL; .optional() rejeitava e
// deixava usuário Firebase órfão sem perfil), undefined = "não mexer" (SET-23).
const profileEditableFields = {
  full_name: commonSchemas.createSafeText(0, 200).nullish(),
  first_name: commonSchemas.createSafeText(0, 100).nullish(),
  last_name: commonSchemas.createSafeText(0, 100).nullish(),
  primary_instrument: commonSchemas.createSafeText(0, 100).nullish(),
  avatar_url: emptyableUrl,
  bio: commonSchemas.createSafeText(0, 2000).nullish(),
  website: emptyableUrl,
}

export const authSchemas = {
  // Session creation (POST /api/auth/session) — payload real da UI é
  // exatamente { idToken } (pre-check §2.11); strict é no-op de comportamento
  sessionCreate: z.object({
    idToken: z.string().min(1, 'ID token is required')
      .max(4000, 'Token too long')
  }).strict(),

  // User profile creation (signup e primeiro login social) — política D1:
  // id/email vêm do token autenticado; o cliente os envia hoje (login-panel e
  // signup os incluem no body), então são IGNORADOS POR LISTA EXPLÍCITA.
  profileCreate: withIgnoredKeys(
    z.object(profileEditableFields).strict(),
    ['id', 'email']
  ),

  // User profile update — mesmo conjunto de campos editáveis, mesma lista.
  profileUpdate: withIgnoredKeys(
    z.object(profileEditableFields).strict(),
    ['id', 'email']
  )
} as const

// ---------------------------------------------------------------------------
// Setlists — PR-5: os três campos fantasma (SET-01) DEIXAM a lista de
// ignorados e ENTRAM no contrato; o handler os persiste de verdade.
//
// performance_date é DATE-ONLY por decisão de produto (B5, 2026-08-10):
// YYYY-MM-DD, sem hora, sem fuso — a coluna já é `date` no banco (dump).
// Timestamp completo → 400 (elimina o off-by-one do SET-17 no contrato;
// a exibição web mantém o bug até morrer — Bloco D).
// ---------------------------------------------------------------------------
const setlistMetadataFields = {
  // name 1..255: alinhado à coluna varchar(255) do dump (era 100)
  name: commonSchemas.createSafeText(1, 255),
  // .nullish() em tudo: SET-23 — null = limpar, undefined = não mexer
  description: commonSchemas.safeHtml.nullish(),
  venue: commonSchemas.createSafeText(0, 255).nullish(),
  performance_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'performance_date must be date-only (YYYY-MM-DD)')
    .nullish(),
  notes: commonSchemas.safeHtml.nullish(),
}

// Item de songs[] no CREATE (D2): SEM position — a ORDEM DO ARRAY é a
// ordem, renumerada 1..N pelo servidor. Aceitar uma position que o servidor
// recalcularia seria a mesma mentira que o B2 existe para matar.
const setlistCreateSongItem = z.object({
  content_id: commonSchemas.objectId,
  notes: commonSchemas.safeText.nullish(),
}).strict()

export const setlistSchemas = {
  create: z.object({
    ...setlistMetadataFields,
    // songs[] agora é IMPLEMENTADO pelo handler (fim do a3 — o 201 diz a
    // verdade). content_id repetido no array → 400: bis intencional se faz
    // ADICIONANDO depois (a UNIQUE do bis caiu na MIG-1); repetir na
    // criação é erro de cliente.
    songs: z.array(setlistCreateSongItem).max(100).default([])
      .refine(
        (songs) => new Set(songs.map((s) => s.content_id)).size === songs.length,
        'Duplicate content_id in songs'
      ),
  }).strict(),

  // update é SÓ metadados (decisão D2): songs aqui → 400 por chave
  // desconhecida (não strip). Reordenar/adicionar/remover têm rotas próprias.
  update: z.object({
    ...setlistMetadataFields,
    name: commonSchemas.createSafeText(1, 255).optional(),
  }).strict(),

  addSong: z.object({
    content_id: commonSchemas.objectId,
    // EXCEÇÃO DELIBERADA à política D1 (ajuste 4 do aval do desenho):
    // position é aceita como SUGESTÃO e o servidor recalcula
    // (songs/route.ts — Math.max(position, max+1); item 21 da Fase D).
    // A semântica final é pergunta aberta do B6 — não "corrigir" aqui.
    position: z.number().int().min(0).nullish(),
    notes: commonSchemas.safeText.nullish(),
  }).strict(),
} as const
