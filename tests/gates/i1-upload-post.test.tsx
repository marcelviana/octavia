/**
 * CN do que o upload ENVIA (I1-PR12) — "o `POST` de upload e o de criação não mudam" (I1-D9; o prompt, §0 e §3).
 *
 * Monta a tela de `/add-content` (`components/add-content-page-client.tsx`) com o `fetch` falso que GUARDA o
 * `FormData` do `POST /api/storage/upload` (campo a campo; o arquivo como nome · tipo · tamanho · sha256 dos bytes) e
 * o corpo de cada `POST /api/content`; percorre um roteiro por fluxo (criar do zero, importar um arquivo, partitura,
 * lote) com a mesma INTENÇÃO antes e depois do redesenho — só os seletores mudam, porque os rótulos mudam — e
 * compara, byte a byte, com `fixtures/upload-post-antes.json`, gravado no commit 1 sobre o código da `main`
 * (`CN_GRAVAR=1`). Commit 2: só os seletores mudaram, mais o clique no *Próximo* do passo 1 (I1-E21) e, no criar do
 * zero, o texto que não se digita mais (decisão 5) — esse caso foi regravado sobre a `main` sem o texto (div. 832).
 *
 * O que o roteiro preenche e o corpo NÃO leva (medido aqui, não consertado — herança D): *Ano*, *Capo* e *Afinação*
 * (o hook não os lê), *Compasso* e *favorita* (o formulário manda `time_signature`/`is_favorite`, o hook lê
 * `timeSignature`/`isFavorite`). Texto dos fixtures: do projeto (os exemplos da folha 7) — a regra "anexo não carrega
 * texto de música" não o alcança.
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => '/add-content',
  useSearchParams: () => new URLSearchParams(),
}))
const usuario = { uid: 'cn-user', email: 'cn@exemplo.com', displayName: 'CN' }
vi.mock('@/contexts/firebase-auth-context', () => {
  const ctx = () => ({ user: usuario, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() })
  return { useAuth: ctx, useFirebaseAuth: ctx }
})
vi.mock('@/lib/firebase', () => ({ auth: { currentUser: { uid: 'cn-user', email: 'cn@exemplo.com' } } }))
vi.mock('@/lib/auth-manager', () => ({ getValidToken: async () => ({ token: 'cn-token', error: null }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import AddContentPageClient from '@/components/add-content-page-client'

const ANTES = path.resolve(__dirname, 'fixtures/upload-post-antes.json')

/**
 * Os arquivos do roteiro, gerados em memória (nunca lidos do disco). O `File` do jsdom não tem `text()` nem
 * `arrayBuffer()` (medido: `typeof … === 'undefined'`); o lote lê o `.txt` por `file.text()` — os dois vêm do texto.
 */
const arquivo = (nome: string, tipo: string, texto: string) => {
  const f = new File([texto], nome, { type: tipo })
  const bytes = Buffer.from(texto, 'utf8')
  Object.defineProperty(f, 'text', { value: async () => texto })
  Object.defineProperty(f, 'arrayBuffer', { value: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) })
  return f
}
const LOTE = ['Anunciação', 'primeira linha da música um', '---', 'Asa branca', 'primeira linha da música dois', '---',
  'Batch três', 'primeira linha da música três'].join('\n')

// ---- os seletores do roteiro (I1-PR-12, commit 2: os do upload novo — os rótulos mudaram; a intenção é a mesma) ------
const clicar = async (papel: 'radio' | 'button' | 'checkbox', nome: string | RegExp) => fireEvent.click(await screen.findByRole(papel, { name: nome }))
const escrever = async (el: Promise<HTMLElement> | HTMLElement, v: string) => fireEvent.change(await el, { target: { value: v } })
const campo = (testid: string) => screen.findByTestId(testid)
const A = {
  escolherTipo: (tipo: 'Letra' | 'Cifra' | 'Tab' | 'Partitura') => clicar('radio', tipo),
  escolherImportar: () => clicar('radio', /^Importar de arquivo/),
  escolherLote: () => clicar('radio', 'Várias músicas num arquivo'),
  /** I1-E21 (decisão 2 do aval): o passo 1 tem *Próximo* — o clique a mais, antes da zona ou do criar */
  proximo: () => clicar('button', 'Próximo'),
  enviar: async (f: File) => {
    await screen.findByTestId('zona-arquivo')
    fireEvent.change(document.querySelector('input[type=file]') as HTMLInputElement, { target: { files: [f] } })
  },
  criarTitulo: (v: string) => escrever(campo('campo-criar-titulo'), v),
  criarProximo: () => clicar('button', 'Próximo'),
  campo: (qual: 'titulo' | 'artista' | 'album' | 'genero' | 'ano' | 'notas', v: string) => escrever(campo(`campo-${qual}`), v),
  abrirAvancadas: () => clicar('button', /^Opções avançadas/),
  avancado: (qual: 'bpm' | 'capo' | 'afinacao' | 'compasso', v: string) =>
    escrever(campo({ bpm: 'campo-bpm', capo: 'campo-capo', afinacao: 'campo-tuning', compasso: 'campo-timeSignature' }[qual]), v),
  favorita: () => clicar('checkbox', 'Favorita'),
  salvar: () => clicar('button', 'Salvar'),
  loteArtista: async (i: number, v: string) => escrever((await screen.findAllByTestId('campo-lote-artista'))[i] as HTMLElement, v),
  importarTodas: () => clicar('button', 'Importar todas'),
}

