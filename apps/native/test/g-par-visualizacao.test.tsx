/**
 * G-par DA VISUALIZAÇÃO (N4-PR8; `N4-PRECHECK.md` A12; `N4-REQUISITOS.md` §3, PR-8: *"o G-par sobre o nó `corpo` de
 * V"*) — o mesmo content mostra o mesmo texto no site e na visualização do tablet.
 *
 * O PAR, por item do `par` de `packages/core/fixtures/g-par.json` (a fixture do G-par da N4-PR1, sem nenhum item novo):
 *   (site) o que o `ContentDisplay` do site mostra — o RETRATO `packages/core/fixtures/g-par-site.json`, que o
 *          `tests/gates/n4-g-par.test.tsx` cobra byte a byte contra o site renderizado (os dois lados rodam em projetos
 *          diferentes do Vitest; o arquivo no meio é cobrado pelos dois, e nenhum se cala sozinho);
 *   (V)    o que a VISUALIZAÇÃO desenha, montada com o item: o texto do nó `corpo` (o leitor do palco), ou o arquivo que
 *          o leitor de PDF abre (a `source.uri` do duplo do `react-native-pdf`), ou nenhum dos dois (o placeholder).
 *
 * A COMPARAÇÃO é a do G-par da N4-PR1 — três classes, `texto` × `texto` byte a byte sem normalização nenhuma, `arquivo`
 * × `arquivo` pela URL, `sem-corpo` × `sem-corpo` igual, classes diferentes reprovam. Os `fora_do_par` são impressos e
 * contados, não reprovam (as formas que só o site lê, Bloco D — o mesmo destino do G-par da N4-PR1).
 *
 * O gate imprime o TAMANHO do que leu (regra 4): itens, pares, iguais, diferentes (com os dois comprimentos), fora do par,
 * e confere que o retrato tem EXATAMENTE os ids do par (um retrato velho, de outra fixture, reprova).
 *
 * QL-PR1 (QL-D16; div. 1185) — O TEXTO LÓGICO. Com a quebra (QL) o nó `corpo` de V passa a ter as LINHAS VISUAIS, não
 * o texto. O `texto` × `texto` deixa de ser byte a byte do nó: o lado de V vale como o texto do site quando as linhas
 * desenhadas são uma QUEBRA dele (`ehQuebraDe`, `apps/native/scripts/texto-logico.mjs`: só o recuo de 2 e espaço entre
 * os pedaços mudam; uma letra trocada, uma palavra a menos ou uma linha fora de ordem reprovam). E o gate passa a rodar
 * DUAS VEZES: em C como sempre, e com o duplo em **26 colunas** (`__colunas(26)`, a largura de A e do palco em pé no
 * zoom 40), onde linhas da fixture passam da coluna. Antes o duplo nunca chamava `onLayout`, e o G-par passaria sem
 * ver a quebra (div. 1185).
 *
 * `O_LEITOR_QUEBRA` é a declaração do estado do leitor: `false` até a PR-3 — e então V não pode mostrar continuação
 * nenhuma (uma quebra sem a declaração reprova); `true` desde a PR-3 — e então todo item de texto com linha acima de 26
 * colunas (fora a Tab) tem de mostrar continuação em 26 (um leitor que ignore as colunas do duplo reprova).
 */
import './dev-flag'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO } from '@octavia/core'
import { desmontar, montar } from './tela'
import { __colunas } from './fake-react-native'
import { ehQuebraDe } from '../scripts/texto-logico.mjs'

/** O estado do leitor de V: quebra o corpo? `false` até a PR-3 do QL (ver o cabeçalho). */
const O_LEITOR_QUEBRA = false
const COLUNAS_ESTREITAS = 26

