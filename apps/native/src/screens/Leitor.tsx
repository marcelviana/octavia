/**
 * O LEITOR DO PALCO, COMPARTILHADO — N4-PR8 (N4-D24: *"o corpo da música na visualização usa o mesmo leitor do
 * palco"*; `N4-REQUISITOS.md` N4-R13, N4-R15).
 *
 * O que mora aqui é COMO o corpo se desenha — e só isso: o texto (mono, a entrelinha do texto ou da tablatura, sem
 * quebra de linha: o corpo dentro de uma rolagem HORIZONTAL, T1-R25/R31) e as medidas do corpo do palco. O palco
 * (`StageScreen.tsx`) e a visualização (`VisualizacaoScreen.tsx`) importam daqui; **o palco desenha exatamente o que
 * desenhava** — a prova é o G-inv 18/18 da `B3-referencia-paisagem/` (o palco com setlist, nó a nó) e 34/34 da
 * `B5-baseline/`. Uma mudança aqui muda os dois, e o G-inv a vê (o controle negativo do `N4-PR8-anexos/README.md`).
 *
 * O que NÃO mora aqui: os controles de tocar (rolagem automática, zoom, tema, as bordas de virar página) e a máquina
 * do arquivo do palco (o `buscarArquivo` e as linhas de log dele) — a visualização não toca, e as linhas `log(` do
 * palco não mudam de arquivo (G3). Os `testID` também ficam com quem desenha: cada tela passa o seu (o G2 coleta por
 * arquivo).
 */
import { ScrollView, StyleSheet, Text, type TextStyle } from 'react-native'
import { colors, font, lineHeight, space, type ThemeName } from '../theme'

type Cor = (typeof colors)[ThemeName]

/**
 * O estilo do corpo de texto do palco: IBM Plex Mono no tamanho do zoom (22 é o padrão, T1-R31), a entrelinha 1,55 do
 * texto ou 1,45 da tablatura, na tinta do tema. Era o `estiloTexto` do `StageScreen.tsx` (o mesmo objeto).
 */
export function estiloDoLeitor(tipo: string | null, zoom: number, cor: Cor): TextStyle {
  return {
    fontFamily: font.mono,
    fontSize: zoom,
    lineHeight: zoom * (tipo === 'Tab' ? lineHeight.tab : lineHeight.text),
    color: cor.text,
  }
}

/**
 * O corpo de texto: a cadeia inteira num `Text`, dentro de um `ScrollView` HORIZONTAL — é ele que impede a re-quebra
 * da linha longa em qualquer zoom (T1-R25/R31, provado no spike da N1-PR4). Sem quebra de linha no N4, no palco e em V
 * (N4-D66, P-O5): a linha mais longa que a coluna rola para o lado.
 */
export function CorpoDoLeitor({ corpo, estilo, testID }: { corpo: string | null; estilo: TextStyle; testID: string }): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text style={estilo} testID={testID}>
        {corpo ?? ''}
      </Text>
    </ScrollView>
  )
}

/** As medidas do corpo do palco: a rolagem vertical e o respiro de 32 (48 embaixo) em volta do texto. */
export const leitor = StyleSheet.create({
  conteudo: { flex: 1 },
  conteudoPad: { padding: space.xxl, paddingBottom: space.xxxl },
})
