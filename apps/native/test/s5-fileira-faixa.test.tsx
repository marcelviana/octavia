/**
 * CONTROLES NEGATIVOS DA TELA — N3-PR6c (a fileira de marcas da S5 na faixa
 * B; div. 461, a H-N3-3 do pre-check medida na N3-PR6b).
 * Vêm ANTES do código que medem: contra a árvore de hoje o de B com N = 60
 * reprova — a fileira calcula contra 900 dp fixos (`FILEIRA`, a §7.1 do
 * DESIGN-V1), e com 60 marcas de 10 + 5 ela pede 895 dp numa janela de
 * 711,1: no aparelho, 48 de 60 marcas no dump, as das pontas cortadas.
 *
 * O que se mede aqui é a LARGURA QUE A TELA PEDE: N × largura da marca +
 * (N − 1) × vão, lidos do `style` que ela passa a cada marca e à fileira. Em
 * B isso tem de caber em **663** — a largura útil de B (711,1 − 2 × 24), a
 * mesma da folha (`faixas.B.folha.largura`, N3-D28). Em C, os 900 de sempre
 * e as marcas de hoje (10 dp com 60; 34 com 8): C não muda (N3-D3).
 *
 * **A faixa é forçada pela janela do duplo** (`__janela`), como nos outros
 * testes de faixa. **Nenhum `testID` novo**: a marca se acha pelo estilo
 * dela (3 dp de alto, raio 2, `MARCA` do `EndScreen`).
 *
 * **O que estes CNs NÃO medem**: geometria — que as 60 marcas estão DENTRO
 * da janela no aparelho se mede no dump (commit 3, o (b) do G-N3). Aqui se
 * mede o que a tela pediu.
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EndScreenProps } from '../src/screens/EndScreen'
import { faixas } from '../src/theme'
import { __janela } from './fake-react-native'
import { assentar, desmontar, estilo, montar } from './tela'

/** O canvas medido de B e o de C (`DESIGN-N3/README.md` §6; `APARATO.md`). */
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 663.1 }
/** A largura útil de B: a da folha (N3-D28), 711,1 − 2 × 24. */
const UTIL_B = 663

function props(total: number): EndScreenProps {
  return {
    nomeSetlist: 'Ensaio de retrato',
    total,
    onVoltarUltima: () => undefined,
    onVoltarInicio: () => undefined,
    onSair: () => undefined,
  }
}

/** As marcas (3 dp de alto, raio 2) e a largura que a fileira delas pede. */
function fileira(): { n: number; larguras: number[]; vao: number; pede: number } {
  const marcas = [...document.querySelectorAll<HTMLElement>('[data-style]')].filter((e) => {
    const s = estilo(e)
    return s.height === 3 && s.borderRadius === 2 && typeof s.width === 'number'
  })
  if (marcas.length === 0) throw new Error('sem marcas na tela')
  const larguras = marcas.map((m) => estilo(m).width as number)
  const vao = (estilo(marcas[0].parentElement as HTMLElement).gap as number | undefined) ?? 0
  const pede = larguras.reduce((a, b) => a + b, 0) + vao * (marcas.length - 1)
  return { n: marcas.length, larguras, vao, pede }
}

let EndScreen: typeof import('../src/screens/EndScreen').EndScreen

beforeAll(async () => {
  EndScreen = (await import('../src/screens/EndScreen')).EndScreen
})

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(async () => {
  await assentar(20)
  desmontar()
  __janela()
  vi.restoreAllMocks()
})

describe('div. 461 — em B a fileira de marcas cabe na largura útil (663)', () => {
  for (const n of [60, 19, 18]) {
    it(`B, N = ${n}: as ${n} marcas, e a fileira pede ≤ ${UTIL_B}`, async () => {
      __janela(B.w, B.h)
      await montar(<EndScreen {...props(n)} />)
      const f = fileira()
      expect(f.n).toBe(n)
      expect(f.pede).toBeLessThanOrEqual(UTIL_B)
      expect(UTIL_B).toBe(faixas.B.folha.largura)
    })
  }

  it('B, N = 8: as 8 marcas de 34, como hoje (a fileira de 307 já cabia)', async () => {
    __janela(B.w, B.h)
    await montar(<EndScreen {...props(8)} />)
    const f = fileira()
    expect(f.n).toBe(8)
    expect(new Set(f.larguras)).toEqual(new Set([34]))
    expect(f.pede).toBe(307)
  })
})

describe('C — a fileira de 900, como hoje (CP)', () => {
  for (const [nome, janela] of [['janela de C escrita', C], ['padrão do duplo', null]] as const) {
    it(`${nome}: N = 60 → 60 marcas de 10 + 5 (895); N = 8 → 34 (307)`, async () => {
      if (janela !== null) __janela(janela.w, janela.h)
      await montar(<EndScreen {...props(60)} />)
      let f = fileira()
      expect([f.n, new Set(f.larguras), f.vao, f.pede]).toEqual([60, new Set([10]), 5, 895])
      desmontar()
      if (janela !== null) __janela(janela.w, janela.h)
      await montar(<EndScreen {...props(8)} />)
      f = fileira()
      expect([f.n, new Set(f.larguras), f.pede]).toEqual([8, new Set([34]), 307])
    })
  }
})
