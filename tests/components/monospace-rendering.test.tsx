import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChordDisplay } from '@/components/content-viewer/ChordDisplay'
import { LyricsDisplay } from '@/components/content-viewer/LyricsDisplay'
import { TabDisplay } from '@/components/content-viewer/TabDisplay'
import type { ConteudoVisto } from '@/components/content/tipos'

/**
 * CONT-01 / CONT-02 — renderização monoespaçada sem word-wrap.
 *
 * Cobre os sites que o spec de UI (cont01-02-monoespacado.spec.ts) NÃO
 * alcança por falta de conteúdo no seed:
 *   #4 ChordDisplay → sections[].lyrics (era `pre-wrap`)
 *   #5 LyricsDisplay → cifra-string dentro de uma letra
 * e, de quebra, reforça #2/#3 no nível de componente.
 *
 * jsdom não aplica Tailwind, então o assert é sobre as CLASSES que decidem o
 * comportamento: o texto em `whitespace-pre` (sem quebra) dentro de um contêiner
 * `overflow-x-auto` — desde a I1-PR-10 o painel da folha 5, marcado
 * `data-rolagem="painel"` (resposta 19: rola na horizontal DENTRO do painel).
 */

const CIFRA = ['C                Am', 'Quando a noite chega e a cidade acende', 'F                 G'].join('\n')
const TAB = ['e|---0---|', 'B|-1---1-|', 'G|0-----0|'].join('\n')

const conteudo = (content_data: unknown) => ({ id: 'cn', title: 'CN', content_type: 'Chords', capo: null, tuning: null, content_data }) as unknown as ConteudoVisto

/** O bloco do texto não quebra e o painel em volta rola na horizontal. */
function semQuebraRolandoNoPainel(texto: RegExp | string) {
  const alvo = screen.getByText(texto)
  const bloco = alvo.closest('.whitespace-pre') as HTMLElement | null
  expect(bloco, 'o texto está num bloco whitespace-pre').not.toBeNull()
  expect(bloco?.className).not.toContain('whitespace-pre-wrap')
  const painel = alvo.closest('[data-rolagem="painel"]') as HTMLElement | null
  expect(painel?.className).toContain('overflow-x-auto')
}

describe('CONT-01/02 — monoespaçado sem wrap', () => {
  it('#3 ChordDisplay: cifra-string usa whitespace-pre + overflow-x-auto', () => {
    render(<ChordDisplay content={conteudo({ chords: CIFRA })} />)
    semQuebraRolandoNoPainel(/Quando a noite chega/)
  })

  it('#4 ChordDisplay: sections[].lyrics deixa de envolver (mudança deliberada)', () => {
    render(<ChordDisplay content={conteudo({ sections: [{ id: 's1', name: 'Verso', lyrics: CIFRA }] })} />)
    semQuebraRolandoNoPainel(/Quando a noite chega/)
  })

  it('#5 LyricsDisplay: cifra-string dentro da letra recebe o mesmo tratamento', () => {
    render(<LyricsDisplay content={conteudo({ lyrics: 'linha da letra', chords: CIFRA })} />)
    semQuebraRolandoNoPainel(/Quando a noite chega/)
    semQuebraRolandoNoPainel(/linha da letra/)
  })

  it('#2 TabDisplay: tab-string usa whitespace-pre + overflow-x-auto', () => {
    render(<TabDisplay content={conteudo({ tablature: TAB })} />)
    semQuebraRolandoNoPainel(/e\|---0---\|/)
  })

  it('TabDisplay: o branch de array segue sem quebra (uma linha por corda)', () => {
    render(<TabDisplay content={conteudo({ tablature: ['e|---0---|', 'B|-1---1-|'] })} />)
    semQuebraRolandoNoPainel(/e\|---0---\|/)
    expect(screen.getByText(/e\|---0---\|/).textContent).toBe('e|---0---|\nB|-1---1-|')
  })
})
