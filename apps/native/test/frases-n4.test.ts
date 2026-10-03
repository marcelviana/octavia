/**
 * N4-PR3 — as frases novas do N4 no core, contra a FOLHA, e o motivo isolado contra as TELAS de hoje.
 *
 * (1) **As P-F aceitas** (N4-D67: P-F1, P-F3…P-F7, P-F9…P-F11; a P-F8 já existe, N4-E5). A lista esperada é
 *     `n4-pf-esperado.json`, extraída da folha RENDERIZADA (o extrator é o `n4-pf-extrair.mjs`, ao lado), com o
 *     sha256 do `telas.html` de que saiu — e o teste confere esse sha contra o arquivo da árvore: a folha mudou,
 *     a lista é outra, e o teste reprova antes de comparar. Frase com parâmetro é FUNÇÃO no core; o teste a
 *     compara com o molde da folha preenchido (`{título}`, `{tipo}`, `{n}`), com as aspas tipográficas da folha.
 * (2) **O motivo isolado** (N4-D29): o core guarda cada motivo sozinho e o tablet compõe as orações com o
 *     separador das telas de hoje. As quatro composições que já existem (`IndexScreen.tsx` ×2,
 *     `ModoDeReordenar.tsx`, `SearchScreen.tsx`) são lidas do FONTE: o separador delas é o do core, e a frase
 *     composta pelo core é, byte a byte, a que cada tela monta hoje. A tabela das espécies do favoritar (a
 *     legenda de `N4-*-L-favoritar-falhou`) sai do core com o separador do tablet — a folha o escreve com um
 *     espaço de cada lado, e o HTML o colapsa (`N4-PR3-anexos/README.md`, divergências).
 *
 * Sobre a `main` de antes da PR-3, o arquivo inteiro reprova: `frases-content` não existe no core.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { frase, FRASES, type ChaveDeFrase } from '@octavia/core'
import * as conteudo from '@octavia/core'
import esperado from './n4-pf-esperado.json'

const RAIZ = resolve(__dirname, '../../..')
const ler = (rel: string): string => readFileSync(resolve(RAIZ, rel), 'utf8')

describe('(1) as P-F aceitas — contra a lista extraída da folha', () => {
  it(`a lista saiu do telas.html da árvore (sha256 ${esperado.sha256.slice(0, 12)}…)`, () => {
    const sha = createHash('sha256').update(readFileSync(resolve(RAIZ, esperado.origem))).digest('hex')
    expect(sha).toBe(esperado.sha256)
  })

  it(`são ${esperado.pf.length} P-F, as da N4-D67 menos a P-F8`, () => {
    expect(esperado.pf.map((p) => p.id)).toEqual(['P-F1', 'P-F3', 'P-F4', 'P-F5', 'P-F6', 'P-F7', 'P-F9', 'P-F10', 'P-F11'])
  })

  /** O que o core dá para cada P-F, com o molde da folha preenchido pelos mesmos valores. */
  const TITULOS = ['Manhã de ensaio', 'Uma música de título bem comprido, para medir a quebra', '{título}']
  const CASOS: Record<string, (molde: string[]) => [obtido: string, esperado: string][]> = {
    'P-F1': ([m]) => TITULOS.map((t) => [conteudo.nomeTocar(t), m!.replace('{título}', t)]),
    'P-F3': ([m]) => [[conteudo.FRASES_N4['notas-da-musica'], m!]],
    'P-F4': ([m]) => [[conteudo.FRASES_N4['sem-rede-favoritar'], m!]],
    'P-F5': ([favoritando, tirando]) =>
      TITULOS.flatMap((t): [string, string][] => [
        [conteudo.nomeFavoritando(t), favoritando!.replace('{título}', t)],
        [conteudo.nomeTirando(t), tirando!.replace('{título}', t)],
      ]),
    'P-F6': ([m]) => [[conteudo.FRASES_N4['voltar-visualizacao'], m!]],
    'P-F7': ([m]) => TITULOS.map((t) => [conteudo.nomeVer(t), m!.replace('{título}', t)]),
    // Sem plural: o {n} é a contagem entre parênteses, a mesma forma para 0, 1 e muitos.
    'P-F9': ([m]) =>
      (['Letra', 'Cifra', 'Tab', 'Partitura'] as const).flatMap((tipo) =>
        [0, 1, 57].map((n): [string, string] => [conteudo.nomeDoFiltro(tipo, n), m!.replace('{tipo}', tipo).replace('{n}', String(n))]),
      ),
    'P-F10': ([m]) => [[conteudo.FRASES_N4['biblioteca-vazia'], m!]],
    'P-F11': ([m]) => [[conteudo.FRASES_N4['biblioteca-sem-cache'], m!]],
  }

  it.each(esperado.pf.map((p) => [p.id, p.frases] as const))('%s', (id, frases) => {
    const caso = CASOS[id]
    expect(caso, `${id} sem caso no teste`).toBeDefined()
    for (const [obtido, daFolha] of caso!(frases)) expect(obtido).toBe(daFolha)
  })

  it('as aspas são as tipográficas da folha (“ ”), nunca a reta', () => {
    for (const f of [conteudo.nomeTocar('x'), conteudo.nomeVer('x'), conteudo.nomeFavoritando('x'), conteudo.nomeTirando('x')]) {
      expect(f).toMatch(/“x”/)
      expect(f).not.toMatch(/"/)
    }
  })

  it('as cinco constantes P-F do core são estas, e só estas', () => {
    expect(Object.keys(conteudo.FRASES_N4).sort()).toEqual(
      ['biblioteca-sem-cache', 'biblioteca-vazia', 'notas-da-musica', 'sem-rede-favoritar', 'voltar-visualizacao'],
    )
  })
})

