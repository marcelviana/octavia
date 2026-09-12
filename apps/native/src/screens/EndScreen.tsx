/**
 * S5 — Fim da setlist (PRD T1-R29; aceite A14).
 * Avançar na última música chega aqui: "fim da setlist", com "voltar ao
 * início" e "sair". A borda esquerda continua funcionando e devolve à última
 * música; **nada** leva para fora do app sem o botão — o beco sem saída e a
 * saída acidental são justamente o que o requisito proíbe.
 */
import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { log } from '../log'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'

export interface EndScreenProps {
  nomeSetlist: string
  total: number
  onVoltarUltima: () => void
  onVoltarInicio: () => void
  onSair: () => void
}

export function EndScreen({
  nomeSetlist,
  total,
  onVoltarUltima,
  onVoltarInicio,
  onSair,
}: EndScreenProps): React.JSX.Element {
  // As duas linhas eram idênticas às do `StageScreen` e herdavam o mesmo
  // transbordo de 84,0 dp (V1-PRECHECK §3.4, div. 16) — com uma borda só.
  // Método e razão: a nota longa no `StageScreen`.
  const [meio, setMeio] = useState<{ largura: number; altura: number } | null>(null)
  const medirMeio = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout
    setMeio((m) => (m !== null && m.largura === w && m.altura === h ? m : { largura: w, altura: h }))
  }, [])
  const larguraBorda = meio === null ? 0 : Math.max(meio.largura * 0.15, touch.min)
  const alturaConteudo = meio === null ? 0 : Math.max(meio.altura, touch.min)

  return (
    <View style={styles.tela}>
      <View style={styles.barraTopo}>
        <Text style={styles.posicao}>{`${total} DE ${total}`}</Text>
        <Text style={styles.nomeSetlist} numberOfLines={1}>
          {nomeSetlist}
        </Text>
      </View>

      <View style={styles.meio} onLayout={medirMeio}>
        <View style={styles.centro}>
          <Text style={styles.titulo}>FIM DA SETLIST</Text>
          <Text style={styles.apoio}>
            {`${total} ${total === 1 ? 'música' : 'músicas'}  ·  ${nomeSetlist}`}
          </Text>
          <View style={styles.acoes}>
            <Pressable style={styles.botaoPrimario} onPress={onVoltarInicio} testID="voltar-inicio">
              <Text style={styles.botaoPrimarioTexto}>Voltar ao início</Text>
            </Pressable>
            <Pressable style={styles.botaoSecundario} onPress={onSair} testID="sair">
              <Text style={styles.botaoSecundarioTexto}>Sair</Text>
            </Pressable>
          </View>
        </View>

        {/* Borda esquerda: volta à última música. A direita NÃO existe aqui —
            não há para onde avançar, e sair só pelo botão (T1-R29). */}
        {meio !== null ? (
          <Pressable
            style={[styles.borda, { width: larguraBorda, height: alturaConteudo, left: 0 }]}
            onPress={() => {
              log(`nav n=${total}/${total} setlist=fim t=0`)
              onVoltarUltima()
            }}
            testID="borda-voltar"
          />
        ) : null}
      </View>

      <View style={styles.barraBaixo} />
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  barraTopo: {
    height: bar.top,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  posicao: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.display,
  },
  nomeSetlist: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: 13,
    letterSpacing: 13 * tracking.label,
    textTransform: 'uppercase',
  },
  meio: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  titulo: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: 44,
    letterSpacing: 44 * tracking.display,
  },
  apoio: { color: dark.muted, fontFamily: font.ui, fontSize: size.body },
  acoes: { flexDirection: 'row', gap: space.lg, marginTop: space.xl },
  botaoPrimario: {
    height: touch.stage,
    paddingHorizontal: space.xxl,
    borderRadius: radius.control,
    backgroundColor: dark.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPrimarioTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.button },
  botaoSecundario: {
    height: touch.stage,
    paddingHorizontal: space.xxl,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundarioTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.button },
  borda: { position: 'absolute', top: 0 },
  barraBaixo: { height: bar.stage, borderTopWidth: bar.hairline, borderTopColor: dark.line },
})
