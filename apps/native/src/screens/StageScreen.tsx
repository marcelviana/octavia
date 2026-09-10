/**
 * S3 — Palco, conteúdo de TEXTO (PRD T1-R24, R25, R27, R28, R29, R30, R31,
 * R32, R33, R34, R35; aceites A12, A14, A15, A16, A17, A18). PDF é a N1-PR5.
 *
 * Layout do design: barra superior de 64 dp com "n de N", nome da setlist,
 * título · artista · tipo, a nota da música e o chip de rede; conteúdo em
 * IBM Plex Mono com entrelinha 1,55; barra inferior de 96 dp com sete
 * controles; e as **bordas invisíveis** de 15% da largura, ocupando só a
 * altura ENTRE as barras (D-1) — é por elas que se avança e volta às cegas.
 *
 * Decisões medidas no spike (commit 1): auto-scroll por `requestAnimationFrame`
 * (responde em ~38 ms) e linha longa dentro de um `ScrollView` horizontal
 * (sem ele a linha re-quebra).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import {
  bodyOf,
  endOfSetlist,
  isValidContent,
  nextPosition,
  prevPosition,
  resolveSong,
  type ContentDTO,
  type SetlistDTO,
} from '@octavia/core'
import { log } from '../log'
import {
  bar,
  colors,
  dark,
  font,
  lineHeight,
  radius,
  size,
  space,
  touch,
  tracking,
  zoomDefault,
  zoomSteps,
  type ThemeName,
} from '../theme'

export interface StageScreenProps {
  setlist: SetlistDTO
  contentById: Map<string, ContentDTO>
  posicao: number
  online: boolean
  onPosicao: (p: number) => void
  onFim: () => void
  onIndice: () => void
  onSair: () => void
}

/** Tag do wake lock — só o palco a usa, então só ele a solta. */
const TAG_PALCO = 'octavia-palco'

const TIPO: Record<string, string> = {
  Lyrics: 'Letra',
  Chords: 'Cifra',
  Tab: 'Tab',
  Sheet: 'Partitura',
}

/** Motivo do placeholder, na linguagem do design (nunca tela vazia). */
const MOTIVO: Record<string, { titulo: string; apoio: string }> = {
  'no-body': {
    titulo: 'este item não tem conteúdo',
    apoio:
      'A música existe na setlist, mas não tem letra, cifra, tab ou arquivo. Edite na versão web. Toque na borda direita para seguir.',
  },
  'no-key': {
    titulo: 'este item não tem conteúdo',
    apoio:
      'O conteúdo salvo não traz o texto desta música. Edite na versão web. Toque na borda direita para seguir.',
  },
  'not-string': {
    titulo: 'este item não tem conteúdo',
    apoio:
      'O conteúdo salvo não traz o texto desta música. Edite na versão web. Toque na borda direita para seguir.',
  },
  'unknown-type': {
    titulo: 'tipo desconhecido',
    apoio: 'Este item tem um tipo que o app ainda não sabe mostrar. Toque na borda direita para seguir.',
  },
  ausente: {
    titulo: 'conteúdo não baixado',
    apoio:
      'Esta música ainda não foi sincronizada neste aparelho. Conecte-se à internet para baixá-la.',
  },
  /**
   * O corpo desta música é um ARQUIVO (Sheet, ou Chords escaneada). O
   * download e o render de PDF são a N1-PR5 — até lá o item mostra o
   * placeholder do design (S3e) em vez de uma tela vazia, que é o que o
   * T1-R26 e a regra C3-1 proíbem.
   */
  arquivo: {
    titulo: 'arquivo não baixado',
    apoio:
      'Esta música é um arquivo (partitura ou cifra escaneada). O download e a leitura de PDF chegam na próxima versão do app.',
  },
}

