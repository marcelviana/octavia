/**
 * CN do que `/setlists` ESCREVE (I1-PR13) — "nenhuma rota, contrato ou validação muda; nenhuma escrita nova" (I1-D9; o
 * prompt, §0 e §3).
 *
 * Monta a tela (`components/setlists-page-client.tsx`) com o servidor falso, que GUARDA cada escrita (método · caminho
 * · corpo), e percorre um roteiro por ação — criar, editar, adicionar duas músicas, remover uma, apagar — com a mesma
 * INTENÇÃO antes e depois do redesenho (só os seletores mudam, porque os rótulos mudam). Compara, byte a byte, com
 * `fixtures/setlists-escritas-antes.json`, gravado no commit 1 sobre o código da `main` (`CN_GRAVAR=1`).
 *
 * O roteiro passa LONGE dos três defeitos que esta PR conserta (I1-D9, N2 §10.3.5/.6 — `setlists-defeitos.test.tsx`):
 * remove uma linha que veio do servidor (id verdadeiro, sem bis) e apaga uma setlist que existe. O que os defeitos
 * mudam é o ALVO de dois `DELETE` (o id da linha), nunca um corpo.
 */
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/setlists',
  useSearchParams: () => new URLSearchParams(),
}))
const usuario = { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' }
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'cn-user', email: 'cn@exemplo.com', getIdToken: async () => 'cn-token' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))

import SetlistsPageClient from '@/components/setlists-page-client'
import { SETLISTS_DA_FOLHA, servir } from '@/components/setlists/__tests__/servidor-falso'

const ANTES = path.resolve(__dirname, 'fixtures/setlists-escritas-antes.json')

// ---- os seletores do roteiro (commit 1: os da tela de antes, em inglês; o commit 2 troca SÓ isto) -------------------
const botao = (nome: string | RegExp, onde: HTMLElement = document.body) => within(onde).findByRole('button', { name: nome })
const escrever = async (el: Promise<HTMLElement>, v: string) => fireEvent.change(await el, { target: { value: v } })
const dialogo = () => screen.findByRole('dialog')
const A = {
  novaSetlist: async () => fireEvent.click(await botao('Create Setlist')),
  /** o *Editar* / *Apagar* do cartão, pela posição da setlist na lista */
  editarCartao: async (i: number) => fireEvent.click((await screen.findAllByRole('button', { name: 'Edit setlist' }))[i] as HTMLElement),
  apagarCartao: async (i: number) => fireEvent.click((await screen.findAllByRole('button', { name: 'Delete setlist' }))[i] as HTMLElement),
  campo: async (qual: 'nome' | 'descricao' | 'data' | 'local' | 'notas', v: string) =>
    escrever(within(await dialogo()).findByLabelText({ nome: /^Setlist Name/, descricao: 'Description', data: 'Performance Date', local: 'Venue', notas: 'Notes' }[qual]), v),
  criar: async () => fireEvent.click(await botao('Create Setlist', await dialogo())),
  salvar: async () => fireEvent.click(await botao('Update Setlist', await dialogo())),
  confirmarApagar: async () => fireEvent.click(await botao('Delete', await dialogo())),
  abrir: (nome: string) => fireEvent.click(screen.getAllByText(nome)[0] as HTMLElement),
  adicionarMusicas: async () => fireEvent.click((await screen.findAllByRole('button', { name: 'Add Songs' }))[0] as HTMLElement),
  marcar: async (titulo: string) => fireEvent.click(await within(await dialogo()).findByText(titulo)),
  adicionar: async (n: number) => fireEvent.click(await botao(`Add ${n} Songs`, await dialogo())),
  remover: async (i: number) => fireEvent.click((await screen.findAllByRole('button', { name: 'Remove song' }))[i] as HTMLElement),
}

interface Caso { nome: string; roteiro: () => Promise<void>; escritas: number }
const CASOS: Caso[] = [
  {
    nome: 'criar (os cinco campos)',
    escritas: 1,
    roteiro: async () => {
      await A.novaSetlist()
      await A.campo('nome', 'Ensaio de sexta')
      await A.campo('descricao', 'uma linha sobre esta setlist')
      await A.campo('data', '2026-10-03')
      await A.campo('local', 'Blue Note')
      await A.campo('notas', 'outras anotações')
      await A.criar()
    },
  },
  {
    nome: 'criar (só o nome)',
    escritas: 1,
    roteiro: async () => {
      await A.novaSetlist()
      await A.campo('nome', 'Ensaio de sexta')
      await A.criar()
    },
  },
  {
    nome: 'editar (o nome muda, a descrição sai)',
    escritas: 1,
    roteiro: async () => {
      await A.editarCartao(1) // Show padrão
      await A.campo('nome', 'Show de sábado')
      await A.campo('descricao', '')
      await A.campo('local', 'Blue Note')
      await A.salvar()
    },
  },
  {
    nome: 'adicionar duas músicas',
    escritas: 2,
    roteiro: async () => {
      A.abrir('Show padrão')
      await A.adicionarMusicas()
      await A.marcar('Asa branca')
      await A.marcar('Batch dois')
      await A.adicionar(2)
    },
  },
  {
    nome: 'remover uma música (a 2ª linha)',
    escritas: 1,
    roteiro: async () => {
      A.abrir('Show padrão')
      await A.remover(1)
    },
  },
  {
    nome: 'apagar a setlist',
    escritas: 1,
    roteiro: async () => {
      await A.apagarCartao(2) // Solo
      await A.confirmarApagar()
    },
  },
]

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('I1-PR13 — o que /setlists escreve, byte a byte contra o da main', () => {
  const gravados: Record<string, string[]> = {}
  for (const c of CASOS) {
    it(c.nome, async () => {
      const { escritas } = servir({ listas: [SETLISTS_DA_FOLHA()] })
      render(<SetlistsPageClient />)
      // o corpo vem por `next/dynamic`: espera a lista com prazo folgado (div. 844 — o 1º caso paga a carga do pedaço)
      await screen.findAllByText('Show padrão', {}, { timeout: 30_000 })
      await c.roteiro()
      await waitFor(() => expect(escritas).toHaveLength(c.escritas))
      gravados[c.nome] = [...escritas]
      if (process.env.CN_GRAVAR) return
      const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8')) as Record<string, string[]>
      expect(escritas).toEqual(antes[c.nome])
    }, 60_000)
  }
  it.runIf(!!process.env.CN_GRAVAR)('grava o antes (CN_GRAVAR=1, só no commit 1, sobre o código da main)', () => {
    fs.mkdirSync(path.dirname(ANTES), { recursive: true })
    fs.writeFileSync(ANTES, JSON.stringify(gravados, null, 1) + '\n')
  })
})
