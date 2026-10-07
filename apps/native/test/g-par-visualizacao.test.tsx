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
 */
import './dev-flag'
import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContentDTO } from '@octavia/core'
import { desmontar, montar } from './tela'

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

function conteudo(it: Item): ContentDTO {
  return {
    id: it.id, title: 'G-par', artist: null, album: null, content_type: it.content_type as ContentDTO['content_type'],
    content_data: it.content_data, file_url: it.file_url, updated_at: '2026-09-10T15:00:00.000Z',
  }
}

async function visualizacao(it: Item): Promise<Lado> {
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
    if (corpo !== null) return { classe: 'texto', texto: corpo.textContent ?? '' }
    const pdf = document.querySelector<HTMLElement>('[data-pdf="true"]')
    if (pdf !== null) return { classe: 'arquivo', url: pdf.getAttribute('data-uri') ?? '' }
    return { classe: 'sem-corpo' }
  } finally {
    desmontar()
  }
}

const igual = (a: Lado, b: Lado): boolean =>
  a.classe === b.classe &&
  (a.classe === 'texto' ? a.texto === (b as { texto: string }).texto
    : a.classe === 'arquivo' ? a.url === (b as { url: string }).url : true)

const descrever = (l: Lado): string =>
  l.classe === 'texto' ? `texto(${l.texto.length})` : l.classe === 'arquivo' ? `arquivo(${l.url.length})` : 'sem-corpo'

afterEach(() => desmontar())

describe('G-par da visualização (N4-PR8) — o nó corpo de V mostra o que o site mostra', () => {
  it('cada item do par: V igual ao retrato do site, byte a byte', async () => {
    const fx = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'g-par.json'), 'utf8')) as Fixture
    const site = (JSON.parse(fs.readFileSync(path.join(FIXTURES, 'g-par-site.json'), 'utf8')) as { itens: Record<string, Lado> }).itens

    const out: string[] = []
    const diferentes: string[] = []
    let iguais = 0
    for (const it of fx.par) {
      const s = site[it.id]
      const v = await visualizacao(it)
      const ok = s !== undefined && igual(s, v)
      if (ok) iguais++
      else diferentes.push(it.id)
      out.push(`  ${ok ? 'IGUAL    ' : 'DIFERENTE'} ${it.id.padEnd(28)} site=${s === undefined ? '(sem retrato)' : descrever(s).padEnd(16)} V=${descrever(v)}`)
    }
    out.push('', `fora do par (${fx.fora_do_par.length}) — impressos e contados, não reprovam:`)
    for (const it of fx.fora_do_par) {
      out.push(`  ${it.id.padEnd(28)} V=${descrever(await visualizacao(it)).padEnd(16)} — ${it.razao} → ${it.destino}`)
    }
    console.log(
      [
        `G-par da visualização — itens ${fx.par.length + fx.fora_do_par.length} · pares ${fx.par.length} · iguais ${iguais} · diferentes ${diferentes.length} · fora do par ${fx.fora_do_par.length} · retrato do site ${Object.keys(site).length}`,
        ...out,
        diferentes.length ? `G-par da visualização: ✗ reprova (${diferentes.join(', ')})` : 'G-par da visualização: zero diferenças ✓',
      ].join('\n'),
    )

    expect(fx.par.length, 'G-par sem pares: não mediu nada (regra 4)').toBeGreaterThan(0)
    expect(Object.keys(site).sort(), 'o retrato do site tem de ter exatamente os ids do par').toStrictEqual(fx.par.map((i) => i.id).sort())
    expect(diferentes, 'V diferente do site').toEqual([])
  })
})
