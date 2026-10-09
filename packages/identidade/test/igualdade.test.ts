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
  paresIconesN4: { pares: Record<string, { velho: unknown; novo: unknown; razao: string }> }
  paresTokensN4: { pares: { caminho: string; velho: unknown; novo: unknown; razao: string }[] }
  paresIconesQL: { pares: Record<string, { velho: unknown; novo: unknown; razao: string }> }
}

/**
 * N4-PR4 (N4-D64) — as faixas da linha de base com os pares de `paresTokensN4`
 * aplicados: cada medida inexistente por desenho era uma chave PRESENTE com
 * `undefined` (o `$indefinido`) e passa a ser a palavra do tipo do pacote.
 * O velho é conferido (chave presente, valor `undefined`); o resto das faixas,
 * intocado. A linha de base não se regrava (regra 14).
 */
function faixasEsperadas(): Record<string, Record<string, unknown>> {
  const faixas = structuredClone(base.tokens.faixas) as Record<string, Record<string, unknown>>
  for (const par of base.paresTokensN4.pares) {
    const [raiz, f, grupo, chave] = par.caminho.split('.')
    expect(raiz).toBe('faixas')
    const alvo = faixas[f][grupo] as Record<string, unknown>
    expect(chave in alvo, `o velho de ${par.caminho} é uma chave presente`).toBe(true)
    expect(alvo[chave], `o velho de ${par.caminho} é o da linha de base`).toStrictEqual(par.velho ?? undefined)
    expect(par.razao).toMatch(/N4-D64/)
    alvo[chave] = par.novo
  }
  return faixas
}

/** Os tokens que migram SEM mudar de forma (I1-D3). */
const IGUAIS = [
  'dark', 'light', 'space', 'radius', 'touch', 'bar', 'size',
  'zoomSteps', 'zoomDefault', 'lineHeight', 'tracking',
] as const

/**
 * Sem o bloco `web`, a faixa do pacote é a do nativo. **N4-PR7**: e sem o bloco `lib` (P-T1, P-T2), que é ADIÇÃO —
 * nenhuma chave da linha de base muda; ele é cobrado no `it` próprio, contra a folha (`N4-PR7 — o bloco lib`).
 * **N4-PR8**: e sem o bloco `view` (P-T3, N4-D99), outra ADIÇÃO, cobrada no `it` dela (`N4-PR8 — o bloco view`).
 */
const ADICOES_N4 = ['web', 'lib', 'view']
const semWeb = (f: Record<string, unknown>) => Object.fromEntries(Object.entries(f).filter(([k]) => !ADICOES_N4.includes(k)))

