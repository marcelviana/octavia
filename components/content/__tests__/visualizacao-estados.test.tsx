/**
 * I1-PR-10 — os estados da visualização que o aceite com sessão não alcança (decisão 1 do aval: a rota é SSR,
 * div. 732): os quatro vazios, `VIEW-erro-formato` (sem *Tentar de novo*, I1-E17) e `VIEW-erro-render` (a casca,
 * o cabeçalho e os detalhes de pé); o motivo do erro do PDF pela espécie (I1-E15, os `name` medidos em
 * `docs/ux/I1-PR10-anexos/cn/pdfjs-erros-navegador.txt`); a falha do arquivo na linha acima do painel e a da
 * SESSÃO vencendo (decisão 14). Prova de estrutura; a geometria é da pré-verificação sem sessão.
 * Textos: do projeto (exemplos da folha 5).
 */
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

const sessao = vi.hoisted(() => ({ estado: { estado: 'aberta' } as Record<string, unknown> }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/content/cn',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({ user: null, profile: null, isLoading: true, signOut: vi.fn(), sessao: sessao.estado, tentarSessaoDeNovo: vi.fn() }),
}))
// o PdfViewer real não roda em jsdom: o stub relata a falha que o teste pede, como o real (`onFalha`)
const pdf = vi.hoisted(() => ({ falha: null as null | { tipo: string; motivo: string; tentar: () => void } }))
vi.mock('@/components/pdf-viewer', async () => {
  const { useEffect } = await import('react')
  function PdfViewerFalso({ onFalha }: { onFalha?: (f: unknown) => void }) {
    useEffect(() => { onFalha?.(pdf.falha) }, []) // eslint-disable-line react-hooks/exhaustive-deps
    return <div data-testid="pdf-viewer" />
  }
  return { default: PdfViewerFalso }
})
const explodir = vi.hoisted(() => ({ agora: false }))
vi.mock('@/components/content/corpo-de-texto', async (original) => {
  const real = await original<typeof import('@/components/content/corpo-de-texto')>()
  return { ...real, textoDaCifra: (d: Parameters<typeof real.textoDaCifra>[0]) => { if (explodir.agora) throw new Error('CN: render'); return real.textoDaCifra(d) } }
})

import ContentPageClient from '@/components/content-page-client'
import { especieDoPdf, fraseDoPdf } from '@/components/content/frases-visualizacao'
import type { ConteudoVisto } from '@/components/content/tipos'

const base = {
  user_id: 'cn', artist: 'Teste de régua', album: null, bpm: null, capo: null, difficulty: null, genre: null,
  is_favorite: false, is_public: false, key: null, notes: null, tags: null, thumbnail_url: null, time_signature: '4/4',
  tuning: null, created_at: '2026-09-10T15:00:00Z', updated_at: '2026-09-10T15:00:00Z', file_url: null as string | null,
}
const montar = (c: Record<string, unknown>) =>
  render(<ContentPageClient content={{ ...base, id: 'cn', title: 'Linha de 120 colunas', ...c } as unknown as ConteudoVisto} />)
const alerta = () => screen.queryByRole('alert')

afterEach(() => { cleanup(); explodir.agora = false; pdf.falha = null; sessao.estado = { estado: 'aberta' } })

describe('I1-PR-10 — os vazios (vazio ≠ erro: a frase no painel, nenhuma linha de aviso)', () => {
  it.each([
    ['VIEW-vazio-cifra', { content_type: 'Chords', content_data: {} }, 'nenhuma cifra', null],
    ['VIEW-vazio-letra', { content_type: 'Lyrics', content_data: {} }, 'nenhuma letra', 'escreva a letra para ter no palco'],
    ['VIEW-vazio-tab', { content_type: 'Tab', content_data: {} }, 'nenhuma tablatura', null],
    ['VIEW-vazio-partitura', { content_type: 'Sheet', content_data: null }, 'nenhuma partitura', 'envie um PDF ou uma imagem para ver a partitura'],
  ])('%s', (_, c, frase, apoio) => {
    montar(c)
    expect(screen.getByText(frase)).toBeInTheDocument()
    if (apoio) expect(screen.getByText(apoio)).toBeInTheDocument()
    expect(alerta()).toBeNull()
    expect(screen.queryByText(/capo:/)).toBeNull() // a tab vazia não mostra capo/afinação (a folha)
  })

  it('as fixtures de antes não aparecem mais como conteúdo (Am F C G; a tablatura E|--0----3)', () => {
    montar({ content_type: 'Chords', content_data: {} })
    expect(screen.queryByText('Am')).toBeNull()
    cleanup()
    montar({ content_type: 'Tab', content_data: {} })
    expect(screen.queryByText(/E\|--0----3/)).toBeNull()
  })
})

