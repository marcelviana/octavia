/**
 * N4-PR9 — a linha de aviso POR ESPÉCIE nas quatro telas antigas, sem mudar um par (N4-D32, N4-D72; o contrato da
 * N4-PR3, `N4-PR3-anexos/README.md` §2.5; `N4-PR9-anexos/README.md` §2).
 *
 * Até a N4-PR8 o `LinhaDeAviso.tsx` recebe `icone` e `cor` de quem chama. A troca é: a tela diz a ESPÉCIE e o
 * componente mapeia espécie → (ícone, cor). Ela **só entra se o mapa devolver exatamente os mesmos pares de hoje**
 * em todos os usos. Por isso o par de hoje está FIXADO aqui, uso a uso, lido da `main` `5c41c2d` (arquivo:linha na
 * tabela) — depois da troca ele não está mais na fonte das telas, e é este arquivo que lembra qual era.
 *
 * O que se cobra:
 *  1. cada uso das quatro telas, achado pela árvore do TypeScript (o objeto literal com `motivo` e `cor`/`especie`),
 *     declara a espécie da tabela e não declara mais `icone`/`cor` — e o mapa dessa espécie é o par de hoje;
 *  2. o uso que NÃO cabe no mapa sem mudar o par (`especie: null` na tabela) continua com o `icone`/`cor` de hoje;
 *  3. nenhum uso fica fora da tabela (um aviso novo numa tela antiga reprova até entrar nela);
 *  4. o componente, com a espécie, desenha o MESMO ícone na mesma tinta que desenhava com o par.
 *
 * O controle negativo (regra 4): um par trocado numa tela antiga — a espécie de outro uso, ou o mapa com outro ícone
 * ou outra cor — reprova aqui; no aparelho, o G-inv vê o desenho (div. 1049).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { Icone } from '../src/icones/Icone'
import type { NomeIcone } from '../src/icones/dados'
import * as Componente from '../src/screens/LinhaDeAviso'
import { dark } from '../src/theme'

type Tinta = 'offlineInk' | 'errorInk' | 'muted'
type Tela = 'IndexScreen.tsx' | 'ModoDeReordenar.tsx' | 'Picker.tsx' | 'SetlistsScreen.tsx'

interface Uso {
  tela: Tela
  /** Onde o par estava na `main` `5c41c2d` (a linha do `icone:`). */
  linhaNaMain: number
  situacao: string
  /** O texto do `motivo` do objeto literal — a âncora do uso na fonte. */
  motivo: string
  icone: NomeIcone
  cor: Tinta
  /** A espécie do contrato que devolve o mesmo par; `null` = não cabe no mapa sem mudar o par (não se troca). */
  especie: 'rede' | 'limite' | 'falha' | 'teto' | 'salvo-nao-relido' | null
}

