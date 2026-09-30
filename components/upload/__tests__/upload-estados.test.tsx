/**
 * I1-PR-12 — os estados do upload (folha `7-upload`) e o que o aval decidiu. Os cinco primeiros `describe` são os que
 * TÊM de reprovar na `main` (o prompt, §4): os seletores aceitam o rótulo de antes e o de agora, para que a reprovação
 * seja do COMPORTAMENTO, não do rótulo (`docs/ux/I1-PR12-anexos/cn/upload-estados-main.txt`).
 *
 * jsdom, `fetch` falso (nada sai); arquivos gerados em memória (o `File` do jsdom não tem `text()`: definido aqui).
 */
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'

// o 1º teste paga a carga do pedaço do `dynamic` (div. 844): prazo folgado para a suíte
vi.setConfig({ testTimeout: 40_000 })

const usuario = vi.hoisted(() => ({ atual: { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' } as { uid: string } | null, isLoading: false }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}), usePathname: () => '/add-content', useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario.atual, profile: null, isLoading: usuario.isLoading, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'cn-user' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

import AddContentPageClient from '@/components/add-content-page-client'

/**
 * Monta a tela e ESPERA o passo 1 (div. 844): o corpo vem por `next/dynamic`, e o 1º teste da suíte paga a carga do
 * pedaço — sob cobertura no CI ela passou de 1 s (o prazo padrão do `findBy*`) e o roteiro começou com a tela ainda em
 * *carregando…*. O prazo aqui é folgado; o que se espera é o rótulo do seletor de tipo, o de antes ou o de agora.
 */
async function montar() {
  render(<AddContentPageClient />)
  await screen.findByText(/^(Content Type|tipo de conteúdo)$/, {}, { timeout: 30_000 })
}

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); usuario.atual = { uid: 'cn-user' }; usuario.isLoading = false })

const arquivo = (nome: string, tipo: string, texto: string, ler: () => Promise<string> = async () => texto) => {
  const f = new File([texto], nome, { type: tipo })
  Object.defineProperty(f, 'text', { value: ler })
  return f
}
type Resposta = { status: number; corpo?: unknown; texto?: string } | 'rede' | 'segurar'
const responder = (r: Resposta): Promise<Response> => {
  if (r === 'rede') return Promise.reject(new TypeError('Failed to fetch'))
  if (r === 'segurar') return new Promise<Response>(() => undefined)
  return Promise.resolve(new Response(r.texto ?? JSON.stringify(r.corpo ?? {}), { status: r.status }))
}
/** O `fetch` falso: a fila de respostas do envio e a da criação (a última se repete); guarda o que foi pedido. */
function servir(envio: Resposta[], criacao: Resposta[] = []) {
  const pedidos: { rota: string; corpo: unknown }[] = []
  const proxima = (fila: Resposta[]) => (fila.length > 1 ? (fila.shift() as Resposta) : (fila[0] as Resposta))
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
    if (url === '/api/storage/upload') { pedidos.push({ rota: url, corpo: init?.body }); return responder(proxima(envio)) }
    if (url === '/api/content' && init?.method === 'POST') { pedidos.push({ rota: url, corpo: JSON.parse(String(init.body)) }); return responder(proxima(criacao)) }
    return Promise.resolve(new Response('{}', { status: 404 }))
  }))
  return pedidos
}
const ENVIO_OK: Resposta = { status: 201, corpo: { url: 'https://cn.supabase.co/storage/v1/object/public/content-files/cn' } }
const CRIADO: Resposta = { status: 201, corpo: { id: 'cn-id', title: 'T', artist: 'A' } }
const LIMITE_400: Resposta = { status: 400, corpo: { error: 'Validation failed', code: 'VALIDATION_ERROR', details: [{ field: 'size', message: 'File exceeds the 4MB limit', code: 'too_big' }] } }