describe('I1-PR-10 — VIEW-erro-formato (I1-E17)', () => {
  it('extensão que não é PDF nem imagem → a linha da folha, SEM Tentar de novo, e o painel vazio', () => {
    montar({ content_type: 'Sheet', file_url: 'https://cn.supabase.co/objeto-sem-extensao', content_data: null })
    expect(alerta()).toHaveTextContent('não foi possível abrir o arquivo — confira o formato')
    expect(screen.queryByRole('button', { name: /Tentar de novo/ })).toBeNull()
    expect(screen.getByText('Partitura')).toBeInTheDocument()
  })
})

describe('I1-PR-10 — VIEW-erro-render (div. 744)', () => {
  it('exceção de render no corpo → "algo deu errado" + Tentar de novo; o cabeçalho e os detalhes de pé; Tentar de novo volta', () => {
    explodir.agora = true
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    montar({ content_type: 'Chords', content_data: { chords: 'C7M G7' } })
    expect(alerta()).toHaveTextContent('algo deu errado')
    expect(screen.getByRole('button', { name: 'Voltar para a biblioteca' })).toBeInTheDocument()
    expect(screen.getByText('Linha de 120 colunas')).toBeInTheDocument()
    expect(screen.getByText('Detalhes')).toBeInTheDocument()
    expect(screen.queryByText(/Something went wrong/)).toBeNull()
    explodir.agora = false
    fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/ }))
    expect(alerta()).toBeNull()
    expect(screen.getByText('C7M G7')).toBeInTheDocument()
    erro.mockRestore()
  })
})

describe('I1-PR-10 — o erro do PDF pela espécie (I1-E15, div. 735)', () => {
  it.each([
    ['UnexpectedResponseException', 'Unexpected server response (500) while retrieving PDF "x".', 'não foi possível abrir o PDF — o arquivo está corrompido ou inacessível'],
    ['MissingPDFException', 'Missing PDF "x".', 'não foi possível abrir o PDF — o arquivo está corrompido ou inacessível'],
    ['InvalidPDFException', 'Invalid PDF structure.', 'não foi possível abrir o PDF — formato de PDF inválido'],
    ['UnknownErrorException', 'Failed to fetch', 'não foi possível abrir o PDF — sem conexão'],
    ['AbortException', 'qualquer coisa', 'não foi possível abrir o PDF — algo deu errado'],
  ])('%s → a frase da espécie', (name, message, frase) => {
    expect(fraseDoPdf(especieDoPdf(Object.assign(new Error(message), { name })))).toBe(frase)
  })

  it('a falha do PDF vai para a linha ACIMA do painel, com Tentar de novo (o do visualizador)', () => {
    const tentar = vi.fn()
    pdf.falha = { tipo: 'falha', motivo: fraseDoPdf('inacessivel'), tentar }
    montar({ content_type: 'Sheet', file_url: 'https://cn.supabase.co/p.pdf', content_data: null })
    const linha = alerta() as HTMLElement
    expect(linha).toHaveTextContent('o arquivo está corrompido ou inacessível')
    expect(linha.compareDocumentPosition(screen.getByText('Partitura')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Tentar de novo/ }))
    expect(tentar).toHaveBeenCalledTimes(1)
  })

  it('com a sessão falhando, vence a sessão (uma linha por tela — decisão 14)', () => {
    sessao.estado = { estado: 'falhou', falha: { tipo: 'servidor' }, origem: 'renovacao' }
    pdf.falha = { tipo: 'falha', motivo: fraseDoPdf('inacessivel'), tentar: vi.fn() }
    montar({ content_type: 'Sheet', file_url: 'https://cn.supabase.co/p.pdf', content_data: null })
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(alerta()).toHaveTextContent('a sessão não foi renovada')
  })
})

describe('I1-PR-10 — a coluna lateral e o cabeçalho', () => {
  it('Detalhes em pt-BR, um par por campo que existe; Editar leva a /edit; sem favoritar nem apagar', () => {
    montar({ content_type: 'Tab', difficulty: 'advanced', capo: 3, bpm: 92, tags: ['a', 'b'], content_data: { tablature: 'e|---0---|' } })
    for (const t of ['dificuldade', 'avançado', 'compasso', '4/4', 'andamento', '92 BPM', 'etiquetas', 'a · b', 'criado', '10 set 2026', 'capo: 3ª casa', 'afinação: padrão (EADGBE)', 'nenhuma nota de palco — use Editar para escrever']) {
      expect(screen.getAllByText(t).length).toBeGreaterThan(0)
    }
    expect(screen.getByRole('link', { name: /Editar/ })).toHaveAttribute('href', '/content/cn/edit')
    expect(screen.queryByRole('button', { name: /favorit/i })).toBeNull()
    expect(screen.queryByText(/Apagar|Delete/)).toBeNull()
  })
})
