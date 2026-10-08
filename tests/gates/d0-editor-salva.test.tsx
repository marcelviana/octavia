/**
 * Gate da D-0 — **o editor do site salva, e o que ele salva os leitores mostram** (D0-D6…D8, D0-D13, D0-D19, D0-D21,
 * D0-D22; `docs/ux/D0-PRECHECK.md` §8, §10; `docs/ux/D0-PR1-anexos/README.md`).
 *
 * Monta a ROTA do editor (`app/content/[id]/edit/page.tsx`) com um content FABRICADO e leva o `PUT` à ROTA REAL
 * (`./rota-real.ts`: o esquema e o contrato de escrita de verdade; autenticação e banco simulados — o molde do M0). Cada
 * caso diz o status que a rota devolveu e, quando é o caso, a linha como ficaria no banco (`gravada()`), lida pelos
 * DOIS leitores: o do site (`components/content/corpo-de-texto.ts`, o que o `TabDisplay` desenha) e o contrato de
 * leitura do core (`packages/core/src/content-contract.ts`, o que o palco usa).
 *
 * Os grupos:
 *   (a) todo tipo × dificuldade (preenchida e nula) salva com 200 — a div. 1152 (D0-D19);
 *   (b) a Tab na forma do upload (`content_data: null`, com arquivo) salva com 200 pelos dois caminhos do M0 (*Detalhes*
 *       e o editor de tab — *Informações* e o painel de texto); por *Detalhes*, o `content_data` nulo fica nulo (D0-D22);
 *   (c) a Cifra com `content_data` nulo salva com 200 (D0-D21); a escaneada segue sendo ARQUIVO para o core (D0-D22);
 *   (d) editar o texto de uma Tab e salvar: a `tablature` editada vai no corpo, e os dois leitores a mostram; o
 *       `content_data` gravado é o item `tab-editada-no-site` do G-par (`packages/core/fixtures/g-par.json`), que o
 *       `tests/gates/n4-g-par.test.tsx` lê pelos dois lados;
 *   (e) as três classes de dado do pre-check (§8.2): o editor abre a `tablature`, e salvar não apaga nem altera o
 *       `measures` gravado (D0-D8);
 *   (f) o compasso de exemplo não existe em lugar nenhum do código do site (D0-D7);
 *   (g) o editor não apaga o que não conhece: a chave que nenhum editor de tipo edita, num `content_data` não nulo, volta
 *       no corpo e na linha gravada com o mesmo valor, nos quatro tipos (a Partitura com a chave legada `file`);
 *   (h) as anotações (D0-D23): o `annotations` da linha volta igual; `[]` fica `[]`; sem a chave, o objeto ganha `[]`.
 *
 * Sobre a `main` (gate-first, regra 30) ele REPROVA: (a) nos 4 casos de dificuldade nula; (b) e (c) pelo contrato de
 * escrita; (d), (e) e (f) porque não há painel de texto e o exemplo está no `tab-editor.tsx`. Dado fabricado: nenhum
 * título, autor ou texto de obra real.
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { execFileSync } from 'node:child_process'
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
vi.mock('@/lib/firebase-server-utils', () => ({ requireAuthServer: async () => ({ uid: 'cn-user', email: 'cn@exemplo.com' }) }))
vi.mock('@/lib/supabase-service', async () => ({ getSupabaseServiceClient: (await import('./rota-real')).clienteSimulado }))

import EditContentPage from '@/app/content/[id]/edit/page'
import { textoDaTab } from '@/components/content/corpo-de-texto'
import { bodyOf, isValidContent } from '../../packages/core/src/content-contract'
import { chamadas, gravada, motivo, servir } from './rota-real'

const RAIZ = path.resolve(__dirname, '../..')
const T = '2026-10-08T12:00:00.000Z'
let seq = 0
/** Um id novo por caso: o `getContentById` guarda em cache por id. */
const novoId = () => `00000000-0000-4000-8000-d0${String(++seq).padStart(10, '0')}`
const base = {
  user_id: 'cn-user', title: 'Tab de régua D0', artist: 'Autor fabricado', album: null, bpm: null, capo: null,
  difficulty: null as string | null, genre: null, is_favorite: false, is_public: false, key: null, notes: null, tags: null,
  thumbnail_url: null, time_signature: '4/4', tuning: null, created_at: T, updated_at: T, file_url: null as string | null,
}
// textos fabricados (obra do projeto, D-0): nenhum é trecho de música real
const TAB = 'e|--1--3--|\nB|--3--1--|'
const TAB_EDITADA = 'e|--1--3--5--|\nB|--3--1--0--|\nG|--2--2--2--|'
const EXEMPLO = [{ id: 1, strings: ['E|--0--3--0--2--0--|', 'B|--1--1--1--1--1--|', 'G|--0--0--0--0--0--|', 'D|--2--2--2--2--2--|', 'A|--3-------------|', 'E|----------------|'] }]
const OUTRO = [{ id: 7, strings: ['e|--D0--|', 'B|--D0--|'] }]
const PDF = 'https://d0.exemplo.test/storage/v1/object/public/content-files/d0-arquivo-fabricado.pdf'
const TXT = 'https://d0.exemplo.test/storage/v1/object/public/content-files/d0-arquivo-fabricado.txt'

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(T)) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals() })

