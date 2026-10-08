/**
 * CN do corpo do PUT do editor (I1-PR11) — "o que o editor grava não muda" (I1-D9; a poluição do `content_data` é
 * Bloco D e fica como está).
 *
 * Monta a ROTA do editor (`app/content/[id]/edit/page.tsx`) para um content de cada tipo, com o `GET
 * /api/content/<id>` fabricado e o `PUT /api/content` levado à ROTA REAL (`./rota-real.ts`); faz uma
 * edição roteirizada por tipo (a mesma intenção antes e depois do redesenho — só os seletores mudam, porque os
 * rótulos mudam) e clica em salvar. O corpo, byte a byte, tem de ser o de `fixtures/editor-put-antes.json`, gravado
 * no commit 1 sobre o código da `main` (`CN_GRAVAR=1`).
 *
 * D-0 (div. 1157; D0-D19): **"não mudou" não é "funciona"**. Até a D-0 o `fetch` falso deste gate devolvia 200 a
 * qualquer corpo, e o gate travou byte a byte, em 4 dos 5 casos, um corpo com `difficulty: ""` que o servidor recusava
 * desde 2025-07-08 (div. 1152). Agora cada corpo passa pelo handler `PUT` real — o esquema `contentSchemas.update` e o
 * contrato de escrita com o tipo da linha —, com a autenticação e o banco simulados, e o gate exige **200** antes de
 * comparar os bytes. Um corpo que o esquema recusa não passa por construção: o status vem da rota, não do gate.
 *
 * D-0, commit 2 — o corpo muda DE PROPÓSITO, e o gate passa a ter dois arquivos e um par (regra 14):
 *   `fixtures/editor-put-antes.json` — o que a `main` gravava (o do I1, com o título e o autor reais da Tab trocados
 *     pelos fabricados da D-0 — D0-D18; o editor não lê o nome: é o corpo que a `main` grava com a entrada fabricada);
 *   `fixtures/editor-put-depois.json` — o que o editor da D-0 grava (`CN_GRAVAR=1`, só depois da rota dizer 200);
 *   `PARES` — o que mudou, chave a chave, `velho → novo · razão`. O gate exige o corpo = o depois, byte a byte, e o
 *     antes × o depois = EXATAMENTE os pares: mudança fora dos pares reprova (não declarada), par que não casa reprova
 *     (órfão). As chaves comparadas são as do topo e as do `content_data` (um nível; o valor inteiro, em JSON).
 *
 * `Date` é fixado (o `updated_at` do corpo e os `id` de seção/compasso vêm de `new Date()`/`Date.now()`).
 * Texto dos fixtures: do projeto (os exemplos das folhas 5 e 6) ou fabricado (a Tab, D-0) — a regra "anexo não carrega
 * texto de música" não o alcança.
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
// D-0 (div. 1157): o lado do servidor — a rota é a real; só a autenticação e o banco são simulados (`./rota-real.ts`)
vi.mock('@/lib/firebase-server-utils', () => ({ requireAuthServer: async () => ({ uid: 'cn-user', email: 'cn@exemplo.com' }) }))
vi.mock('@/lib/supabase-service', async () => ({ getSupabaseServiceClient: (await import('./rota-real')).clienteSimulado }))

import EditContentPage from '@/app/content/[id]/edit/page'
import { chamadas, motivo, servir } from './rota-real'

const ANTES = path.resolve(__dirname, 'fixtures/editor-put-antes.json')
const DEPOIS = path.resolve(__dirname, 'fixtures/editor-put-depois.json')
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
    // D-0: título e autor fabricados (D0-D18); a edição é a do painel de texto (D0-D6) — antes, uma corda do exemplo
    nome: 'tab (tablatura em texto, sem compassos)',
    content: { ...base, id: ID(4), title: 'Tab de régua D0', artist: 'Autor fabricado', content_type: 'Tab', difficulty: 'Advanced',
      content_data: { tablature: 'e|-------0-----------0-------|\nB|-----1---1-------1---1-----|' } },
    editar: async () => { await mudar(campo('campo-tablatura'), (v) => `${v}\nG|---0-------0---0-------0---|`) },
  },
  {
    // D-0 (D0-D23): uma linha COM anotação — o corpo da main a zerava
    nome: 'letra com anotações',
    content: { ...base, id: ID(6), title: 'Batch três', artist: null, content_type: 'Lyrics', difficulty: 'Beginner',
      content_data: { lyrics: 'Primeira estrofe da música três', annotations: [{ id: 1, texto: 'anotação do CN', pos: { x: 10, y: 20 } }] } },
    editar: async () => { await mudar(campo('campo-notas'), () => 'nota do CN') },
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

/** O valor de uma chave que não existe num dos lados do par. */
const AUSENTE = '(ausente)'
interface Par { caso: string; chave: string; velho: unknown; novo: unknown; razao: string }
const EXEMPLO_EDITADO = [{ id: 1, strings: ['E|--0--3--0--2--0--5|', 'B|--1--1--1--1--1--|', 'G|--0--0--0--0--0--|', 'D|--2--2--2--2--2--|', 'A|--3-------------|', 'E|----------------|'] }]
const TAB_VELHA = 'e|-------0-----------0-------|\nB|-----1---1-------1---1-----|'
const DIF = 'D0-D19 (div. 1152): a dificuldade vazia vai null — o esquema da rota aceita null e recusa ""'
/** D-0, commit 2: o que o corpo do `PUT` muda, de propósito, caso a caso (regra 14). */
const PARES: Par[] = [
  { caso: 'cifra em texto (a forma de hoje da cifra)', chave: 'difficulty', velho: '', novo: null, razao: DIF },
  { caso: 'cifra em seções', chave: 'difficulty', velho: '', novo: null, razao: DIF },
  { caso: 'letra', chave: 'difficulty', velho: '', novo: null, razao: DIF },
  { caso: 'tab (tablatura em texto, sem compassos)', chave: 'content_data.tablature', velho: TAB_VELHA, novo: `${TAB_VELHA}\nG|---0-------0---0-------0---|`,
    razao: 'D0-D6: a edição vai à tablature, a chave que os leitores leem (antes ela viajava intacta e a edição ia a measures)' },
  { caso: 'tab (tablatura em texto, sem compassos)', chave: 'content_data.measures', velho: EXEMPLO_EDITADO, novo: AUSENTE,
    razao: 'D0-D7: o editor de compassos e o compasso de exemplo saíram — o exemplo não se grava mais (a linha não tinha measures)' },
  { caso: 'letra com anotações', chave: 'content_data.annotations', velho: [], novo: [{ id: 1, texto: 'anotação do CN', pos: { x: 10, y: 20 } }],
    razao: 'D0-D23 (div. 1168): o editor parte do annotations que a linha tem — a main o zerava em todo salvar' },
  { caso: 'partitura (PDF)', chave: 'difficulty', velho: '', novo: null, razao: DIF },
  { caso: 'partitura (PDF)', chave: 'content_data', velho: { annotations: [] }, novo: null,
    razao: 'D0-D22: o content_data nulo que nenhum editor de tipo tocou vai null, como estava na linha' },
]

