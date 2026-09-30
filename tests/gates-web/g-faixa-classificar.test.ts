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
  corta?: { x: boolean; y: boolean }; h_texto?: string | null; h_nome?: string | null; testid?: string | null
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
  it('div. 758 (I1-PR10): além da borda do viewport DENTRO do painel marcado que rola: (d′); sem a marca, ou num contêiner que só corta, segue (b)', () => {
    const painel = { x: 20, y: 0, w: 371, h: 800, rolagem: true, painel: true }
    const alem = med(411, [no('span-do-pdf', 300, 10, 200, 20, { clip: painel })]) // 300 + 200 > 411 e > 20 + 371
    expect(cortes(alem).b).toEqual([])
    expect(classificarEstado({ larguras: { 411: alem } })['411'].dl).toMatchObject([{ k: 'span-do-pdf', painel: expect.stringContaining('decisão 621') }])
    expect(cortes(med(411, [no('s', 300, 10, 200, 20, { clip: { ...painel, painel: false } })])).b[0]).toMatchObject({ tipo: 'borda do viewport' })
    expect(cortes(med(411, [no('c', 300, 10, 200, 20, { clip: { ...painel, rolagem: false } })])).b[0]).toMatchObject({ tipo: 'borda do viewport' })
    expect(cortes(med(411, [no('livre', 300, 10, 200, 20)])).b[0]).toMatchObject({ tipo: 'borda do viewport' })
    // o painel ACIMA de outro recorte (a camada de texto dentro da página do PDF, que recorta): vale o `emPainel`
    const sobPagina = med(411, [no('span', 131, 10, 445, 19, { clip: { x: 50, y: 0, w: 800, h: 1132, rolagem: false, painel: false }, emPainel: { x: 25, y: 0, w: 361, h: 1200 } })])
    expect(cortes(sobPagina).b).toEqual([])
    expect(classificarEstado({ larguras: { 411: sobPagina } })['411'].dl).toMatchObject([{ k: 'span', painel: expect.stringContaining('decisão 621') }])
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
  it('I1-PR13 (2b; I1-D7 item 4): rótulo curto COM nome acessível longo — o mesmo aria-label em C e em B, que contém o rótulo — é saída nome-acessível, não (e)', () => {
    const botao = (texto: string, n: number, nome: string | null, nl = !!nome) => ({ ...no(`button:${texto}#1`, 10, 100, 12 * n, 56), role: 'button', tag: 'button', n, h_texto: texto, h_nome: nome, ...(nl ? { nl: true } : {}) })
    const LONGO = 'Adicionar músicas a X'
    const c = med(1138, [botao('Adicionar músicas', 17, LONGO)])
    const comNome = classificarEstado({ larguras: { 1138: c, 711: med(711, [botao('Adicionar', 9, LONGO)]), 411: med(411, [botao('Adicionar', 9, LONGO)]) } })
    expect(comNome['711'].e).toEqual([])
    expect(comNome['411'].e).toEqual([])
    expect(comNome['711'].saidas.nomeAcessivel).toBe(1)
    // sem o nome acessível o texto que encolheu segue (e): nada diz que é o mesmo controle com o rótulo inteiro
    const semNome = classificarEstado({ larguras: { 1138: med(1138, [botao('Adicionar músicas', 17, null)]), 711: med(711, [botao('Adicionar', 9, null)]) } })
    expect(semNome['711'].e).toEqual([{ k: 'button:Adicionar músicas#1', tipo: 'texto some do nó', n: [17, 9] }])
    // o nome em C e OUTRO nome em B: também (e)
    const outroNome = classificarEstado({ larguras: { 1138: c, 711: med(711, [botao('Adicionar', 9, 'Adicionar')]) } })
    expect(outroNome['711'].e).toHaveLength(1)
    // o nó com o mesmo nome mas SEM área (escondido) não conta
    const escondido = classificarEstado({ larguras: { 1138: c, 711: med(711, [{ ...botao('Adicionar', 9, LONGO), w: 0 }]) } })
    expect(escondido['711'].e).toHaveLength(1)
    // o MESMO aria-label que NÃO contém o texto (o cartão da biblioteca velha: perde um bloco de conteúdo em 711): segue (e)
    const cartao = (texto: string, n: number) => botao(texto, n, 'Abrir o conteúdo', false)
    const perdeConteudo = classificarEstado({ larguras: { 1138: med(1138, [cartao('título artista tipo data', 48)]), 711: med(711, [cartao('título artista tipo', 36)]) } })
    expect(perdeConteudo['711'].e).toEqual([{ k: 'button:título artista tipo data#1', tipo: 'texto some do nó', n: [48, 36] }])
  })
  it('o nó existe mas perdeu parte do texto (chave mudou): (e) "texto some do nó", não "sem nó"; texto trocado do mesmo tamanho: (d′)', () => {
    const card = (k: string, n: number) => ({ ...no(k, 10, 10, 600, 60), role: 'button', tag: 'div', n })
    const r = med(1138, [card('card-completo', 48), card('rotulo-a', 5)])
    const b = med(711, [card('card-sem-data', 36), card('rotulo-b', 5)])
    const c = classificarEstado({ larguras: { 1138: r, 711: b } })
    expect(c['711'].e).toEqual([{ k: 'card-completo', tipo: 'texto some do nó', n: [48, 36] }])
    expect(c['711'].dl).toMatchObject([{ k: 'rotulo-a', texto: 'trocado' }])
  })
  it('a faixa A (411): o (e) e o (b) reprovam (errata da I1-D11; div. 677)', () => {
    const c = classificarEstado({ larguras: { 1138: ref, 411: med(411, []) } })
    expect(c['411'].e).toHaveLength(4)
    expect(c['411'].reprova).toBe(true)
    expect(c['411'].reprovaB).toBe(true)
  })
})