const abrir = async (linha: Record<string, unknown>) => {
  params.id = String(linha.id)
  servir(linha)
  render(<EditContentPage />)
  await screen.findByRole('button', { name: 'Salvar', exact: true })
}
const mudar = async (testid: string, valor: string) => {
  const e = (await screen.findAllByTestId(testid))[0] as HTMLInputElement
  fireEvent.change(e, { target: { value: valor } })
}
/** O painel de texto da Tab (D0-D6). Na `main` não existe — o gate diz isso, não um `null` sem nome. */
const painelDaTab = async () => {
  const p = await screen.findByTestId('campo-tablatura', {}, { timeout: 1500 }).catch(() => null)
  if (!p) throw new Error('o editor de Tab não tem painel de texto (campo-tablatura) — abre os compassos, não a tablatura')
  return p as HTMLTextAreaElement
}
const salvar = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Salvar', exact: true }))
  await waitFor(() => expect(chamadas.respostas).toHaveLength(1))
  const corpo = JSON.parse(chamadas.corpos[0]) as Record<string, unknown>
  const r = chamadas.respostas[0]
  console.log(`  rota ${motivo(r)} · corpo ${chamadas.corpos[0].length} B · content_data ${corpo.content_data === null ? 'null' : `{${Object.keys((corpo.content_data ?? {}) as object).length} chaves}`}`)
  return { corpo, status: r.status, motivo: motivo(r) }
}
const dados = (l: Record<string, unknown>) => l.content_data as Record<string, unknown> | null

