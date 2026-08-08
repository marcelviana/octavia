/**
 * Seed da conta de UX audit contra a API pública de prod (nunca Supabase
 * direto, nunca service role). Dados desenhados para expor casos ruins de
 * UX; todo item leva o prefixo [UX-AUDIT] no título/nome — o prefixo é a
 * chave de idempotência e de cleanup.
 *
 * ATENÇÃO (Fase A3 do assessment): NÃO executar antes de capturar os
 * estados vazios da conta (Fase B). Por isso o script exige a flag --yes.
 *
 * Execução: serial, ~300ms entre requests, backoff exponencial em 429
 * (via apiFetch). Idempotente: itens cujo título [UX-AUDIT] já existe são
 * pulados (duplicados intencionais são controlados por contagem); músicas
 * de setlist são idempotentes POR MÚSICA — só o delta até o alvo é
 * inserido, com posições sequenciais a partir da última existente.
 *
 * A rota POST /api/setlists/[id]/songs tem pacing próprio (ver
 * SONGS_DELAY_MS): limite de 50 req/60s por IP em lib/rate-limit.ts, num
 * contador LRU COMPARTILHADO entre todas as rotas que usam withRateLimit
 * (o token é só o IP, sem a rota) e com TTL renovado a cada request aceito
 * (janela desliza — estourar o limite e insistir mantém o bloqueio).
 *
 * Uso: pnpm tsx scripts/ux-audit/seed.ts --yes
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { apiFetch, sleep } from './auth'

const PREFIX = '[UX-AUDIT]'
const DELAY_MS = 300

// Prefixo SEM colchetes para NOMES DE SETLIST: o setlistSchemas.create usa
// createSafeText (nível strict do lib/input-sanitizer.ts), cujo padrão de
// "command injection" /[;&|`$(){}[\]]/ casa com colchetes — e no strict
// QUALQUER ameaça detectada zera a string INTEIRA. "[UX-AUDIT] X" vira ""
// no banco (achado da Fase C: nomes com [, ], (, ), &, ', ", + são
// silenciosamente esvaziados). Títulos de conteúdo não passam por isso.
const SETLIST_PREFIX = 'UX-AUDIT'

// POST /api/setlists/[id]/songs: withRateLimit(handler, 50) sobre o
// defaultLimiter de lib/rate-limit.ts. NÃO é janela rolante: o contador
// LRU tem TTL de 60s renovado a cada request ACEITO e é compartilhado por
// IP entre todas as rotas do withRateLimit — na prática, burst de até 50
// e depois 60s de silêncio para o contador expirar. O pacing correto é
// adaptativo: ler X-RateLimit-Remaining/Reset das respostas e pausar até
// o reset quando o orçamento estiver acabando.
const SONGS_BUDGET_FLOOR = 3

type ContentTypeName = 'Lyrics' | 'Chords' | 'Tab' | 'Sheet'

interface ContentItem {
  title: string
  artist?: string
  content_type: ContentTypeName
  content_data?: Record<string, unknown>
  key?: string
  bpm?: number
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  is_favorite?: boolean
}

interface ContentRow {
  id: string
  title: string
  file_url: string | null
}

const counts = { created: 0, skipped: 0, failed: 0 }

function logItem(status: 'created' | 'skipped' | 'failed', label: string, reason?: string): void {
  counts[status]++
  console.log(`[seed] ${status.padEnd(7)} ${label}${reason ? ` — ${reason}` : ''}`)
}

// ---------------------------------------------------------------------------
// Conteúdo dummy plausível
// ---------------------------------------------------------------------------

const LYRICS_DUMMY = [
  'Quando a noite chega e a cidade acende',
  'Eu procuro a estrada que me leva até você',
  'O vento traz lembranças de um tempo que passou',
  '',
  'E se a saudade aperta, eu canto essa canção',
  'Pra espantar a sombra e acalmar o coração',
  'Amanhã é outro dia, o sol vai voltar',
  'E a gente segue em frente, sem parar de sonhar',
].join('\n')

const CHORDS_DUMMY = [
  '[Intro] C  Am  F  G',
  '',
  'C                Am',
  'Quando a noite chega e a cidade acende',
  'F                 G',
  'Eu procuro a estrada que me leva até você',
  'C                Am',
  'O vento traz lembranças de um tempo que passou',
  'F        G         C',
  'E a gente segue em frente',
  '',
  '[Refrão] F  G  Em  Am  F  G  C',
].join('\n')

const TAB_DUMMY = [
  'e|-------0-----------0-------|-------0-----------0-------|',
  'B|-----1---1-------1---1-----|-----1---1-------1---1-----|',
  'G|---0-------0---0-------0---|---2-------2---2-------2---|',
  'D|---------------------------|---------------------------|',
  'A|-3-------------------------|---------------------------|',
  'E|---------------|-----------|-0-------------------------|',
].join('\n')

// ---------------------------------------------------------------------------
// Plano de conteúdo (~40 itens): títulos 150+, acentuação, duplicados
// exatos, itens sem artista, mix de content_types
// ---------------------------------------------------------------------------

const LONG_TITLE_1 =
  `${PREFIX} Canção interminável do sertão profundo onde o vento faz a curva e o violeiro conta causos ` +
  `da assombração da meia-noite em ritmo de moda de viola caipira da tradição centenária`

const LONG_TITLE_2 =
  `${PREFIX} Suíte concertante nº 3 em ré menor para violão de sete cordas, orquestra de câmara e coro ` +
  `feminino — movimento II: andante espressivo com variações sobre um tema nordestino`

const CONTENT_PLAN: ContentItem[] = [
  // Títulos com 150+ caracteres
  { title: LONG_TITLE_1, content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: LONG_TITLE_2, artist: 'Orquestra do Recife', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'Dm' },

  // Pares de duplicados exatos (2x cada — idempotência por contagem)
  { title: `${PREFIX} Águas de Março`, artist: 'Tom Jobim', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'C' },
  { title: `${PREFIX} Águas de Março`, artist: 'Tom Jobim', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'C' },
  { title: `${PREFIX} Evidências`, artist: 'Chitãozinho & Xororó', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Evidências`, artist: 'Chitãozinho & Xororó', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },

  // Acentuação variada (ção, ã, é, ê)
  { title: `${PREFIX} Construção`, artist: 'Chico Buarque', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY }, is_favorite: true },
  { title: `${PREFIX} Coração Vagabundo`, artist: 'Caetano Veloso', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'D' },
  { title: `${PREFIX} Oração ao Tempo`, artist: 'Caetano Veloso', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Canção da América`, artist: 'Milton Nascimento', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'G' },
  { title: `${PREFIX} Ê Boi`, content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Fé Cega, Faca Amolada`, artist: 'Milton Nascimento', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'Em', bpm: 132 },
  { title: `${PREFIX} João e Maria`, artist: 'Chico Buarque', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'Am' },
  { title: `${PREFIX} Romaria`, artist: 'Renato Teixeira', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Andança`, artist: 'Beth Carvalho', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'F' },
  { title: `${PREFIX} Ponta de Areia`, artist: 'Milton Nascimento', content_type: 'Tab', content_data: { tablature: TAB_DUMMY } },

  // Sem artista
  { title: `${PREFIX} Baião de Dois`, content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'A' },
  { title: `${PREFIX} Modinha sem Autor Conhecido`, content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Estudo em Mi Menor`, content_type: 'Tab', content_data: { tablature: TAB_DUMMY }, difficulty: 'Intermediate' },
  { title: `${PREFIX} Tema da Aula de Sexta`, content_type: 'Tab', content_data: { tablature: TAB_DUMMY }, difficulty: 'Beginner' },

  // Mix geral
  { title: `${PREFIX} Garota de Ipanema`, artist: 'Tom Jobim', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'F', bpm: 120, is_favorite: true },
  { title: `${PREFIX} Chega de Saudade`, artist: 'João Gilberto', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'Dm' },
  { title: `${PREFIX} O Leãozinho`, artist: 'Caetano Veloso', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'G' },
  { title: `${PREFIX} Trem-Bala`, artist: 'Ana Vilela', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Anunciação`, artist: 'Alceu Valença', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY }, is_favorite: true },
  { title: `${PREFIX} Asa Branca`, artist: 'Luiz Gonzaga', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'E' },
  { title: `${PREFIX} Esperando na Janela`, artist: 'Gilberto Gil', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'A', bpm: 104 },
  { title: `${PREFIX} Sampa`, artist: 'Caetano Veloso', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Wave`, artist: 'Tom Jobim', content_type: 'Tab', content_data: { tablature: TAB_DUMMY }, difficulty: 'Advanced' },
  { title: `${PREFIX} Manhã de Carnaval`, artist: 'Luiz Bonfá', content_type: 'Tab', content_data: { tablature: TAB_DUMMY } },
  { title: `${PREFIX} Sons de Carrilhões`, artist: 'João Pernambuco', content_type: 'Tab', content_data: { tablature: TAB_DUMMY }, difficulty: 'Advanced' },
  { title: `${PREFIX} Lamentos do Morro`, artist: 'Pixinguinha', content_type: 'Tab', content_data: { tablature: TAB_DUMMY } },
  { title: `${PREFIX} Odeio Você`, artist: 'Adoniran Barbosa', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
  { title: `${PREFIX} Trenzinho do Caipira`, artist: 'Villa-Lobos', content_type: 'Tab', content_data: { tablature: TAB_DUMMY }, difficulty: 'Advanced' },
  { title: `${PREFIX} Felicidade`, artist: 'Marcelo Jeneci', content_type: 'Chords', content_data: { chords: CHORDS_DUMMY }, key: 'C' },
  { title: `${PREFIX} Palco`, artist: 'Gilberto Gil', content_type: 'Lyrics', content_data: { lyrics: LYRICS_DUMMY } },
]

// A tabela setlist_songs em PROD tem unique constraint em
// (setlist_id, content_id) — NÃO está no schema.sql (drift confirmado) — e
// repetir uma música numa setlist retorna 500 genérico (achado Fase C/D:
// bis/reprise é impossível pela API). A setlist Estresse (60 músicas)
// exige portanto 60 conteúdos DISTINTOS; os "Bis" abaixo completam o que
// falta além do CONTENT_PLAN + PDFs.
const FILLER_TARGET = 60
const FILLER_PLAN: ContentItem[] = Array.from(
  { length: Math.max(0, FILLER_TARGET - (CONTENT_PLAN.length + 2)) },
  (_, i) => ({
    title: `${PREFIX} Bis nº ${String(i + 1).padStart(2, '0')}`,
    artist: 'Conjunto do Bis',
    content_type: 'Lyrics' as const,
    content_data: { lyrics: LYRICS_DUMMY },
  })
)

// PDFs pelo fluxo real de upload (storage + content)
const PDF_PLAN = [
  { title: `${PREFIX} Partitura de 1 página`, filename: 'ux-audit-partitura-1p.pdf', pages: 1 },
  { title: `${PREFIX} Partitura de 12 páginas`, filename: 'ux-audit-partitura-12p.pdf', pages: 12 },
] as const

// ---------------------------------------------------------------------------
// Helpers de API
// ---------------------------------------------------------------------------

async function fetchAllContent(): Promise<ContentRow[]> {
  const all: ContentRow[] = []
  let page = 1
  for (;;) {
    const res = await apiFetch(`/api/content?page=${page}&pageSize=100`)
    if (!res.ok) throw new Error(`GET /api/content página ${page}: HTTP ${res.status}`)
    const body = (await res.json()) as { data: ContentRow[]; hasMore: boolean }
    all.push(...body.data)
    if (!body.hasMore) break
    page++
    await sleep(DELAY_MS)
  }
  return all
}

async function createContent(item: ContentItem & { file_url?: string }): Promise<ContentRow | null> {
  const res = await apiFetch('/api/content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!res.ok) {
    let detail = ''
    try {
      detail = JSON.stringify(await res.json())
    } catch {
      // sem corpo JSON
    }
    logItem('failed', item.title, `HTTP ${res.status} ${detail}`)
    return null
  }
  logItem('created', item.title)
  return (await res.json()) as ContentRow
}

// ---------------------------------------------------------------------------
// PDFs dummy (pdf-lib) — vetoriais com pautas desenhadas; não é um scan
// real, mas mantém proporção A4 e conteúdo por página
// ---------------------------------------------------------------------------

async function buildSheetPdf(title: string, pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const noteFont = await doc.embedFont(StandardFonts.Helvetica)

  // LCG determinístico: mesmo PDF a cada execução (idempotência de tamanho)
  let seed = 42
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }

  for (let p = 0; p < pages; p++) {
    const page = doc.addPage([595, 842]) // A4 em pontos
    page.drawText(title.replace(/[^\x20-\x7E]/g, '?'), { x: 50, y: 800, size: 14, font })
    page.drawText(`pagina ${p + 1} de ${pages}`, { x: 50, y: 782, size: 10, font: noteFont })

    for (let staff = 0; staff < 10; staff++) {
      const top = 740 - staff * 70
      for (let line = 0; line < 5; line++) {
        const y = top - line * 8
        page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.8, color: rgb(0.1, 0.1, 0.1) })
      }
      // "notas" pseudo-aleatórias determinísticas para dar corpo à página
      for (let n = 0; n < 24; n++) {
        const x = 60 + n * 20 + rand() * 6
        const y = top - Math.floor(rand() * 5) * 8 + 4
        page.drawCircle({ x, y, size: 3.5, color: rgb(0.1, 0.1, 0.1) })
      }
    }
  }

  return doc.save()
}

async function uploadFile(
  filename: string,
  bytes: Uint8Array,
  mimeType: string
): Promise<{ ok: boolean; status: number; body: { url?: string; error?: string; details?: unknown } }> {
  const form = new FormData()
  form.append('file', new Blob([bytes as BlobPart], { type: mimeType }), filename)
  form.append('filename', filename)
  const res = await apiFetch('/api/storage/upload', { method: 'POST', body: form })
  let body: { url?: string; error?: string; details?: unknown } = {}
  try {
    body = (await res.json()) as typeof body
  } catch {
    // sem corpo JSON
  }
  return { ok: res.ok, status: res.status, body }
}

// ---------------------------------------------------------------------------
// Setlists
// ---------------------------------------------------------------------------

interface SetlistRow {
  id: string
  name: string
  venue?: string | null
  performance_date?: string | null
  notes?: string | null
  setlist_songs: Array<{ id: string; position: number; content_id: string }>
}

const SETLIST_PLAN = [
  { name: `${SETLIST_PREFIX} Solo`, songCount: 1, extras: {} },
  {
    name: `${SETLIST_PREFIX} Show padrão`,
    songCount: 8,
    // venue/performance_date/notes: a rota lê esses campos, mas o schema Zod
    // (setlistSchemas.create) os descarta antes do handler. Enviamos mesmo
    // assim e logamos o retorno — insumo para a Fase C (colunas write-only).
    extras: {
      description: 'Show completo com bloco acústico e bloco elétrico',
      venue: 'Bar do Zé — Pelourinho',
      performance_date: '2026-09-12T21:00:00.000Z',
      notes: 'Chegar 19h para passagem de som; levar cabo extra',
    },
  },
  { name: `${SETLIST_PREFIX} Estresse`, songCount: 60, extras: {} },
] as const

async function fetchSetlists(): Promise<SetlistRow[]> {
  const res = await apiFetch('/api/setlists')
  if (!res.ok) throw new Error(`GET /api/setlists: HTTP ${res.status}`)
  return (await res.json()) as SetlistRow[]
}

async function createSetlist(plan: (typeof SETLIST_PLAN)[number]): Promise<SetlistRow | null> {
  const res = await apiFetch('/api/setlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: plan.name, ...plan.extras }),
  })
  if (!res.ok) {
    logItem('failed', plan.name, `HTTP ${res.status}`)
    return null
  }
  const row = (await res.json()) as SetlistRow
  logItem('created', plan.name)
  if (row.name !== plan.name) {
    console.log(
      `[seed]         achado: nome enviado "${plan.name}" persistido como ` +
        `"${row.name}" (sanitizador strict do createSafeText — verificar na Fase C)`
    )
  }
  if ('venue' in plan.extras) {
    const stripped = [
      row.venue == null ? 'venue' : null,
      row.performance_date == null ? 'performance_date' : null,
      row.notes == null ? 'notes' : null,
    ].filter(Boolean)
    if (stripped.length > 0) {
      console.log(
        `[seed]         achado: campos enviados mas descartados pela API em "${plan.name}": ` +
          `${stripped.join(', ')} (schema Zod não os aceita — verificar na Fase C)`
      )
    }
  }
  return row
}

interface SongInsertResult {
  ok: boolean
  status: number
  remaining: number | null
  resetAtMs: number | null
  retryAfterSec: number | null
  detail: string
}

async function addSongToSetlist(
  setlistId: string,
  contentId: string,
  position: number,
  notes?: string
): Promise<SongInsertResult> {
  const res = await apiFetch(`/api/setlists/${setlistId}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_id: contentId, position, ...(notes ? { notes } : {}) }),
  })
  const remainingHeader = res.headers.get('X-RateLimit-Remaining')
  const resetHeader = res.headers.get('X-RateLimit-Reset')
  const retryAfterHeader = res.headers.get('Retry-After')
  let detail = ''
  if (!res.ok) {
    try {
      detail = (await res.text()).slice(0, 200)
    } catch {
      // corpo ilegível
    }
  }
  return {
    ok: res.ok,
    status: res.status,
    remaining: remainingHeader !== null ? Number(remainingHeader) : null,
    resetAtMs: resetHeader ? Date.parse(resetHeader) : null,
    retryAfterSec: retryAfterHeader !== null ? Number(retryAfterHeader) : null,
    detail,
  }
}

/** Pausa até o reset da janela de rate limit (com margem de 2s). */
async function waitForRateLimitReset(resetAtMs: number | null, label: string): Promise<void> {
  const waitMs = resetAtMs ? Math.max(resetAtMs - Date.now(), 0) + 2_000 : 62_000
  console.log(`[seed]         ${label} — pausando ${Math.ceil(waitMs / 1000)}s até a janela de rate limit resetar`)
  await sleep(waitMs)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!process.argv.includes('--yes')) {
    console.error(
      '[seed] BLOQUEADO: este script grava dados na conta de audit em PROD.\n' +
        '[seed] Os estados vazios da conta precisam ser capturados antes (Fase B).\n' +
        '[seed] Para executar de fato: pnpm tsx scripts/ux-audit/seed.ts --yes'
    )
    process.exit(2)
  }

  console.log('[seed] Carregando conteúdo existente para idempotência…')
  const existing = await fetchAllContent()
  const auditRows = existing.filter((row) => row.title.startsWith(PREFIX))
  const existingByTitle = new Map<string, number>()
  for (const row of auditRows) {
    existingByTitle.set(row.title, (existingByTitle.get(row.title) ?? 0) + 1)
  }
  console.log(`[seed] ${auditRows.length} itens ${PREFIX} já existentes na biblioteca`)

  const contentIds: string[] = auditRows.map((row) => row.id)

  // 1. Conteúdo inline (letras, cifras, tablaturas + fillers da Estresse)
  for (const item of [...CONTENT_PLAN, ...FILLER_PLAN]) {
    const remaining = existingByTitle.get(item.title) ?? 0
    if (remaining > 0) {
      existingByTitle.set(item.title, remaining - 1)
      logItem('skipped', item.title, 'já existe')
      continue
    }
    const row = await createContent(item)
    if (row) contentIds.push(row.id)
    await sleep(DELAY_MS)
  }

  // 2. PDFs pelo fluxo real de upload
  for (const pdf of PDF_PLAN) {
    const remaining = existingByTitle.get(pdf.title) ?? 0
    if (remaining > 0) {
      existingByTitle.set(pdf.title, remaining - 1)
      logItem('skipped', pdf.title, 'já existe')
      continue
    }
    const bytes = await buildSheetPdf(pdf.title, pdf.pages)
    const upload = await uploadFile(pdf.filename, bytes, 'application/pdf')
    if (!upload.ok || !upload.body.url) {
      logItem('failed', pdf.title, `upload HTTP ${upload.status}`)
      await sleep(DELAY_MS)
      continue
    }
    await sleep(DELAY_MS)
    const row = await createContent({
      title: pdf.title,
      artist: 'Compositor Anônimo',
      content_type: 'Sheet',
      file_url: upload.body.url,
    })
    if (row) contentIds.push(row.id)
    await sleep(DELAY_MS)
  }

  // 3. Tentativa deliberada de upload de tipo não permitido — a REJEIÇÃO
  // pela API é o resultado esperado e conta como sucesso do teste
  {
    const label = 'upload não permitido (ux-audit-nao-permitido.exe)'
    const fakeExe = new TextEncoder().encode('MZ fake executable payload para teste de rejeição')
    const attempt = await uploadFile('ux-audit-nao-permitido.exe', fakeExe, 'application/x-msdownload')
    if (!attempt.ok) {
      const detail = attempt.body.error ?? JSON.stringify(attempt.body.details ?? {})
      logItem('created', label, `rejeitado como esperado: HTTP ${attempt.status} "${detail}"`)
    } else {
      logItem('failed', label, `API ACEITOU tipo não permitido (HTTP ${attempt.status}) — achado de segurança!`)
    }
    await sleep(DELAY_MS)
  }

  if (contentIds.length === 0) {
    console.error('[seed] Nenhum conteúdo disponível para montar setlists — abortando')
    process.exit(1)
  }

  // 4. Setlists
  console.log('[seed] Carregando setlists existentes…')
  const existingSetlists = await fetchSetlists()

  for (const plan of SETLIST_PLAN) {
    let setlist = existingSetlists.find((s) => s.name === plan.name) ?? null
    let currentSongs = setlist?.setlist_songs.length ?? 0
    // Posições sequenciais a partir da última existente (não assume 1..n)
    let lastPosition = setlist
      ? setlist.setlist_songs.reduce((max, s) => Math.max(max, s.position), 0)
      : 0

    if (setlist && currentSongs >= plan.songCount) {
      logItem('skipped', plan.name, `já existe com ${currentSongs} músicas`)
      continue
    }

    if (!setlist) {
      setlist = await createSetlist(plan)
      currentSongs = 0
      lastPosition = 0
      await sleep(DELAY_MS)
      if (!setlist) continue
    }

    const delta = plan.songCount - currentSongs
    // Unique constraint (setlist_id, content_id) em prod: só entram
    // conteúdos que ainda não estão na setlist
    const usedContentIds = new Set(setlist.setlist_songs?.map((s) => s.content_id) ?? [])
    const availableIds = contentIds.filter((id) => !usedContentIds.has(id))
    if (availableIds.length < delta) {
      logItem(
        'failed',
        `${plan.name} (músicas)`,
        `só ${availableIds.length} conteúdos distintos disponíveis para ${delta} inserções`
      )
      continue
    }
    // Modelo do limiter: bursts de ~46 (50 menos margem/uso compartilhado)
    // com pausa de ~62s entre bursts
    const estimatedSec = Math.ceil((delta * DELAY_MS) / 1000) + Math.floor(delta / 46) * 62
    console.log(
      `[seed] ${plan.name}: inserindo ${delta} músicas (${currentSongs} → ${plan.songCount}), ` +
        `pacing adaptativo via X-RateLimit-* (burst de ~50, pausa de ~60s) — tempo estimado ~${estimatedSec}s`
    )

    let failures = 0
    for (let i = 0; i < delta; i++) {
      const songIndex = currentSongs + i
      const contentId = availableIds[i]
      if (!contentId) break
      const notes =
        songIndex % 5 === 0
          ? `Observação da música ${songIndex + 1}: modular meio tom acima no último refrão`
          : undefined
      let result = await addSongToSetlist(setlist.id, contentId, lastPosition + i + 1, notes)

      if (result.status === 429) {
        // Estourou apesar do pacing (orçamento compartilhado com outras
        // rotas) — espera o reset e tenta a MESMA música mais uma vez
        await waitForRateLimitReset(
          result.retryAfterSec ? Date.now() + result.retryAfterSec * 1000 : result.resetAtMs,
          `429 na música ${songIndex + 1}`
        )
        result = await addSongToSetlist(setlist.id, contentId, lastPosition + i + 1, notes)
      }

      if (!result.ok) {
        failures++
        console.log(
          `[seed]         música ${songIndex + 1} falhou: HTTP ${result.status}` +
            `${result.detail ? ` ${result.detail}` : ''}`
        )
      } else if (result.remaining !== null && result.remaining <= SONGS_BUDGET_FLOOR && i < delta - 1) {
        // Pausa preventiva ANTES de estourar: o contador compartilhado só
        // expira com ~60s sem requests aceitos
        await waitForRateLimitReset(result.resetAtMs, `orçamento baixo (remaining=${result.remaining})`)
      }
      await sleep(DELAY_MS)
    }
    if (failures > 0) {
      logItem('failed', `${plan.name} (músicas)`, `${failures} de ${delta} inserções falharam`)
    } else if (delta > 0) {
      console.log(`[seed]         ${plan.name}: ${delta} músicas adicionadas`)
    }
  }

  console.log(
    `[seed] Resumo: ${counts.created} created, ${counts.skipped} skipped, ${counts.failed} failed`
  )
  process.exit(counts.failed > 0 ? 1 : 0)
}

main().catch((err: unknown) => {
  console.error(`[seed] ERRO: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
