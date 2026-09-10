/**
 * SPIKE da N1-PR4 — tela TEMPORÁRIA, apagada no commit 2 desta mesma PR.
 * Existe para medir os dois riscos que o pre-check nomeou (C3), antes de
 * escrever o palco de verdade:
 *
 *  1. **Auto-scroll (T1-R30)**: `ScrollView.scrollTo` dirigido por
 *     `requestAnimationFrame` a 1 dp/frame responde em < 100 ms e roda sem
 *     engasgo? Mede `autoscroll on t=<ms>` e serve de carga para o
 *     `dumpsys gfxinfo framestats`.
 *  2. **Linha longa (T1-R25/R31)**: `ScrollView` horizontal + `Text` mono
 *     mantém uma linha de 120 colunas inteira em qualquer zoom, sem
 *     re-quebrar? O botão "sem horizontal" é o CONTROLE NEGATIVO: mostra a
 *     quebra que o teste precisa ser capaz de ver.
 */
import { useCallback, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CIFRA_120_COLUNAS, TEXTO_300_LINHAS } from '../fixtures/palco'
import { log } from '../log'
import { dark, font, lineHeight, radius, space, touch, zoomSteps } from '../theme'

export function SpikeScreen({ onSair }: { onSair: () => void }): React.JSX.Element {
  const scroll = useRef<ScrollView | null>(null)
  const y = useRef(0)
  const frame = useRef<number | null>(null)
  const pedidoEm = useRef(0)
  const primeiroFrame = useRef(true)
  const [rodando, setRodando] = useState(false)
  const [zoom, setZoom] = useState(22)
  const [horizontal, setHorizontal] = useState(true)

  const passo = useCallback(() => {
    if (primeiroFrame.current) {
      primeiroFrame.current = false
      log(`autoscroll on t=${Date.now() - pedidoEm.current}`)
    }
    y.current += 1
    scroll.current?.scrollTo({ y: y.current, animated: false })
    frame.current = requestAnimationFrame(passo)
  }, [])

  const alternar = useCallback(() => {
    if (rodando) {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      frame.current = null
      setRodando(false)
      log('autoscroll off t=0')
      return
    }
    pedidoEm.current = Date.now()
    primeiroFrame.current = true
    setRodando(true)
    frame.current = requestAnimationFrame(passo)
  }, [rodando, passo])

  const trocarZoom = useCallback((dp: number) => {
    setZoom(dp)
    log(`zoom dp=${dp}`)
  }, [])

  const estiloTexto = { fontFamily: font.mono, fontSize: zoom, lineHeight: zoom * lineHeight.text, color: dark.text }

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <Text style={styles.rotulo}>SPIKE C3 — descartável</Text>
        {zoomSteps.map((dp) => (
          <Pressable key={dp} style={styles.botao} onPress={() => trocarZoom(dp)}>
            <Text style={styles.botaoTexto}>{dp}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.botao} onPress={() => setHorizontal((h) => !h)}>
          <Text style={styles.botaoTexto}>{horizontal ? 'com horizontal' : 'SEM horizontal'}</Text>
        </Pressable>
        <Pressable style={styles.botao} onPress={alternar} testID="autoscroll">
          <Text style={styles.botaoTexto}>{rodando ? 'parar' : 'auto-scroll'}</Text>
        </Pressable>
        <Pressable style={styles.botao} onPress={onSair}>
          <Text style={styles.botaoTexto}>sair</Text>
        </Pressable>
      </View>

      <ScrollView ref={scroll} style={styles.conteudo} scrollEventThrottle={16}>
        {horizontal ? (
          <ScrollView horizontal showsHorizontalScrollIndicator>
            <Text style={estiloTexto}>{CIFRA_120_COLUNAS}</Text>
          </ScrollView>
        ) : (
          <Text style={estiloTexto}>{CIFRA_120_COLUNAS}</Text>
        )}
        <Text style={[estiloTexto, styles.separador]}>{TEXTO_300_LINHAS}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderBottomWidth: 1,
    borderBottomColor: dark.line,
  },
  rotulo: { color: dark.offline, fontFamily: font.uiBold, fontSize: 13, marginRight: space.lg },
  botao: {
    height: touch.min,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: dark.line,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: { color: dark.text, fontFamily: font.ui, fontSize: 13 },
  conteudo: { flex: 1, padding: space.xxl },
  separador: { marginTop: space.xxl },
})
