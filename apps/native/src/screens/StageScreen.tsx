/**
 * S3 — Palco (PRD T1-R24, R25, R26, R27, R28, R29, R30, R31, R32, R33, R34,
 * R35; aceites A12, A13, A14, A15, A16, A17, A18). Duas variantes:
 *
 *  - **texto** (Lyrics, Tab, Chords com corpo) — S3a/b/c;
 *  - **arquivo** (Sheet, e Chords escaneada: `content_data` sem corpo e
 *    `file_url` presente) — **S3d**, o PDF do disco, paginado; e **S3e**, o
 *    placeholder "arquivo não baixado" quando ele não está aqui.
 *
 * Layout do design: barra superior de 64 dp com "n de N", nome da setlist,
 * título · artista · tipo, a nota da música e o chip de rede; conteúdo em
 * IBM Plex Mono com entrelinha 1,55; barra inferior de 96 dp com sete
 * controles; e as **bordas invisíveis** de 15% da largura, ocupando só a
 * altura ENTRE as barras (D-1) — é por elas que se avança e volta às cegas.
 *
 * Decisões medidas no spike (N1-PR4): auto-scroll por `requestAnimationFrame`
 * (responde em ~38 ms) e linha longa dentro de um `ScrollView` horizontal
 * (sem ele a linha re-quebra).
 *
 * No PDF o `react-native-pdf` já traz pinça, pan e virar página; o que esta
 * tela acrescenta é o "página n de N" do design, a dica de gesto, e a regra
 * do T1-R30: **auto-scroll fica desabilitado com o motivo à vista**, nunca
 * mudo. As bordas de 15% continuam navegando MÚSICA, não página — errata do
 * design (D-1 / A14): quem vira página é o deslize sobre o documento.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import Pdf from 'react-native-pdf'
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
import { ensureFile, fileNameFromUrl, hasFile, knownBytes } from '../files'
import { log } from '../log'
import { prefetchDemanda } from '../prefetch'
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
  /**
   * Música AVULSA da biblioteca, aberta pela busca (T1-R22): `content_id` que
   * não pertence a esta posição da setlist. Quando presente, o palco mostra
   * essa música e as bordas não navegam — sair devolve o palco à posição de
   * onde a busca partiu.
   */
  avulsaContentId: string | null
  online: boolean
  onPosicao: (p: number) => void
  onFim: () => void
  onIndice: () => void
  onBusca: () => void
  onSair: () => void
  /** O disco mudou (download ou despejo) — a raiz recalcula `filesPresent`. */
  onArquivosMudaram: () => void
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
}

/** "242.176 B" → "237 KB" — o "(1,2 MB)" do S3e. */
function tamanhoLegivel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/**
 * O arquivo desta posição, nas quatro situações que a tela precisa
 * distinguir. `bytes` sobrevive ao despejo (o índice lembra o tamanho), e é
 * por isso que o S3e consegue dizer o tamanho de algo que não está aqui.
 */
type EstadoArquivo =
  | { fase: 'buscando' }
  | { fase: 'pronto'; uri: string }
  | { fase: 'ausente'; bytes: number | null }
  | { fase: 'erro'; mensagem: string; bytes: number | null }

