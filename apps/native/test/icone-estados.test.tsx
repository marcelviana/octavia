/**
 * N4-PR4 — o `Icone.tsx` escolhe o desenho que o catálogo guarda (N4-D86,
 * N4-D87). O `gate:icones` cobra o MAPA contra a folha; este arquivo cobra o
 * outro lado — que o componente entrega ao `<Svg>` o estado e o traço certos.
 *
 *  - a estrela: `normal` vazada, `ativo` cheia (preenchimento + contorno),
 *    `inerte` vazada a 1,25 e `ativo-inerte` cheia a 1,25 — o ramo novo;
 *  - os quatro de tipo: em 20 o `em20`, com o traço da folha (1,8) em cada
 *    traço; em 24 e 28 o `normal`, sem traço próprio (o do `<Svg>`, `TRACO`).
 *
 * Não mede pixel: o `react-native-svg` é o duplo, e o que sai é o markup.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Icone, type EstadoIcone } from '../src/icones/Icone'
import type { NomeIcone } from '../src/icones/dados'
import type { TamanhoIcone } from '@octavia/identidade'

function paths(nome: NomeIcone, tamanho: TamanhoIcone, estado: EstadoIcone = 'normal') {
  const html = renderToStaticMarkup(<Icone nome={nome} tamanho={tamanho} cor="#fff" estado={estado} />)
  const svg = /<svg [^>]*stroke-width="([\d.]+)"/.exec(html)
  return {
    traco: svg === null ? null : +svg[1],
    paths: [...html.matchAll(/<path ([^>]*)>/g)].map(([, a]) => ({
      cheio: /fill="currentColor"/.test(a),
      traco: /stroke-width="([\d.]+)"/.exec(a)?.[1] ?? null,
    })),
  }
}

describe('a estrela: um registro, dois estados, e o inerte de cada um (N4-D76, N4-D87)', () => {
  it('normal = vazada; ativo = cheia (preenchimento por baixo, contorno por cima)', () => {
    expect(paths('estrela', 24).paths).toStrictEqual([{ cheio: false, traco: null }])
    expect(paths('estrela', 24, 'ativo').paths).toStrictEqual([{ cheio: true, traco: null }, { cheio: false, traco: null }])
  })

  it('inerte = vazada a 1,25; ativo-inerte = cheia a 1,25', () => {
    expect(paths('estrela', 24, 'inerte').paths).toStrictEqual([{ cheio: false, traco: '1.25' }])
    expect(paths('estrela', 24, 'ativo-inerte').paths).toStrictEqual([{ cheio: true, traco: null }, { cheio: false, traco: '1.25' }])
  })

  it('o tocar: normal e inerte a 1,25', () => {
    expect(paths('tocar', 24).paths).toStrictEqual([{ cheio: false, traco: null }])
    expect(paths('tocar', 24, 'inerte').paths).toStrictEqual([{ cheio: false, traco: '1.25' }])
  })

  it('ativo-inerte num ícone sem a forma cai no desenho de sempre (nenhum outro muda)', () => {
    expect(paths('tocar', 24, 'ativo-inerte')).toStrictEqual(paths('tocar', 24))
  })
})

describe('os quatro de tipo: em 20 o traço da folha, em 24 e 28 o da família (N4-D86)', () => {
  for (const nome of ['letra', 'cifra', 'tab', 'partitura'] as const) {
    it(`${nome}: 20 → todo traço a 1,8; 24 e 28 → sem traço próprio`, () => {
      const em20 = paths(nome, 20)
      expect(em20.traco).toBe(1.5)
      for (const p of em20.paths) expect(p.traco).toBe(p.cheio ? null : '1.8')
      for (const t of [24, 28] as const) {
        const n = paths(nome, t)
        expect(n.traco).toBe(t === 24 ? 1.75 : 2)
        expect(n.paths.every((p) => p.traco === null)).toBe(true)
        expect(n.paths.length).toBe(em20.paths.length)
      }
    })
  }
})
