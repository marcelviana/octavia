/**
 * I1-PR-13 — os três defeitos de tela das setlists (`N2-ENCERRAMENTO.md` §10.3, itens 5 e 6; I1-D9: entram como
 * requisito desta PR). Um teste de tela por defeito, com o servidor falso; **os três reprovam sobre o código da
 * `main`** (é o CN da PR) e passam no commit 2.
 *
 *  (a) remover por `content.id` — com a mesma música duas vezes (bis), o `find` escolhia a 1ª ocorrência para o
 *      `DELETE` e o `filter` tirava TODAS da tela: a remoção é pelo id da LINHA da setlist;
 *  (b) id local falso — a música adicionada ganhava o id `${setlist.id}-${content.id}`, que a rota não conhece: o id
 *      é o que o `POST …/songs` devolve;
 *  (c) apagar a setlist já apagada — o 404 deixava o diálogo aberto e mudo (H-I1-5): o diálogo fecha, a lista é
 *      relida e a tela diz *esta setlist já foi apagada*.
 *
 * Os seletores aceitam o rótulo de antes (inglês) e o de agora (a folha `8-setlists`): a reprovação é do
 * COMPORTAMENTO, não do texto.
 */
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

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
import { CONTEUDOS, NAO_ENCONTRADA, SETLISTS_DA_FOLHA, servir, setlist } from './servidor-falso'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const PRAZO = { timeout: 30_000 } // o corpo vem por `next/dynamic`: o 1º caso paga a carga do pedaço (div. 844)

/** Monta `/setlists` e espera a lista. */
async function montar() {
  render(<SetlistsPageClient />)
  await screen.findAllByText('Show padrão', {}, PRAZO)
}
/** Abre a setlist pelo nome (o cartão da lista). */
const abrir = (nome: string) => fireEvent.click(screen.getAllByText(nome)[0] as HTMLElement)
/** Os *remover* das linhas de música da setlist aberta, na ordem das linhas. */
const removedores = () => screen.findAllByRole('button', { name: /^(Remove song|Remover .+ da setlist)$/ })
const deletes = (escritas: string[]) => escritas.filter((e) => e.startsWith('DELETE '))

describe('I1-PR13 — os três defeitos de tela das setlists (N2 §10.3.5/.6)', () => {
  it('(a) remover o bis: o DELETE leva o id da LINHA clicada e só ela sai da tela', async () => {
    const comBis = [setlist('set-show', 'Show padrão', [['linha-1', CONTEUDOS.garota], ['linha-2', CONTEUDOS.construcao], ['linha-3', CONTEUDOS.garota]])]
    const { escritas } = servir({ listas: [comBis] })
    await montar()
    abrir('Show padrão')
    expect(await screen.findAllByText('Garota de Ipanema')).toHaveLength(2)

    fireEvent.click((await removedores())[2] as HTMLElement) // a 3ª linha: o bis

    await waitFor(() => expect(deletes(escritas)).toHaveLength(1))
    expect(deletes(escritas)).toEqual(['DELETE /api/setlists/songs/linha-3'])
    await waitFor(() => expect(screen.getAllByText('Garota de Ipanema')).toHaveLength(1))
    expect(screen.getAllByText('Construção')).toHaveLength(1)
  }, 60_000)

  it('(b) a música adicionada fica com o id que a rota devolveu: removê-la chama esse id', async () => {
    const { escritas } = servir({ listas: [SETLISTS_DA_FOLHA()] })
    await montar()
    abrir('Solo')
    fireEvent.click((await screen.findAllByRole('button', { name: /^(Add Songs|Adicionar músicas a Solo)$/ }))[0] as HTMLElement)
    const picker = await screen.findByRole('dialog')
    fireEvent.click(await within(picker).findByText('Asa branca'))
    fireEvent.click(await within(picker).findByRole('button', { name: /^(Add 1 Song|Adicionar 1\b.*)$/ }))
    await waitFor(() => expect(escritas.filter((e) => e.startsWith('POST /api/setlists/set-solo/songs'))).toHaveLength(1))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText('Asa branca')).toBeInTheDocument()

    fireEvent.click((await removedores())[1] as HTMLElement) // a 2ª linha: a que acabou de entrar

    await waitFor(() => expect(deletes(escritas)).toHaveLength(1))
    expect(deletes(escritas)).toEqual(['DELETE /api/setlists/songs/linha-do-servidor-1'])
  }, 60_000)

  it('(c) apagar a setlist já apagada (404): o diálogo fecha, a lista é relida e a tela diz por quê', async () => {
    const todas = SETLISTS_DA_FOLHA()
    const semAShow = todas.filter((s) => s.id !== 'set-show')
    const { escritas, leituras } = servir({ listas: [todas, semAShow], respostas: { apagar: [NAO_ENCONTRADA] } })
    await montar()

    // o *Apagar* do cartão de "Show padrão" (o 2º da lista)
    fireEvent.click((await screen.findAllByRole('button', { name: /^(Delete setlist|Apagar a setlist .+)$/ }))[1] as HTMLElement)
    const dialogo = await screen.findByRole('dialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: /^(Delete|Apagar)$/ }))
    await waitFor(() => expect(deletes(escritas)).toEqual(['DELETE /api/setlists/set-show']))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText('esta setlist já foi apagada')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Show padrão')).toBeNull())
    expect(leituras.setlists).toBe(2)
  }, 60_000)
})
