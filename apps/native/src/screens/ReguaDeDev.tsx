/**
 * A RÉGUA DE DESENVOLVIMENTO — N3-PR1 (decisão pré-tomada no prompt; N3-D26
 * se aceita). **Só existe no dev client**: o `App.tsx` a carrega por
 * `require` atrás de `__DEV__`, e no release o Metro dobra a constante e o
 * `require` some do bundle.
 *
 * Para que serve: as dez medidas `[estimado]` e as duas `[soma]` do
 * `DESIGN-N3` (§4.1) são larguras de texto que ainda não estão em tela
 * nenhuma — `Adicionar` no lugar de `Adicionar música`, o chip empilhado, o
 * `FIM DA SETLIST` em 32. Um dump só mede o que o app desenha; a régua desenha
 * o texto com o `Text` e o estilo do app e devolve a largura.
 *
 * Como se usa (`APARATO.md`, "A régua"):
 *
 *   adb shell am start -a android.intent.action.VIEW \
 *     -d 'exp+octavia://regua?t=Adicionar%20m%C3%BAsica&s=faixa' rocks.octavia.app
 *
 * → a linha `regua t="Adicionar música" s=faixa w=<dp>` no logcat (via
 * `onLayout`), e o nó `regua-texto` no dump. `exp+octavia://regua` sem `t`
 * fecha a régua. O texto vem do link; nenhum literal de UI mora aqui (o
 * `gate:a20` não tem o que acusar neste arquivo).
 *
 * Os ESTILOS são cópias declaradas dos `StyleSheet` das telas (os `styles`
 * delas não são exportados, e exportá-los tocaria em tela nesta PR, que não
 * muda tela). O controle de que a cópia é fiel é medido, não suposto: a régua
 * e o dump do mesmo texto na mesma tela têm de dar a mesma largura
 * (`N3-PR1-anexos/`, "régua × dump").
 */
import { useEffect, useState } from 'react'
import { Linking, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type TextStyle } from 'react-native'
import { log } from '../log'
import { dark, font, lineHeight, size, tracking, zoomDefault } from '../theme'

/** Token de estilo → o estilo de texto do app, com a origem ao lado. */
const ESTILOS: Record<string, TextStyle> = {
  /** `IndexScreen.controleTexto` — os quatro rótulos da faixa de S2. */
  faixa: { fontFamily: font.ui, fontSize: size.bodySmall },
  /** `SetlistsScreen.status` — o chip de sync (`sem conexão`, `· última sincronização …`). */
  chip: { fontFamily: font.ui, fontSize: 13 },
  /** `LinhaDeAviso.motivo` — a frase da linha de aviso. */
  aviso: { fontFamily: font.ui, fontSize: size.bodySmall },
  /** `ModoDeReordenar.motivoInativo` = `FolhaDeCriar.motivoInativo` — o motivo do inativo. */
  motivo: { fontFamily: font.ui, fontSize: size.bodySmall },
  /** `ModoDeReordenar.titulo26` — `Reordenar · <nome>`. */
  'reordenar-titulo': {
    fontFamily: font.display,
    fontSize: size.titleSmall,
    letterSpacing: size.titleSmall * tracking.displayWide,
    textTransform: 'uppercase',
  },
  /** `SearchScreen.reguaTexto` — a régua do S4 e do picker (rótulo e contador). */
  'regua-picker': {
    fontFamily: font.mono,
    fontSize: size.labelSmall,
    letterSpacing: size.labelSmall * tracking.display,
    textTransform: 'uppercase',
  },
  /** `Picker.marcaTexto` — `já na setlist · 2×`. */
  marca: { fontFamily: font.ui, fontSize: 13 },
  /** `Picker.alvoTexto` — `Adicionar` / `Tentar de novo` na linha do picker. */
  'picker-alvo': { fontFamily: font.ui, fontSize: size.bodySmall },
  /** `EndScreen.titulo` — `FIM DA SETLIST` em 52, .22em. */
  fim: { fontFamily: font.display, fontSize: size.display, letterSpacing: size.display * tracking.displayWide },
  /** O mesmo token em 32 — o degrau de A da N3-D18. Não existe no app: é a conta da folha, `s1`. */
  'fim-32': { fontFamily: font.display, fontSize: 32, letterSpacing: 32 * tracking.displayWide },
  /**
   * N4-PR7 — a biblioteca (L), medida ANTES de a tela existir (N4-R25; regra 19). Os quatro são os estilos que a
   * `LibraryScreen` usa (a folha, `N4-B-L-base`): o rótulo do chip em Manrope 15 (`size.bodySmall`), a contagem do
   * chip em mono 13 (o literal 13 da S4, N4-D79), o título da linha em Manrope 600 de 20 (o título de resultado da S4,
   * N4-D79) e a segunda linha em Manrope 15. A tela nasce no commit 4 desta PR; daí em diante, mudou o estilo dela,
   * muda o token aqui no mesmo commit.
   */
  'lib-chip': { fontFamily: font.ui, fontSize: size.bodySmall },
  'lib-contagem': { fontFamily: font.mono, fontSize: 13 },
  'lib-titulo': { fontFamily: font.uiBold, fontSize: 20 },
  'lib-segunda': { fontFamily: font.ui, fontSize: size.bodySmall },
  /**
   * N4-PR8 — a visualização (V), medida ANTES de a tela existir (N4-R25; regra 19), com os estilos que a tela vai usar
   * (a folha, `N4-*-V-letra`): o título do cabeçalho em Manrope 600 de 22 (`size.title`), a meta (artista · tipo) e o
   * valor de cada campo em Manrope 17 (`size.button`), o rótulo do campo e a linha das datas em Manrope 13 (o literal
   * 13 da N4-D100, como a N4-D79), as notas em Manrope 16 (`size.body`) — e o LEITOR, o texto do palco em mono 22 com a
   * entrelinha do texto (`zoomDefault` × `lineHeight.text`, o `estiloTexto` do `StageScreen`), de onde saem as colunas
   * visíveis (m14). A tela nasce no commit 4; daí em diante, mudou o estilo dela, muda o token aqui no mesmo commit.
   */
  'view-titulo': { fontFamily: font.uiBold, fontSize: size.title },
  'view-meta': { fontFamily: font.ui, fontSize: size.button },
  'view-rotulo': { fontFamily: font.ui, fontSize: 13 },
  'view-valor': { fontFamily: font.ui, fontSize: size.button },
  'view-notas': { fontFamily: font.ui, fontSize: size.body, lineHeight: size.body * lineHeight.text },
  leitor: { fontFamily: font.mono, fontSize: zoomDefault, lineHeight: zoomDefault * lineHeight.text },
}