// O que a visualização traz consigo: o favoritar (→ a API → o Firebase) e a rede — os duplos de sempre.
vi.mock('../src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-g-par' } } }))
vi.mock('expo-network', () => ({
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
  addNetworkStateListener: () => ({ remove: () => undefined }),
}))
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }))
vi.mock('@react-navigation/native', () => ({ useFocusEffect: () => undefined }))
// O arquivo: está no aparelho, e o leitor abre o que pediu — a `uri` devolvida É a URL pedida, para a comparação ler
// no nó do PDF o arquivo que V mandou abrir.
vi.mock('../src/files', () => ({
  hasFile: () => true,
  knownBytes: () => null,
  fileNameFromUrl: (url: string) => url.split('/').pop() ?? url,
  fraseDaFalha: () => 'não consegui baixar',
  ensureFile: async (url: string) => ({ uri: url, src: 'disk', bytes: 1 }),
}))

const { VisualizacaoScreen } = await import('../src/screens/VisualizacaoScreen')

const FIXTURES = path.resolve(__dirname, '../../../packages/core/fixtures')
type Dados = Record<string, unknown> | null
interface Item { id: string; razao?: string; destino?: string; content_type: string; file_url: string | null; content_data: Dados }
interface Fixture { par: Item[]; fora_do_par: Item[] }
type Lado = { classe: 'texto'; texto: string } | { classe: 'arquivo'; url: string } | { classe: 'sem-corpo' }
type LadoV = { classe: 'texto'; linhas: string[] } | { classe: 'arquivo'; url: string } | { classe: 'sem-corpo' }

/**
 * As linhas DESENHADAS do nó `corpo`: um `Text` (o `span` do duplo) é um bloco de texto corrido — o RN junta os `Text`
 * aninhados na mesma linha —, partido no `\n`; uma `View` (o `div`) empilha os filhos, cada um nas suas linhas. Hoje o
 * `corpo` é um `Text` só; a PR-3 pode desenhar uma linha por nó, e a leitura é a mesma.
 */
function linhasDesenhadas(el: Element): string[] {
  if (el.tagName === 'SPAN') return (el.textContent ?? '').split('\n')
  return [...el.children].flatMap(linhasDesenhadas)
}

function conteudo(it: Item): ContentDTO {
  return {
    id: it.id, title: 'G-par', artist: null, album: null, content_type: it.content_type as ContentDTO['content_type'],
    content_data: it.content_data, file_url: it.file_url, updated_at: '2026-09-10T15:00:00.000Z',
  }
}

async function visualizacao(it: Item): Promise<LadoV> {
  await montar(
    <VisualizacaoScreen
      content={conteudo(it)}
      online
      onVoltar={() => undefined}
      onTocar={() => undefined}
      onArquivosMudaram={() => undefined}
    />,
  )
  try {
    // o leitor de PDF assenta depois do `ensureFile` (uma volta do laço)
    await new Promise((r) => setTimeout(r, 0))
    const corpo = document.querySelector<HTMLElement>('[data-testid="corpo"]')
    if (corpo !== null) return { classe: 'texto', linhas: linhasDesenhadas(corpo) }
    const pdf = document.querySelector<HTMLElement>('[data-pdf="true"]')
    if (pdf !== null) return { classe: 'arquivo', url: pdf.getAttribute('data-uri') ?? '' }
    return { classe: 'sem-corpo' }
  } finally {
    desmontar()
  }
}

/** O site e V: `texto` × `texto` pelo TEXTO LÓGICO (a quebra vale), `arquivo` pela URL, `sem-corpo` igual. */
function comparar(s: Lado, v: LadoV): { igual: boolean; continuacoes: number } {
  if (s.classe === 'texto' && v.classe === 'texto') {
    const r = ehQuebraDe(v.linhas, s.texto)
    return { igual: r.ok, continuacoes: r.continuacoes }
  }
  if (s.classe === 'arquivo' && v.classe === 'arquivo') return { igual: s.url === v.url, continuacoes: 0 }
  return { igual: s.classe === v.classe, continuacoes: 0 }
}

const descrever = (l: Lado | LadoV): string =>
  l.classe === 'texto'
    ? 'texto' in l
      ? `texto(${l.texto.length})`
      : `texto(${l.linhas.join('\n').length}; ${l.linhas.length} linhas)`
    : l.classe === 'arquivo'
      ? `arquivo(${l.url.length})`
      : 'sem-corpo'