/** As chaves do par: as do topo e, quando os dois lados têm `content_data` objeto, as dele (um nível). */
function chaves(a: Record<string, unknown>, b: Record<string, unknown>): Map<string, [unknown, unknown]> {
  const m = new Map<string, [unknown, unknown]>()
  const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (k === 'content_data' && obj(a[k]) && obj(b[k])) {
      const x = a[k] as Record<string, unknown>, y = b[k] as Record<string, unknown>
      for (const j of new Set([...Object.keys(x), ...Object.keys(y)])) m.set(`content_data.${j}`, [j in x ? x[j] : AUSENTE, j in y ? y[j] : AUSENTE])
    } else m.set(k, [k in a ? a[k] : AUSENTE, k in b ? b[k] : AUSENTE])
  }
  return m
}

/** O botão de salvar — o nome muda no redesenho (antes *Save Changes*); o clique é o mesmo. */
const salvar = async () => fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-29T12:00:00.000Z'))
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('I1-PR11 / D-0 — o corpo do PUT do editor: a rota aceita, byte a byte o depois, e o antes × o depois = os pares', () => {
  const gravados: Record<string, string> = {}
  for (const c of CASOS) {
    it(c.nome, async () => {
      params.id = String(c.content.id)
      servir(c.content)
      render(<EditContentPage />)
      await c.editar()
      await salvar()
      await waitFor(() => expect(chamadas.respostas).toHaveLength(1))
      const corpo = chamadas.corpos[0]
      const resposta = chamadas.respostas[0]
      // regra 4: o tamanho do que se leu, e o que a rota disse
      console.log(`PUT do editor · ${c.nome}: corpo ${corpo.length} B · rota ${motivo(resposta)}`)
      // D-0 (div. 1157): primeiro o servidor aceita — e nada que ele recuse se grava como fixture; só então os bytes
      expect(resposta.status, `o servidor recusou o corpo: ${motivo(resposta)}`).toBe(200)
      gravados[c.nome] = corpo
      if (process.env.CN_GRAVAR) return
      const depois = JSON.parse(fs.readFileSync(DEPOIS, 'utf8')) as Record<string, string>
      expect(corpo, 'o corpo do editor = o depois, byte a byte').toBe(depois[c.nome])
      // o par: o antes × o depois mudam EXATAMENTE nas chaves declaradas, de velho para novo
      const antes = JSON.parse(fs.readFileSync(ANTES, 'utf8')) as Record<string, string>
      const mudou = [...chaves(JSON.parse(antes[c.nome]), JSON.parse(depois[c.nome]))]
        .filter(([, [v, n]]) => JSON.stringify(v) !== JSON.stringify(n))
      const pares = PARES.filter((p) => p.caso === c.nome)
      const naoDeclaradas = mudou.filter(([k]) => !pares.some((p) => p.chave === k)).map(([k, [v, n]]) => `${k}: ${JSON.stringify(v)} → ${JSON.stringify(n)}`)
      const orfaos = pares.filter((p) => {
        const m = mudou.find(([k]) => k === p.chave)
        return !m || JSON.stringify(m[1][0]) !== JSON.stringify(p.velho) || JSON.stringify(m[1][1]) !== JSON.stringify(p.novo)
      }).map((p) => `${p.chave}: ${JSON.stringify(p.velho)} → ${JSON.stringify(p.novo)}`)
      console.log(`  par · ${c.nome}: chaves que mudaram ${mudou.length} · pares declarados ${pares.length} · não declaradas ${naoDeclaradas.length} · órfãos ${orfaos.length}`)
      expect(naoDeclaradas, 'mudança NÃO DECLARADA no corpo do PUT').toEqual([])
      expect(orfaos, 'par ÓRFÃO (declarado e não casa com o antes × o depois)').toEqual([])
    }, 20_000)
  }
  it('nenhum par fora dos casos (órfão de caso)', () => {
    const nomes = new Set(CASOS.map((c) => c.nome))
    expect(PARES.filter((p) => !nomes.has(p.caso)).map((p) => p.caso)).toEqual([])
  })
  it.runIf(!!process.env.CN_GRAVAR)('grava o depois (CN_GRAVAR=1, D-0 commit 2, só com a rota dizendo 200)', () => {
    // só com TODOS os casos gravados: um caso que a rota recusou não entra em `gravados`, e gravar assim truncaria o
    // depois sem nenhum vermelho no lugar (o controle negativo 5 da D-0-PR1 o achou — div. 1161)
    const faltam = CASOS.map((c) => c.nome).filter((n) => !(n in gravados))
    expect(faltam, 'casos sem corpo aceito pela rota — o depois NÃO se grava').toEqual([])
    fs.writeFileSync(DEPOIS, JSON.stringify(gravados, null, 1) + '\n')
  })
})
