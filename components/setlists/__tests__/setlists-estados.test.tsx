/**
 * I1-PR-13 — os estados de `/setlists` pela folha `8-setlists`, com o servidor falso (nada sai do jsdom).
 *
 * O 1º bloco é o que **reprova sobre o código da `main`** (os seletores aceitam o rótulo de antes e o de agora: a
 * reprovação é do comportamento): as cinco falhas que eram mudas agora dizem o motivo, no lugar da ação; o 404 de uma
 * escrita fecha e relê; a adição que falha a meio não duplica; o *Criar* inativo diz por quê (N7); o picker não mente
 * quando todas já estão na setlist (N10). O 2º bloco são os estados da folha e as decisões do aval do commit 1.
 */
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/setlists',
  useSearchParams: () => new URLSearchParams(),
}))
const sessao = vi.hoisted(() => ({ user: { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' } as unknown, isLoading: false }))
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: sessao.user, profile: null, isLoading: sessao.isLoading, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'cn-user', email: 'cn@exemplo.com', getIdToken: async () => 'cn-token' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))

import SetlistsPageClient from '@/components/setlists-page-client'
import { CONTEUDOS, NAO_ENCONTRADA, SETLISTS_DA_FOLHA, erro, servir, setlist, type Roteiro } from './servidor-falso'

beforeEach(() => { sessao.isLoading = false; sessao.user = { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' } })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

const PRAZO = { timeout: 30_000 } // o corpo vem por `next/dynamic`: o 1º caso paga a carga do pedaço (div. 844)

async function montar(roteiro: Partial<Roteiro> = {}, esperar: string | null = 'Show padrão') {
  const s = servir({ listas: [SETLISTS_DA_FOLHA()], ...roteiro })
  render(<SetlistsPageClient />)
  if (esperar) await screen.findAllByText(esperar, {}, PRAZO)
  return s
}
// ---- os seletores: o rótulo de antes | o de agora ------------------------------------------------------------------
const botoes = (nome: RegExp, onde: HTMLElement = document.body) => within(onde).findAllByRole('button', { name: nome })
const clicar = async (nome: RegExp, i = 0, onde?: HTMLElement) => fireEvent.click((await botoes(nome, onde))[i] as HTMLElement)
const dialogo = () => screen.findByRole('dialog')
const S = {
  abrir: (nome: string) => fireEvent.click(screen.getAllByText(nome)[0] as HTMLElement),
  nova: () => clicar(/^(Create Setlist|Nova setlist)$/),
  nome: async (v: string) => fireEvent.change(await within(await dialogo()).findByLabelText(/^(Setlist Name|Nome)/), { target: { value: v } }),
  criar: async () => clicar(/^(Create Setlist|Criar)$/, 0, await dialogo()),
  editarCartao: (i: number) => clicar(/^(Edit setlist|Editar a setlist .+)$/, i),
  salvar: async () => clicar(/^(Update Setlist|Salvar)$/, 0, await dialogo()),
  apagarCartao: (i: number) => clicar(/^(Delete setlist|Apagar a setlist .+)$/, i),
  apagar: async () => clicar(/^(Delete|Apagar)$/, 0, await dialogo()),
  adicionarMusicas: () => clicar(/^(Add Songs|Adicionar músicas a .+)$/),
  marcar: async (titulo: string) => fireEvent.click(await within(await dialogo()).findByText(titulo)),
  adicionar: async () => clicar(/^(Add \d+ Songs?|Adicionar \d+\b.*)$/, 0, await dialogo()),
  remover: (i: number) => clicar(/^(Remove song|Remover .+ da setlist)$/, i),
  tentar: (onde?: HTMLElement) => clicar(/^Tentar de novo$/, 0, onde),
}
const semDialogo = () => waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
const so = (escritas: string[], prefixo: string) => escritas.filter((e) => e.startsWith(prefixo))

describe('1 · o que era mudo agora diz (reprovam na main)', () => {
  it('criar falha (rede): o diálogo fica com o digitado, a linha diz o motivo, Tentar de novo reenvia o MESMO corpo', async () => {
    const { escritas } = await montar({ respostas: { criar: ['rede'] } })
    await S.nova()
    await S.nome('Ensaio de sexta')
    await S.criar()
    await waitFor(() => expect(so(escritas, 'POST /api/setlists ')).toHaveLength(1))
    const d = await dialogo() // na main o diálogo fecha como se tivesse dado certo
    expect(await within(d).findByText('não foi possível criar a setlist — sem conexão')).toBeInTheDocument()
    expect(within(d).getByText('o que você escreveu continua aqui')).toBeInTheDocument()
    expect(within(d).getByLabelText('Nome')).toHaveValue('Ensaio de sexta')
    await S.tentar(d)
    await semDialogo()
    const posts = so(escritas, 'POST /api/setlists ')
    expect(posts).toHaveLength(2)
    expect(posts[1]).toBe(posts[0])
    expect(await screen.findByText('Ensaio de sexta')).toBeInTheDocument()
  }, 60_000)

  it.each([
    [400, 'o servidor recusou os dados', false], [401, 'o servidor não aceitou a sessão, entre de novo', false],
    [429, 'muitas tentativas, tente de novo em instantes', false], [500, 'falha no servidor', true],
  ] as const)('criar falha (%i): "%s" — Tentar de novo: %s', async (status, motivo, tentar) => {
    await montar({ respostas: { criar: [erro(status)] } })
    await S.nova()
    await S.nome('Ensaio de sexta')
    await S.criar()
    const d = await dialogo()
    expect(await within(d).findByText(`não foi possível criar a setlist — ${motivo}`)).toBeInTheDocument()
    expect(within(d).queryAllByRole('button', { name: 'Tentar de novo' })).toHaveLength(tentar ? 1 : 0)
  }, 60_000)

  it('salvar falha (500): o diálogo de editar fica e diz "não foi possível salvar a setlist"', async () => {
    await montar({ respostas: { salvar: [erro(500)] } })
    await S.editarCartao(1)
    await S.nome('Show de sábado')
    await S.salvar()
    expect(await within(await dialogo()).findByText('não foi possível salvar a setlist — falha no servidor')).toBeInTheDocument()
  }, 60_000)

  it('apagar falha (500): a linha DENTRO do diálogo, sem Tentar de novo; o Apagar repete', async () => {
    const { escritas } = await montar({ respostas: { apagar: [erro(500)] } })
    await S.apagarCartao(1)
    await S.apagar()
    const d = await dialogo()
    expect(await within(d).findByText('não foi possível apagar a setlist — falha no servidor')).toBeInTheDocument() // na main: mudo
    expect(within(d).queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    await S.apagar()
    await semDialogo()
    expect(so(escritas, 'DELETE /api/setlists/set-show')).toHaveLength(2)
    expect(screen.queryByText('Show padrão')).toBeNull()
    expect(screen.queryByText('esta setlist já foi apagada')).toBeNull()
  }, 60_000)

  it('adicionar falha (500 na 1ª): o picker fica com a seleção e a linha; nada entra', async () => {
    const { escritas } = await montar({ respostas: { adicionar: [erro(500)] } })
    S.abrir('Solo')
    await S.adicionarMusicas()
    await S.marcar('Asa branca')
    await S.adicionar()
    await waitFor(() => expect(so(escritas, 'POST /api/setlists/set-solo/songs')).toHaveLength(1))
    const d = await dialogo() // na main o picker fecha
    expect(await within(d).findByText('não foi possível adicionar as músicas — falha no servidor')).toBeInTheDocument()
    expect(within(d).getByRole('button', { name: 'Adicionar 1 música a Solo' })).toBeEnabled()
  }, 60_000)

  it('adicionar falha A MEIO (201, 500): a que entrou aparece na lista e sai da seleção; Tentar de novo manda só as que faltam', async () => {
    const { escritas } = await montar({ respostas: { adicionar: [{ status: 201, corpo: { id: 'linha-nova', position: 9, notes: null } }, erro(500)] } })
    S.abrir('Solo')
    await S.adicionarMusicas()
    await S.marcar('Asa branca'); await S.marcar('Batch dois'); await S.marcar('Batch três')
    await S.adicionar()
    await waitFor(() => expect(so(escritas, 'POST ')).toHaveLength(2))
    const d = await dialogo() // na main o picker fecha, e o que entrou não aparece
    expect(await within(d).findByText('não foi possível adicionar as músicas — falha no servidor')).toBeInTheDocument()
    expect(within(d).queryByText('Asa branca')).toBeNull() // já está na setlist: saiu do picker
    expect(within(d).getByRole('button', { name: 'Adicionar 2 músicas a Solo' })).toBeInTheDocument()
    await S.tentar(d)
    await semDialogo()
    const ids = so(escritas, 'POST ').map((e) => (JSON.parse(e.slice(e.indexOf('{'))) as { content_id: string }).content_id)
    expect(ids).toEqual(['c-asa', 'c-batch2', 'c-batch2', 'c-batch3']) // a Asa branca foi UMA vez
    expect(screen.getAllByText('Asa branca')).toHaveLength(1)
  }, 60_000)

  it('remover falha (rede): a linha abaixo do cabeçalho da setlist, com o título; Tentar de novo repete o mesmo DELETE', async () => {
    const { escritas } = await montar({ respostas: { remover: ['rede'] } })
    S.abrir('Show padrão')
    await S.remover(1)
    expect(await screen.findByText('não foi possível remover “Construção” — sem conexão')).toBeInTheDocument() // na main: nada
    expect(screen.getAllByText('Construção')).toHaveLength(1)
    await S.tentar()
    await waitFor(() => expect(screen.queryByText('Construção')).toBeNull())
    expect(so(escritas, 'DELETE ')).toEqual(['DELETE /api/setlists/songs/linha-2', 'DELETE /api/setlists/songs/linha-2'])
    expect(screen.queryByText(/não foi possível remover/)).toBeNull()
  }, 60_000)

  it('editar uma setlist que sumiu (404): o diálogo fecha, a lista é relida, "esta setlist já foi apagada"', async () => {
    const todas = SETLISTS_DA_FOLHA()
    const { leituras } = await montar({ listas: [todas, todas.filter((s) => s.id !== 'set-show')], respostas: { salvar: [NAO_ENCONTRADA] } })
    await S.editarCartao(1)
    await S.nome('Show de sábado')
    await S.salvar()
    await semDialogo() // na main o diálogo também fecha — e nada mais acontece
    expect(await screen.findByText('esta setlist já foi apagada')).toBeInTheDocument()
    expect(screen.queryByText('Show padrão')).toBeNull()
    expect(leituras.setlists).toBe(2)
  }, 60_000)

  it('remover uma linha que sumiu (404), a setlist ainda existe: relê e mostra a lista relida, sem frase', async () => {
    const todas = SETLISTS_DA_FOLHA()
    const relida = SETLISTS_DA_FOLHA().map((s) => (s.id === 'set-show' ? { ...s, setlist_songs: s.setlist_songs.filter((l) => l.id !== 'linha-2') } : s))
    const { leituras } = await montar({ listas: [todas, relida], respostas: { remover: [{ status: 404, corpo: { error: 'Song not found', code: 'NOT_FOUND' } }] } })
    S.abrir('Show padrão')
    await S.remover(1)
    await waitFor(() => expect(leituras.setlists).toBe(2)) // na main: nenhuma releitura
    await waitFor(() => expect(screen.queryByText('Construção')).toBeNull())
    expect(screen.queryByText('esta setlist já foi apagada')).toBeNull()
    expect(screen.queryByText(/não foi possível/)).toBeNull()
  }, 60_000)

  it('N7: sem nome, o Criar fica inativo e DIZ por quê; com nome, a frase some', async () => {
    await montar()
    await S.nova()
    const d = await dialogo()
    expect(within(d).getByRole('button', { name: /^(Create Setlist|Criar)$/ })).toBeDisabled()
    expect(within(d).getByText('a setlist precisa de um nome')).toBeInTheDocument() // na main: só o botão cinza
    await S.nome('Ensaio de sexta')
    expect(within(d).queryByText('a setlist precisa de um nome')).toBeNull()
    expect(within(d).getByRole('button', { name: 'Criar' })).toBeEnabled()
  }, 60_000)

  it('N10: todas as músicas da biblioteca já estão na setlist — o picker diz isso, e não "adicione à biblioteca"', async () => {
    const tudo = [setlist('set-show', 'Show padrão', [['l1', CONTEUDOS.garota], ['l2', CONTEUDOS.asa]])]
    await montar({ listas: [tudo], biblioteca: { data: [CONTEUDOS.garota, CONTEUDOS.asa] } })
    S.abrir('Show padrão')
    await S.adicionarMusicas()
    const d = await dialogo()
    expect(await within(d).findByText('todas as músicas da biblioteca já estão nesta setlist')).toBeInTheDocument()
    expect(within(d).queryByText(/adicione músicas à biblioteca primeiro|Add some songs to your library first/)).toBeNull()
  }, 60_000)
})

describe('2 · os estados da folha e as decisões do aval', () => {
  it('SET-carregando: a sessão carregando e o sem usuário são a mesma tela — o título, Nova setlist inerte e a frase', async () => {
    sessao.isLoading = true
    await montar({}, 'carregando as setlists…')
    expect(screen.getByRole('heading', { name: 'Setlists' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nova setlist' })).toHaveAttribute('aria-disabled', 'true')
    cleanup()
    sessao.isLoading = false; sessao.user = null
    await montar({}, 'carregando as setlists…')
    expect(screen.getByRole('button', { name: 'Nova setlist' })).toHaveAttribute('aria-disabled', 'true')
  }, 60_000)

  it('SET-carregando-dados: três blocos sem texto, com o título e Nova setlist ativo (decisão 15)', async () => {
    await montar({ listas: ['segurar'] }, null)
    await waitFor(() => expect(document.querySelector('[aria-busy="true"]')?.children).toHaveLength(3), PRAZO)
    expect(screen.queryByText('carregando as setlists…')).toBeNull()
    await S.nova()
    expect(await dialogo()).toBeInTheDocument()
  }, 60_000)

  it('SET-vazio: nenhuma setlist ainda, e Criar a primeira setlist abre o formulário', async () => {
    await montar({ listas: [[]] }, 'nenhuma setlist ainda')
    expect(screen.getByText('crie a primeira para organizar as músicas do show')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Criar a primeira setlist' }))
    expect(await within(await dialogo()).findByText('Nova setlist')).toBeInTheDocument()
  }, 60_000)

  it.each([
    ['rede' as const, 'sem conexão', true], [erro(401), 'o servidor não aceitou a sessão, entre de novo', false],
    [erro(429), 'muitas tentativas, tente de novo em instantes', false], [erro(500), 'falha no servidor', true],
  ])('SET-erro (%j): o motivo pela espécie; Tentar de novo (%s) repete a CARGA, não a página (decisão 16)', async (falha, motivo, tentar) => {
    const { leituras } = await montar({ listas: [falha, SETLISTS_DA_FOLHA()] }, `não foi possível carregar as setlists — ${motivo}`)
    expect(screen.queryByText('nenhuma setlist ainda')).toBeNull() // erro ≠ vazio
    expect(screen.queryAllByRole('button', { name: 'Tentar de novo' })).toHaveLength(tentar ? 1 : 0)
    if (!tentar) return
    await S.tentar()
    expect(await screen.findByText('Show padrão')).toBeInTheDocument()
    expect(leituras.setlists).toBe(2)
    expect(screen.queryByText(/não foi possível carregar/)).toBeNull()
  }, 60_000)

  it('SET e SET-nenhuma: a contagem, os nomes acessíveis, a duração estimada, o tipo em pt-BR, sem alça', async () => {
    await montar()
    expect(screen.getByText('3 setlists')).toBeInTheDocument()
    expect(screen.getByText('escolha uma setlist para ver os detalhes')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar a setlist Show padrão' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apagar a setlist Solo' })).toBeInTheDocument()
    S.abrir('Show padrão')
    expect(await screen.findByText('5 músicas · 20 min')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover Garota de Ipanema da setlist' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar músicas a Show padrão' })).toBeInTheDocument()
    for (const tipo of ['Cifra', 'Tab', 'Partitura']) expect(screen.getByText(tipo)).toBeInTheDocument()
    expect(screen.getAllByText('Letra')).toHaveLength(2)
    expect(document.querySelector('[draggable="true"]')).toBeNull() // decisão 27: a ordem é fixa
  }, 60_000)

  it('SET-sem-musicas: "0 músicas" sem duração; o Adicionar é o do cabeçalho (um só)', async () => {
    await montar()
    S.abrir('Estresse')
    expect(await screen.findByText('nenhuma música ainda')).toBeInTheDocument()
    expect(screen.getByText('adicione músicas da biblioteca')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Estresse' }).parentElement).toHaveTextContent(/0 músicas$/)
    expect(screen.getAllByRole('button', { name: /^Adicionar músicas a / })).toHaveLength(1)
  }, 60_000)

  it('decisões 6, 7 e 8: o sentinela da rota, a data e o local, a nota da música', async () => {
    const semArtista = { ...CONTEUDOS.batch2, title: 'Unknown Title', artist: 'Unknown Artist', content_type: 'Unknown Type' }
    const s = setlist('set-x', 'Casamento', [['l1', semArtista], ['l2', CONTEUDOS.garota]], { performance_date: '2026-10-03', venue: 'Blue Note' })
    s.setlist_songs[1]!.notes = 'entrada em Lá'
    await montar({ listas: [[s]] }, 'Casamento')
    S.abrir('Casamento')
    expect(await screen.findByText('sem título')).toBeInTheDocument()
    expect(screen.getByText('artista desconhecido')).toBeInTheDocument()
    expect(screen.queryByText(/Unknown/)).toBeNull()
    expect(screen.getAllByText('3 out 2026')).toHaveLength(2) // o cartão e o cabeçalho — o dia é o do banco, sem fuso
    expect(screen.getAllByText('Blue Note')).toHaveLength(2)
    expect(screen.getByText('entrada em Lá')).toBeInTheDocument()
  }, 60_000)

  it('o editar é o mesmo diálogo: Editar setlist, os valores de antes, Salvar / Salvando…', async () => {
    const { escritas } = await montar()
    await S.editarCartao(1)
    const d = await dialogo()
    expect(within(d).getByText('Editar setlist')).toBeInTheDocument()
    expect(within(d).getByLabelText('Nome')).toHaveValue('Show padrão')
    expect(within(d).getByLabelText('Descrição')).toHaveValue('show completo com bloco acústico e bloco elétrico')
    await S.salvar()
    await semDialogo()
    expect(so(escritas, 'PUT /api/setlists/set-show')).toHaveLength(1)
  }, 60_000)

  it('o picker: Selecionar todas, a busca pelo rótulo pt-BR e pelo valor de antes, nada encontrado (decisão 11)', async () => {
    await montar()
    S.abrir('Show padrão')
    await S.adicionarMusicas()
    const d = await dialogo()
    expect(within(d).getByText('Adicionar a Show padrão')).toBeInTheDocument()
    const todas = within(d).getByRole('checkbox', { name: 'Selecionar todas (3)' })
    expect(within(d).getByRole('button', { name: 'Adicionar' })).toBeDisabled()
    fireEvent.click(todas)
    expect(within(d).getByRole('button', { name: 'Adicionar 3 músicas a Show padrão' })).toHaveTextContent('Adicionar 3')
    expect(within(d).getAllByText('artista desconhecido')).toHaveLength(2)
    const busca = within(d).getByRole('searchbox', { name: 'buscar por título, artista ou tipo' })
    fireEvent.change(busca, { target: { value: 'cifra' } })
    expect(within(d).getByText('Batch três')).toBeInTheDocument()
    expect(within(d).queryByText('Asa branca')).toBeNull()
    fireEvent.change(busca, { target: { value: 'chords' } })
    expect(within(d).getByText('Batch três')).toBeInTheDocument()
    fireEvent.change(busca, { target: { value: 'xablau' } })
    expect(within(d).getByText('nada encontrado')).toBeInTheDocument()
    expect(within(d).getByText('mude a busca')).toBeInTheDocument()
  }, 60_000)

  it('o picker sem músicas: a biblioteca vazia; o teto (decisão 4); a leitura que falhou (decisão 5)', async () => {
    const abrirPicker = async (r: Partial<Roteiro>) => {
      await montar(r)
      S.abrir('Solo')
      await S.adicionarMusicas()
      return dialogo()
    }
    let d = await abrirPicker({ biblioteca: { data: [] } })
    expect(within(d).getByText('nenhuma música disponível')).toBeInTheDocument()
    expect(within(d).getByText('adicione músicas à biblioteca primeiro')).toBeInTheDocument()
    cleanup()
    // a resposta veio cortada (total > o que veio): não se pode dizer "todas" — nem mandar adicionar à biblioteca
    d = await abrirPicker({ biblioteca: { data: [CONTEUDOS.garota], total: 250 } })
    expect(within(d).getByText('nenhuma música disponível')).toBeInTheDocument()
    expect(within(d).queryByText('adicione músicas à biblioteca primeiro')).toBeNull()
    expect(within(d).queryByText('todas as músicas da biblioteca já estão nesta setlist')).toBeNull()
    cleanup()
    d = await abrirPicker({ biblioteca: { falha: erro(500) } })
    expect(within(d).getByText('não foi possível carregar a biblioteca — falha no servidor')).toBeInTheDocument()
    expect(within(d).queryByText('nenhuma música disponível')).toBeNull()
    expect(within(d).getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  }, 60_000)

  it('div. 871: a recarga ao voltar à aba (30 s) não troca a lista pelos blocos, e a setlist aberta é a relida', async () => {
    const relida = SETLISTS_DA_FOLHA().map((x) => (x.id === 'set-solo' ? { ...x, setlist_songs: [...x.setlist_songs, { id: 'l-nova', position: 2, notes: null, content: CONTEUDOS.asa }] } : x))
    const { leituras } = await montar({ listas: [SETLISTS_DA_FOLHA(), 'segurar'] })
    S.abrir('Solo')
    const agora = Date.now()
    const relogio = vi.spyOn(Date, 'now').mockReturnValue(agora + 31_000)
    fireEvent(window, new Event('focus'))
    await waitFor(() => expect(leituras.setlists).toBe(2))
    relogio.mockRestore()
    expect(document.querySelector('[aria-busy="true"]')).toBeNull() // a lista fica enquanto a releitura não chega
    expect(screen.getAllByText('Show padrão').length).toBeGreaterThan(0)
    cleanup()
    // e quando a releitura chega, o painel mostra o que ela trouxe (a aberta é derivada da lista)
    const s2 = await montar({ listas: [SETLISTS_DA_FOLHA(), relida] })
    S.abrir('Solo')
    const relogio2 = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 31_000)
    fireEvent(window, new Event('focus'))
    relogio2.mockRestore()
    expect(await screen.findByText('Asa branca')).toBeInTheDocument()
    expect(s2.leituras.setlists).toBe(2)
  }, 60_000)

  it('adicionando: o botão diz Adicionando… e fica inativo; Esc não fecha', async () => {
    const s = servir({ listas: [SETLISTS_DA_FOLHA()] })
    const original = globalThis.fetch
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => (String(url).endsWith('/songs') ? new Promise<Response>(() => undefined) : original(url, init))))
    render(<SetlistsPageClient />)
    await screen.findAllByText('Show padrão', {}, PRAZO)
    S.abrir('Solo')
    await S.adicionarMusicas()
    await S.marcar('Asa branca')
    await S.adicionar()
    const d = await dialogo()
    expect(await within(d).findByRole('button', { name: /Adicionando…|Adicionar 1 música a Solo/ })).toBeDisabled()
    expect(within(d).getByText('Adicionando…')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(s.escritas).toEqual([])
  }, 60_000)
})
