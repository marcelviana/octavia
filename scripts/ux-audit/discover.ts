/**
 * Discovery da Fase B2: resolve os IDs de conteúdo/setlist da conta de
 * audit (pós-seed) que o harvest-populated.spec.ts precisa para as células
 * de rota dinâmica. Somente leitura: GET /api/content e GET /api/setlists.
 *
 * Saída: tests/ux-audit/.auth/discovery.json (fora do docs/, é insumo do
 * harvest e não artefato do assessment).
 *
 * Uso: pnpm tsx scripts/ux-audit/discover.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { apiFetch, sleep } from './auth'

const PREFIX = '[UX-AUDIT]'
const OUTPUT_PATH = 'tests/ux-audit/.auth/discovery.json'

interface ContentRow {
  id: string
  title: string
  artist: string | null
  content_type: string
  key: string | null
  bpm: number | null
  file_url: string | null
}

interface SetlistRow {
  id: string
  name: string
  venue?: string | null
  performance_date?: string | null
  notes?: string | null
  setlist_songs: Array<{ id: string; position: number; content_id: string }>
}

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
    await sleep(300)
  }
  return all
}

function pick(rows: ContentRow[], predicate: (r: ContentRow) => boolean, label: string): ContentRow {
  const found = rows.find(predicate)
  if (!found) throw new Error(`Discovery não encontrou: ${label}`)
  return found
}

async function main(): Promise<void> {
  const content = (await fetchAllContent()).filter((r) => r.title.startsWith(PREFIX))
  console.log(`[discover] ${content.length} conteúdos ${PREFIX} na conta`)

  const setlistsRes = await apiFetch('/api/setlists')
  if (!setlistsRes.ok) throw new Error(`GET /api/setlists: HTTP ${setlistsRes.status}`)
  const setlists = ((await setlistsRes.json()) as SetlistRow[]).filter((s) =>
    s.name.startsWith('UX-AUDIT')
  )
  console.log(`[discover] ${setlists.length} setlists UX-AUDIT na conta`)

  const byId = new Map(content.map((r) => [r.id, r]))

  const pdf1 = pick(content, (r) => r.title.includes('Partitura de 1 página'), 'PDF 1 página')
  const pdf12 = pick(content, (r) => r.title.includes('Partitura de 12 páginas'), 'PDF 12 páginas')
  const chords = pick(
    content,
    (r) => r.content_type === 'Chords' && r.title.includes('Garota de Ipanema'),
    'cifra (Garota de Ipanema)'
  )
  const lyrics = pick(
    content,
    (r) => r.content_type === 'Lyrics' && r.title.includes('Construção'),
    'letra (Construção)'
  )
  const tab = pick(
    content,
    (r) => r.content_type === 'Tab' && r.title.includes('Ponta de Areia'),
    'tab (Ponta de Areia)'
  )
  const longTitle = pick(
    content,
    (r) => r.title.includes('Canção interminável do sertão profundo'),
    'título longo (186 chars)'
  )
  const aguas = content.filter((r) => r.title === `${PREFIX} Águas de Março`)
  if (aguas.length < 2) {
    throw new Error(`Esperava 2 duplicados de Águas de Março, achei ${aguas.length}`)
  }

  function findSetlist(suffix: string): SetlistRow {
    const found = setlists.find((s) => s.name === `UX-AUDIT ${suffix}`)
    if (!found) throw new Error(`Setlist não encontrada: UX-AUDIT ${suffix}`)
    return { ...found, setlist_songs: [...found.setlist_songs].sort((a, b) => a.position - b.position) }
  }

  const solo = findSetlist('Solo')
  const show = findSetlist('Show padrão')
  const estresse = findSetlist('Estresse')

  // Índices (0-based, para startingSongIndex) de exemplares DENTRO das setlists
  function indexOf(setlist: SetlistRow, predicate: (r: ContentRow) => boolean): number {
    return setlist.setlist_songs.findIndex((s) => {
      const row = byId.get(s.content_id)
      return row ? predicate(row) : false
    })
  }

  const indices = {
    show_first_song: show.setlist_songs[0]
      ? { index: 0, title: byId.get(show.setlist_songs[0].content_id)?.title ?? null }
      : null,
    show_chords_index: indexOf(show, (r) => r.content_type === 'Chords'),
    estresse_chords_index: indexOf(estresse, (r) => r.content_type === 'Chords'),
    estresse_pdf12_index: indexOf(estresse, (r) => r.id === pdf12.id),
    estresse_last_index: estresse.setlist_songs.length - 1,
  }

  const summary = {
    generated_by: 'scripts/ux-audit/discover.ts',
    counts: { content: content.length, setlists: setlists.length },
    content: {
      pdf1: { id: pdf1.id, title: pdf1.title },
      pdf12: { id: pdf12.id, title: pdf12.title },
      chords: { id: chords.id, title: chords.title, bpm: chords.bpm },
      lyrics: { id: lyrics.id, title: lyrics.title },
      tab: { id: tab.id, title: tab.title },
      longTitle: { id: longTitle.id, title: longTitle.title, length: longTitle.title.length },
      duplicates: aguas.map((r) => ({ id: r.id, title: r.title, key: r.key, bpm: r.bpm })),
    },
    setlists: {
      solo: { id: solo.id, name: solo.name, songCount: solo.setlist_songs.length },
      show: {
        id: show.id,
        name: show.name,
        songCount: show.setlist_songs.length,
        venue: show.venue ?? null,
        performance_date: show.performance_date ?? null,
        notes: show.notes ?? null,
      },
      estresse: { id: estresse.id, name: estresse.name, songCount: estresse.setlist_songs.length },
    },
    indices,
    estresse_songs: estresse.setlist_songs.map((s) => ({
      position: s.position,
      content_id: s.content_id,
      title: byId.get(s.content_id)?.title ?? null,
      content_type: byId.get(s.content_id)?.content_type ?? null,
    })),
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2) + '\n')
  console.log(`[discover] escrito em ${OUTPUT_PATH}`)
  console.log(JSON.stringify({ counts: summary.counts, indices }, null, 2))
}

main().catch((err: unknown) => {
  console.error(`[discover] ERRO: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
