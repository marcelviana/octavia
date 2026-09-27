/**
 * G-faixa (I1-PR5) — a classificação, sobre nós sintéticos: cada regra com o
 * caso que reprova e o que passa (regra 7: o instrumento prova que mede).
 * A medição de verdade (navegador) está no anexo da I1-PR5; aqui é a lógica
 * que o veredito do CI refaz sobre o JSON commitado.
 */
import { describe, expect, it } from 'vitest'
// @ts-expect-error — módulo .mjs sem tipos; roda igual no Node do CI e no Vitest
import { classificarEstado, cortes, resumo } from '../../scripts/gates-web/g-faixa-classificar.mjs'

interface No {
  k: string; x: number; y: number; w: number; h: number
  sr?: boolean; clip?: { x: number; y: number; w: number; h: number; rolagem: boolean; painel?: boolean } | null
  corta?: { x: boolean; y: boolean }; h_texto?: string | null; h_nome?: string | null
}
const no = (k: string, x: number, y: number, w: number, h: number, extra: Partial<No> = {}): No =>
  ({ k, x, y, w, h, sr: false, clip: null, corta: { x: false, y: false }, h_texto: k, h_nome: null, ...extra })
const med = (vw: number, nos: No[], scrollWidth = vw) => ({ viewport: { w: vw, h: 800 }, doc: { scrollWidth, clientWidth: vw }, nos })

describe('G-faixa — (b) cortes', () => {
  it('nó dentro do viewport e sem recorte: nenhum (b)', () => {
    expect(cortes(med(711, [no('a', 10, 10, 100, 40)])).b).toEqual([])
  })
  it('nó que passa da borda direita do viewport: (b)', () => {
    expect(cortes(med(711, [no('a', 650, 10, 100, 40)])).b[0]).toMatchObject({ k: 'a', tipo: 'borda do viewport' })
  })
  it('nó fora da gaveta que não rola (overflow hidden): (b); fora de contêiner que rola: saída rolagem, não (b)', () => {
    const clip = { x: 0, y: 0, w: 300, h: 200 }
    const r = cortes(med(711, [
      no('corta', 250, 10, 100, 40, { clip: { ...clip, rolagem: false } }),
      no('rola', 10, 500, 100, 40, { clip: { ...clip, rolagem: true } }),
    ]))
    expect(r.b.map((o: { k: string }) => o.k)).toEqual(['corta'])
    expect(r.rolagem.map((o: { k: string }) => o.k)).toEqual(['rola'])
  })
  it('decisão 621: fora NA HORIZONTAL de contêiner que rola, sem a marca: (b); com data-rolagem="painel": (d′), não (b)', () => {
    const clip = { x: 0, y: 0, w: 300, h: 200, rolagem: true }
    const semMarca = cortes(med(711, [no('h', 280, 10, 100, 40, { clip: { ...clip, painel: false } })]))
    expect(semMarca.b[0]).toMatchObject({ k: 'h', tipo: 'rolagem horizontal de contêiner' })
    const comMarca = med(711, [no('p', 280, 10, 100, 40, { clip: { ...clip, painel: true } })])
    expect(cortes(comMarca).b).toEqual([])
    const c = classificarEstado({ larguras: { 711: comMarca } })
    expect(c['711'].b).toEqual([])
    expect(c['711'].dl).toMatchObject([{ k: 'p', painel: expect.stringContaining('decisão 621') }])
  })
  it('texto que transborda o próprio nó com overflow escondido (elidir): (b)', () => {
    expect(cortes(med(711, [no('t', 10, 10, 100, 20, { corta: { x: true, y: false } })])).b[0]).toMatchObject({ tipo: 'conteúdo cortado no próprio nó' })
  })
  it('página com rolagem horizontal: (b); nó sr-only fora de tudo: nada', () => {
    const r = cortes(med(711, [no('sr', -10000, 0, 1, 1, { sr: true })], 740))
    expect(r.b).toEqual([{ k: '(página)', tipo: 'página com rolagem horizontal', de: 711, para: 740 }])
  })
})

describe('G-faixa — (e), (d′) e as saídas contra 1138', () => {
  const ref = med(1138, [no('nav', 10, 10, 120, 40), no('titulo', 10, 60, 600, 30), no('adicionar', 10, 100, 200, 48), no('zero', 10, 150, 80, 20)])
  it('some em 711: (e) "sem nó"; largura zero: (e); quebrou linha: (d′); nome longo no aria-label: saída nome-acessível', () => {
    const b = med(711, [
      no('titulo', 10, 60, 400, 60), // mais estreito e mais alto → (d′)
      no('curto', 10, 100, 120, 48, { h_texto: 'curto', h_nome: 'adicionar' }), // o texto de 1138 é o nome acessível aqui
      no('zero', 10, 150, 0, 20),
    ])
    const c = classificarEstado({ larguras: { 1138: ref, 711: b } })
    expect(c['711'].e).toEqual([
      { k: 'nav', tipo: 'sem nó', ref: [10, 10, 120, 40] },
      { k: 'zero', tipo: 'largura zero', w: 0, h: 20 },
    ])
    expect(c['711'].dl.map((o: { k: string }) => o.k)).toEqual(['titulo'])
    expect(c['711'].saidas).toEqual({ nomeAcessivel: 1, rolagem: 0 })
    expect(c['711'].reprova).toBe(true)
    expect(c['1138'].e).toEqual([]) // a referência não se compara consigo
  })
  it('o nó existe mas perdeu parte do texto (chave mudou): (e) "texto some do nó", não "sem nó"; texto trocado do mesmo tamanho: (d′)', () => {
    const card = (k: string, n: number) => ({ ...no(k, 10, 10, 600, 60), role: 'button', tag: 'div', n })
    const r = med(1138, [card('card-completo', 48), card('rotulo-a', 5)])
    const b = med(711, [card('card-sem-data', 36), card('rotulo-b', 5)])
    const c = classificarEstado({ larguras: { 1138: r, 711: b } })
    expect(c['711'].e).toEqual([{ k: 'card-completo', tipo: 'texto some do nó', n: [48, 36] }])
    expect(c['711'].dl).toMatchObject([{ k: 'rotulo-a', texto: 'trocado' }])
  })
  it('a faixa A (411) é contada à parte: reprova=false', () => {
    const c = classificarEstado({ larguras: { 1138: ref, 411: med(411, []) } })
    expect(c['411'].e).toHaveLength(4)
    expect(c['411'].reprova).toBe(false)
  })
})

describe('G-faixa — errata candidata contra a folha (4 px)', () => {
  it('Δ de até 4 px passa; 4,1 px é errata candidata', () => {
    const app = med(1138, [no('a', 32, 64, 200, 48), no('b', 32, 120, 200, 48)])
    const folha = { C: [no('a', 36, 64, 200, 48), no('b', 32, 120, 195.9, 48)] }
    const c = classificarEstado({ larguras: { 1138: app }, folha })
    expect(c['1138'].errata).toEqual([{ k: 'b', delta: [0, 0, 4.1, 0] }])
  })
})

describe('G-faixa — resumo', () => {
  it('soma por largura sobre os estados', () => {
    const s = { estados: { base: { larguras: { 1138: med(1138, [no('a', 0, 0, 10, 10)]), 711: med(711, []) } } } }
    expect(resumo(s)['711']).toMatchObject({ e: 1, b: 0, reprova: true, estados: ['base'] })
  })
})
