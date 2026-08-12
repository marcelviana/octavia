import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChordDisplay } from '@/components/content-viewer/ChordDisplay'
import { LyricsDisplay } from '@/components/content-viewer/LyricsDisplay'
import { TabDisplay } from '@/components/content-viewer/TabDisplay'

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
 * comportamento (`whitespace-pre` + `overflow-x-auto`); o computed style real
 * é verificado no spec de UI contra o app deployado.
 */

const CIFRA = ['C                Am', 'Quando a noite chega e a cidade acende', 'F                 G'].join('\n')
const TAB = ['e|---0---|', 'B|-1---1-|', 'G|0-----0|'].join('\n')

function classesDo(el: HTMLElement | null): string {
  return el?.className ?? ''
}

describe('CONT-01/02 — monoespaçado sem wrap', () => {
  it('#3 ChordDisplay: cifra-string usa whitespace-pre + overflow-x-auto', () => {
    render(<ChordDisplay content={{ content_data: { chords: CIFRA } }} />)
    const bloco = screen.getByText(/Quando a noite chega/).closest('div')
    expect(classesDo(bloco)).toContain('whitespace-pre')
    expect(classesDo(bloco)).toContain('overflow-x-auto')
    expect(classesDo(bloco)).not.toContain('whitespace-pre-wrap')
  })

  it('#4 ChordDisplay: sections[].lyrics deixa de envolver (mudança deliberada)', () => {
    render(
      <ChordDisplay
        content={{ content_data: { sections: [{ id: 's1', name: 'Verso', lyrics: CIFRA }] } }}
      />
    )
    const bloco = screen.getByText(/Quando a noite chega/)
    expect(classesDo(bloco)).toContain('whitespace-pre')
    expect(classesDo(bloco)).toContain('overflow-x-auto')
    expect(classesDo(bloco)).not.toContain('whitespace-pre-wrap')
  })

  it('#5 LyricsDisplay: cifra-string dentro da letra recebe o mesmo tratamento', () => {
    render(<LyricsDisplay content={{ content_data: { lyrics: 'linha da letra', chords: CIFRA } }} />)
    const bloco = screen.getByText(/Quando a noite chega/).closest('div')
    expect(classesDo(bloco)).toContain('whitespace-pre')
    expect(classesDo(bloco)).toContain('overflow-x-auto')
  })

  it('#2 TabDisplay: tab-string usa whitespace-pre + overflow-x-auto', () => {
    render(<TabDisplay content={{ content_data: { tablature: TAB } }} getOrdinalSuffix={() => 'st'} />)
    const bloco = screen.getByText(/e\|---0---\|/).closest('div')
    expect(classesDo(bloco)).toContain('whitespace-pre')
    expect(classesDo(bloco)).toContain('overflow-x-auto')
  })

  it('TabDisplay: o branch de array (que já era correto) permanece intocado', () => {
    render(
      <TabDisplay
        content={{ content_data: { tablature: ['e|---0---|', 'B|-1---1-|'] } }}
        getOrdinalSuffix={() => 'st'}
      />
    )
    const linha = screen.getByText('e|---0---|')
    expect(classesDo(linha)).toContain('whitespace-nowrap')
  })
})