describe('G-faixa — errata candidata contra a folha (4 px)', () => {
  it('Δ de até 4 px passa; 4,1 px é errata candidata', () => {
    const app = med(1138, [no('a', 32, 64, 200, 48), no('b', 32, 120, 200, 48)])
    const folha = { C: [no('a', 36, 64, 200, 48), no('b', 32, 120, 195.9, 48)] }
    const c = classificarEstado({ larguras: { 1138: app }, folha })
    expect(c['1138'].errata).toEqual([{ k: 'b', delta: [0, 0, 4.1, 0] }])
  })

  it('I1-PR6 (decisão 7): o par é pelo texto SEM o papel — o `texto` da folha casa com o `link` do app', () => {
    const app = med(1138, [no('link:esqueci#1', 900, 200, 110, 19, { h_texto: 'esqueci' })])
    const folha = { C: [no('texto:esqueci#1', 913.9, 201, 104.1, 19, { h_texto: 'esqueci' })] }
    const c = classificarEstado({ larguras: { 1138: app }, folha })
    expect(c['1138'].errata).toEqual([{ k: 'link:esqueci#1', delta: [-13.9, -1, 5.9, 0] }])
    expect(c['1138'].semPar).toEqual({ folha: [], app: [] })
  })

  it('I1-PR6 (decisão 7): a âncora `data-testid` casa o campo; o que não pareia é LISTADO dos dois lados', () => {
    const app = med(1138, [no('t:campo-email#1', 598, 120, 420, 60, { testid: 'campo-email', h_texto: null }), no('textbox:voce#1', 647, 138, 354, 24, { h_texto: 'voce' })])
    const folha = { C: [no('t:campo-email#1', 598, 121, 420, 60, { testid: 'campo-email', h_texto: 'marcel' }), no('texto:marcel#1', 647, 143, 354, 24, { h_texto: 'marcel' })] }
    const c = classificarEstado({ larguras: { 1138: app }, folha })
    expect(c['1138'].errata).toEqual([])
    expect(c['1138'].semPar.app.map((o: { k: string }) => o.k)).toEqual(['textbox:voce#1'])
    expect(c['1138'].semPar.folha.map((o: { k: string }) => o.k)).toEqual(['texto:marcel#1'])
  })
})

