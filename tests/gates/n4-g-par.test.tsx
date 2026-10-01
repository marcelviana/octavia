/**
 * G-par (N4-D19; N4-PR1) — o mesmo content mostra o mesmo texto no web e no nativo.
 *
 * O PAR, por item da fixture (`packages/core/fixtures/g-par.json`):
 *   (web)    o corpo do PAINEL PRINCIPAL do tipo, como o `ContentDisplay` real o desenha
 *            (`components/content-viewer/ContentDisplay.tsx` → `normalizeContentType` → os `*Display` →
 *            `components/content/corpo-de-texto.ts`): o primeiro `section[data-testid^="painel-"]` montado.
 *            O SEGUNDO painel *Cifra* que a Letra e a Tab mostram (`textoDosAcordes`, I1-E18) fica FORA do par,
 *            declarado (N4-PR1 §1).
 *   (nativo) a validade e o corpo do contrato de leitura do core (`packages/core/src/content-contract.ts`,
 *            `isValidContent` + `bodyOf`) — o que o palco usa (`StageScreen.tsx`, N4-PRECHECK A2).
 *
 * A COMPARAÇÃO tem três classes de cada lado — `texto`, `arquivo`, `sem-corpo`:
 *   texto × texto       → byte a byte (a cadeia, sem normalização nenhuma);
 *   arquivo × arquivo   → a URL que cada lado abre (web: a do visualizador/imagem; nativo: o `file_url`, que é o que
 *                         o palco abre quando a validade diz `body: 'file'`);
 *   sem-corpo × sem-corpo → igual (o motivo do core é impresso, não comparado: o web não tem motivo);
 *   classes diferentes  → diferente.
 *   NORMALIZAÇÃO: nenhuma. O texto do web é o `textContent` do corpo mono do painel — para a Letra, o `<pre>` do
 *   `MusicText`, que tira `**`/`*`/`__`/`_` de marcação: é o que o músico vê, e não é normalização do gate (a
 *   fixture não tem marcação; se tiver um dia, a diferença é real e aparece).
 *
 * O VEREDITO (molde: a lista de exceções com ÓRFÃ REPROVANDO, regra 14 do `LOGS-OCTAVIA.md`, e a linha de base
 * que reprova por construção, `tests/gates-web/medicoes/cn-main/` do G-faixa): o gate REPROVA EXATAMENTE a lista de
 * `packages/core/fixtures/g-par-reprovados.txt`. Reprovado fora da lista = "reprovação não declarada"; item da lista
 * que passa (ou que não existe na fixture) = "declaração órfã". Lista vazia = zero reprovações (a PR-2).
 *
 * FORA DO PAR: `fora_do_par` da fixture — formas que só o web lê e que a B2 não achou no dado real. Impressas e
 * contadas em toda corrida, com o resultado de cada lado; não reprovam e não somem.
 *
 * O gate imprime o TAMANHO do que leu (regra 4): itens, pares comparados, iguais, diferentes (id e os dois
 * comprimentos), fora do par.
 */
import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

// a `LinhaDaTela` do topo lê a sessão; aberta = nenhuma linha (o par não depende dela)
vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({ user: null, profile: null, isLoading: false, signOut: vi.fn(), sessao: { estado: 'aberta' }, tentarSessaoDeNovo: vi.fn() }),
}))
vi.mock('@/components/pdf-viewer', () => ({ default: ({ url }: { url: string }) => <div data-testid="pdf-viewer" data-url={url} /> }))
vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { ContentDisplay } from '@/components/content-viewer/ContentDisplay'
import type { ConteudoVisto } from '@/components/content/tipos'
import { bodyOf, isValidContent } from '../../packages/core/src/content-contract'

const FIXTURES = path.resolve(__dirname, '../../packages/core/fixtures')
type Dados = Record<string, unknown> | null
interface Item { id: string; nota?: string; razao?: string; destino?: string; content_type: string; file_url: string | null; content_data: Dados }
interface Fixture { par: Item[]; fora_do_par: Item[] }
type Lado = { classe: 'texto'; texto: string } | { classe: 'arquivo'; url: string } | { classe: 'sem-corpo'; motivo?: string }

const linha = {
  user_id: 'g-par', artist: null, album: null, bpm: null, capo: null, difficulty: null, genre: null, is_favorite: false,
  is_public: false, key: null, notes: null, tags: null, thumbnail_url: null, time_signature: null, tuning: null,
  created_at: '2026-09-10T15:00:00.000Z', updated_at: '2026-09-10T15:00:00.000Z', title: 'G-par',
}