/** As linhas lógicas acima de `n` colunas num texto do site (a Tab não quebra: fica de fora). */
const acimaDe = (s: Lado | undefined, tipo: string, n: number): number =>
  s?.classe === 'texto' && tipo !== 'Tab' ? s.texto.split('\n').filter((l) => l.length > n).length : 0

afterEach(() => desmontar())

describe('G-par da visualização (N4-PR8) — o nó corpo de V mostra o que o site mostra', () => {
  it.each([
    ['C (a coluna de V, 55)', undefined],
    [`${COLUNAS_ESTREITAS} colunas (o duplo com colunas, QL-PR1)`, COLUNAS_ESTREITAS],
  ])('cada item do par: V igual ao retrato do site pelo texto lógico — %s', async (rotulo, colunas) => {
    const fx = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'g-par.json'), 'utf8')) as Fixture
    const site = (JSON.parse(fs.readFileSync(path.join(FIXTURES, 'g-par-site.json'), 'utf8')) as { itens: Record<string, Lado> }).itens

    __colunas(colunas)
    const out: string[] = []
    const diferentes: string[] = []
    const cegos: string[] = []
    let iguais = 0
    let continuacoes = 0
    let acima = 0
    try {
      for (const it of fx.par) {
        const s = site[it.id]
        const v = await visualizacao(it)
        const c = s === undefined ? { igual: false, continuacoes: 0 } : comparar(s, v)
        const n = colunas === undefined ? 0 : acimaDe(s, it.content_type, colunas)
        acima += n
        continuacoes += c.continuacoes
        if (c.igual) iguais++
        else diferentes.push(it.id)
        if (O_LEITOR_QUEBRA && n > 0 && c.continuacoes === 0) cegos.push(it.id)
        const estado = !c.igual ? 'DIFERENTE' : c.continuacoes > 0 ? 'QUEBRA   ' : 'IGUAL    '
        out.push(
          `  ${estado} ${it.id.padEnd(28)} site=${s === undefined ? '(sem retrato)' : descrever(s).padEnd(16)} V=${descrever(v)}` +
            (c.continuacoes > 0 ? ` · ${c.continuacoes} continuações` : '') +
            (n > 0 ? ` · ${n} linha(s) acima de ${colunas}` : ''),
        )
      }
      out.push('', `fora do par (${fx.fora_do_par.length}) — impressos e contados, não reprovam:`)
      for (const it of fx.fora_do_par) {
        out.push(`  ${it.id.padEnd(28)} V=${descrever(await visualizacao(it)).padEnd(16)} — ${it.razao} → ${it.destino}`)
      }
    } finally {
      __colunas()
    }
    console.log(
      [
        `G-par da visualização [${rotulo}] — itens ${fx.par.length + fx.fora_do_par.length} · pares ${fx.par.length} · iguais ${iguais} · diferentes ${diferentes.length} · fora do par ${fx.fora_do_par.length} · retrato do site ${Object.keys(site).length}`,
        `  o leitor quebra: ${O_LEITOR_QUEBRA ? 'sim (PR-3)' : 'não (até a PR-3)'} · linhas do par acima da coluna: ${acima} · continuações vistas em V: ${continuacoes}`,
        ...out,
        diferentes.length ? `G-par da visualização: ✗ reprova (${diferentes.join(', ')})` : 'G-par da visualização: zero diferenças ✓',
      ].join('\n'),
    )

    expect(fx.par.length, 'G-par sem pares: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(Object.keys(site).sort(), 'o retrato do site tem de ter exatamente os ids do par').toStrictEqual(fx.par.map((i) => i.id).sort())
    expect(diferentes, 'V diferente do site').toEqual([])
    if (!O_LEITOR_QUEBRA) expect(continuacoes, 'V quebrou o corpo sem a declaração O_LEITOR_QUEBRA = true').toBe(0)
    else expect(cegos, 'linha acima da coluna e V sem continuação: o leitor não viu as colunas do duplo').toEqual([])
  })
})
