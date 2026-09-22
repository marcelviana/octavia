/**
 * N2-PR5 — a ORDEM do modo de reordenar, sem tela (PRD T2-R8; N2-D27; div.
 * 155). Controles negativos: contra a árvore de hoje o arquivo inteiro reprova
 * por ausência — não há `./ordem`.
 *
 * O que é decisão mora aqui e não na tela: o teto de 100 é o do contrato
 * (`SETLISTS.md` §order, "strict, 1..100 itens") e o "nada mudou" é a N2-D36.
 * A tela só pergunta.
 */
import { describe, expect, it } from 'vitest'
import { TETO_DO_REORDENAR, alvoDoArrasto, mesmaOrdem, mover, reordenavel } from './ordem'

describe('mover — a permutação de um arrasto', () => {
  const cinco = ['a', 'b', 'c', 'd', 'e']

  it('5 → 2 (índices 4 → 1): o quinto entra na segunda posição e os do meio descem um', () => {
    expect(mover(cinco, 4, 1)).toEqual(['a', 'e', 'b', 'c', 'd'])
  })

  it('1 → 5: o primeiro vai para o fim e os outros sobem um', () => {
    expect(mover(cinco, 0, 4)).toEqual(['b', 'c', 'd', 'e', 'a'])
  })

  it('soltar no lugar de onde saiu não muda nada', () => {
    expect(mover(cinco, 2, 2)).toEqual(cinco)
  })

  it('não muta a lista de entrada — o arrasto é estado da TELA, e a do servidor fica', () => {
    const entrada = [...cinco]
    mover(entrada, 4, 0)
    expect(entrada).toEqual(cinco)
  })

  it('é permutação: mesmo conjunto, mesmo tamanho (o que a RPC exige, C8)', () => {
    const r = mover(cinco, 3, 0)
    expect([...r].sort()).toEqual([...cinco].sort())
  })

  it('índice fora da lista é erro de quem chama, e não uma ordem inventada', () => {
    expect(() => mover(cinco, 5, 0)).toThrow()
    expect(() => mover(cinco, 0, -1)).toThrow()
  })
})

describe('mesmaOrdem — o "nada mudou" do reordenar (N2-D36)', () => {
  it('iguais elemento a elemento → mesma', () => {
    expect(mesmaOrdem(['a', 'b'], ['a', 'b'])).toBe(true)
  })

  it('mesmo conjunto em outra ordem → outra', () => {
    expect(mesmaOrdem(['a', 'b'], ['b', 'a'])).toBe(false)
  })

  it('arrastar e devolver é "nada mudou"', () => {
    const ida = mover(['a', 'b', 'c', 'd', 'e'], 4, 1)
    expect(mesmaOrdem(mover(ida, 1, 4), ['a', 'b', 'c', 'd', 'e'])).toBe(true)
  })

  it('tamanhos diferentes → outra (a setlist mudou atrás do modo)', () => {
    expect(mesmaOrdem(['a', 'b'], ['a', 'b', 'c'])).toBe(false)
  })
})

describe('reordenavel — o teto de 100 (div. 155; N2-D17; N2-X-100)', () => {
  it('o teto é o do contrato: 100', () => {
    expect(TETO_DO_REORDENAR).toBe(100)
  })

  it('100 músicas reordena; 101 não', () => {
    expect(reordenavel(100)).toBe(true)
    expect(reordenavel(101)).toBe(false)
  })
})

describe('alvoDoArrasto — onde a linha erguida cai', () => {
  // Passo de 80 dp: a linha de 72 mais o vão de 8 da lista (moldura N2-S2e-reordenar).
  const P = 80

  it('sem deslocamento, cai onde saiu', () => {
    expect(alvoDoArrasto(4, 0, P, 5)).toBe(4)
  })

  it('três passos para cima: 5 → 2', () => {
    expect(alvoDoArrasto(4, -3 * P, P, 5)).toBe(1)
  })

  it('arredonda pelo meio da linha: menos de meio passo não troca', () => {
    expect(alvoDoArrasto(4, -0.4 * P, P, 5)).toBe(4)
    expect(alvoDoArrasto(4, -0.6 * P, P, 5)).toBe(3)
  })

  it('satura nas pontas: arrastar para além da lista cai na primeira ou na última', () => {
    expect(alvoDoArrasto(4, -40 * P, P, 5)).toBe(0)
    expect(alvoDoArrasto(0, 40 * P, P, 5)).toBe(4)
  })
})