describe('G-faixa — quebra por dado (I1-PR11, div. 767)', () => {
  // o título de DADO (sem par por texto dos dois lados) no lugar do título da folha; em 711 ele quebra em duas linhas
  const tituloC = no('heading:dado#1', 96, 90, 875, 30, { h_texto: 'dado' })
  const folhaB = [no('texto:exemplo#1', 88, 145, 398.3, 33.8, { h_texto: 'exemplo' }), no('button:voltar#1', 24, 149.9, 48, 48, { h_texto: 'voltar' }), no('h2:painel#1', 24, 260.8, 663, 49, { h_texto: 'painel' }), no('p:acima#1', 24, 100, 40, 19, { h_texto: 'acima' })]
  const appB = (hTitulo: number, extra: No[] = []) => med(711, [
    no('heading:dado#1', 88, 145, 400.3, hTitulo, { h_texto: 'dado' }),
    no('button:voltar#1', 24, 149.9 + (hTitulo - 33.8) / 2, 48, 48, { h_texto: 'voltar' }), // centrado: desce a metade
    no('h2:painel#1', 24, 260.8 + (hTitulo - 33.8), 663, 49, { h_texto: 'painel' }),
    no('p:acima#1', 24, 100 + 26.2, 40, 19, { h_texto: 'acima' }), // ACIMA da quebra: segue candidata
    ...extra,
  ])
  it('o nó de dado em 2 linhas no lugar do nó da folha: a cascata abaixo dele sai das candidatas; o que está acima fica', () => {
    const c = classificarEstado({ larguras: { 1138: med(1138, [tituloC]), 711: appB(60) }, folha: { B: folhaB } })['711']
    expect(c.quebraPorDado.nos).toMatchObject([{ k: 'heading:dado#1', linhas: 2, extra: 26.2 }])
    expect(c.quebraPorDado.cascata.map((o: { k: string }) => o.k).sort()).toEqual(['button:voltar#1', 'h2:painel#1'])
    expect(c.errata.map((o: { k: string }) => o.k)).toEqual(['p:acima#1'])
  })
  it('sem quebra acima (o título em 1 linha), o mesmo Δy segue errata candidata', () => {
    const b = appB(30)
    b.nos.find((n) => n.k === 'h2:painel#1')!.y = 260.8 + 26.2
    const c = classificarEstado({ larguras: { 1138: med(1138, [tituloC]), 711: b }, folha: { B: folhaB } })['711']
    expect(c.quebraPorDado).toEqual({ nos: [], cascata: [] })
    expect(c.errata.map((o: { k: string }) => o.k)).toContain('h2:painel#1')
  })
  it('a cascata que desce MAIS que a quebra, ou que muda de tamanho, segue candidata', () => {
    const b = appB(60)
    b.nos.find((n) => n.k === 'h2:painel#1')!.y += 20 // desce 46,2 com a quebra de 26,2
    const c = classificarEstado({ larguras: { 1138: med(1138, [tituloC]), 711: b }, folha: { B: folhaB } })['711']
    expect(c.errata.map((o: { k: string }) => o.k)).toContain('h2:painel#1')
  })
  it('altura que não é múltipla da entrelinha (60 contra 1 linha de 40) não é quebra', () => {
    const c = classificarEstado({ larguras: { 1138: med(1138, [{ ...tituloC, h: 40 }]), 711: appB(60) }, folha: { B: folhaB } })['711']
    expect(c.quebraPorDado.nos).toEqual([])
  })
})

describe('G-faixa — resumo', () => {
  it('soma por largura sobre os estados', () => {
    const s = { estados: { base: { larguras: { 1138: med(1138, [no('a', 0, 0, 10, 10)]), 711: med(711, []) } } } }
    expect(resumo(s)['711']).toMatchObject({ e: 1, b: 0, reprova: true, estados: ['base'] })
  })
})