interface Pedido {
  t: string
  s: string
}

/** `exp+octavia://regua?t=…&s=…` → o pedido; outro link → `undefined`; `regua` sem `t` → `null` (fechar). */
function lerLink(url: string | null): Pedido | null | undefined {
  if (url === null || !/^[^:]+:\/\/regua(\?|$)/.test(url)) return undefined
  const q = url.split('?')[1] ?? ''
  const p = new Map(
    q.split('&').filter(Boolean).map((kv) => {
      const [k, v = ''] = kv.split('=')
      return [k, decodeURIComponent(v.replace(/\+/g, ' '))] as const
    }),
  )
  const t = p.get('t')
  return t ? { t, s: p.get('s') ?? '' } : null
}

export function ReguaDeDev(): React.JSX.Element | null {
  const [pedido, setPedido] = useState<Pedido | null>(null)

  useEffect(() => {
    const aplicar = (url: string | null): void => {
      const p = lerLink(url)
      if (p !== undefined) setPedido(p)
    }
    void Linking.getInitialURL().then(aplicar)
    const sub = Linking.addEventListener('url', (e) => aplicar(e.url))
    return () => sub.remove()
  }, [])

  if (pedido === null) return null
  const estilo = ESTILOS[pedido.s]
  const medir = (e: LayoutChangeEvent): void => {
    log(`regua t="${pedido.t}" s=${pedido.s} w=${e.nativeEvent.layout.width.toFixed(1)}`)
  }
  return (
    <View style={styles.cortina}>
      {estilo === undefined ? (
        <Text style={styles.erro} onLayout={() => log(`regua t="${pedido.t}" s=${pedido.s} w=-`)}>
          {pedido.s}
        </Text>
      ) : (
        <ScrollView horizontal contentContainerStyle={styles.linha}>
          <Text key={`${pedido.s}|${pedido.t}`} testID="regua-texto" style={[styles.texto, estilo]} onLayout={medir}>
            {pedido.t}
          </Text>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  cortina: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: dark.bg, justifyContent: 'center' },
  linha: { alignItems: 'flex-start', paddingHorizontal: 0 },
  texto: { color: dark.text },
  erro: { color: dark.error, fontFamily: font.mono, fontSize: size.label },
})