describe('pacote ≡ linha de base (em dp)', () => {
  for (const k of IGUAIS) {
    it(k, () => expect((identidade as Record<string, unknown>)[k]).toStrictEqual(base.tokens[k]))
  }

  it('faixas A, B e C, fora o bloco web — com as três medidas inexistentes por desenho (N4-D64, em par)', () => {
    const esperadas = faixasEsperadas()
    for (const f of ['A', 'B', 'C'] as const) {
      expect(semWeb(identidade.faixas[f] as unknown as Record<string, unknown>)).toStrictEqual(esperadas[f])
    }
    expect(base.paresTokensN4.pares.map((p) => p.caminho)).toStrictEqual([
      'faixas.B.folha.alturaMin', 'faixas.A.folha.alturaMin', 'faixas.C.reordenar.artistaMin',
    ])
  })

  it('N4-D64: a medida que a faixa não tem é a palavra do tipo, e nenhuma faixa tem `undefined` (só o web tem `null`)', () => {
    expect(identidade.INEXISTENTE).toBe('inexistente')
    const indefinidas = (o: unknown, caminho: string): string[] =>
      o !== null && typeof o === 'object'
        ? Object.entries(o).flatMap(([k, v]) => (v === undefined ? [`${caminho}.${k}`] : indefinidas(v, `${caminho}.${k}`)))
        : []
    expect(['A', 'B', 'C'].flatMap((f) => indefinidas(identidade.faixas[f as 'A'], f))).toStrictEqual([])
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
    const auth = { marca: { largura: 340, altura: 219 }, colunaAuth: 420, campoAuth: 60, botaoAuth: 58, botaoAviso: 36, entrelinhaAviso: 20, limiarAviso: 320,
      // I1-PR-9 (aval do commit 2, opção 2): o metadado de linha e as duas alfas da folha 4 — ADIÇÃO
      metadado: 13, alfaMarcado: 0.12, alfaDialogo: 0.82 }
    const C = { conteiner: 1138, margem: 32, colunaLateral: 320, razaoListaDetalhe: [2, 3], zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: false, ...auth, vaoAuth: 140 }
    const B = { conteiner: null, margem: 24, colunaLateral: 'empilha', razaoListaDetalhe: 'empilha', zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: true, ...auth, vaoAuth: 48 }
    expect(identidade.faixas.C.web).toStrictEqual(C)
    expect(identidade.faixas.B.web).toStrictEqual(B)
    expect(identidade.faixas.A.web).toStrictEqual(B)
  })

  /**
   * N4-PR7 — P-T1 e P-T2 (N4-D67; `DESIGN-N4/README.md` §3.1, `N4-REQUISITOS.md` N4-R20), por faixa: a faixa de
   * filtros 64 em C e B, 120 em A (duas linhas, 3 + 2); a linha 80 nas três (em A, o mínimo — ela cresce). A é a
   * primeira faixa com valor próprio: o único `lib.filtros`, e o resto de A continua sendo B.
   */
  it('N4-PR7 — o bloco lib (P-T1, P-T2): C 64 · B 64 · A 120; a linha 80', () => {
    expect(identidade.faixas.C.lib).toStrictEqual({ filtros: 64, linha: 80 })
    expect(identidade.faixas.B.lib).toStrictEqual({ filtros: 64, linha: 80 })
    expect(identidade.faixas.A.lib).toStrictEqual({ filtros: 120, linha: 80 })
    // Em par (N4-PR8): era `semLib(A) == semLib(B)` — com o `view` de A (a grade de 2, N4-D99), A é B fora do `lib` E
    // do `view`.
    const semLib = (f: object) => Object.fromEntries(Object.entries(f).filter(([k]) => k !== 'lib' && k !== 'view'))
    expect(semLib(identidade.faixas.A)).toStrictEqual(semLib(identidade.faixas.B))
  })

  /**
   * N4-PR8 — P-T3 (N4-D65, N4-D67; `DESIGN-N4/README.md` §3.1, `N4-REQUISITOS.md` N4-R13, N4-R20) e a grade de
   * *Detalhes* (N4-D99, `[Marcel, 2026-10-06]`), por faixa. A coluna de detalhes à esquerda do leitor existe SÓ em C
   * (340); em B e A ela é **inexistente por desenho** (uma coluna só: os detalhes sobre o corpo) — a forma da N4-D64,
   * a palavra `INEXISTENTE`, nunca `undefined` (div. 1020). A grade: 2 colunas em C (dentro dos 340), 3 em B, 2 em A.
   */
  it('N4-PR8 — o bloco view (P-T3, N4-D99): a coluna 340 só em C, inexistente em B e A; a grade C 2 · B 3 · A 2', () => {
    expect(identidade.faixas.C.view).toStrictEqual({ coluna: 340, grade: 2 })
    expect(identidade.faixas.B.view).toStrictEqual({ coluna: identidade.INEXISTENTE, grade: 3 })
    expect(identidade.faixas.A.view).toStrictEqual({ coluna: identidade.INEXISTENTE, grade: 2 })
  })

  it('faixaDe e os limiares moram no pacote (I1-D30): A < 700 · B 700–960 · C > 960', () => {
    expect(identidade.limiares).toStrictEqual({ ab: 700, bc: 960 })
    expect([699, 699.9, 700, 960, 960.1, 961].map(identidade.faixaDe)).toEqual(['A', 'A', 'B', 'B', 'C', 'C'])
  })

  /**
   * N4-PR4 — a linha de base NÃO se regrava: a troca dos quatro de tipo e os
   * dois novos (N4-D68, N4-D69, N4-D76) entram como PAR (regra 14 do
   * `LOGS-OCTAVIA.md`) em `paresIconesN4` — o velho tem de ser exatamente o da
   * linha de base (ou `null`, nome novo), e o pacote tem de ter o novo. Os
   * outros 39 nomes continuam cobrados contra a linha de base, intocados.
   */
  /**
   * QL-PR4 — a divisa (QL-D31) entra pelo mesmo mecanismo: um par a mais (`paresIconesQL`, velho `null` — nome
   * novo), aplicado DEPOIS dos do N4. A linha de base continua sem ser regravada.
   */
  it('ícones: os 43 da linha de base com os seis pares do N4 e o do QL aplicados — 46 nomes, e nenhum visto (div. 588, decisão (b))', () => {
    const esperado: Record<string, unknown> = { ...(base.icones as Record<string, unknown>) }
    for (const [nome, par] of Object.entries(base.paresIconesN4.pares)) {
      expect(par.velho ?? undefined, `o velho do par "${nome}" é o da linha de base`).toStrictEqual(esperado[nome])
      expect(par.razao, `o par "${nome}" tem razão`).toMatch(/N4-D\d+/)
      esperado[nome] = par.novo
    }
    for (const [nome, par] of Object.entries(base.paresIconesQL.pares)) {
      expect(par.velho ?? undefined, `o velho do par "${nome}" é o da linha de base com o N4 aplicado`).toStrictEqual(esperado[nome])
      expect(par.razao, `o par "${nome}" tem razão`).toMatch(/QL-D\d+/)
      esperado[nome] = par.novo
    }
    expect(Object.keys(base.paresIconesN4.pares)).toStrictEqual(['letra', 'cifra', 'tab', 'partitura', 'estrela', 'tocar'])
    expect(Object.keys(base.paresIconesQL.pares)).toStrictEqual(['divisa'])
    expect(identidade.desenhos).toStrictEqual(esperado)
    expect(identidade.nomesIcones).toHaveLength(46)
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

  it('theme.faixas — sem o bloco web, A continua sendo B fora do lib e do view (com os pares da N4-D64)', () => {
    const esperadas = faixasEsperadas()
    for (const f of ['A', 'B', 'C'] as const) {
      expect(semWeb(tema.faixas[f] as unknown as Record<string, unknown>)).toStrictEqual(esperadas[f])
    }
    // Em par (N4-PR7, P-T1): era `expect(tema.faixas.A).toBe(tema.faixas.B)` — A ERA o objeto de B. Com a faixa de
    // filtros de duas linhas em A, A é uma cópia de B com o `lib` próprio: o resto, chave a chave, igual; e o mesmo
    // objeto do pacote (o `theme.ts` reexporta, não copia).
    // Em par (N4-PR8): A é B fora do `lib` e do `view` (a grade de 2 de A, N4-D99).
    const semLib = (f: object) => Object.fromEntries(Object.entries(f).filter(([k]) => k !== 'lib' && k !== 'view'))
    expect(semLib(tema.faixas.A)).toStrictEqual(semLib(tema.faixas.B))
    expect(tema.faixas.A.lib.filtros).not.toBe(tema.faixas.B.lib.filtros)
    expect(tema.faixas.A.view.grade).not.toBe(tema.faixas.B.view.grade)
    expect(tema.faixas).toBe(identidade.faixas)
  })

  it('theme.font continua com os nomes de .ttf do expo-font (o mapa de fontes.ts)', () => {
    expect(tema.font).toStrictEqual(base.tokens.font)
  })

  it('icones/dados.ts é o mapa do pacote', () => {
    expect(dados.desenhos).toBe(identidade.desenhos)
  })
})
