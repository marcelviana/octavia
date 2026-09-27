/**
 * "Gerado == fonte" (I1-D3, I1-D13 G-tok): o `app/styles/identidade.css`
 * commitado é exatamente o que o gerador produz hoje a partir do pacote.
 * Quem muda um token e não regenera, ou edita o CSS à mão, reprova aqui.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — o gerador é .mjs sem tipos; roda por tsx e pelo Vitest.
import { gerarCss, SAIDA } from '../scripts/gerar-css.mjs'

describe('app/styles/identidade.css', () => {
  it('o commitado é o gerado, byte a byte', () => {
    expect(readFileSync(SAIDA, 'utf8')).toBe(gerarCss())
  })

  it('as faixas são intervalos gerados dos limiares, e o conteúdo de C não vaza para B', () => {
    const css: string = gerarCss()
    expect(css).toContain('@media (width > 960px)')
    expect(css).toContain('@media (700px <= width <= 960px)')
    expect(css).toContain('@media (width < 700px)')
    const b = css.slice(css.indexOf('/* faixa B */'), css.indexOf('/* faixa A */'))
    expect(b).toContain('--faixa-conteiner: none;')
    expect(b).not.toContain('--faixa-coluna-lateral')
    expect(b).not.toContain('--faixa-razao-')
    expect(css.slice(0, css.indexOf('/* faixa C */'))).not.toContain('--faixa-')
  })
})
