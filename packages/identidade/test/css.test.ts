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

  it('as medidas fixas das folhas 0 e 1 (I1-PR-6, decisão 2): em toda faixa, e o vão da auth muda de C para B', () => {
    const css: string = gerarCss()
    const faixa = (f: string) => css.slice(css.indexOf(`/* faixa ${f} */`), f === 'A' ? undefined : css.indexOf(`/* faixa ${f === 'C' ? 'B' : 'A'} */`))
    for (const f of ['C', 'B', 'A']) {
      for (const l of ['--faixa-marca-largura: 340px;', '--faixa-marca-altura: 219px;', '--faixa-coluna-auth: 420px;',
        '--faixa-campo-auth: 60px;', '--faixa-botao-auth: 58px;', '--faixa-botao-aviso: 36px;', '--faixa-entrelinha-aviso: 20px;', '--faixa-limiar-aviso: 320px;']) {
        expect(faixa(f)).toContain(l)
      }
    }
    expect(faixa('C')).toContain('--faixa-vao-auth: 140px;')
    expect(faixa('B')).toContain('--faixa-vao-auth: 48px;')
    expect(faixa('A')).toContain('--faixa-vao-auth: 48px;')
  })

  it('a folha 4 (I1-PR-9): o metadado 13 e as alfas como color-mix do token, em toda faixa', () => {
    const css: string = gerarCss()
    for (const f of ['C', 'B', 'A']) {
      const i = css.indexOf(`/* faixa ${f} */`)
      const faixa = css.slice(i, f === 'A' ? undefined : css.indexOf('/* faixa', i + 5))
      expect(faixa).toContain('--faixa-metadado: 13px;')
      expect(faixa).toContain('--faixa-cor-marcado: color-mix(in srgb, var(--cor-accent) 12%, transparent);')
      expect(faixa).toContain('--faixa-cor-dialogo: color-mix(in srgb, var(--cor-bg) 82%, transparent);')
    }
  })
})