export function StageScreen({
  setlist,
  contentById,
  posicao,
  online,
  onPosicao,
  onFim,
  onIndice,
  onSair,
}: StageScreenProps): React.JSX.Element {
  /**
   * T1-R33 — a tela não apaga ENQUANTO o palco está aberto.
   *
   * Por FOCO, não por montagem: o `useKeepAwake` solta o lock no unmount, mas
   * o native-stack **não desmonta** a tela ao navegar para outra da pilha —
   * medido na N1-PR4, o `KEEP_SCREEN_ON` continuava na janela do app depois
   * de sair do palco. Com `useFocusEffect` o lock vive exatamente enquanto o
   * palco está visível.
   */
  useFocusEffect(
    useCallback(() => {
      void activateKeepAwakeAsync(TAG_PALCO)
      log('keepawake on')
      return () => {
        deactivateKeepAwake(TAG_PALCO)
        log('keepawake off')
      }
    }, []),
  )

  const { width, height } = useWindowDimensions()
  const [zoom, setZoom] = useState<number>(zoomDefault)
  const [tema, setTema] = useState<ThemeName>('dark')
  const [rodando, setRodando] = useState(false)

  const scroll = useRef<ScrollView | null>(null)
  const y = useRef(0)
  const frame = useRef<number | null>(null)
  const pedidoEm = useRef(0)
  const primeiroFrame = useRef(true)
  const navegouEm = useRef(0)

  const songs = useMemo(
    () => [...setlist.setlist_songs].sort((a, b) => a.position - b.position),
    [setlist],
  )
  const n = songs.length
  const song = songs[posicao - 1]
  const resolvida = song !== undefined ? resolveSong(song, contentById) : null
  const content = resolvida?.content ?? null
  const validade =
    content !== null ? isValidContent(content.content_type, content.content_data, content.file_url) : null
  const corpo = content !== null ? bodyOf(content.content_type, content.content_data) : null
  const cor = colors[tema]

  const pararScroll = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
  }, [])

  /**
   * Troca de música: mede o tempo até o primeiro render do conteúdo novo
   * (T1-R34 / A17), volta ao topo e para o auto-scroll — mantendo zoom e tema
   * (T1-R32: "o estado persiste ao trocar de música").
   *
   * As dependências são só valores ESTÁVEIS (`posicao`, `n`, o id da setlist
   * e a chave do placeholder). Com `validade`/`content` na lista, o efeito
   * rodava a cada render — inclusive o render causado por `setRodando(true)`
   * — e cancelava o `requestAnimationFrame` antes do primeiro frame, o que
   * matava o auto-scroll em silêncio (defeito medido no device, N1-PR4).
   */
  const chavePlaceholder =
    content === null
      ? 'content-missing'
      : validade !== null && !validade.ok
        ? validade.reason
        : validade !== null && validade.body === 'file'
          ? 'file-missing'
          : null

  useEffect(() => {
    pararScroll()
    setRodando(false)
    y.current = 0
    scroll.current?.scrollTo({ y: 0, animated: false })
    if (navegouEm.current > 0) {
      log(
        `nav n=${posicao}/${n} setlist=${setlist.id.slice(0, 8)} t=${Date.now() - navegouEm.current}`,
      )
      navegouEm.current = 0
    }
    if (chavePlaceholder !== null) log(`placeholder kind=${chavePlaceholder}`)
  }, [posicao, n, setlist.id, chavePlaceholder, pararScroll])

  const irPara = useCallback(
    (destino: number) => {
      navegouEm.current = Date.now()
      onPosicao(destino)
    },
    [onPosicao],
  )

  const avancar = useCallback(() => {
    if (endOfSetlist(posicao, n)) {
      log(`end-of-setlist n=${n}`)
      onFim()
      return
    }
    irPara(nextPosition(posicao, n))
  }, [posicao, n, onFim, irPara])

  const voltar = useCallback(() => {
    if (posicao <= 1) return
    irPara(prevPosition(posicao, n))
  }, [posicao, n, irPara])

  const passo = useCallback(() => {
    if (primeiroFrame.current) {
      primeiroFrame.current = false
      log(`autoscroll on t=${Date.now() - pedidoEm.current}`)
    }
    y.current += 1
    scroll.current?.scrollTo({ y: y.current, animated: false })
    frame.current = requestAnimationFrame(passo)
  }, [])

  const alternarScroll = useCallback(() => {
    // T1-R30: em conteúdo que não é texto o controle fica desabilitado COM
    // motivo — nunca mudo. (O caso PDF chega com a N1-PR5.)
    if (corpo === null) {
      log('autoscroll disabled kind=pdf')
      return
    }
    if (rodando) {
      pararScroll()
      setRodando(false)
      log('autoscroll off t=0')
      return
    }
    pedidoEm.current = Date.now()
    primeiroFrame.current = true
    setRodando(true)
    frame.current = requestAnimationFrame(passo)
  }, [corpo, rodando, passo, pararScroll])

  const mudarZoom = useCallback((delta: number) => {
    setZoom((atual) => {
      const i = zoomSteps.indexOf(atual as (typeof zoomSteps)[number])
      const j = Math.min(Math.max(i + delta, 0), zoomSteps.length - 1)
      const novo = zoomSteps[j] ?? atual
      log(`zoom dp=${novo}`)
      return novo
    })
  }, [])

  const alternarTema = useCallback(() => {
    setTema((t) => {
      const novo: ThemeName = t === 'dark' ? 'light' : 'dark'
      log(`theme=${novo}`)
      return novo
    })
  }, [])

  useEffect(() => pararScroll, [pararScroll])

  // Bordas: 15% da largura, altura ENTRE as barras (D-1 / A14).
  const alturaConteudo = Math.max(height - (bar.top + bar.stage), touch.min)
  const larguraBorda = Math.max(width * 0.15, touch.min)

  const estiloTexto = {
    fontFamily: content?.content_type === 'Chords' || content?.content_type === 'Tab' ? font.mono : font.mono,
    fontSize: zoom,
    lineHeight: zoom * (content?.content_type === 'Tab' ? lineHeight.tab : lineHeight.text),
    color: cor.text,
  }

  const motivo =
    content === null
      ? MOTIVO.ausente
      : validade !== null && !validade.ok
        ? MOTIVO[validade.reason]
        : validade !== null && validade.ok && validade.body === 'file'
          ? MOTIVO.arquivo
          : undefined

  return (
    <View style={[styles.tela, { backgroundColor: cor.bg }]}>
      <View style={[styles.barraTopo, { borderBottomColor: cor.line }]}>
        <Text style={[styles.posicao, { color: cor.text }]}>{`${posicao} DE ${n}`}</Text>
        <Text style={[styles.nomeSetlist, { color: cor.muted }]} numberOfLines={1}>
          {setlist.name}
        </Text>
        <Text style={[styles.titulo, { color: cor.text }]} numberOfLines={1}>
          {content?.title ?? '—'}
          <Text style={{ color: cor.muted }}>
            {content?.artist !== null && content?.artist !== undefined ? ` · ${content.artist}` : ''}
            {content !== null ? ` · ${TIPO[content.content_type] ?? content.content_type}` : ''}
          </Text>
        </Text>
        {/* T1-R35: a nota da POSIÇÃO, discreta; sem área vazia quando é nula. */}
        {song?.notes !== null && song?.notes !== undefined && song.notes.length > 0 ? (
          <View style={[styles.nota, { borderColor: cor.line }]}>
            <Text style={[styles.notaTexto, { color: cor.muted }]} numberOfLines={1}>
              {`Nota: ${song.notes}`}
            </Text>
          </View>
        ) : null}
        {!online ? <View style={styles.pontoOffline} /> : null}
      </View>

      <View style={styles.meio}>
        <ScrollView ref={scroll} style={styles.conteudo} contentContainerStyle={styles.conteudoPad}>
          {motivo !== undefined ? (
            <View style={styles.placeholder} testID="placeholder">
              <Text style={[styles.placeholderTitulo, { color: cor.text }]}>{motivo.titulo}</Text>
              <Text style={[styles.placeholderApoio, { color: cor.muted }]}>{motivo.apoio}</Text>
            </View>
          ) : (
            // O ScrollView horizontal é o que impede a re-quebra da linha
            // longa em qualquer zoom (T1-R25/R31 — provado no spike).
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={estiloTexto} testID="corpo">
                {corpo ?? ''}
              </Text>
            </ScrollView>
          )}
        </ScrollView>

        <Pressable
          style={[styles.borda, { width: larguraBorda, height: alturaConteudo, left: 0 }]}
          onPress={voltar}
          testID="borda-voltar"
        />
        <Pressable
          style={[styles.borda, { width: larguraBorda, height: alturaConteudo, right: 0 }]}
          onPress={avancar}
          testID="borda-avancar"
        />
      </View>

      <View style={[styles.barraBaixo, { borderTopColor: cor.line }]}>
        <Controle
          rotulo="Auto-scroll"
          ativo={rodando}
          inativo={corpo === null}
          motivo={corpo === null ? 'auto-scroll só em texto' : undefined}
          cor={cor}
          onPress={alternarScroll}
          testID="auto-scroll"
        />
        <Controle rotulo="Zoom −" cor={cor} onPress={() => mudarZoom(-1)} testID="zoom-menos" />
        <Controle rotulo="Zoom +" cor={cor} onPress={() => mudarZoom(1)} testID="zoom-mais" />
        <Controle
          rotulo={tema === 'dark' ? 'Claro' : 'Escuro'}
          cor={cor}
          onPress={alternarTema}
          testID="tema"
        />
        <Controle rotulo="Índice" cor={cor} onPress={onIndice} testID="indice" />
        <Controle rotulo="Busca" cor={cor} inativo onPress={() => undefined} testID="busca" />
        <Controle rotulo="Sair" cor={cor} onPress={onSair} testID="sair" />
      </View>
    </View>
  )
}

