/**
 * I1-PR-10 — pré-verificação SEM sessão: os contents de cada estado da folha 5, com os exemplos da PRÓPRIA folha
 * (obra do projeto — "o que a regra NÃO alcança", CLAUDE.md). O `file_url` da partitura é o fabricado do
 * instrumento (`scripts/gates-web/g-faixa-conteudo.ts`), respondido pelo `route()` do roteiro.
 */
export const PDF_URL = 'https://g-faixa.supabase.co/storage/v1/object/public/content-files/g-faixa-partitura-12p.pdf'

const T10 = '2026-09-10T15:00:00Z', T08 = '2026-08-08T15:00:00Z'
const base = {
  user_id: 'fumaca', album: null, bpm: null, capo: null, difficulty: null, genre: null, is_favorite: false, is_public: false,
  key: null, notes: null, tags: null, thumbnail_url: null, time_signature: '4/4', tuning: null, created_at: T10, updated_at: T10,
  file_url: null as string | null, content_data: null as unknown,
}
const CIFRA = '[Régua de 120 colunas — B7/N1: T1-R31, A15]\n\nC7M      Dm7      G7       C7M      A7       Dm7      G7       C7M      Em7      A7       Dm7\nLa la la la la la la la la la la la la la la la la la la la la la la la la la la la la la la la la la la la la\n\n[Verso curto — controle]\nC7M      G7\nLa la la, la la lá'
const TAB = 'e|-------0-----------0-------|-------0-----------0-------|\nB|-----1---1-------1---1-----|-----1---1-------1---1-----|\nG|---0-------0---0-------0---|---2-------2---2-------2---|\nD|---------------------------|---------------------------|\nA|-3-------------------------|---------------------------|\nE|---------------|-----------|-0-------------------------|'

const cifra = { ...base, id: 'f-cifra', title: 'Linha de 120 colunas', artist: 'Teste de régua', content_type: 'Chords' }
const letra = { ...base, id: 'f-letra', title: 'Batch três', artist: null, content_type: 'Lyrics' }
const tab = { ...base, id: 'f-tab', title: 'Trenzinho do caipira', artist: 'Villa-Lobos', content_type: 'Tab' }
const partitura = { ...base, id: 'f-partitura', title: 'Partitura de 12 páginas', artist: 'Compositor anônimo', content_type: 'Sheet' }
/** um `content_data` que lança ao ser lido: a exceção de render do `VIEW-erro-render` */
const explode = { get chords(): string { throw new Error('fumaça: exceção de render') } }

export const FIXTURES: Record<string, Record<string, unknown>> = {
  'VIEW-cifra': { ...cifra, content_data: { chords: CIFRA } },
  'VIEW-letra': { ...letra, content_data: { lyrics: 'Primeira estrofe da música três' } },
  'VIEW-tab': { ...tab, difficulty: 'advanced', created_at: T08, updated_at: T08, content_data: { tablature: TAB } },
  'VIEW-partitura': { ...partitura, file_url: PDF_URL },
  'VIEW-partitura-cheia': { ...partitura, file_url: PDF_URL },
  'VIEW-carregando-pdf': { ...partitura, file_url: PDF_URL },
  'VIEW-erro-pdf': { ...partitura, file_url: PDF_URL },
  'VIEW-vazio-partitura': partitura,
  'VIEW-vazio-letra': { ...letra, content_data: {} },
  'VIEW-vazio-tab': { ...tab, content_data: {} },
  'VIEW-vazio-cifra': { ...cifra, content_data: {} },
  'VIEW-erro-formato': { ...partitura, file_url: 'https://g-faixa.supabase.co/storage/v1/object/public/content-files/objeto-sem-extensao' },
  'VIEW-erro-render': { ...cifra, content_data: explode },
}