// ---- seletores que valem antes e depois (o rótulo de antes | o de agora) --------------------------------------------
const clicar = async (texto: RegExp) => fireEvent.click(await screen.findByText(texto))
const entradaDoArquivo = () => document.querySelector('input[type=file]') as HTMLInputElement | null
/** Do passo 1 até a zona: *Importar de arquivo* (e o lote), e o *Próximo* do passo 1 quando existe (I1-E21). */
async function ateAZona(lote = false) {
  await clicar(/^(Import from File|Importar de arquivo)$/)
  if (lote) await clicar(/^(Batch Import|Várias músicas num arquivo)$/)
  const proximo = screen.queryByRole('button', { name: 'Próximo' })
  if (proximo) fireEvent.click(proximo)
  await waitFor(() => expect(entradaDoArquivo()).not.toBeNull())
}
const enviar = (f: File) => fireEvent.change(entradaDoArquivo() as HTMLInputElement, { target: { files: [f] } })
const PDF = () => arquivo('partitura-12-paginas.pdf', 'application/pdf', '%PDF-1.7\n')
const LOTE = () => arquivo('repertorio.txt', 'text/plain', 'Anunciação\num\n---\nAsa branca\ndois')
const escrever = (el: Element | null, v: string) => fireEvent.change(el as Element, { target: { value: v } })
const campo = (antes: string, agora: string) => document.getElementById(antes) ?? screen.queryByTestId(agora)
/** Do zero até o formulário: o criar (o *Próximo* do passo 1, o título, *Next* ou *Próximo*) e o artista. */
async function ateOFormularioPeloCriar() {
  const proximo = screen.queryByRole('button', { name: 'Próximo' })
  if (proximo) fireEvent.click(proximo)
  await waitFor(() => expect(campo('content-title', 'campo-criar-titulo')).not.toBeNull())
  escrever(campo('content-title', 'campo-criar-titulo'), 'T')
  fireEvent.click(await screen.findByRole('button', { name: /^(Next|Próximo)$/ }))
  await waitFor(() => expect(campo('artist', 'campo-artista')).not.toBeNull())
  escrever(campo('artist', 'campo-artista'), 'A')
}
const salvar = async () => fireEvent.click(await screen.findByRole('button', { name: /^(Save Content|Salvar)$/ }))

describe('1 · a cópia velha do erro de salvar não volta no passo anterior (decisão 24 do DESIGN-I1)', () => {
  it('salvar falha → Cancelar: nenhum alerta na tela', async () => {
    servir([], [{ status: 500, corpo: { error: 'Failed to create content', code: 'INTERNAL_ERROR' } }])
    await montar()
    await ateOFormularioPeloCriar()
    await salvar()
    await screen.findByText(/^(Failed to create content|não foi possível salvar — falha no servidor)$/)
    fireEvent.click(await screen.findByRole('button', { name: /^(Cancel|Cancelar)$/ }))
    await waitFor(() => expect(campo('content-title', 'campo-criar-titulo')).not.toBeNull())
    expect(screen.queryAllByRole('alert').map((e) => e.textContent)).toEqual([])
  })
})

describe('2 · o lote importado diz que importou, na tela (UP-lote-sucesso; era toast)', () => {
  it('a linha de sucesso no passo 1, nenhum toast', async () => {
    const pedidos = servir([ENVIO_OK], [CRIADO])
    await montar()
    await ateAZona(true)
    enviar(LOTE())
    fireEvent.click(await screen.findByRole('button', { name: /^(Import All|Importar todas)$/ }))
    await waitFor(() => expect(pedidos.filter((p) => p.rota === '/api/content')).toHaveLength(2))
    await screen.findByText(/^(How would you like to add content\?|como você quer adicionar\?)$/)
    expect(toast.success).not.toHaveBeenCalled()
    expect(within(screen.getByRole('status')).getByText('2 músicas importadas')).toBeTruthy()
  })
})

describe('3 · o limite pela resposta do servidor (N8, decisão 11 do aval)', () => {
  const caso = async (r: Resposta) => {
    servir([r])
    await montar()
    await ateAZona()
    enviar(PDF())
    return screen.findByText('o arquivo passa de 4 MiB — escolha um menor')
  }
  it('400 com details de field "size" → a frase do limite, sem ação, sem toast', async () => {
    await caso(LIMITE_400)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    expect(toast.error).not.toHaveBeenCalled()
    expect(screen.queryByText(/50 ?MB/)).toBeNull()
    expect(screen.getByText('formatos: .pdf, .docx, .txt · até 4 MiB')).toBeTruthy()
  })
  it('413 da plataforma (sem JSON) → a mesma frase', async () => { await caso({ status: 413, texto: 'Request Entity Too Large' }) })
})