describe('D-0 — o editor do site salva, e o que salva os leitores mostram', () => {
  // (a) a div. 1152: todo tipo × dificuldade
  const CORPOS: Record<string, { content_data: Record<string, unknown> | null; file_url: string | null }> = {
    Lyrics: { content_data: { lyrics: 'Primeira linha fabricada D0' }, file_url: null },
    Chords: { content_data: { chords: 'C  G\nLa la D0' }, file_url: null },
    Tab: { content_data: { tablature: TAB }, file_url: null },
    Sheet: { content_data: null, file_url: PDF },
  }
  for (const tipo of Object.keys(CORPOS)) for (const dif of [null, 'Intermediate']) {
    it(`(a) ${tipo} · dificuldade ${JSON.stringify(dif)} · uma nota em Detalhes → 200`, async () => {
      await abrir({ ...base, id: novoId(), content_type: tipo, difficulty: dif, ...CORPOS[tipo] })
      await mudar('campo-notas', 'nota fabricada D0')
      const s = await salvar()
      expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
      expect(s.corpo.difficulty, 'a dificuldade vazia vai null (D0-D19)').toBe(dif)
    }, 20_000)
  }

  // (b) a div. 1149: a Tab na forma do upload, pelos dois caminhos do M0
  const upload = () => ({ ...base, id: novoId(), content_type: 'Tab', difficulty: 'Beginner', content_data: null, file_url: TXT })
  it('(b) Tab de upload · Detalhes → 200, e o content_data nulo fica nulo (D0-D22)', async () => {
    await abrir(upload())
    await mudar('campo-titulo', 'Título novo D0')
    const s = await salvar()
    expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
    expect(dados(gravada()), 'o content_data que ninguém editou não vira objeto').toBeNull()
  }, 20_000)
  it('(b) Tab de upload · Informações do editor de tab → 200, com a tablature no corpo (D0-D13)', async () => {
    await abrir(upload())
    await mudar('campo-info-titulo', 'Título novo D0')
    const s = await salvar()
    expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
    expect(typeof dados(s.corpo)?.tablature, 'a tablature vai sempre que o content_data vai como objeto').toBe('string')
  }, 20_000)
  it('(b) Tab de upload · o painel de texto → 200, com o texto digitado', async () => {
    await abrir(upload())
    fireEvent.change(await painelDaTab(), { target: { value: TAB_EDITADA } })
    const s = await salvar()
    expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
    expect(dados(s.corpo)?.tablature).toBe(TAB_EDITADA)
  }, 20_000)

  // (c) a div. 1156 (D0-D21): a Cifra com content_data nulo; a escaneada segue arquivo para o core (D0-D22)
  const cifraNula = (file_url: string | null) => ({ ...base, id: novoId(), title: 'Cifra de régua D0', content_type: 'Chords', difficulty: 'Beginner', content_data: null, file_url })
  it('(c) Cifra com content_data nulo, sem arquivo · Detalhes → 200, nulo fica nulo', async () => {
    await abrir(cifraNula(null))
    await mudar('campo-notas', 'nota fabricada D0')
    const s = await salvar()
    expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
    expect(dados(gravada())).toBeNull()
  }, 20_000)
  it('(c) Cifra escaneada (content_data nulo + PDF) · Detalhes → 200, e o palco segue abrindo o arquivo', async () => {
    await abrir(cifraNula(PDF))
    await mudar('campo-notas', 'nota fabricada D0')
    const s = await salvar()
    expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
    const g = gravada()
    expect(isValidContent('Chords', dados(g), g.file_url as string), 'o core: a cifra escaneada é ARQUIVO (N4-D49)').toEqual({ ok: true, body: 'file' })
  }, 20_000)
  it('(c) Cifra com content_data nulo · uma seção editada → 200, com a chave chords no corpo', async () => {
    await abrir(cifraNula(null))
    await mudar('campo-secao-letra', 'La la D0')
    const s = await salvar()
    expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
    expect(typeof dados(s.corpo)?.chords).toBe('string')
  }, 20_000)

  // (d) editar o texto de uma Tab: a tablature editada no corpo, nos dois leitores, e o item do G-par
  it('(d) Tab · editar o texto e salvar → a tablature editada, nos dois leitores, = o item tab-editada-no-site do G-par', async () => {
    const linha = { ...base, id: '00000000-0000-4000-8000-0000000000d4', content_type: 'Tab', difficulty: 'Beginner', content_data: { tablature: TAB } }
    await abrir(linha)
    const p = await painelDaTab()
    expect(p.value, 'o editor abre a tablatura').toBe(TAB)
    fireEvent.change(p, { target: { value: TAB_EDITADA } })
    const s = await salvar()
    expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
    expect(dados(s.corpo)?.tablature, 'o corpo leva a tablature editada').toBe(TAB_EDITADA)
    const g = dados(gravada())
    expect(textoDaTab(g), 'o leitor do site').toBe(TAB_EDITADA)
    expect(bodyOf('Tab', g), 'o contrato do core').toBe(TAB_EDITADA)
    const fx = JSON.parse(fs.readFileSync(path.join(RAIZ, 'packages/core/fixtures/g-par.json'), 'utf8')) as { par: { id: string; content_data: unknown }[] }
    const item = fx.par.find((i) => i.id === 'tab-editada-no-site')
    expect(item, 'o item tab-editada-no-site está no par do G-par').toBeDefined()
    expect(JSON.stringify(g), 'o content_data gravado é o do item do G-par, byte a byte').toBe(JSON.stringify(item?.content_data))
  }, 20_000)

  // (e) as três classes do pre-check (§8.2): abre a tablature; o measures gravado não se toca (D0-D8)
  const CLASSES: [string, unknown][] = [['1 · sem measures', undefined], ['2 · measures = o exemplo', EXEMPLO], ['3 · measures ≠ o exemplo', OUTRO]]
  for (const [classe, measures] of CLASSES) {
    it(`(e) classe ${classe}: abre a tablature; salvar não apaga nem altera o measures`, async () => {
      const cd: Record<string, unknown> = { tablature: TAB }
      if (measures !== undefined) cd.measures = measures
      await abrir({ ...base, id: novoId(), content_type: 'Tab', difficulty: 'Beginner', content_data: cd })
      const p = await painelDaTab()
      expect(p.value, 'o que o editor mostra ao abrir é a tablature').toBe(TAB)
      fireEvent.change(p, { target: { value: TAB_EDITADA } })
      const s = await salvar()
      expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
      const g = dados(gravada()) ?? {}
      expect(g.tablature).toBe(TAB_EDITADA)
      if (measures === undefined) expect('measures' in g, 'nenhum measures novo').toBe(false)
      else expect(JSON.stringify(g.measures), 'o measures gravado, intacto').toBe(JSON.stringify(measures))
    }, 20_000)
  }

  // (g) o editor não apaga o que não conhece: uma chave que nenhum editor de tipo edita, num `content_data` que NÃO é
  // nulo, volta no corpo com o mesmo valor depois de um salvar por *Detalhes* — a generalização do (e) (D0-D8) aos
  // quatro tipos. A Partitura leva também a chave legada `file` (a forma que o pre-check do N4 mediu na conta principal,
  // `docs/native/N4-PRECHECK.md:950`); os valores são fabricados.
  const DESCONHECIDA = { chave_d0_desconhecida: { origem: 'fabricada D0', n: 7, lista: ['a', 'b'] } }
  const COM_DESCONHECIDA: Record<string, { content_data: Record<string, unknown>; file_url: string | null }> = {
    Lyrics: { content_data: { lyrics: 'Primeira linha fabricada D0', ...DESCONHECIDA }, file_url: null },
    Chords: { content_data: { chords: 'C  G\nLa la D0', ...DESCONHECIDA }, file_url: null },
    Tab: { content_data: { tablature: TAB, ...DESCONHECIDA }, file_url: null },
    Sheet: { content_data: { file: 'd0-legado-fabricado.pdf', ...DESCONHECIDA }, file_url: PDF },
  }
  for (const tipo of Object.keys(COM_DESCONHECIDA)) {
    it(`(g) ${tipo} · uma chave desconhecida no content_data · Notas em Detalhes → a chave volta no corpo, igual`, async () => {
      const linha = { ...base, id: novoId(), content_type: tipo, difficulty: 'Beginner', ...COM_DESCONHECIDA[tipo] }
      await abrir(linha)
      await mudar('campo-notas', 'nota fabricada D0')
      const s = await salvar()
      expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
      const corpo = dados(s.corpo) ?? {}
      const antes = linha.content_data as Record<string, unknown>
      const desconhecidas = Object.keys(antes).filter((k) => !['lyrics', 'chords', 'tablature', 'sections', 'annotations'].includes(k))
      console.log(`  (g) ${tipo}: chaves que nenhum editor edita ${desconhecidas.length} (${desconhecidas.join(', ')}) · no corpo ${desconhecidas.filter((k) => k in corpo).length}`)
      for (const k of desconhecidas) expect(JSON.stringify(corpo[k]), `a chave ${k} perdeu-se ou mudou no corpo`).toBe(JSON.stringify(antes[k]))
      for (const k of desconhecidas) expect(JSON.stringify((dados(gravada()) ?? {})[k]), `a chave ${k} na linha gravada`).toBe(JSON.stringify(antes[k]))
    }, 20_000)
  }

  // (h) as anotações (D0-D23, div. 1168): o editor não zera o `annotations` da linha. Para cada tipo, uma linha com
  // anotação, *Notas* em *Detalhes*, salvar → o `annotations` volta IGUAL no corpo e na linha gravada. E as duas bordas,
  // que já passavam e seguem passando: a linha com `annotations: []` volta `[]`; a linha SEM a chave, com `content_data`
  // objeto, ganha `annotations: []` (o comportamento de sempre — o editor acrescenta a chave quando o objeto vai).
  const ANOTACOES = [{ id: 1, texto: 'anotação fabricada D0', pos: { x: 10, y: 20 } }]
  const BASE_H: Record<string, { content_data: Record<string, unknown>; file_url: string | null }> = {
    Lyrics: { content_data: { lyrics: 'Primeira linha fabricada D0' }, file_url: null },
    Chords: { content_data: { chords: 'C  G\nLa la D0' }, file_url: null },
    Tab: { content_data: { tablature: TAB }, file_url: null },
    Sheet: { content_data: { file: 'd0-legado-fabricado.pdf' }, file_url: PDF },
  }
  const BORDAS: [string, Record<string, unknown>, unknown][] = [
    ['com anotação', { annotations: ANOTACOES }, ANOTACOES],
    ['com annotations: []', { annotations: [] }, []],
    ['sem a chave annotations', {}, []],
  ]
  for (const tipo of Object.keys(BASE_H)) for (const [nome, extra, esperado] of BORDAS) {
    it(`(h) ${tipo} · ${nome} · Notas em Detalhes → o annotations no corpo = ${JSON.stringify(esperado).slice(0, 20)}`, async () => {
      const linha = { ...base, id: novoId(), content_type: tipo, difficulty: 'Beginner', file_url: BASE_H[tipo].file_url,
        content_data: { ...BASE_H[tipo].content_data, ...extra } }
      await abrir(linha)
      await mudar('campo-notas', 'nota fabricada D0')
      const s = await salvar()
      expect(s.status, `a rota recusou: ${s.motivo}`).toBe(200)
      const corpo = dados(s.corpo) ?? {}
      console.log(`  (h) ${tipo} · ${nome}: na linha ${JSON.stringify((linha.content_data as Record<string, unknown>).annotations)} · no corpo ${JSON.stringify(corpo.annotations)}`)
      expect(JSON.stringify(corpo.annotations), 'o annotations no corpo').toBe(JSON.stringify(esperado))
      expect(JSON.stringify((dados(gravada()) ?? {}).annotations), 'o annotations na linha gravada').toBe(JSON.stringify(esperado))
    }, 20_000)
  }

  // (f) o compasso de exemplo não existe no código do site (D0-D7)
  it('(f) o compasso de exemplo não existe em lugar nenhum do código do site', () => {
    const arquivos = execFileSync('git', ['ls-files', '--', 'app', 'components', 'lib', 'hooks', 'contexts', 'types', 'utils', 'middleware.ts'], { cwd: RAIZ, encoding: 'utf8' })
      .split('\n').filter((f) => f && !/(^|\/)__tests__\/|\.test\.|\.spec\./.test(f) && /\.(tsx?|jsx?|mjs)$/.test(f))
    const cordas = EXEMPLO[0].strings.filter((c, i, a) => a.indexOf(c) === i)
    const achados = arquivos.flatMap((f) => {
      const texto = fs.readFileSync(path.join(RAIZ, f), 'utf8')
      return cordas.filter((c) => texto.includes(c)).map((c) => `${f}: ${c}`)
    })
    console.log(`  (f) arquivos do site lidos: ${arquivos.length} · cordas do exemplo procuradas: ${cordas.length} · achados: ${achados.length}`)
    for (const a of achados) console.log(`    ✗ ${a}`)
    expect(arquivos.length, 'nenhum arquivo lido: não mediu nada (regra 4)').toBeGreaterThan(100)
    expect(achados).toEqual([])
  })
})