function Controle({
  rotulo,
  ativo,
  inativo,
  motivo,
  cor,
  onPress,
  testID,
}: {
  rotulo: string
  ativo?: boolean
  inativo?: boolean
  motivo?: string
  cor: (typeof colors)[ThemeName]
  onPress: () => void
  testID: string
}): React.JSX.Element {
  return (
    <Pressable
      style={[
        styles.controle,
        { borderColor: ativo === true ? cor.accent : cor.line },
        inativo === true && styles.controleInativo,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
    >
      <Text style={[styles.controleTexto, { color: ativo === true ? cor.accent : cor.text }]}>
        {rotulo}
      </Text>
      {motivo !== undefined ? (
        <Text style={[styles.controleMotivo, { color: cor.muted }]}>{motivo}</Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  barraTopo: {
    height: bar.top,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
  },
  posicao: {
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.display,
  },
  nomeSetlist: {
    fontFamily: font.ui,
    fontSize: 13,
    letterSpacing: 13 * tracking.label,
    textTransform: 'uppercase',
  },
  titulo: { flex: 1, textAlign: 'center', fontFamily: font.ui, fontSize: 20 },
  nota: {
    maxWidth: 260,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: bar.hairline,
    borderRadius: radius.chip,
  },
  notaTexto: { fontFamily: font.ui, fontSize: size.label },
  pontoOffline: { width: 8, height: 8, borderRadius: 4, backgroundColor: dark.offline },
  meio: { flex: 1 },
  conteudo: { flex: 1 },
  conteudoPad: { padding: space.xxl, paddingBottom: space.xxxl },
  borda: { position: 'absolute', top: 0 },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingTop: space.xxxl },
  placeholderTitulo: { fontFamily: font.uiBold, fontSize: size.titleLarge },
  placeholderApoio: {
    fontFamily: font.ui,
    fontSize: size.body,
    textAlign: 'center',
    maxWidth: 560,
  },
  barraBaixo: {
    height: bar.stage,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderTopWidth: bar.hairline,
  },
  controle: {
    minWidth: 106,
    height: touch.stage + 2,
    paddingHorizontal: space.md,
    borderWidth: bar.hairline,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  controleInativo: { opacity: 0.4 },
  controleTexto: { fontFamily: font.ui, fontSize: 12, letterSpacing: 12 * 0.04 },
  controleMotivo: { fontFamily: font.ui, fontSize: 10 },
})
