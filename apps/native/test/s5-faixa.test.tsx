/**
 * CONTROLES NEGATIVOS DA TELA — N3-PR6 (a barra superior da S5 na faixa B;
 * **N3-E17**, decisão do Marcel de 2026-09-25 sobre a div. 442).
 * Vêm ANTES do código que medem: contra a árvore de hoje o de B reprova — a
 * barra superior da S5 tem 64 em qualquer faixa, e em B a do palco tem 88
 * (N3-PR5): ao chegar ao fim da setlist a barra encolhia 24 dp.
 *
 * A decisão, verbatim do prompt da N3-PR6: *"a barra superior de S5 em B usa
 * o token da barra do palco (88), vazia; sem salto de 24 dp ao chegar ao
 * fim."* O token é o `faixas[…].palco.barra` — **o mesmo** que o palco lê,
 * não uma cópia do número: se o palco mudar, a S5 muda junto. "Vazia" = a
 * barra não ganha conteúdo novo (nenhuma segunda linha, nenhum título): a
 * S5 continua com `n DE N` e o nome da setlist, como em C, na altura da
 * barra do palco.
 *
 * **A faixa é forçada pela janela do duplo** (`__janela`), como nos outros
 * testes de faixa: 711,1 × 1053,8 é o AVD em retrato; C é o padrão do duplo.
 * **Nenhum `testID` novo**: a barra se acha pelo texto `8 DE 8`.
 *
 * **O que estes CNs NÃO medem**: geometria — a barra de 88 no aparelho, a
 * mesma do palco na última, se mede no dump (commit 3). Aqui se mede a altura
 * que a tela pediu ao `theme.ts`, e que é a mesma que o palco pediu.
 */
import './dev-flag'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EndScreenProps } from '../src/screens/EndScreen'
import { faixas } from '../src/theme'
import { __janela } from './fake-react-native'
import { assentar, desmontar, estilo, exige, montar } from './tela'

/** O canvas medido de B e o de C (`DESIGN-N3/README.md` §6; `APARATO.md`). */
const B = { w: 711.1, h: 1053.8 }
const C = { w: 1137.8, h: 663.1 }

function props(): EndScreenProps {
  return {
    nomeSetlist: 'Ensaio de retrato',
    total: 8,
    onVoltarUltima: () => undefined,
    onVoltarInicio: () => undefined,
    onSair: () => undefined,
  }
}

/** O `span` cujo texto É `t`. */
function noDeTexto(t: string): HTMLElement {
  const e = [...document.querySelectorAll<HTMLElement>('span')].find(
    (x) => (x.textContent ?? '').replace(/\s+/g, ' ').trim() === t,
  )
  if (e === undefined) throw new Error(`sem nó de texto ${t}`)
  return e
}

/** A barra superior: o pai de `8 DE 8` (e do nome da setlist). */
function barra(): HTMLElement {
  const pos = noDeTexto('8 DE 8')
  const b = pos.parentElement as HTMLElement
  expect(b.contains(noDeTexto('Ensaio de retrato'))).toBe(true)
  return b
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

describe('N3-E17 — em B a barra superior da S5 tem a altura da do palco (88), sem conteúdo novo', () => {
  it('B: a barra de `8 DE 8` tem 88 — o token `palco.barra` da faixa B', async () => {
    __janela(B.w, B.h)
    await montar(<EndScreen {...props()} />)
    expect(estilo(barra()).height).toBe(88)
    expect(estilo(barra()).height).toBe(faixas.B.palco.barra)
  })

  it('B: "vazia" — os mesmos dois textos de C, numa linha, e mais nada', async () => {
    __janela(B.w, B.h)
    await montar(<EndScreen {...props()} />)
    const b = barra()
    expect(estilo(b).flexDirection).toBe('row')
    expect((b.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe('8 DE 8Ensaio de retrato')
    // o resto da S5 não muda: os dois botões e a borda de voltar
    exige('voltar-inicio')
    exige('sair')
  })
})

describe('C — a barra de 64, como hoje (CP)', () => {
  for (const [nome, janela] of [['janela de C escrita', C], ['padrão do duplo', null]] as const) {
    it(`${nome}: 64, o token \`palco.barra\` de C`, async () => {
      if (janela !== null) __janela(janela.w, janela.h)
      await montar(<EndScreen {...props()} />)
      expect(estilo(barra()).height).toBe(64)
      expect(estilo(barra()).height).toBe(faixas.C.palco.barra)
      expect(estilo(barra()).flexDirection).toBe('row')
    })
  }
})