/** Os 16 usos, na ordem das telas e, dentro de cada uma, na da escada "vale o que bloqueia mais". */
const USOS: readonly Uso[] = [
  { tela: 'IndexScreen.tsx', linhaNaMain: 569, situacao: 'sem rede', motivo: "frase('sem-rede-s2')", icone: 'sem-conexao', cor: 'offlineInk', especie: 'rede' },
  { tela: 'IndexScreen.tsx', linhaNaMain: 574, situacao: 'limite de taxa', motivo: 'falha.frase', icone: 'ultima-sincronizacao', cor: 'offlineInk', especie: 'limite' },
  { tela: 'IndexScreen.tsx', linhaNaMain: 586, situacao: 'a escrita falhou', motivo: "oracoes.join('  ·  ')", icone: 'falha', cor: 'errorInk', especie: 'falha' },
  { tela: 'IndexScreen.tsx', linhaNaMain: 610, situacao: 'o teto de 100', motivo: "frase('teto-100')", icone: 'n-de-musicas', cor: 'muted', especie: 'teto' },
  { tela: 'IndexScreen.tsx', linhaNaMain: 614, situacao: 'salvo, não relido', motivo: "frase('salvo-nao-relido-s2')", icone: 'ultima-sincronizacao', cor: 'muted', especie: 'salvo-nao-relido' },
  { tela: 'ModoDeReordenar.tsx', linhaNaMain: 502, situacao: 'sem rede', motivo: "frase('sem-rede-s2')", icone: 'sem-conexao', cor: 'offlineInk', especie: 'rede' },
  { tela: 'ModoDeReordenar.tsx', linhaNaMain: 504, situacao: 'limite de taxa', motivo: 'falha.frase', icone: 'ultima-sincronizacao', cor: 'offlineInk', especie: 'limite' },
  { tela: 'ModoDeReordenar.tsx', linhaNaMain: 511, situacao: 'a ordem falhou', motivo: "oracoes.join('  ·  ')", icone: 'falha', cor: 'errorInk', especie: 'falha' },
  { tela: 'Picker.tsx', linhaNaMain: 314, situacao: 'sem rede', motivo: "frase('sem-rede-s2')", icone: 'sem-conexao', cor: 'offlineInk', especie: 'rede' },
  { tela: 'Picker.tsx', linhaNaMain: 317, situacao: 'a releitura falhou', motivo: "frase('salvo-nao-relido-picker')", icone: 'ultima-sincronizacao', cor: 'muted', especie: 'salvo-nao-relido' },
  { tela: 'Picker.tsx', linhaNaMain: 328, situacao: 'o teto de 100', motivo: "frase('teto-100')", icone: 'n-de-musicas', cor: 'muted', especie: 'teto' },
  { tela: 'SetlistsScreen.tsx', linhaNaMain: 498, situacao: 'sem rede', motivo: "frase('sem-rede-s1')", icone: 'sem-conexao', cor: 'offlineInk', especie: 'rede' },
  { tela: 'SetlistsScreen.tsx', linhaNaMain: 505, situacao: 'a setlist sumiu e a releitura falhou', motivo: "frase('sumiu-nao-relido')", icone: 'falha', cor: 'muted', especie: null },
  { tela: 'SetlistsScreen.tsx', linhaNaMain: 517, situacao: 'a setlist sumiu (declarado)', motivo: "frase('sumiu-declarado')", icone: 'falha', cor: 'muted', especie: null },
  { tela: 'SetlistsScreen.tsx', linhaNaMain: 524, situacao: 'apagada, não relida', motivo: "`${apagadaNaoRelida} foi apagada. ${frase('apagada-nao-relida')}`", icone: 'ultima-sincronizacao', cor: 'muted', especie: 'salvo-nao-relido' },
  { tela: 'SetlistsScreen.tsx', linhaNaMain: 538, situacao: 'criada, não relida', motivo: "`${salvoNaoRelido} foi criada. ${frase('salvo-nao-relido-s1')}`", icone: 'ultima-sincronizacao', cor: 'muted', especie: 'salvo-nao-relido' },
]

const TELAS: readonly Tela[] = ['IndexScreen.tsx', 'ModoDeReordenar.tsx', 'Picker.tsx', 'SetlistsScreen.tsx']

interface Literal {
  motivo: string
  props: Map<string, string>
  linha: number
}

/** Os objetos literais de aviso de uma tela: os que têm `motivo` e `cor` ou `especie` (o `invalidoDe` do índice tem
 *  `motivo` e `icone`, mas não é aviso — não tem tinta). */
function literaisDeAviso(tela: Tela): Literal[] {
  const fonte = readFileSync(join(__dirname, '../src/screens', tela), 'utf8')
  const sf = ts.createSourceFile(tela, fonte, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: Literal[] = []
  const visitar = (n: ts.Node): void => {
    if (ts.isObjectLiteralExpression(n)) {
      const props = new Map<string, string>()
      for (const p of n.properties) {
        if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
          props.set(p.name.text, p.initializer.getText(sf))
        }
      }
      const motivo = props.get('motivo')
      if (motivo !== undefined && (props.has('cor') || props.has('especie'))) {
        out.push({ motivo, props, linha: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1 })
      }
    }
    ts.forEachChild(n, visitar)
  }
  visitar(sf)
  return out
}