function web(it: Item): Lado & { painel: string } {
  const content = { ...linha, id: it.id, content_type: it.content_type, file_url: it.file_url, content_data: it.content_data } as unknown as ConteudoVisto
  const { container } = render(<ContentDisplay content={content} />)
  try {
    const painel = container.querySelector('section[data-testid^="painel-"]')
    if (!painel) throw new Error(`G-par: ${it.id} — o web não montou painel nenhum`)
    const p = painel.getAttribute('data-testid') ?? '?'
    const visualizador = painel.querySelector('[data-testid="pdf-viewer"]')
    if (visualizador) return { painel: p, classe: 'arquivo', url: visualizador.getAttribute('data-url') ?? '' }
    const imagem = painel.querySelector('img')
    if (imagem) return { painel: p, classe: 'arquivo', url: imagem.getAttribute('src') ?? '' }
    const corpo = painel.querySelector('[data-rolagem="painel"] > div')
    if (corpo) return { painel: p, classe: 'texto', texto: corpo.textContent ?? '' }
    return { painel: p, classe: 'sem-corpo' }
  } finally { cleanup() }
}

function nativo(it: Item): Lado {
  const v = isValidContent(it.content_type, it.content_data, it.file_url)
  if (!v.ok) return { classe: 'sem-corpo', motivo: v.reason }
  if (v.body === 'file') return { classe: 'arquivo', url: it.file_url ?? '' }
  return { classe: 'texto', texto: bodyOf(it.content_type, it.content_data) ?? '' }
}

const igual = (a: Lado, b: Lado) =>
  a.classe === b.classe &&
  (a.classe === 'texto' ? a.texto === (b as { texto: string }).texto
    : a.classe === 'arquivo' ? a.url === (b as { url: string }).url : true)

const descrever = (l: Lado) =>
  l.classe === 'texto' ? `texto(${l.texto.length})` : l.classe === 'arquivo' ? `arquivo(${l.url.length})` : `sem-corpo${l.motivo ? `:${l.motivo}` : ''}`

afterEach(() => cleanup())

describe('G-par (N4-PR1) — o mesmo content, o mesmo texto no web e no nativo', () => {
  it('reprova exatamente a lista de g-par-reprovados.txt', () => {
    const fx = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'g-par.json'), 'utf8')) as Fixture
    const esperados = fs.readFileSync(path.join(FIXTURES, 'g-par-reprovados.txt'), 'utf8')
      .split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean)

    const out: string[] = []
    const reprovados: string[] = []
    let iguais = 0
    for (const it of fx.par) {
      const w = web(it), n = nativo(it)
      const ok = igual(w, n)
      if (ok) iguais++; else reprovados.push(it.id)
      out.push(`  ${ok ? 'IGUAL    ' : 'DIFERENTE'} ${it.id.padEnd(28)} web=${descrever(w).padEnd(16)} nativo=${descrever(n).padEnd(22)} [${w.painel}]`)
    }
    out.push('', `fora do par (${fx.fora_do_par.length}) — impressos e contados, não reprovam:`)
    for (const it of fx.fora_do_par) {
      const w = web(it), n = nativo(it)
      out.push(`  ${igual(w, n) ? 'igual    ' : 'diferente'} ${it.id.padEnd(28)} web=${descrever(w).padEnd(16)} nativo=${descrever(n).padEnd(22)} — ${it.razao} → ${it.destino}`)
    }

    const ids = new Set(fx.par.map((i) => i.id))
    const naoDeclarados = reprovados.filter((id) => !esperados.includes(id))
    const orfas = esperados.filter((id) => !reprovados.includes(id))
    const resumo = [
      `G-par — itens ${fx.par.length + fx.fora_do_par.length} · pares comparados ${fx.par.length} · iguais ${iguais} · diferentes ${reprovados.length} · fora do par ${fx.fora_do_par.length}`,
      ...out,
      '',
      `lista esperada (${esperados.length}): ${esperados.join(', ') || '(vazia)'}`,
      `reprovados     (${reprovados.length}): ${reprovados.join(', ') || '(nenhum)'}`,
      ...naoDeclarados.map((id) => `  ✗ reprovação NÃO DECLARADA: ${id}`),
      ...orfas.map((id) => `  ✗ declaração ÓRFÃ: ${id}${ids.has(id) ? ' (passa)' : ' (não existe na fixture)'}`),
      naoDeclarados.length || orfas.length ? 'G-par: ✗ a reprovação não é a lista esperada' : `G-par: reprova exatamente a lista esperada (${esperados.length}) ✓`,
    ].join('\n')
    console.log(resumo)

    expect(ids.size, 'ids repetidos na fixture').toBe(fx.par.length)
    expect(fx.par.length, 'G-par sem pares: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(naoDeclarados, 'reprovação não declarada').toEqual([])
    expect(orfas, 'declaração órfã').toEqual([])
  })
})
