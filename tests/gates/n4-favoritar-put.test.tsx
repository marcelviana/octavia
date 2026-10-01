/**
 * Gate do corpo do favoritar (N4-PR1; N4-D22, div. 966) — o corpo que a LISTA do web envia ao favoritar e ao
 * desfavoritar, byte a byte, contra `packages/core/fixtures/favoritar-put.json`. É **o** corpo que o nativo terá de
 * enviar na PR-4 (N4-D45), contra esta mesma fixture.
 *
 * Molde: `tests/gates/i1-editor-put.test.tsx`. Monta a biblioteca real (`components/library/RefactoredLibrary.tsx`
 * → `LinhaDaBiblioteca` → `useContentActions.toggleFavoriteItem` → `content-service.toggleFavorite` →
 * `updateContent` → `fetch('/api/content', PUT)`), com um `fetch` falso que GUARDA o corpo do `PUT`; clica em
 * *Favoritar* numa linha não favorita e em *Favorita* numa favorita. A fixture foi gravada sobre o código da `main`
 * (`CN_GRAVAR=1`, commit 2 da N4-PR1).
 *
 * E o ESQUEMA: o corpo da fixture passa no `contentSchemas.update` (o schema do `PUT /api/content`, conferido no
 * texto da rota) e um corpo com chave desconhecida não passa (`.strict()`, N4-PRECHECK A5).
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/library',
  useSearchParams: () => new URLSearchParams(),
}))
const usuario = { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' }
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ isFirebaseConfigured: true, auth: { currentUser: { uid: 'cn-user', email: 'cn@exemplo.com', getIdToken: async () => 'cn-token' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))

import RefactoredLibrary from '@/components/library/RefactoredLibrary'
import { contentSchemas } from '@/lib/api-schemas'
import { clearContentCache } from '@/lib/content-service'
import type { ContentItem } from '@/types/library'

const FIXTURE = path.resolve(__dirname, '../../packages/core/fixtures/favoritar-put.json')
const ID = '00000000-0000-4000-8000-0000000000f1'
const T = '2026-09-10T15:00:00.000Z'
const linha = (is_favorite: boolean) => ({
  id: ID, user_id: 'cn-user', title: 'Favorita do gate', artist: null, album: null, content_type: 'Lyrics',
  content_data: { lyrics: 'Texto de teste do gate do favoritar' }, file_url: null, bpm: null, capo: null, difficulty: null,
  genre: null, is_favorite, is_public: false, key: null, notes: null, tags: null, thumbnail_url: null, time_signature: null,
  tuning: null, created_at: T, updated_at: T,
}) as unknown as ContentItem

let corpos: { url: string; metodo: string; corpo: string }[] = []
let recargas = 0
// o servidor falso: o PUT grava o favorito (e o corpo, para o gate); o GET devolve a linha COMO ESTÁ — a recarga
// depois do favoritar (`onReload`) mostra o novo estado, como no servidor real
const servir = (item: ContentItem) => {
  let atual = item
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET'
    if (metodo === 'PUT') {
      corpos.push({ url: String(url), metodo, corpo: String(init?.body) })
      atual = { ...atual, ...JSON.parse(String(init?.body)) }
      return new Response(JSON.stringify(atual), { status: 200 })
    }
    if (corpos.length) recargas++
    return new Response(JSON.stringify({ data: [atual], total: 1, page: 1, pageSize: 20, hasMore: false, totalPages: 1 }), { status: 200 })
  }))
}

// o cache de módulo do `content-service` sobrevive entre os testes: limpo nos dois lados de cada um
beforeEach(() => { clearContentCache(); corpos = []; recargas = 0 })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); clearContentCache() })

const CASOS = [
  { nome: 'favoritar', antes: false, rotulo: 'Favoritar', nomeAcessivel: 'Favoritar “Favorita do gate”', nomeDepois: 'Tirar “Favorita do gate” das favoritas' },
  { nome: 'desfavoritar', antes: true, rotulo: 'Favorita', nomeAcessivel: 'Tirar “Favorita do gate” das favoritas', nomeDepois: 'Favoritar “Favorita do gate”' },
] as const

describe('N4-PR1 — o corpo do PUT do favoritar da lista, byte a byte', () => {
  const gravados: Record<string, string> = {}
  for (const c of CASOS) {
    it(`${c.nome} (a linha com is_favorite=${c.antes})`, async () => {
      const item = linha(c.antes)
      servir(item)
      render(<RefactoredLibrary onSelectContent={vi.fn()} initialContent={[item]} initialTotal={1} initialPage={1} initialPageSize={20} />)
      // o botão da LINHA, pelo nome acessível (frases-lista.ts `lib.favoritar.nome` / `lib.favorita.nome`)
      const botao = await screen.findByRole('button', { name: c.nomeAcessivel })
      expect(botao.textContent).toBe(c.rotulo)
      expect(botao.getAttribute('aria-pressed')).toBe(String(c.antes))
      fireEvent.click(botao)
      await waitFor(() => expect(corpos).toHaveLength(1))
      // o fim do ciclo do clique: a recarga terminou e a linha mostra o estado novo (nada fica em voo para o próximo teste)
      await waitFor(() => expect(recargas).toBeGreaterThan(0))
      await screen.findByRole('button', { name: c.nomeDepois })
      expect(corpos).toHaveLength(1)
      expect(corpos[0].url).toBe('/api/content')
      expect(corpos[0].metodo).toBe('PUT')
      gravados[c.nome] = corpos[0].corpo
      if (process.env.CN_GRAVAR) return
      const fx = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as Record<string, string>
      console.log(`favoritar-put — ${c.nome}: enviado ${corpos[0].corpo.length} B · fixture ${fx[c.nome]?.length ?? 0} B`)
      expect(corpos[0].corpo).toBe(fx[c.nome])
    })
  }
  it.runIf(!!process.env.CN_GRAVAR)('grava a fixture (CN_GRAVAR=1, só no commit 2, sobre o código da main)', () => {
    const fx = {
      _leia: 'N4-PR1 — o corpo EXATO que a lista do web envia ao PUT /api/content ao favoritar e ao desfavoritar (gravado por tests/gates/n4-favoritar-put.test.tsx com CN_GRAVAR=1 sobre o código da main). O nativo envia este mesmo corpo, byte a byte, na PR-4 (N4-D22, N4-D45). `id` é o uuid fabricado com que os dois lados montam o corpo.',
      id: ID,
      ...gravados,
    }
    fs.writeFileSync(FIXTURE, JSON.stringify(fx, null, 1) + '\n')
  })
})

describe('N4-PR1 — o corpo da fixture contra o schema do PUT /api/content', () => {
  it('a rota valida o corpo com contentSchemas.update', () => {
    const rota = fs.readFileSync(path.resolve(__dirname, '../../app/api/content/route.ts'), 'utf8')
    expect(rota).toContain('contentSchemas.update.safeParse(body)')
  })
  for (const nome of ['favoritar', 'desfavoritar'] as const) {
    it(`${nome}: o corpo passa; com uma chave desconhecida, não passa (.strict())`, () => {
      const fx = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')) as Record<string, string>
      const corpo = JSON.parse(fx[nome]) as Record<string, unknown>
      expect(contentSchemas.update.safeParse(corpo).success).toBe(true)
      const r = contentSchemas.update.safeParse({ ...corpo, chave_desconhecida: true })
      expect(r.success).toBe(false)
      expect(r.success ? [] : r.error.issues.map((i) => i.code)).toContain('unrecognized_keys')
    })
  }
})