export function StageScreen({
  setlist,
  contentById,
  posicao,
  avulsaContentId,
  online,
  onPosicao,
  onFim,
  onIndice,
  onBusca,
  onSair,
  onArquivosMudaram,
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
  /**
   * N1-D17 — `stage restore n=<i>/<N>`: o palco voltou de uma tela empilhada
   * (índice, busca, ou o palco avulso do T1-R22) na posição em que estava.
   *
   * Antes desta linha, a única prova da restauração era comparar dois
   * screencaps pixel a pixel (N1-PR6): um aceite não deve depender disso.
   *
   * Só nos focos SEGUINTES ao primeiro — a montagem inicial não é uma volta.
   * A posição sai de um ref, e não das dependências, para o efeito de foco
   * não re-rodar a cada navegação dentro da própria setlist: com `[posicao]`
   * na lista, avançar uma música emitiria `stage restore`, que é o oposto do
   * que a linha significa. No palco AVULSO a linha não sai: ele não tem
   * posição na setlist (o "n de N" da barra é "AVULSA").
   */
  const jaFocou = useRef(false)
  const posicaoRef = useRef(posicao)
  const totalRef = useRef(0)
  const avulsaRef = useRef(false)

  useFocusEffect(
    useCallback(() => {
      void activateKeepAwakeAsync(TAG_PALCO)
      log('keepawake on')
      if (jaFocou.current && !avulsaRef.current) {
        log(`stage restore n=${posicaoRef.current}/${totalRef.current}`)
      }
      jaFocou.current = true
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
  const [arquivo, setArquivo] = useState<EstadoArquivo>({ fase: 'buscando' })
  const [pagina, setPagina] = useState({ n: 0, total: 0 })

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
  const avulsa = avulsaContentId !== null
  const song = avulsa ? undefined : songs[posicao - 1]
  const resolvida = song !== undefined ? resolveSong(song, contentById) : null
  const content = avulsa ? (contentById.get(avulsaContentId) ?? null) : (resolvida?.content ?? null)
  const validade =
    content !== null ? isValidContent(content.content_type, content.content_data, content.file_url) : null
  const corpo = content !== null ? bodyOf(content.content_type, content.content_data) : null
  const cor = colors[tema]

  // Os refs que o efeito de foco (N1-D17) lê sem entrar nas dependências.
  posicaoRef.current = posicao
  totalRef.current = n
  avulsaRef.current = avulsa

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
        : null

  /**
   * O corpo desta posição é um ARQUIVO? (Sheet, e Chords escaneada — o core
   * decide, `isValidContent(...).body === 'file'`.) A URL vira dependência
   * estável dos efeitos do PDF; `null` significa "variante texto".
   */
  const urlArquivo =
    validade !== null && validade.ok && validade.body === 'file' ? content?.file_url ?? null : null

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

  /**
   * T1-R26 — o arquivo desta posição: **disco primeiro** (A9/A13), rede só
   * se preciso, e sem arquivo nem rede o S3e — nunca tela branca. Sem retry
   * automático: quem tenta de novo é o "Baixar" do usuário (T1-R37).
   */
  const buscarArquivo = useCallback(
    async (url: string, pedidoPeloUsuario: boolean): Promise<void> => {
      const nome = fileNameFromUrl(url)
      if (!hasFile(url) && !online && !pedidoPeloUsuario) {
        setArquivo({ fase: 'ausente', bytes: knownBytes(url) })
        log(`placeholder kind=file-missing name=${nome}`)
        return
      }
      setArquivo({ fase: 'buscando' })
      try {
        const r = await ensureFile(url)
        setArquivo({ fase: 'pronto', uri: r.uri })
        if (r.src === 'download') onArquivosMudaram()
      } catch (e: unknown) {
        const mensagem = e instanceof Error ? e.message : 'falha ao baixar'
        log(`download-error ${mensagem}`)
        setArquivo({ fase: 'erro', mensagem, bytes: knownBytes(url) })
      }
    },
    [online, onArquivosMudaram],
  )

  useEffect(() => {
    setPagina({ n: 0, total: 0 })
    if (urlArquivo === null) {
      setArquivo({ fase: 'buscando' })
      return
    }
    void buscarArquivo(urlArquivo, false)
  }, [urlArquivo, buscarArquivo])

  /**
   * T1-R16 — prefetch sob demanda a partir desta posição (atual, +1, +2, +3,
   * −1, resto). Roda a cada navegação e só com rede; o `ensureFile` deduplica
   * o download que o efeito de cima já pode ter começado.
   */
  useEffect(() => {
    if (!online) return
    void prefetchDemanda(setlist, contentById, posicao).then(onArquivosMudaram)
  }, [setlist, contentById, posicao, online, onArquivosMudaram])

  const irPara = useCallback(
    (destino: number) => {
      navegouEm.current = Date.now()
      onPosicao(destino)
    },
    [onPosicao],
  )

  const avancar = useCallback(() => {
    if (avulsa) return
    if (endOfSetlist(posicao, n)) {
      log(`end-of-setlist n=${n}`)
      onFim()
      return
    }
    irPara(nextPosition(posicao, n))
  }, [avulsa, posicao, n, onFim, irPara])

  const voltar = useCallback(() => {
    if (avulsa || posicao <= 1) return
    irPara(prevPosition(posicao, n))
  }, [avulsa, posicao, n, irPara])

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
        : undefined

  return (
    <View style={[styles.tela, { backgroundColor: cor.bg }]}>
      <View style={[styles.barraTopo, { borderBottomColor: cor.line }]}>
        <Text style={[styles.posicao, { color: cor.text }]}>
          {avulsa ? 'AVULSA' : `${posicao} DE ${n}`}
        </Text>
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
        {/* S3d: "página n de N" — só no PDF, e só depois de ele carregar. */}
        {pagina.total > 0 ? (
          <Text style={[styles.paginaTexto, { color: cor.muted }]} testID="pagina">
            {`página ${pagina.n} de ${pagina.total}`}
          </Text>
        ) : null}
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
        {urlArquivo !== null ? (
          <Arquivo
            estado={arquivo}
            titulo={content?.title ?? ''}
            tipo={(TIPO[content?.content_type ?? ''] ?? 'arquivo').toLowerCase()}
            online={online}
            cor={cor}
            onPaginas={(total) => {
              log(`pdf-render pages=${total} src=disk`)
              setPagina({ n: 1, total })
            }}
            onPagina={(atual, total) => {
              log(`pdf-page n=${atual}/${total}`)
              setPagina({ n: atual, total })
            }}
            onBaixar={() => void buscarArquivo(urlArquivo, true)}
          />
        ) : (
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
        )}

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
        {/* T1-R31 é zoom de TEXTO. No PDF quem amplia é a pinça — o controle
            fica desabilitado com o motivo à vista, como o auto-scroll. */}
        <Controle
          rotulo="Zoom −"
          cor={cor}
          inativo={urlArquivo !== null}
          motivo={urlArquivo !== null ? 'pinça para zoom' : undefined}
          onPress={() => (urlArquivo === null ? mudarZoom(-1) : undefined)}
          testID="zoom-menos"
        />
        <Controle
          rotulo="Zoom +"
          cor={cor}
          inativo={urlArquivo !== null}
          onPress={() => (urlArquivo === null ? mudarZoom(1) : undefined)}
          testID="zoom-mais"
        />
        <Controle
          rotulo={tema === 'dark' ? 'Claro' : 'Escuro'}
          cor={cor}
          onPress={alternarTema}
          testID="tema"
        />
        <Controle rotulo="Índice" cor={cor} onPress={onIndice} testID="indice" />
        <Controle rotulo="Busca" cor={cor} onPress={onBusca} testID="busca" />
        <Controle
          rotulo={avulsa ? 'Voltar' : 'Sair'}
          cor={cor}
          onPress={onSair}
          testID="sair"
        />
      </View>
    </View>
  )
}

/**
 * S3d / S3e — a variante ARQUIVO do palco.
 *
 * S3d: o PDF do disco, paginado (`enablePaging`), com pinça e pan do próprio
 * `react-native-pdf`; o "página n de N" fica na barra superior e a dica de
 * gesto embaixo, como no design. S3e: o placeholder do arquivo que não está
 * aqui — com o nome da música, o tamanho quando o aparelho já o conhece, e
 * "Baixar". O que esta função nunca faz é devolver nada: sem tela, o T1-R26
 * e a regra C3-1 estariam violados.
 */
function Arquivo({
  estado,
  titulo,
  tipo,
  online,
  cor,
  onPaginas,
  onPagina,
  onBaixar,
}: {
  estado: EstadoArquivo
  titulo: string
  tipo: string
  online: boolean
  cor: (typeof colors)[ThemeName]
  onPaginas: (total: number) => void
  onPagina: (atual: number, total: number) => void
  onBaixar: () => void
}): React.JSX.Element {
  if (estado.fase === 'pronto') {
    return (
      <View style={styles.pdfArea} testID="s3d">
        <Pdf
          source={{ uri: estado.uri, cache: false }}
          style={[styles.pdf, { backgroundColor: cor.bg }]}
          enablePaging
          enableDoubleTapZoom
          /**
           * `fitPolicy={2}` = página inteira na tela: **um** gesto vira uma
           * página, que é o que o T1-R27 pede ("avançar: 1 tap ou 1 gesto")
           * para a navegação às cegas do palco. Com `0` (fit width) a
           * partitura ficava maior, mas o deslize rolava dentro da página
           * antes de virar — ~4 gestos por página, medido na N1-PR5.
           * Reavaliado no aceite do Tab S6 (decisão do Marcel, 2026-09-10):
           * se a partitura ficar ilegível no device real, errata declarada e
           * volta a `0`.
           */
          fitPolicy={2}
          minScale={1}
          maxScale={4}
          spacing={0}
          onLoadComplete={(total) => onPaginas(total)}
          onPageChanged={(atual, total) => onPagina(atual, total)}
          onError={(e: Error) => log(`pdf-error ${e.message}`)}
        />
        <Text style={[styles.dica, { color: cor.muted }]}>
          pinça para zoom · arraste para mover · deslize para virar a página
        </Text>
      </View>
    )
  }

  if (estado.fase === 'buscando') {
    return (
      <View style={styles.placeholder} testID="s3-baixando">
        <Text style={[styles.placeholderApoio, { color: cor.muted }]}>baixando o arquivo…</Text>
      </View>
    )
  }

  const tamanho = estado.bytes === null ? '' : ` (${tamanhoLegivel(estado.bytes)})`
  const fecho = online
    ? 'Toque em Baixar para trazê-lo para este aparelho.'
    : 'Sem conexão agora — toque em Baixar quando a rede voltar.'

  return (
    <View style={styles.placeholder} testID="s3e">
      <Text style={[styles.placeholderTitulo, { color: cor.text }]}>arquivo não baixado</Text>
      <Text style={[styles.placeholderApoio, { color: cor.muted }]}>
        {`${titulo} · ${tipo}${tamanho} não está neste aparelho. ${fecho}`}
      </Text>
      {estado.fase === 'erro' ? (
        <Text style={[styles.erro, { color: cor.error }]} testID="download-erro">
          {estado.mensagem}
        </Text>
      ) : null}
      <Pressable
        style={[styles.botaoBaixar, { borderColor: cor.line }]}
        onPress={onBaixar}
        accessibilityRole="button"
        testID="baixar"
      >
        <Text style={[styles.botaoBaixarTexto, { color: cor.text }]}>Baixar</Text>
      </Pressable>
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
  paginaTexto: { fontFamily: font.mono, fontSize: size.label },
  meio: { flex: 1 },
  pdfArea: { flex: 1 },
  pdf: { flex: 1, width: '100%' },
  dica: { textAlign: 'center', fontFamily: font.ui, fontSize: size.label, paddingVertical: space.sm },
  erro: { fontFamily: font.ui, fontSize: size.label, textAlign: 'center', maxWidth: 560 },
  botaoBaixar: {
    marginTop: space.sm,
    height: touch.stage,
    paddingHorizontal: space.xxl,
    borderWidth: bar.hairline,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoBaixarTexto: { fontFamily: font.uiBold, fontSize: size.button },
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