describe('(2) o motivo isolado — o core compõe como as telas de hoje', () => {
  /** As composições de hoje: `.join('<separador>')` com `·`, lidas do fonte (comentário fora). */
  const TELAS = [
    'apps/native/src/screens/IndexScreen.tsx',
    'apps/native/src/screens/ModoDeReordenar.tsx',
    'apps/native/src/screens/SearchScreen.tsx',
  ]
  const JUNCOES = TELAS.flatMap((f) =>
    [...ler(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').matchAll(/\.join\('([^']*·[^']*)'\)/g)].map((m) => ({ f, sep: m[1]! })),
  )

  it(`as ${JUNCOES.length} junções com "·" das telas usam o separador do core`, () => {
    expect(JUNCOES.length).toBe(4)
    for (const { f, sep } of JUNCOES) expect(sep, f).toBe(conteudo.SEPARADOR_DE_ORACOES)
  })

  /** Os seis motivos da escrita (N2): cada um sozinho, sem separador de oração dentro. */
  const MOTIVOS: [ChaveDeFrase, string][] = [
    ['rede', frase('rede')],
    ['sem-resposta', frase('sem-resposta')],
    ['auth', frase('auth')],
    ['limite-com-prazo', frase('limite-com-prazo', 12)],
    ['servidor', frase('servidor')],
    ['generica', frase('generica')],
  ]

  it.each(MOTIVOS)('o motivo %s é isolado (sem separador de oração dentro)', (_, m) => {
    expect(m.includes('·')).toBe(false)
  })

  it.each(MOTIVOS)('S2 e o reordenar: com o motivo %s, o core monta byte a byte a frase da tela', (_, m) => {
    const sepDaTela = JUNCOES.find((j) => j.f.endsWith('IndexScreen.tsx'))!.sep
    for (const [abre, fecha] of [
      [FRASES['falhou-salvar'], FRASES['lista-relida']],
      [FRASES['falhou-ordem'], FRASES['ordem-relida']],
    ] as const) {
      expect(conteudo.compor([abre, m])).toBe([abre, m].join(sepDaTela))
      expect(conteudo.compor([abre, m, fecha])).toBe([abre, m, fecha].join(sepDaTela))
    }
  })

  const ESPECIE: Record<string, string> = {
    'sem rede': frase('rede'),
    'sem resposta': frase('sem-resposta'),
    sessão: frase('auth'),
    limite: frase('limite-com-prazo', 12),
    servidor: frase('servidor'),
    genérica: frase('generica'),
  }

  it.each(esperado.especies.linhas.map((l) => [l.especie, l.linha] as const))(
    'o favoritar com falha, %s: o nome do controle · o motivo (a tabela da folha)',
    (especie, linha) => {
      const titulo = /“([^”]*)”/.exec(linha)![1]!
      const nome = linha.startsWith('Tirar') ? conteudo.nomeTirar(titulo) : conteudo.nomeFavoritar(titulo)
      const composta = conteudo.compor([nome, ESPECIE[especie]!])
      // O separador do tablet tem dois espaços de cada lado; a folha, um (o HTML colapsa) — o resto, byte a byte.
      expect(composta.replace(/ {2}· {2}/g, ' · ')).toBe(linha)
    },
  )
})
