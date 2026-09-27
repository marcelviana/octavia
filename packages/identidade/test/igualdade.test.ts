/**
 * I1-PR-4 — o CN de IGUALDADE (I1-D3, I1-D4, I1-D30, I1-D31).
 *
 * Nasceu no commit 1, ANTES de `packages/identidade/src` existir: o gate vem
 * antes do que ele mede, e este arquivo reprova por ausência do pacote.
 *
 * A comparação é contra a LINHA DE BASE CONGELADA (`linha-de-base.json`), e não
 * contra o `theme.ts` vivo: depois da migração o `theme.ts` reexporta o pacote,
 * e comparar um com o outro seria comparar o objeto consigo mesmo. A linha de
 * base foi gerada no commit 1 importando, por `tsx`, o `theme.ts` e o
 * `icones/dados.ts` da `origin/main` (`d18b7c4`); o comando está no anexo da
 * PR (`docs/native/I1-PR4-anexos/`). Os dois lados se cobram contra ela:
 *
 *  - o PACOTE, com o que ele muda de forma por decisão — `font` em família +
 *    peso (I1-D31), o bloco `web` por faixa (DESIGN-I1 §3), `faixaDe` e os
 *    limiares (I1-D30) e o `visto` (div. 588);
 *  - o NATIVO (`theme.ts`, `icones/dados.ts`), que tem de continuar
 *    exportando exatamente os mesmos valores em dp — inclusive o `font` com os
 *    nomes de `.ttf` do `expo-font`, agora vindos do mapa de `fontes.ts`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import * as identidade from '../src/index'
import * as tema from '../../../apps/native/src/theme'
import * as dados from '../../../apps/native/src/icones/dados'

const base = JSON.parse(readFileSync(join(__dirname, 'linha-de-base.json'), 'utf8'), (_k, v) =>
  v !== null && typeof v === 'object' && v.$indefinido === true ? undefined : v,
)

/** Os tokens que migram SEM mudar de forma (I1-D3). */
const IGUAIS = [
  'dark', 'light', 'space', 'radius', 'touch', 'bar', 'size',
  'zoomSteps', 'zoomDefault', 'lineHeight', 'tracking',
] as const

/** Sem o bloco `web`, a faixa do pacote é a do nativo. */
const semWeb = (f: Record<string, unknown>) => Object.fromEntries(Object.entries(f).filter(([k]) => k !== 'web'))

describe('pacote ≡ linha de base (em dp)', () => {
  for (const k of IGUAIS) {
    it(k, () => expect((identidade as Record<string, unknown>)[k]).toStrictEqual(base.tokens[k]))
  }

  it('faixas A, B e C, fora o bloco web', () => {
    for (const f of ['A', 'B', 'C'] as const) {
      expect(semWeb(identidade.faixas[f] as unknown as Record<string, unknown>)).toStrictEqual(base.tokens.faixas[f])
    }
  })

  it('font é família + peso (I1-D31) — nenhum nome de .ttf no pacote', () => {
    expect(identidade.font).toStrictEqual({
      display: { familia: 'Raleway', peso: 600 },
      displayMedium: { familia: 'Raleway', peso: 500 },
      ui: { familia: 'Manrope', peso: 400 },
      uiBold: { familia: 'Manrope', peso: 600 },
      mono: { familia: 'IBM Plex Mono', peso: 400 },
      monoBold: { familia: 'IBM Plex Mono', peso: 600 },
    })
    expect(JSON.stringify(identidade)).not.toMatch(/_\d{3}[A-Z]/)
  })

  it('o bloco web por faixa — DESIGN-I1/README.md §3 (nome · C · B; A segue B)', () => {
    const C = { conteiner: 1138, margem: 32, colunaLateral: 320, razaoListaDetalhe: [2, 3], zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: false }
    const B = { conteiner: null, margem: 24, colunaLateral: 'empilha', razaoListaDetalhe: 'empilha', zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: true }
    expect(identidade.faixas.C.web).toStrictEqual(C)
    expect(identidade.faixas.B.web).toStrictEqual(B)
    expect(identidade.faixas.A.web).toStrictEqual(B)
  })

  it('faixaDe e os limiares moram no pacote (I1-D30): A < 700 · B 700–960 · C > 960', () => {
    expect(identidade.limiares).toStrictEqual({ ab: 700, bc: 960 })
    expect([699, 699.9, 700, 960, 960.1, 961].map(identidade.faixaDe)).toEqual(['A', 'A', 'B', 'B', 'C', 'C'])
  })

  it('ícones: os 43 da linha de base, desenho a desenho, mais o visto (div. 588)', () => {
    const { visto, ...resto } = identidade.desenhos as Record<string, unknown>
    expect(resto).toStrictEqual(base.icones)
    expect(Object.keys(resto)).toHaveLength(43)
    // DESIGN-N2, anexo D, "Exceção declarada · o visto não é amputável (R2·2)":
    // o inativo é o desenho inteiro com traço 1,25.
    expect(visto).toStrictEqual({
      normal: [{ d: 'M4.5 12.5l5 5 10-11' }],
      inerte: [{ d: 'M4.5 12.5l5 5 10-11', traco: 1.25 }],
    })
  })

  it('garantida numa forma só, a do catálogo (div. 589, I1-E3)', () => {
    expect(identidade.desenhos.garantida).toStrictEqual({ normal: [{ cx: 12, cy: 12, r: 9 }, { d: 'M8 12.2l2.8 2.8L16.2 9.4' }] })
  })
})

describe('nativo ≡ linha de base (nada mudou em dp)', () => {
  for (const k of IGUAIS) {
    it(`theme.${k}`, () => expect((tema as Record<string, unknown>)[k]).toStrictEqual(base.tokens[k]))
  }

  it('theme.faixas — sem o bloco web, A continua sendo B', () => {
    for (const f of ['A', 'B', 'C'] as const) {
      expect(semWeb(tema.faixas[f] as unknown as Record<string, unknown>)).toStrictEqual(base.tokens.faixas[f])
    }
    expect(tema.faixas.A).toBe(tema.faixas.B)
  })

  it('theme.font continua com os nomes de .ttf do expo-font (o mapa de fontes.ts)', () => {
    expect(tema.font).toStrictEqual(base.tokens.font)
  })

  it('icones/dados.ts é o mapa do pacote', () => {
    expect(dados.desenhos).toBe(identidade.desenhos)
  })
})
