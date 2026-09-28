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
 *    limiares (I1-D30) e o `TRACO` (que saiu do `Icone.tsx`). O `visto` das
 *    folhas do I1 NÃO entra (div. 588, decisão (b) do aval; errata I1-E6);
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

/**
 * O marcador `{"$indefinido": true}` volta a ser uma chave PRESENTE com valor
 * `undefined`. Não por `reviver` do `JSON.parse`: devolver `undefined` ali
 * APAGA a chave, e o `toStrictEqual` distingue chave ausente de chave
 * `undefined` (medido no commit 2: a linha de base perdia o `alturaMin`).
 */
function reviver(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(reviver)
  if (v === null || typeof v !== 'object') return v
  const o = v as Record<string, unknown>
  if (o.$indefinido === true) return undefined
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(o)) out[k] = reviver(o[k])
  return out
}
const base = reviver(JSON.parse(readFileSync(join(__dirname, 'linha-de-base.json'), 'utf8'))) as {
  tokens: Record<string, unknown> & { faixas: Record<string, unknown>; font: unknown }
  icones: unknown
}

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
    // I1-PR-6 (decisão 2): as medidas fixas das folhas 0 e 1 — ADIÇÃO; as oito de antes não mudam
    const auth = { marca: { largura: 340, altura: 219 }, colunaAuth: 420, campoAuth: 60, botaoAuth: 58, botaoAviso: 36, entrelinhaAviso: 20, limiarAviso: 320 }
    const C = { conteiner: 1138, margem: 32, colunaLateral: 320, razaoListaDetalhe: [2, 3], zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: false, ...auth, vaoAuth: 140 }
    const B = { conteiner: null, margem: 24, colunaLateral: 'empilha', razaoListaDetalhe: 'empilha', zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: true, ...auth, vaoAuth: 48 }
    expect(identidade.faixas.C.web).toStrictEqual(C)
    expect(identidade.faixas.B.web).toStrictEqual(B)
    expect(identidade.faixas.A.web).toStrictEqual(B)
  })

  it('faixaDe e os limiares moram no pacote (I1-D30): A < 700 · B 700–960 · C > 960', () => {
    expect(identidade.limiares).toStrictEqual({ ab: 700, bc: 960 })
    expect([699, 699.9, 700, 960, 960.1, 961].map(identidade.faixaDe)).toEqual(['A', 'A', 'B', 'B', 'C', 'C'])
  })

  it('ícones: os 43 da linha de base, desenho a desenho — e nenhum visto (div. 588, decisão (b))', () => {
    expect(identidade.desenhos).toStrictEqual(base.icones)
    expect(identidade.nomesIcones).toHaveLength(43)
    expect(identidade.nomesIcones).not.toContain('visto')
  })

  it('TRACO, o envelope por tamanho, veio do Icone.tsx sem mudar (§5.5): 20 → 1,5 · 24 → 1,75 · 28 → 2', () => {
    expect(identidade.TRACO).toStrictEqual({ 20: 1.5, 24: 1.75, 28: 2 })
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