describe('4 · o Tom das Opções avançadas mostra o valor escolhido (decisão 14 do aval)', () => {
  it('escolhido Sol, a caixa diz G — e o corpo leva "key":"G"', async () => {
    const pedidos = servir([], [CRIADO])
    await montar()
    await ateOFormularioPeloCriar()
    fireEvent.click(await screen.findByRole('button', { name: /^Opções avançadas/ }))
    const tom = (await screen.findByTestId('campo-tom')) as HTMLSelectElement
    fireEvent.change(tom, { target: { value: 'G' } })
    expect((screen.getByTestId('campo-tom') as HTMLSelectElement).value).toBe('G')
    await salvar()
    await waitFor(() => expect(pedidos).toHaveLength(1))
    expect((pedidos[0]?.corpo as { key: string }).key).toBe('G')
  })
})

describe('5 · o passo 1 é só o como: a zona vem depois do Próximo (I1-E21 — mudança de fluxo declarada)', () => {
  it('Importar de arquivo não mostra a zona; o Próximo mostra; Voltar devolve o passo 1 com a escolha', async () => {
    servir([])
    await montar()
    await clicar(/^(Import from File|Importar de arquivo)$/)
    expect(entradaDoArquivo()).toBeNull()
    expect(screen.getByLabelText('passo 1 de 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    await waitFor(() => expect(entradaDoArquivo()).not.toBeNull())
    expect(screen.getByLabelText('passo 2 de 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(entradaDoArquivo()).toBeNull()
    expect(screen.getByRole('radio', { name: /^Importar de arquivo/ }).getAttribute('aria-checked')).toBe('true')
  })
  it('a partitura esconde o como e o lote, como antes (decisão 4)', async () => {
    servir([])
    await montar()
    fireEvent.click(await screen.findByRole('radio', { name: 'Partitura' }))
    await waitFor(() => expect(screen.queryByText('como você quer adicionar?')).toBeNull())
    expect(screen.queryByRole('radio', { name: 'Várias músicas num arquivo' })).toBeNull()
    expect(screen.getByRole('radio', { name: 'Um arquivo' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }))
    await screen.findByText('formatos: .pdf, .png, .jpg, .jpeg · até 4 MiB')
  })
})

describe('a espera: os três carregamentos de antes são um, na casca (resposta 14)', () => {
  it('sem usuário (o `return null` de antes) → carregando…', () => {
    usuario.atual = null
    render(<AddContentPageClient />)
    expect(screen.getByText('carregando…')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Adicionar' })).toBeTruthy()
  })
  it('a sessão ainda abrindo → carregando…', () => {
    usuario.isLoading = true
    render(<AddContentPageClient />)
    expect(screen.getByText('carregando…')).toBeTruthy()
  })
})

describe('o envio, por espécie', () => {
  const caso = async (r: Resposta, frase: string, tentar: boolean) => {
    const pedidos = servir([r, ENVIO_OK])
    await montar()
    await ateAZona()
    enviar(PDF())
    await screen.findByText(frase)
    expect(!!screen.queryByRole('button', { name: 'Tentar de novo' })).toBe(tentar)
    expect(toast.error).not.toHaveBeenCalled()
    return pedidos
  }
  it('rede → sem conexão + Tentar de novo, que repete o MESMO envio e segue ao formulário', async () => {
    const pedidos = await caso('rede', 'o arquivo não foi enviado — sem conexão', true)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await screen.findByTestId('campo-titulo')
    expect(pedidos).toHaveLength(2)
    const [a, b] = pedidos.map((p) => p.corpo as FormData)
    expect(a?.get('file')).toBe(b?.get('file'))
    expect(a?.get('filename')).toBe('partitura-12-paginas.pdf')
    expect(b?.get('filename')).toBe('partitura-12-paginas.pdf')
    expect(screen.getByText('partitura-12-paginas.pdf · 9 B')).toBeTruthy()
  })
  it('500 → falha no servidor + Tentar de novo', () => caso({ status: 500, corpo: { error: 'File upload failed' } }, 'o arquivo não foi enviado — falha no servidor', true))
  it('201 sem url → falha no servidor', () => caso({ status: 201, corpo: {} }, 'o arquivo não foi enviado — falha no servidor', true))
  it('401 → a sessão, sem ação', () => caso({ status: 401, corpo: { error: 'Authentication required' } }, 'o arquivo não foi enviado — o servidor não aceitou a sessão, entre de novo', false))
  it('429 → o limite de tentativas, sem ação', () => caso({ status: 429, corpo: { error: 'Rate limit exceeded' } }, 'o arquivo não foi enviado — muitas tentativas, tente de novo em instantes', false))
  it('400 que não é o tamanho → o servidor recusou os dados, sem ação', () =>
    caso({ status: 400, corpo: { error: 'Validation failed', details: [{ field: 'contentType', message: 'x', code: 'custom' }] } }, 'o arquivo não foi enviado — o servidor recusou os dados', false))
  it('enviando: a frase, o nome e o tamanho; sem o Escolher arquivo', async () => {
    servir(['segurar'])
    await montar()
    await ateAZona()
    enviar(PDF())
    await screen.findByText('enviando o arquivo…')
    expect(screen.getByText('partitura-12-paginas.pdf · 9 B')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Escolher o arquivo de música' })).toBeNull()
  })
  it('a extensão recusada fica sob a zona; nenhum request, nenhum toast', async () => {
    const pedidos = servir([ENVIO_OK])
    await montar()
    await ateAZona()
    enviar(arquivo('foto.heic', 'image/heic', 'x'))
    await screen.findByText('tipo de arquivo não aceito: foto.heic — use .pdf, .docx ou .txt')
    expect(pedidos).toHaveLength(0)
    expect(toast.error).not.toHaveBeenCalled()
  })
})

describe('o salvar, por espécie', () => {
  const caso = async (r: Resposta, motivo: string, tentar: boolean) => {
    const pedidos = servir([], [r, CRIADO])
    await montar()
    await ateOFormularioPeloCriar()
    await salvar()
    await screen.findByText(`não foi possível salvar — ${motivo}`)
    expect(screen.getByText('o que você escreveu continua aqui')).toBeTruthy()
    expect(!!screen.queryByRole('button', { name: 'Tentar de novo' })).toBe(tentar)
    expect((screen.getByTestId('campo-artista') as HTMLInputElement).value).toBe('A')
    return pedidos
  }
  it('rede → Tentar de novo repete o mesmo corpo e chega ao pronto', async () => {
    const pedidos = await caso('rede', 'sem conexão', true)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await screen.findByText('“T”, de A, está na biblioteca')
    expect(pedidos).toHaveLength(2)
    expect(pedidos[1]?.corpo).toEqual(pedidos[0]?.corpo)
    expect(screen.getByLabelText('passo 3 de 3')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ir para a biblioteca' })).toBeTruthy()
  })
  it('500 → falha no servidor, com Tentar de novo', () => caso({ status: 500, corpo: { error: 'x' } }, 'falha no servidor', true))
  it('400 → o servidor recusou os dados, sem ação', () => caso({ status: 400, corpo: { error: 'Validation failed' } }, 'o servidor recusou os dados', false))
  it('401 → a sessão, sem ação', () => caso({ status: 401, corpo: { error: 'x' } }, 'o servidor não aceitou a sessão, entre de novo', false))
  it('429 → o limite, sem ação', () => caso({ status: 429, corpo: { error: 'x' } }, 'muitas tentativas, tente de novo em instantes', false))
  it('sem título ou artista: o Salvar inativo diz por quê; salvando: Salvando…', async () => {
    servir([], ['segurar'])
    await montar()
    await ateOFormularioPeloCriar()
    escrever(screen.getByTestId('campo-artista'), '')
    expect(screen.getByText('título e artista são obrigatórios')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(true)
    escrever(screen.getByTestId('campo-artista'), 'A')
    expect(screen.queryByText('título e artista são obrigatórios')).toBeNull()
    await salvar()
    expect(((await screen.findByRole('button', { name: 'Salvando…' })) as HTMLButtonElement).disabled).toBe(true)
  })
  it('o criar do zero sem título: a validação sob o campo', async () => {
    servir([])
    await montar()
    fireEvent.click(await screen.findByRole('button', { name: 'Próximo' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Próximo' }))
    expect(await screen.findByText('o título é obrigatório')).toBeTruthy()
    expect(screen.getByTestId('campo-criar-titulo').getAttribute('aria-invalid')).toBe('true')
  })
})

describe('o lote', () => {
  const ateOLote = async () => { await ateAZona(true); enviar(LOTE()); return screen.findByRole('button', { name: 'Importar todas' }) }
  it('a prévia: a frase do topo, o número, o título, o artista, o corpo e o incluir; só as incluídas sobem', async () => {
    const pedidos = servir([ENVIO_OK], [CRIADO])
    await montar()
    await ateOLote()
    expect(screen.getByText('2 músicas encontradas em repertorio.txt')).toBeTruthy()
    expect((screen.getByLabelText('título da música 1') as HTMLInputElement).value).toBe('Anunciação')
    expect((screen.getByLabelText('corpo de “Asa branca”') as HTMLTextAreaElement).value).toContain('dois')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Incluir “Asa branca”' }))
    fireEvent.click(screen.getByRole('button', { name: 'Importar todas' }))
    await screen.findByText('1 música importada')
    expect(pedidos.filter((p) => p.rota === '/api/content').map((p) => (p.corpo as { title: string }).title)).toEqual(['Anunciação'])
  })
  it('importando: Importando…, inativo', async () => {
    servir([ENVIO_OK], ['segurar'])
    await montar()
    fireEvent.click(await ateOLote())
    expect(((await screen.findByRole('button', { name: 'Importando…' })) as HTMLButtonElement).disabled).toBe(true)
  })
  it('a falha: a linha com o motivo; Tentar de novo repete o importar (como o Import All de antes: regrava as que já entraram — herança D)', async () => {
    const pedidos = servir([ENVIO_OK], [CRIADO, { status: 500, corpo: { error: 'x' } }, CRIADO])
    await montar()
    fireEvent.click(await ateOLote())
    await screen.findByText('não foi possível importar as músicas — falha no servidor')
    expect(toast.error).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Importar todas' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await screen.findByText('2 músicas importadas')
    expect(pedidos.filter((p) => p.rota === '/api/content').map((p) => (p.corpo as { title: string }).title)).toEqual(['Anunciação', 'Asa branca', 'Anunciação', 'Asa branca'])
  })
  it('nenhuma música: a linha acima da zona, sem ação', async () => {
    servir([ENVIO_OK])
    await montar()
    await ateAZona(true)
    enviar(arquivo('vazio.txt', 'text/plain', '\n\n'))
    await screen.findByText('nenhuma música encontrada no arquivo')
    expect(screen.getByTestId('zona-arquivo')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
  it('o arquivo não se leu: a linha com Tentar de novo, que lê de novo o mesmo arquivo sem reenviar', async () => {
    const pedidos = servir([ENVIO_OK])
    let vez = 0
    await montar()
    await ateAZona(true)
    enviar(arquivo('repertorio.txt', 'text/plain', 'x', async () => { if (vez++ === 0) throw new Error('boom'); return 'Anunciação\num' }))
    await screen.findByText('não foi possível ler o arquivo')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await screen.findByText('1 música encontrada em repertorio.txt')
    expect(pedidos.filter((p) => p.rota === '/api/storage/upload')).toHaveLength(1)
  })
  it('lendo (I1-E2): carregando… no lugar da lista, no passo 2', async () => {
    servir([ENVIO_OK])
    await montar()
    await ateAZona(true)
    enviar(arquivo('repertorio.txt', 'text/plain', 'x', () => new Promise<string>(() => undefined)))
    await screen.findByText('carregando…')
    expect(screen.getByLabelText('passo 2 de 3')).toBeTruthy()
    expect(screen.queryByTestId('zona-arquivo')).toBeNull()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeTruthy()
  })
})
