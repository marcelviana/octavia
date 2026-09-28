/**
 * I1-PR-9 (decisão 5 do aval) — os três estados do painel, pelo caminho inteiro da
 * página: `app/dashboard/page.tsx` (SSR) → `DashboardPageClient` → casca + painel,
 * com as funções do serviço (`content-service-server`) mockadas. `DASH-vazio` e
 * `DASH-erro` não se alcançam no navegador (os dados vêm do Supabase no
 * servidor, div. 699); esta é a prova de que o código distingue:
 *   dados  → os números e as linhas;
 *   vazio  → "0" e as frases de vazio, sem linha de aviso;
 *   erro   → "—" nos quatro, NENHUMA frase de vazio, a linha `dash.erro` com *Tentar de novo*.
 * Reprova se o erro voltar a virar vazio (a mutação e a saída: `docs/ux/I1-PR9-anexos/cn/painel-mutacao-cn.txt`).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

const servico = vi.hoisted(() => ({ conteudo: vi.fn(), numeros: vi.fn() }))
vi.mock('@/lib/content-service-server', () => ({
  getUserContentServer: servico.conteudo,
  getUserStatsServer: servico.numeros,
}))
vi.mock('@/lib/require-page-user', () => ({ requirePageUser: vi.fn(async () => ({ uid: 'u1' })) }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Map([['host', 'localhost']]),
}))
const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  usePathname: () => '/dashboard',
}))
vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'u1', email: 'marcel@exemplo.com' },
    profile: { full_name: 'Marcel Viana' },
    signOut: vi.fn(),
    isLoading: false,
    sessao: { estado: 'aberta' },
    tentarSessaoDeNovo: vi.fn(),
  }),
}))

import DashboardPage from '@/app/dashboard/page'

const item = (id: string, title: string, content_type: string, is_favorite: boolean) => ({
  id, title, content_type, is_favorite, created_at: '2026-09-10T12:00:00Z', updated_at: `2026-09-${10 + Number(id)}T12:00:00Z`,
})

async function montar() {
  render(await DashboardPage())
}

const contadores = () => screen.getAllByText(/^(\d+|—)$/).map((n) => n.textContent)

describe('I1-PR-9 — o painel: dados · vazio · erro', () => {
  beforeEach(() => {
    servico.conteudo.mockReset()
    servico.numeros.mockReset()
    refresh.mockReset()
  })

  it('dados: os números e as linhas; nenhuma frase de vazio, nenhuma linha de aviso', async () => {
    servico.conteudo.mockResolvedValue([item('1', 'Batch três', 'Lyrics', false), item('2', 'Garota de Ipanema', 'Chords', true)])
    servico.numeros.mockResolvedValue({ totalContent: 67, totalSetlists: 3, favoriteContent: 3, recentlyViewed: 10 })
    await montar()
    expect(contadores()).toEqual(['67', '3', '3', '10'])
    // a favorita está nas duas listas (recentes e favoritas), as duas abrindo /content/<id>
    expect(screen.getAllByRole('link', { name: /Garota de Ipanema\s*Cifra/ }).map((l) => l.getAttribute('href'))).toEqual(['/content/2', '/content/2'])
    expect(screen.queryByText('nada visto recentemente')).toBeNull()
    expect(screen.queryByText('nenhuma favorita')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('vazio: "0" é dado (o servidor respondeu) e as listas dizem que não há nada', async () => {
    servico.conteudo.mockResolvedValue([])
    servico.numeros.mockResolvedValue({ totalContent: 0, totalSetlists: 0, favoriteContent: 0, recentlyViewed: 0 })
    await montar()
    expect(contadores()).toEqual(['0', '0', '0', '0'])
    expect(screen.getByText('nada visto recentemente')).toBeTruthy()
    expect(screen.getByText('nenhuma favorita')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('erro: "—" nos quatro, nenhuma frase de vazio, UMA linha de aviso com Tentar de novo', async () => {
    servico.conteudo.mockRejectedValue(new Error('Failed to fetch content'))
    servico.numeros.mockRejectedValue(new Error('Failed to fetch stats'))
    await montar()
    expect(contadores()).toEqual(['—', '—', '—', '—'])
    expect(screen.queryByText('nada visto recentemente')).toBeNull()
    expect(screen.queryByText('nenhuma favorita')).toBeNull()
    const linhas = screen.getAllByRole('alert')
    expect(linhas).toHaveLength(1)
    expect(within(linhas[0]).getByText('não foi possível carregar o painel — falha no servidor')).toBeTruthy()
    within(linhas[0]).getByRole('button', { name: /Tentar de novo/ }).click()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('erro só nos números: "—" nos contadores e as listas com os dados', async () => {
    servico.conteudo.mockResolvedValue([item('1', 'Batch três', 'Lyrics', false)])
    servico.numeros.mockRejectedValue(new Error('Failed to fetch stats'))
    await montar()
    expect(contadores()).toEqual(['—', '—', '—', '—'])
    expect(screen.getByRole('link', { name: /Batch três\s*Letra/ })).toBeTruthy()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })
})