/** `'sem-conexao' as NomeIcone` → `sem-conexao` (e `'rede' as const` → `rede`); `dark.offlineInk` → `offlineInk`. */
const semAs = (t: string): string => t.replace(/\s+as\s+\w+$/, '').replace(/^'(.*)'$/, '$1')
const tinta = (t: string): string => t.replace(/^dark\./, '')

/** O mapa do componente — `undefined` antes da troca (a `main` não o tem: é aqui que o instrumento reprova). */
const PAR_DA_ESPECIE = (Componente as Record<string, unknown>).PAR_DA_ESPECIE as
  | Record<string, { icone: NomeIcone; cor: string }>
  | undefined

describe('a troca por espécie nas quatro telas antigas: os mesmos pares de hoje (N4-D32)', () => {
  it('a tabela: 16 usos, 14 por espécie e 2 que não cabem no mapa (a lista de setlists, `falha` em `muted`)', () => {
    expect(USOS).toHaveLength(16)
    expect(USOS.filter((u) => u.especie === null).map((u) => `${u.tela}:${u.linhaNaMain}`)).toEqual([
      'SetlistsScreen.tsx:505',
      'SetlistsScreen.tsx:517',
    ])
  })

  it('nenhum aviso das quatro telas fica fora da tabela, e cada âncora acha um uso só', () => {
    for (const tela of TELAS) {
      const naFonte = literaisDeAviso(tela).map((l) => l.motivo).sort()
      const naTabela = USOS.filter((u) => u.tela === tela).map((u) => u.motivo).sort()
      expect({ tela, motivos: naFonte }).toEqual({ tela, motivos: naTabela })
    }
  })

  it('o mapa espécie → (ícone, cor) devolve, para cada espécie usada, o par de hoje', () => {
    expect(PAR_DA_ESPECIE).toBeDefined()
    for (const u of USOS) {
      if (u.especie === null) continue
      expect({ uso: `${u.tela}:${u.linhaNaMain}`, par: PAR_DA_ESPECIE?.[u.especie] }).toEqual({
        uso: `${u.tela}:${u.linhaNaMain}`,
        par: { icone: u.icone, cor: dark[u.cor] },
      })
    }
  })

  for (const u of USOS) {
    const nome = `${u.tela}:${u.linhaNaMain} (${u.situacao})`
    it(
      u.especie === null
        ? `${nome}: não cabe no mapa — continua com ${u.icone} em ${u.cor}`
        : `${nome}: declara a espécie ${u.especie}, sem icone/cor`,
      () => {
        const l = literaisDeAviso(u.tela).find((x) => x.motivo === u.motivo)
        expect(l, `o uso ${nome} não foi achado pela âncora ${u.motivo}`).toBeDefined()
        const props = l!.props
        if (u.especie === null) {
          expect({ especie: props.get('especie'), icone: semAs(props.get('icone') ?? ''), cor: tinta(props.get('cor') ?? '') }).toEqual({
            especie: undefined,
            icone: u.icone,
            cor: u.cor,
          })
        } else {
          expect({ especie: semAs(props.get('especie') ?? ''), icone: props.get('icone'), cor: props.get('cor') }).toEqual({
            especie: u.especie,
            icone: undefined,
            cor: undefined,
          })
        }
      },
    )
  }

  it('o componente, com a espécie, desenha o mesmo ícone na mesma tinta que com o par (e o motivo nessa tinta)', () => {
    expect(PAR_DA_ESPECIE).toBeDefined()
    const LinhaDeAviso = Componente.LinhaDeAviso as unknown as (p: Record<string, unknown>) => React.JSX.Element
    for (const u of USOS) {
      if (u.especie === null) continue
      const html = renderToStaticMarkup(<LinhaDeAviso especie={u.especie} motivo="m" />)
      const icone = renderToStaticMarkup(<Icone nome={u.icone} tamanho={20} cor={dark[u.cor]} />)
      expect(html.includes(icone), `${u.tela}:${u.linhaNaMain}`).toBe(true)
      expect(html).toContain(`&quot;color&quot;:&quot;${dark[u.cor]}&quot;`)
    }
  })
})
