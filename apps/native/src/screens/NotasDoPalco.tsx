/**
 * AS NOTAS DA MÚSICA NO PALCO — QL-PR4 (`docs/native/QL-REQUISITOS.md` QL-R14, QL-R15; QL-D30, QL-D31, QL-D32, QL-D37;
 * molduras `QL-*-S3-notas-*` do `DESIGN-QL/telas.html`, com a QL-E3 prevalecendo na régua).
 *
 * No topo do corpo, antes da letra, DENTRO da rolagem do corpo — rolam com ela. O bloco, de cima para baixo:
 *   - a RÉGUA, que é o alvo do toque (48 de altura, `touch.min`): o rótulo *notas da música* (a frase de V,
 *     `FRASES_N4['notas-da-musica']`; nenhuma frase nova) com o estilo da régua de V — mono 12, maiúsculo, o
 *     espaçamento `tracking.display` (QL-E3: a folha desenhou 0,2 em; vale a régua de V, QL-D53) —, o fio `line` até a
 *     ponta, e a DIVISA de 20 em `muted` na ponta direita (aberta para cima, recolhida para baixo; o registro do
 *     catálogo, QL-D31). Toque recolhe ou abre; o nome acessível é o rótulo, e o estado é o expandido do sistema;
 *   - abertas, o TEXTO: um parágrafo por linha que o músico escreveu, 8 entre eles, em Manrope (`font.ui`) no tamanho
 *     16 × zoom ÷ 22 (`tamanhoDasNotas`, QL-D32), entrelinha 1,55, na tinta do texto; 4 em cima e 20 embaixo. **Não passa
 *     pelo `quebrar` do core**: a linha longa quebra pela palavra, como texto de UI (é Manrope, não mono — a R1 que a
 *     plataforma já faz);
 *   - recolhidas, 8 no lugar do texto;
 *   - o FIO `line` que fecha o bloco (a borda de baixo), e 24 até a letra.
 * O bloco sobe 8 sobre o respiro de 32 (a régua começa a 24 do topo do corpo), como a folha desenha.
 *
 * Nos dois temas do palco só as tintas trocam (QL-D37): o texto em `text`, o rótulo e a divisa em `muted`, o fio em
 * `line`. **Sem nota, quem desenha não monta este bloco** — nem a régua (o palco decide: `notasDaVisualizacao` do core
 * dá `null` para a nota vazia ou só de espaço). Os números da folha que não são token saem de tokens: 20 = `lg` + `xs`.
 */
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { FRASES_N4 } from '@octavia/core'
import { Icone } from '../icones/Icone'
import { bar, colors, font, lineHeight, size, space, touch, tracking, type ThemeName } from '../theme'
import { tamanhoDasNotas } from './Leitor'

type Cor = (typeof colors)[ThemeName]

export interface NotasDoPalcoProps {
  /** As notas da música (já sem a vazia: `notasDaVisualizacao`). */
  notas: string
  recolhidas: boolean
  onAlternar: () => void
  zoom: number
  cor: Cor
  /** Onde o bloco está na rolagem: o palco soma a altura dele no começo do corpo (a âncora). */
  onLayout: (e: LayoutChangeEvent) => void
}

export function NotasDoPalco({ notas, recolhidas, onAlternar, zoom, cor, onLayout }: NotasDoPalcoProps): React.JSX.Element {
  const tamanho = tamanhoDasNotas(zoom)
  const paragrafo = { fontFamily: font.ui, fontSize: tamanho, lineHeight: tamanho * lineHeight.text, color: cor.text }
  const rotulo = FRASES_N4['notas-da-musica']
  return (
    <View testID="notas" style={[estilos.bloco, { borderBottomColor: cor.line }]} onLayout={onLayout}>
      <Pressable
        testID="notas-regua"
        style={estilos.regua}
        onPress={onAlternar}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityState={{ expanded: !recolhidas }}
      >
        <Text style={[estilos.rotulo, { color: cor.muted }]}>{rotulo}</Text>
        <View style={[estilos.fio, { backgroundColor: cor.line }]} />
        <Icone nome="divisa" tamanho={20} cor={cor.muted} estado={recolhidas ? 'ativo' : 'normal'} />
      </Pressable>
      {recolhidas ? (
        <View style={estilos.vao} />
      ) : (
        <View testID="notas-texto" style={estilos.texto}>
          {notas.split('\n').map((linha, i) => (
            <Text key={i} style={paragrafo}>
              {linha.replace(/\r$/, '')}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  bloco: { marginTop: -space.sm, marginBottom: space.xl, borderBottomWidth: bar.hairline },
  // a régua de V (`VisualizacaoScreen.tsx`, `regua`), com a altura do alvo mínimo (QL-D30) no lugar dos respiros
  regua: { height: touch.min, flexDirection: 'row', alignItems: 'center', gap: space.md },
  rotulo: {
    fontFamily: font.mono,
    fontSize: size.labelSmall,
    letterSpacing: size.labelSmall * tracking.display,
    textTransform: 'uppercase',
  },
  fio: { flex: 1, height: bar.hairline },
  texto: { gap: space.sm, paddingTop: space.xs, paddingBottom: space.lg + space.xs },
  vao: { height: space.sm },
})
