/**
 * CN do corpo do PUT do editor (I1-PR11) — "o que o editor grava não muda" (I1-D9; a poluição do `content_data` é
 * Bloco D e fica como está).
 *
 * Monta a ROTA do editor (`app/content/[id]/edit/page.tsx`) para um content de cada tipo, com o `GET
 * /api/content/<id>` e o `PUT /api/content` respondidos por um `fetch` falso que GUARDA o corpo do `PUT`; faz uma
 * edição roteirizada por tipo (a mesma intenção antes e depois do redesenho — só os seletores mudam, porque os
 * rótulos mudam) e clica em salvar. O corpo, byte a byte, tem de ser o de `fixtures/editor-put-antes.json`, gravado
 * no commit 1 sobre o código da `main` (`CN_GRAVAR=1`).
 *
 * `Date` é fixado (o `updated_at` do corpo e os `id` de seção/compasso vêm de `new Date()`/`Date.now()`).
 * Texto dos fixtures: do projeto (os exemplos das folhas 5 e 6) — a regra "anexo não carrega texto de música" não o
 * alcança.
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const params = { id: '' }
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => params,
  usePathname: () => `/content/${params.id}/edit`,
  useSearchParams: () => new URLSearchParams(),
}))
const usuario = { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' }
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'cn-user', email: 'cn@exemplo.com' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))
vi.mock('@/components/pdf-viewer', () => ({ default: ({ url }: { url: string }) => <div data-testid="pdf-viewer" data-url={url} /> }))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import EditContentPage from '@/app/content/[id]/edit/page'

const ANTES = path.resolve(__dirname, 'fixtures/editor-put-antes.json')
const T = '2026-09-10T15:00:00.000Z'
const base = {
  user_id: 'cn-user', artist: 'Teste de régua', album: null, bpm: null, capo: null, difficulty: null, genre: null,
  is_favorite: false, is_public: false, key: null, notes: null, tags: null, thumbnail_url: null, time_signature: '4/4',
  tuning: null, created_at: T, updated_at: T, file_url: null as string | null,
}
const ID = (n: number) => `00000000-0000-4000-8000-00000000000${n}`

/** O roteiro de cada caso: a edição feita na tela. `rotulo` → o controle; o antes (código da `main`) e o depois. */
export interface Caso { nome: string; content: Record<string, unknown>; editar: () => Promise<void> }

// I1-PR-11, commit 2: os seletores passam aos `data-testid` do editor novo (os rótulos mudaram); a intenção é a mesma
const campo = (testid: string) => screen.findByTestId(testid)
const mudar = async (el: Promise<HTMLElement>, valor: (v: string) => string) => {
  const e = (await el) as HTMLInputElement
  fireEvent.change(e, { target: { value: valor(e.value) } })
}

const CASOS: Caso[] = [
  {
    nome: 'cifra em texto (a forma de hoje da cifra)',
    content: { ...base, id: ID(1), title: 'Linha de 120 colunas', content_type: 'Chords',
      content_data: { chords: '[Verso curto — controle]\nC7M      G7\nLa la la, la la lá' } },
    editar: async () => {
      await mudar(campo('campo-secao-letra'), (v) => `${v}\nLa la lá (CN)`)
      await mudar(campo('campo-album'), () => 'Álbum do CN')
    },
  },
  {
    nome: 'cifra em seções',
    content: { ...base, id: ID(2), title: 'Linha de 120 colunas', content_type: 'Chords', key: 'C', bpm: 96,
      content_data: { chords: 'C7M G7', sections: [{ id: 1, name: 'Verso curto — controle', chords: 'C7M G7', lyrics: 'La la la, la la lá' }] } },
    editar: async () => { await mudar(campo('campo-secao-progressao'), (v) => `${v} Dm7`) },
  },
  {
    nome: 'letra',
    content: { ...base, id: ID(3), title: 'Batch três', artist: null, content_type: 'Lyrics',
      content_data: { lyrics: 'Primeira estrofe da música três' } },
    editar: async () => {
      const t = (await screen.findAllByRole('textbox')).find((e) => (e as HTMLTextAreaElement).value.startsWith('Primeira estrofe')) as HTMLTextAreaElement
      fireEvent.change(t, { target: { value: `${t.value}\n\n[Refrão]` } })
    },
  },
  {
    nome: 'tab (tablatura em texto, sem compassos)',
    content: { ...base, id: ID(4), title: 'Trenzinho do caipira', artist: 'Villa-Lobos', content_type: 'Tab', difficulty: 'Advanced',
      content_data: { tablature: 'e|-------0-----------0-------|\nB|-----1---1-------1---1-----|' } },
    editar: async () => {
      const e = (await screen.findAllByRole('textbox')).find((x) => (x as HTMLInputElement).value.startsWith('E|--0--3')) as HTMLInputElement
      fireEvent.change(e, { target: { value: 'E|--0--3--0--2--0--5|' } })
    },
  },
  {
    nome: 'partitura (PDF)',
    content: { ...base, id: ID(5), title: 'Partitura de 12 páginas', artist: 'Compositor anônimo', content_type: 'Sheet',
      file_url: 'https://cn.supabase.co/storage/v1/object/public/content-files/cn-partitura.pdf', content_data: null },
    editar: async () => {
      // antes: abrir o acordeão *Organization*; o *Detalhes* novo não tem acordeão (decisão 10)
      await mudar(campo('campo-notas'), () => 'nota do CN')
    },
  },
]

/** O botão de salvar — o nome muda no redesenho (antes *Save Changes*); o clique é o mesmo. */
const salvar = async () => fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))

let corpos: string[] = []
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-29T12:00:00.000Z'))
  corpos = []
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

const servir = (content: Record<string, unknown>) =>
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'PUT') { corpos.push(String(init?.body)); return new Response(String(init?.body), { status: 200 }) }
    if (String(url).startsWith(`/api/content/${content.id}`)) return new Response(JSON.stringify(content), { status: 200 })
    return new Response('{}', { status: 404 })
  }))

describe('I1-PR11 — o corpo do PUT do editor, byte a byte contra o da main', () => {
  const gravados: Record<string, string> = {}
  for (const c of CASOS) {
    it(c.nome, async () => {
      params.id = String(c.content.id)
      servir(c.content)
      render(<EditContentPage />)
      await c.editar()
      await salvar()
      await waitFor(() => expect(corpos).toHaveLength(1))
      gravados[c.nome] = corpos[0]
      if (process.env.CN_GRAVAR) return
      const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8')) as Record<string, string>
      expect(corpos[0]).toBe(antes[c.nome])
    }, 20_000)
  }
  it.runIf(!!process.env.CN_GRAVAR)('grava o antes (CN_GRAVAR=1, só no commit 1, sobre o código da main)', () => {
    fs.mkdirSync(path.dirname(ANTES), { recursive: true })
    fs.writeFileSync(ANTES, JSON.stringify(gravados, null, 1) + '\n')
  })
})