interface Caso { nome: string; roteiro: () => Promise<void>; posts: number }
const CASOS: Caso[] = [
  {
    nome: 'criar do zero (letra) + metadados e avançadas',
    posts: 1,
    roteiro: async () => {
      await A.proximo()
      await A.criarTitulo('Linha de 120 colunas')
      // I1-PR-12, decisão 5 do aval: o criar do zero não tem mais o campo de corpo — o roteiro não o digita, e o
      // "antes" deste caso foi REGRAVADO sobre a `main` sem esse passo (div. 832): `content_data: { lyrics: "" }`
      await A.criarProximo()
      await A.campo('artista', 'Teste de régua')
      await A.campo('album', 'Álbum do CN')
      await A.campo('genero', 'Samba')
      await A.campo('ano', '1998')
      await A.campo('notas', 'nota do CN')
      await A.abrirAvancadas()
      await A.avancado('bpm', '96')
      await A.avancado('capo', '2')
      await A.avancado('afinacao', 'Drop D (DADGBE)')
      await A.avancado('compasso', '3/4')
      await A.favorita()
      await A.salvar()
    },
  },
  {
    nome: 'importar um arquivo (cifra, .txt)',
    posts: 1,
    roteiro: async () => {
      await A.escolherTipo('Cifra')
      await A.escolherImportar()
      await A.proximo()
      await A.enviar(arquivo('cifra do cn.txt', 'text/plain', '[Verso curto — controle]\nC7M      G7\nLa la la, la la lá'))
      await A.campo('titulo', 'Verso curto')
      await A.campo('artista', 'Teste de régua')
      await A.salvar()
    },
  },
  {
    nome: 'partitura (.pdf)',
    posts: 1,
    roteiro: async () => {
      await A.escolherTipo('Partitura')
      await A.proximo()
      await A.enviar(arquivo('partitura-12-paginas.pdf', 'application/pdf', '%PDF-1.7\n% partitura do CN\n'))
      await A.campo('titulo', 'Partitura de 12 páginas')
      await A.campo('artista', 'Compositor anônimo')
      await A.campo('notas', 'nota do CN')
      await A.salvar()
    },
  },
  {
    nome: 'lote (.txt, três músicas)',
    posts: 3,
    roteiro: async () => {
      await A.escolherImportar()
      await A.escolherLote()
      await A.proximo()
      await A.enviar(arquivo('repertorio.txt', 'text/plain', LOTE))
      await A.loteArtista(0, 'Alceu Valença')
      await A.loteArtista(1, 'Luiz Gonzaga')
      await A.importarTodas()
    },
  },
]

let envios: string[] = []
beforeEach(() => { envios = [] })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

/** O `FormData` como texto estável: os campos na ordem, o arquivo por nome · tipo · tamanho · sha256. */
async function formDataEmTexto(fd: FormData) {
  const out: [string, unknown][] = []
  for (const [k, v] of fd.entries()) {
    if (typeof v === 'string') out.push([k, v])
    else {
      const bytes = Buffer.from(await v.arrayBuffer())
      out.push([k, { name: v.name, type: v.type, size: v.size, sha256: createHash('sha256').update(bytes).digest('hex') }])
    }
  }
  return JSON.stringify(out)
}

const servir = () =>
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url)
    if (u === '/api/storage/upload' && init?.method === 'POST') {
      envios.push(`POST /api/storage/upload ${await formDataEmTexto(init.body as FormData)}`)
      return new Response(JSON.stringify({ url: 'https://cn.supabase.co/storage/v1/object/public/content-files/cn-arquivo', success: true }), { status: 201 })
    }
    if (u === '/api/content' && init?.method === 'POST') {
      envios.push(`POST /api/content ${String(init.body)}`)
      const corpo = JSON.parse(String(init.body)) as Record<string, unknown>
      return new Response(JSON.stringify({ ...corpo, id: `cn-id-${envios.length}` }), { status: 201 })
    }
    return new Response('{}', { status: 404 })
  }))

describe('I1-PR12 — o que o upload envia, byte a byte contra o da main', () => {
  const gravados: Record<string, string[]> = {}
  for (const c of CASOS) {
    it(c.nome, async () => {
      servir()
      render(<AddContentPageClient />)
      // o corpo vem por `next/dynamic`: espera o passo 1 com prazo folgado (div. 844 — o 1º caso paga a carga do pedaço)
      await screen.findByText('tipo de conteúdo', {}, { timeout: 30_000 })
      await c.roteiro()
      await waitFor(() => expect(envios.filter((e) => e.startsWith('POST /api/content'))).toHaveLength(c.posts))
      gravados[c.nome] = envios
      if (process.env.CN_GRAVAR) return
      const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8')) as Record<string, string[]>
      expect(envios).toEqual(antes[c.nome])
    }, 60_000)
  }
  it.runIf(!!process.env.CN_GRAVAR)('grava o antes (CN_GRAVAR=1, só no commit 1, sobre o código da main)', () => {
    fs.mkdirSync(path.dirname(ANTES), { recursive: true })
    fs.writeFileSync(ANTES, JSON.stringify(gravados, null, 1) + '\n')
  })
})
