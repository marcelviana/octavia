/**
 * T3-R1 — a faixa se decide pela LARGURA ÚTIL DA JANELA, num ponto só
 * (N3-D1, N3-D8, N3-D12, N3-D24): **A < 700 · B 700–960 · C > 960**.
 *
 * Nasceu no commit 1 da N3-PR1, ANTES do `src/faixa.ts` existir: o gate vem
 * antes do que ele mede, e este teste reprovava por ausência (a saída está em
 * `docs/native/N3-PR1-anexos/`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { faixaDe } from '../src/faixa'

describe('faixaDe — as fronteiras (T3-R1)', () => {
  it('699 → A, 700 → B, 960 → B, 961 → C', () => {
    expect(faixaDe(699)).toBe('A')
    expect(faixaDe(700)).toBe('B')
    expect(faixaDe(960)).toBe('B')
    expect(faixaDe(961)).toBe('C')
  })

  it('a largura é dp com fração: 699,9 é A e 960,1 é C', () => {
    expect(faixaDe(699.9)).toBe('A')
    expect(faixaDe(960.1)).toBe('C')
  })

  it('os quatro casos do A-N3-1, com as janelas medidas no pre-check', () => {
    expect(faixaDe(1137.8)).toBe('C') // tablet deitado
    expect(faixaDe(711.1)).toBe('B') // tablet em pé
    expect(faixaDe(411.4)).toBe('A') // celular em pé
    expect(faixaDe(914.3)).toBe('B') // celular deitado
  })
})

/**
 * "Um único ponto de decisão no app" (T3-R1; evidência do A-N3-1): nenhuma
 * tela compara largura por conta própria. O literal dos limiares só pode
 * existir no `faixa.ts`. Varre `src/` e o `App.tsx` como TEXTO (a mesma
 * escolha dos gates: o instrumento lê arquivo, não importa módulo).
 */
describe('um ponto só', () => {
  const raiz = join(__dirname, '..')
  const arquivos = (d: string): string[] =>
    readdirSync(d).flatMap((n) => {
      const p = join(d, n)
      if (statSync(p).isDirectory()) return arquivos(p)
      return /\.tsx?$/.test(n) ? [p] : []
    })

  it('os limiares 700 e 960 aparecem só no src/faixa.ts', () => {
    const onde = [...arquivos(join(raiz, 'src')), join(raiz, 'App.tsx')]
      .filter((p) => /\b(700|960)\b/.test(readFileSync(p, 'utf8')))
      .map((p) => p.slice(raiz.length + 1))
    expect(onde).toEqual(['src/faixa.ts'])
  })
})
