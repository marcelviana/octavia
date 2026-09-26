/**
 * CN do visualizador (I1-PR3, I1-D36 / div. 506) — "todo tipo de content abre
 * no visualizador depois do corte".
 *
 * Monta o `content-page-client` (a tela de `/content/[id]`) para um content de
 * cada tipo — Lyrics, Chords, Tab, Sheet com PDF, Sheet com imagem — e prova o
 * que chega à tela: o texto de cada tipo, e para Sheet o `url` que chega ao
 * `PdfViewer` ou ao `<img>`.
 *
 * No commit 1 o `offline-cache` rodava em dois modos (com-cache: `blob:` +
 * `mimeType`; sem-cache: `null`) — saída em I1-PR3-anexos/cn-visualizador-hoje.txt.
 * No commit 2 o módulo deixou de existir (I1-D18): fica o `sem-cache`, que é
 * o único caminho. O tipo do arquivo sai da extensão de `content.file_url`
 * (I1-D36, aval 5). Controle: `Sheet PDF sem extensão` → "Failed to load file".
 *
 * `fetch` é substituído por um que registra e recusa: o visualizador não
 * pode depender de rede para decidir o tipo (o `/api/proxy` morre com o PWA).
 * Texto dos fixtures: do projeto (regra "anexo não carrega texto de música").
 */
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/content/cn',
  useSearchParams: () => new URLSearchParams(),
}))

// react-pdf não roda em jsdom; o stub expõe o url que chegou ao viewer
vi.mock('@/components/pdf-viewer', () => ({
  default: ({ url }: { url: string }) => <div data-testid="pdf-viewer" data-url={url} />,
}))

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import ContentPageClient from '@/components/content-page-client'

const STORAGE = 'https://cn.supabase.co/storage/v1/object/public/content-files'

const base = {
  user_id: 'cn-user',
  artist: null, album: null, bpm: null, capo: null, created_at: null, difficulty: null,
  genre: null, is_favorite: false, is_public: false, key: null, notes: null, tags: null,
  thumbnail_url: null, time_signature: null, tuning: null, updated_at: null,
}

const CASOS = [
  {
    nome: 'Lyrics',
    content: { ...base, id: 'cn-lyrics', title: 'CN letra', content_type: 'Lyrics', file_url: null,
      content_data: { lyrics: 'Quando a noite chega (fixture do CN)' } },
    mime: null,
    prova: () => expect(screen.getByText(/Quando a noite chega \(fixture do CN\)/)).toBeInTheDocument(),
  },
  {
    nome: 'Chords',
    content: { ...base, id: 'cn-chords', title: 'CN cifra', content_type: 'Chords', file_url: null,
      content_data: { sections: [{ id: 's1', name: 'Intro', chords: '[Intro] C Am F G', lyrics: '' }] } },
    mime: null,
    prova: () => expect(screen.getByText(/\[Intro\] C Am F G/)).toBeInTheDocument(),
  },
  {
    nome: 'Tab',
    content: { ...base, id: 'cn-tab', title: 'CN tab', content_type: 'Tab', file_url: null,
      content_data: { tablature: 'e|---0---|\nB|-1---1-|' } },
    mime: null,
    prova: () => expect(screen.getByText(/e\|---0---\|/)).toBeInTheDocument(),
  },
  {
    nome: 'Sheet PDF',
    content: { ...base, id: 'cn-pdf', title: 'CN partitura', content_type: 'Sheet',
      file_url: `${STORAGE}/1786218427769-ux-audit-partitura-1p.pdf`, content_data: null },
    mime: 'application/pdf',
    prova: () => expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument(),
  },
  {
    nome: 'Sheet imagem',
    content: { ...base, id: 'cn-img', title: 'CN partitura imagem', content_type: 'Sheet',
      file_url: `${STORAGE}/1750546056712-cn-imagem.jpg`, content_data: null },
    mime: 'image/jpeg',
    prova: () => expect(screen.getByAltText('Sheet music')).toBeInTheDocument(),
  },
] as const

// Controle: URL sem extensão — sem o cache (que dava o mimeType), cai na frase de falha
const CONTROLE = {
  ...base, id: 'cn-pdf-sem-ext', title: 'CN controle', content_type: 'Sheet',
  file_url: `${STORAGE}/objeto-sem-extensao`, content_data: null,
}

const chamadasFetch: string[] = []

beforeEach(() => {
  chamadasFetch.length = 0
  vi.stubGlobal('fetch', vi.fn(async (u: unknown) => {
    chamadasFetch.push(String(u))
    throw new Error('CN: o visualizador não pode depender de rede')
  }))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function montar(content: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(<ContentPageClient content={content as any} />)
}

describe('I1-D36 — visualizador, sem-cache', () => {
  for (const caso of CASOS) {
    it(`${caso.nome} abre`, async () => {
      montar(caso.content)
      await waitFor(() => caso.prova())
      if (caso.mime) {
        const alvo = screen.queryByTestId('pdf-viewer') ?? screen.queryByAltText('Sheet music')
        const url = alvo?.getAttribute('data-url') ?? alvo?.getAttribute('src')
        expect(url).toBe(caso.content.file_url)
      }
      expect(chamadasFetch.filter(u => u.includes('/api/proxy'))).toEqual([])
    })
  }

  it('controle: Sheet PDF sem extensão na URL', async () => {
    montar(CONTROLE)
    await waitFor(() => expect(screen.getByText(/Failed to load file/)).toBeInTheDocument())
  })
})
