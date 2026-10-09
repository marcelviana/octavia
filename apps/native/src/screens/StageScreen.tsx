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
 * título · artista · tipo, a nota da música e o chip de rede (em B, 88 em
 * duas linhas — N3-D13, abaixo); conteúdo em
 * IBM Plex Mono com entrelinha 1,55; barra inferior de 96 dp com sete
 * controles **só ícone** (V1-PR3, DESIGN-V1 §6 — o nome de cada um está no
 * `accessibilityLabel`); e as **bordas invisíveis** de 15% da largura, ocupando só a
 * altura ENTRE as barras (D-1) — é por elas que se avança e volta às cegas.
 *
 * Decisões medidas no spike (N1-PR4): auto-scroll por `requestAnimationFrame`
 * (responde em ~38 ms) e linha longa dentro de um `ScrollView` horizontal
 * (sem ele a linha re-quebra).
 *
 * No PDF o `react-native-pdf` já traz pinça, pan e virar página; o que esta
 * tela acrescenta é o "página n de N" do design, a dica de gesto, e a regra
 * do T1-R30: **auto-scroll fica desabilitado com o motivo AO TOQUE**, nunca
 * mudo — a forma permanente é a do ícone (tinta `lineInfo`, desenho
 * amputado) e o motivo aparece na linha acima da barra quando se toca no
 * controle (errata do A15, V1-PR3-PRECHECK §14.1). As bordas de 15%
 * continuam navegando MÚSICA, não página — errata do design (D-1 / A14):
 * quem vira página é o deslize sobre o documento.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import {
  bodyOf,
  ehFormatoQueOAppMostra,
  endOfSetlist,
  FRASES_DO_LEITOR,
  FRASES_DO_PALCO,
  FRASES_DO_TABLET,
  isValidContent,
  nextPosition,
  nomeDoVoltarDoAvulso,
  notasDaVisualizacao,
  paginaDe,
  prevPosition,
  resolveSong,
  type ContentDTO,
  type OrigemDoAvulso,
  type SetlistDTO,
} from '@octavia/core'
import { ensureFile, fileNameFromUrl, fraseDaFalha, hasFile, knownBytes } from '../files'
import { Icone, type EstadoIcone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { log } from '../log'
import { definirNotasRecolhidas, useNotasRecolhidas } from '../preferencias'
import { prefetchDemanda } from '../prefetch'
import {
  bar,
  colors,
  dark,
  faixas,
  font,
  radius,
  size,
  space,
  touch,
  tracking,
  zoomDefault,
  zoomSteps,
  type ThemeName,
} from '../theme'
import { useFaixa } from '../useFaixa'
import {
  CorpoDoLeitor,
  FormatoDoLeitor,
  PdfDoLeitor,
  PlaceholderDoLeitor,
  S3eDoLeitor,
  estiloDoLeitor,
  leitor,
  linhasDoLeitor,
  logicasDasVisuais,
  useAncora,
  useColunasDoLeitor,
  type EstadoDoArquivoDoLeitor,
} from './Leitor'
import { NotasDoPalco, toqueNaRegua } from './NotasDoPalco'

export interface StageScreenProps {
  /**
   * A setlist do palco — ou `null`: o **palco avulso sem hospedeira** (N4-R16, N4-D30, N4-D63). Aberto de fora de
   * uma setlist (a busca de S1; na PR-7 a biblioteca, na PR-8 a visualização), o palco não tem setlist: a barra de
   * cima diz `AVULSA` **sem nome de setlist**, a de baixo não tem o índice, e o prefetch sob demanda é o desta
   * música (div. 964). Com `null`, o `avulsaContentId` é obrigatório.
   */
  setlist: SetlistDTO | null
  contentById: Map<string, ContentDTO>
  posicao: number
  /**
   * Música AVULSA da biblioteca, aberta pela busca (T1-R22): `content_id` que
   * não pertence a esta posição da setlist. Quando presente, o palco mostra
   * essa música e as bordas não navegam — sair devolve o palco à posição de
   * onde a busca partiu.
   */
  avulsaContentId: string | null
  /**
   * De onde o avulso SEM hospedeira veio — o nome acessível do voltar (*Voltar para a busca · para a biblioteca ·
   * para a visualização*, N4-R16). `null` no palco com setlist; o avulso aberto pela busca de dentro de uma setlist
   * continua *Voltar para a busca* (N4-D30).
   */
  origemDoAvulso?: OrigemDoAvulso | null
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

/** Quanto tempo o motivo de um controle inerte fica na linha acima da barra. */
const MOTIVO_MS = 2500

/** A dica de gesto do PDF (S3d) — a linha acima da barra, como no design. */
const DICA_PDF = 'pinça para zoom · arraste para mover · deslize para virar a página'

const TIPO: Record<string, string> = {
  Lyrics: 'Letra',
  Chords: 'Cifra',
  Tab: 'Tab',
  Sheet: 'Partitura',
}

/** Motivo do placeholder, na linguagem do design (nunca tela vazia). */
const MOTIVO: Record<string, { titulo: string; apoio: string }> = {
  'no-body': {
    titulo: FRASES_DO_LEITOR['sem-conteudo'],
    apoio:
      'A música existe na setlist, mas não tem letra, cifra, tab ou arquivo. Edite na versão web. Toque na borda direita para seguir.',
  },
  'no-key': {
    titulo: FRASES_DO_LEITOR['sem-conteudo'],
    apoio:
      'O conteúdo salvo não traz o texto desta música. Edite na versão web. Toque na borda direita para seguir.',
  },
  'not-string': {
    titulo: FRASES_DO_LEITOR['sem-conteudo'],
    apoio:
      'O conteúdo salvo não traz o texto desta música. Edite na versão web. Toque na borda direita para seguir.',
  },
  'unknown-type': {
    titulo: FRASES_DO_LEITOR['tipo-desconhecido'],
    apoio: 'Este item tem um tipo que o app ainda não sabe mostrar. Toque na borda direita para seguir.',
  },
  ausente: {
    titulo: 'conteúdo não baixado',
    apoio:
      'Esta música ainda não foi sincronizada neste aparelho. Conecte-se à internet para baixá-la.',
  },
}

/**
 * O arquivo desta posição, nas quatro situações que a tela precisa
 * distinguir — o tipo do leitor compartilhado (`Leitor.tsx`), que é o que
 * esta tela já tinha.
 */
type EstadoArquivo = EstadoDoArquivoDoLeitor

export function StageScreen({
  setlist,
  contentById,
  posicao,
  avulsaContentId,
  origemDoAvulso = null,
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
  /**
   * N3-PR5 — a barra superior é a ÚNICA coisa do palco que muda de faixa
   * (N3-D13, `N3-B-S3`): em B, 88 em duas linhas — posição + setlist (e a
   * página, a nota e o ponto de sem rede) na primeira, título · artista ·
   * tipo na segunda, com a largura inteira. A base, o corpo e as bordas de 15 %
   * são os de C: as bordas continuam medindo o `meio` (que fica 24 mais baixo),
   * não a faixa. Em C, a barra de uma linha de sempre, nó por nó (T3-R2).
   */
  const t = faixas[useFaixa()].palco

  /**
   * D-c / T1-R27 — `rotation=landscape|portrait n=<i>/<N>`: a linha que o
   * catálogo (N1-D5) promete para o A14 e que o app nunca emitia — o aceite
   * da N1-PR7 provou a rotação por screencap porque o log não existia.
   *
   * Sai só na MUDANÇA de orientação, não na montagem: o `useWindowDimensions`
   * re-renderiza a cada giro, e sem o ref uma linha sairia a cada abertura do
   * palco. A posição vem dos mesmos refs do `stage restore` (N1-D17), pela
   * mesma razão — o efeito não pode depender de `posicao`.
   */
  const orientacaoRef = useRef<'landscape' | 'portrait' | null>(null)
  const orientacao: 'landscape' | 'portrait' = width >= height ? 'landscape' : 'portrait'

  useEffect(() => {
    const anterior = orientacaoRef.current
    orientacaoRef.current = orientacao
    if (anterior === null || anterior === orientacao) return
    log(`rotation=${orientacao} n=${posicaoRef.current}/${totalRef.current}`)
  }, [orientacao])
  const [zoom, setZoom] = useState<number>(zoomDefault)
  const [tema, setTema] = useState<ThemeName>('dark')
  const [rodando, setRodando] = useState(false)
  const [arquivo, setArquivo] = useState<EstadoArquivo>({ fase: 'buscando' })
  const [pagina, setPagina] = useState({ n: 0, total: 0 })

  /**
   * V1-PR3 / errata do A15 — o motivo do controle inerte aparece AO TOQUE, na
   * linha acima da barra (onde o design já põe a dica de gesto do PDF), por
   * `MOTIVO_MS`, e some. A forma permanente é a do ícone (tinta `lineInfo` e
   * o desenho amputado, §6.2 + E3); a palavra não mora mais dentro do
   * controle. Trocar de música apaga o motivo antes do tempo.
   */
  const [motivoVisivel, setMotivoVisivel] = useState<string | null>(null)
  const motivoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revelarMotivo = useCallback((m: string) => {
    if (motivoTimer.current !== null) clearTimeout(motivoTimer.current)
    setMotivoVisivel(m)
    motivoTimer.current = setTimeout(() => setMotivoVisivel(null), MOTIVO_MS)
  }, [])
  useEffect(
    () => () => {
      if (motivoTimer.current !== null) clearTimeout(motivoTimer.current)
    },
    [],
  )

  const scroll = useRef<ScrollView | null>(null)
  const y = useRef(0)
  /** QL-PR4 — a troca de música zera a âncora (o gancho `useAncora`, declarado mais abaixo, onde o desenho já existe). */
  const zerarAncora = useRef<() => void>(() => undefined)
  const frame = useRef<number | null>(null)
  const pedidoEm = useRef(0)
  const primeiroFrame = useRef(true)
  const navegouEm = useRef(0)

  const songs = useMemo(
    () => (setlist === null ? [] : [...setlist.setlist_songs].sort((a, b) => a.position - b.position)),
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

  /**
   * N4-D43, N4-D83 — o arquivo é de um **formato que o app ainda não mostra**? Decide a extensão (o core: só `.pdf`
   * se mostra), antes do disco: baixado ou não, o leitor de PDF não o abre — o palco nem tenta (nenhum `ensureFile`)
   * e mostra o placeholder de formato. Vale no palco com setlist e no avulso: é o mesmo componente. A base do G-inv
   * não tem esse caso (a fixture do pre-check do N3 só tem `.pdf`, div. 1028).
   */
  const formato = urlArquivo !== null && !ehFormatoQueOAppMostra(urlArquivo)

  /** O placeholder do corpo de texto (o item inválido, a música ausente) — nunca tela vazia (T1-R26). */
  const motivoDoCorpo =
    content === null
      ? MOTIVO.ausente
      : validade !== null && !validade.ok
        ? MOTIVO[validade.reason]
        : undefined

  useEffect(() => {
    pararScroll()
    setRodando(false)
    setMotivoVisivel(null)
    y.current = 0
    zerarAncora.current()
    scroll.current?.scrollTo({ y: 0, animated: false })
    if (navegouEm.current > 0 && setlist !== null) {
      log(
        `nav n=${posicao}/${n} setlist=${setlist.id.slice(0, 8)} t=${Date.now() - navegouEm.current}`,
      )
      navegouEm.current = 0
    }
    if (chavePlaceholder !== null) log(`placeholder kind=${chavePlaceholder}`)
  }, [posicao, n, setlist, chavePlaceholder, pararScroll])

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
        // DUAS metades, e de propósito (W2, div. 125). O `mensagem` é o
        // DETALHE — com o nome do objeto e a URL já higienizada pelo `falha()`
        // —, e é ele que continua indo para o log, porque é o que faz um
        // relatório ser diagnosticável. O que o MÚSICO lê é a `fraseDaFalha()`,
        // de um conjunto FECHADO de frases em pt-BR. Antes as duas eram a mesma
        // coisa, e o palco mostrava `1751910900697-Easy_-_Guitar.pdf: Call to
        // function 'FileSystemDownloadTask.start' has been rejected.`
        const mensagem = e instanceof Error ? e.message : 'falha ao baixar'
        log(`download-error ${mensagem}`)
        setArquivo({ fase: 'erro', mensagem: fraseDaFalha(e), bytes: knownBytes(url) })
      }
    },
    [online, onArquivosMudaram],
  )

  useEffect(() => {
    setPagina({ n: 0, total: 0 })
    if (urlArquivo === null || formato) {
      setArquivo({ fase: 'buscando' })
      return
    }
    void buscarArquivo(urlArquivo, false)
  }, [urlArquivo, formato, buscarArquivo])

  /**
   * T1-R16 — prefetch sob demanda a partir desta posição (atual, +1, +2, +3,
   * −1, resto). Roda a cada navegação e só com rede; o `ensureFile` deduplica
   * o download que o efeito de cima já pode ter começado.
   *
   * No avulso SEM hospedeira (N4-PR6, div. 964) não há setlist de onde partir:
   * o plano é o arquivo DESTA música — antes ele era o da primeira setlist da
   * lista, a partir da posição da busca.
   */
  const avulsaSemHospedeira = setlist === null ? avulsaContentId : null
  useEffect(() => {
    if (!online) return
    void prefetchDemanda(setlist, contentById, posicao, avulsaSemHospedeira).then(onArquivosMudaram)
  }, [setlist, contentById, posicao, avulsaSemHospedeira, online, onArquivosMudaram])

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

  // Bordas: 15% da largura, altura ENTRE as barras (D-1 / A14) — e agora as
  // duas medidas vêm do `onLayout` do `meio`, não de `useWindowDimensions()`.
  //
  // Por quê (V1-PRECHECK §3.4, div. 16/24): `useWindowDimensions()` devolve a
  // TELA (711,1 dp no AVD), e o código a tratava como JANELA (627,1 dp). A
  // borda saía com 551,1 dp onde o `meio` tem 467,1 — **84,0 dp de transbordo**,
  // exatamente a soma dos insets, cobrindo 100% do `auto-scroll`. O A14 afirma
  // "entre as barras superior e inferior" desde o N1, e isso era falso.
  //
  // E por que `onLayout` e não `useSafeAreaInsets()`: o `SafeAreaView` da raiz
  // (`App.tsx:206`) já consome os quatro insets, então `height - insets.top -
  // insets.bottom` acerta HOJE por coincidência aritmética e quebra no dia em
  // que alguém tocar em `edges`. O `onLayout` mede a altura que a View de fato
  // recebeu, seja quem for que tenha consumido o quê acima dela.
  const [meio, setMeio] = useState<{ largura: number; altura: number } | null>(null)
  const medirMeio = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout
    setMeio((m) => (m !== null && m.largura === w && m.altura === h ? m : { largura: w, altura: h }))
  }, [])
  const alturaConteudo = meio === null ? 0 : Math.max(meio.altura, touch.min)
  const larguraBorda = meio === null ? 0 : Math.max(meio.largura * 0.15, touch.min)

  // N4-PR8: o estilo do corpo é o do leitor compartilhado (`Leitor.tsx`) — o mesmo objeto de antes.
  const estiloTexto = estiloDoLeitor(content?.content_type ?? null, zoom, cor)

  /**
   * QL-PR3 — a quebra (QL-R10). As colunas vêm do contêiner do corpo (o `ScrollView` vertical, com o respiro de 32 por
   * dentro) e do caractere medido nos cinco zooms de uma vez, na montagem (o passo de zoom já o encontra). Até as duas
   * medidas existirem, e na Tab, o corpo é o de hoje (QL-D43, R4).
   */
  const tipo = content?.content_type ?? null
  const { colunas, aoMedirContainer, medidor } = useColunasDoLeitor(tipo, zoom, zoomSteps, cor)
  const linhas = useMemo(() => linhasDoLeitor(corpo, tipo, colunas), [corpo, tipo, colunas])
  const entrelinha = estiloTexto.lineHeight ?? zoom
  const logicas = useMemo(() => (corpo === null ? [] : logicasDasVisuais(corpo, linhas)), [corpo, linhas])

  /**
   * QL-PR4 — AS NOTAS DA MÚSICA (QL-D30…QL-D32; QL-R14, QL-R15). No topo do corpo de texto, antes da letra, dentro da
   * rolagem; recolhidas ou abertas pelo estado LEMBRADO (`preferencias.ts`, QL-D39: o mesmo em toda música, gravado no
   * aparelho). Sem nota, nada (a vazia e a só de espaço já são `null` no core). A nota da POSIÇÃO continua na barra.
   * Só no corpo de texto: o S3d/S3e (o arquivo) e os placeholders não têm a rolagem do corpo (div. 1230).
   */
  const notas = content !== null ? notasDaVisualizacao(content) : null
  const comNotas = notas !== null && motivoDoCorpo === undefined && corpo !== null && urlArquivo === null
  const recolhidas = useNotasRecolhidas()
  const alternarNotas = useCallback(() => void definirNotasRecolhidas(!recolhidas), [recolhidas])

  /**
   * QL-PR3/QL-PR4 — A ÂNCORA (QL-D18, QL-D37; QL-R13), pelo gancho do leitor (`useAncora`). Quando o desenho do MESMO
   * corpo muda — o giro (C ↔ B) e o zoom mudam as colunas e a entrelinha —, a linha lógica que estava na marca de 32
   * volta a ela, sem sinal de rearranjo. Com as notas no topo do corpo, a conta soma ONDE O CORPO COMEÇA: o bloco das
   * notas na rolagem (o `y` e a altura do `onLayout`) mais os 24 até a letra, menos o respiro — `inicio`. Até as notas
   * serem medidas para ESTA música, `null`: a âncora espera. Com a marca ainda nas notas, ou nada rolado, o topo (QL-D52).
   * A rolagem automática continua do ponto ancorado (`y`). A troca de música não ancora: volta ao topo. A Tab não ancora.
   */
  const chaveDoCorpo = `${posicao}|${content?.id ?? ''}`
  const [medidaDasNotas, setMedidaDasNotas] = useState<{ chave: string; inicio: number; topo: number } | null>(null)
  const medirNotas = useCallback(
    (e: LayoutChangeEvent) => {
      const { y: topo, height } = e.nativeEvent.layout
      const ini = topo + height + space.xl - space.xxl
      setMedidaDasNotas((m) =>
        m !== null && m.chave === chaveDoCorpo && Math.abs(m.inicio - ini) < 0.01 && m.topo === topo ? m : { chave: chaveDoCorpo, inicio: ini, topo },
      )
    },
    [chaveDoCorpo],
  )
  const inicio = !comNotas ? 0 : medidaDasNotas !== null && medidaDasNotas.chave === chaveDoCorpo ? medidaDasNotas.inicio : null
  const ancorar = useCallback((alvo: number) => {
    y.current = alvo
  }, [])
  const ancora = useAncora(scroll, { chave: chaveDoCorpo, corpo, tipo, logicas, entrelinha, inicio }, ancorar)
  zerarAncora.current = () => {
    ancora.zerar()
    yDaRolagem.current = 0
  }

  /**
   * QL-D56 — a régua das notas fora das bordas de toque (`toqueNaRegua`, `NotasDoPalco.tsx`). A rolagem vista pela régua
   * (`yDaRolagem`) é a do corpo, que leva as notas com ela: a régua está na tela em `topo do bloco − rolagem`, no sistema do
   * `meio` (a rolagem começa no topo dele, onde começam as bordas).
   */
  const yDaRolagem = useRef(0)
  const { aoRolar: ancoraAoRolar } = ancora
  const aoRolarCorpo = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      yDaRolagem.current = e.nativeEvent.contentOffset.y
      ancoraAoRolar(e)
    },
    [ancoraAoRolar],
  )
  const reguaNaTela = (): { topo: number; larguraDoMeio: number } | null =>
    comNotas && meio !== null && medidaDasNotas !== null && medidaDasNotas.chave === chaveDoCorpo
      ? { topo: medidaDasNotas.topo - yDaRolagem.current, larguraDoMeio: meio.largura }
      : null
  const tocarBorda = (lado: 'voltar' | 'avancar') => (e: GestureResponderEvent) => {
    const x = lado === 'voltar' ? e.nativeEvent.locationX : (meio?.largura ?? 0) - larguraBorda + e.nativeEvent.locationX
    if (toqueNaRegua(x, e.nativeEvent.locationY, reguaNaTela())) {
      alternarNotas()
      return
    }
    if (lado === 'voltar') voltar()
    else avancar()
  }

  const motivo = motivoDoCorpo

  // A linha acima da barra: o motivo revelado por um toque, senão a dica de
  // gesto do PDF (só no S3d, e só com o arquivo pronto), senão nada.
  const linha = motivoVisivel ?? (arquivo.fase === 'pronto' && urlArquivo !== null ? DICA_PDF : null)

  // Os nós da barra superior — os mesmos nas duas faixas; o que muda é onde
  // ficam (N3-D13). Em C a ordem é a de sempre: posição, setlist, título,
  // página, nota, ponto.
  const posicaoEl = (
    <Text style={[styles.posicao, { color: cor.text }]}>{avulsa ? FRASES_DO_PALCO.avulsa : `${posicao} DE ${n}`}</Text>
  )
  const tituloEl = (extra: typeof styles.tituloNaLinha | null): React.JSX.Element => (
    <Text style={[styles.titulo, extra, { color: cor.text }]} numberOfLines={1}>
      {content?.title ?? '—'}
      <Text style={{ color: cor.muted }}>
        {content?.artist !== null && content?.artist !== undefined ? ` · ${content.artist}` : ''}
        {content !== null ? ` · ${TIPO[content.content_type] ?? content.content_type}` : ''}
      </Text>
    </Text>
  )
  const extrasDaBarra = (
    <>
      {/* S3d: "página n de N" — só no PDF, e só depois de ele carregar. */}
      {pagina.total > 0 ? (
        <Text style={[styles.paginaTexto, { color: cor.muted }]} testID="pagina">
          {paginaDe(pagina.n, pagina.total)}
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
    </>
  )

  // N4-R16 — no avulso SEM hospedeira não há nome de setlist: em C o título (`flex: 1`) ganha a largura dele; em B a
  // linha 1 fica com `AVULSA` e um espaçador no lugar do nome, para a página, a nota e o ponto de sem rede ficarem
  // à direita, onde estão no palco com setlist (N3-B-S3). Nada mais da barra muda.
  return (
    <View style={[styles.tela, { backgroundColor: cor.bg }]}>
      {t.empilha ? (
        <View style={[styles.barraTopo, styles.barraEmpilhada, { height: t.barra, borderBottomColor: cor.line }]}>
          <View style={styles.linhaDaBarra}>
            {posicaoEl}
            {setlist !== null ? (
              <Text style={[styles.nomeSetlist, styles.nomeSetlistNaLinha, { color: cor.muted }]} numberOfLines={1}>
                {setlist.name}
              </Text>
            ) : (
              <View style={styles.nomeSetlistNaLinha} />
            )}
            {extrasDaBarra}
          </View>
          {tituloEl(styles.tituloNaLinha)}
        </View>
      ) : (
        <View style={[styles.barraTopo, { height: t.barra, borderBottomColor: cor.line }]}>
          {posicaoEl}
          {setlist !== null ? (
            <Text style={[styles.nomeSetlist, { color: cor.muted }]} numberOfLines={1}>
              {setlist.name}
            </Text>
          ) : null}
          {tituloEl(null)}
          {extrasDaBarra}
        </View>
      )}

      <View style={styles.meio} onLayout={medirMeio}>
        {formato && urlArquivo !== null ? (
          <FormatoDoLeitor
            nome={fileNameFromUrl(urlArquivo)}
            tipo={TIPO[content?.content_type ?? ''] ?? 'arquivo'}
            bytes={knownBytes(urlArquivo)}
            cor={cor}
            testID="s3-formato"
          />
        ) : urlArquivo !== null ? (
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
          <ScrollView
            ref={scroll}
            style={leitor.conteudo}
            contentContainerStyle={leitor.conteudoPad}
            onLayout={aoMedirContainer}
            onScroll={aoRolarCorpo}
            scrollEventThrottle={16}
            onContentSizeChange={ancora.aoMudarConteudo}
            onScrollBeginDrag={ancora.aoArrastar}
          >
            {/* QL-PR4: as notas da música no topo do corpo, antes da letra (`NotasDoPalco.tsx`); sem nota, nada. */}
            {comNotas && notas !== null ? (
              <NotasDoPalco notas={notas} recolhidas={recolhidas} onAlternar={alternarNotas} zoom={zoom} cor={cor} onLayout={medirNotas} />
            ) : null}
            {motivo !== undefined ? (
              <PlaceholderDoLeitor testID="placeholder" titulo={motivo.titulo} apoio={motivo.apoio} cor={cor} />
            ) : (
              // N4-PR8: o corpo é o do leitor compartilhado, que a visualização também usa. QL-PR3: nas linhas
              // visuais da quebra, quando há colunas; a Tab (e o corpo antes das medidas) como antes, rolando para o
              // lado (`Leitor.tsx`).
              <CorpoDoLeitor corpo={corpo} tipo={tipo} linhas={linhas} colunas={colunas} estilo={estiloTexto} testID="corpo" />
            )}
          </ScrollView>
        )}

        {/* QL-PR3: o medidor do caractere, fora da tela, até os cinco zooms estarem medidos (só para texto que quebra). */}
        {corpo !== null && tipo !== 'Tab' ? medidor : null}

        {linha !== null ? (
          <Text style={[styles.dica, { color: cor.muted }]} testID="linha-motivo">
            {linha}
          </Text>
        ) : null}

        {/* No PRIMEIRO frame o `onLayout` ainda não disparou e as bordas não
            existem — melhor do que existirem com o tamanho errado num canto.
            Não afeta o A17: ele mede a TROCA de música, e trocar de música não
            remonta o palco, então o `meio` não é medido de novo. */}
        {meio !== null ? (
          <>
            <Pressable
              style={[styles.borda, { width: larguraBorda, height: alturaConteudo, left: 0 }]}
              onPress={tocarBorda('voltar')}
              testID="borda-voltar"
            />
            <Pressable
              style={[styles.borda, { width: larguraBorda, height: alturaConteudo, right: 0 }]}
              onPress={tocarBorda('avancar')}
              testID="borda-avancar"
            />
          </>
        ) : null}
      </View>

      {/* Os sete controles, só ícone, alinhados à esquerda (decisão do Marcel,
          Q4: o polegar apoia na borda e a posição aprendida se preserva). Os
          nomes acessíveis são verbatim do DESIGN-V1 §6.4. */}
      <View style={[styles.barraBaixo, { borderTopColor: cor.line }]}>
        <Controle
          icone="auto-scroll"
          accessibilityLabel={
            corpo === null
              ? 'Rolagem automática, indisponível: só em texto'
              : rodando
                ? 'Rolagem automática, ligada'
                : 'Rolagem automática, desligada'
          }
          ativo={rodando}
          inativo={corpo === null}
          motivo={corpo === null ? 'auto-scroll só em texto' : undefined}
          cor={cor}
          onPress={alternarScroll}
          onMotivo={revelarMotivo}
          testID="auto-scroll"
        />
        {/* T1-R31 é zoom de TEXTO. No PDF quem amplia é a pinça — o controle
            fica inerte, com o sinal afinado e o motivo ao toque. */}
        <Controle
          icone="zoom-menos"
          accessibilityLabel={
            urlArquivo !== null ? 'Diminuir o texto, indisponível: pinça para zoom' : 'Diminuir o texto'
          }
          cor={cor}
          inativo={urlArquivo !== null}
          motivo={urlArquivo !== null ? 'pinça para zoom' : undefined}
          onPress={() => (urlArquivo === null ? mudarZoom(-1) : undefined)}
          onMotivo={revelarMotivo}
          testID="zoom-menos"
        />
        <Controle
          icone="zoom-mais"
          accessibilityLabel={
            urlArquivo !== null ? 'Aumentar o texto, indisponível: pinça para zoom' : 'Aumentar o texto'
          }
          cor={cor}
          inativo={urlArquivo !== null}
          motivo={urlArquivo !== null ? 'pinça para zoom' : undefined}
          onPress={() => (urlArquivo === null ? mudarZoom(1) : undefined)}
          onMotivo={revelarMotivo}
          testID="zoom-mais"
        />
        <Controle
          icone={tema === 'dark' ? 'claro' : 'escuro'}
          accessibilityLabel={tema === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
          cor={cor}
          onPress={alternarTema}
          onMotivo={revelarMotivo}
          testID="tema"
        />
        {/* PROPOSTA A (div. 109) — decidida pelo Marcel em 2026-09-14.
            A fileira contígua dos sete deixava 555,6 dp — 49 % da barra —
            vazios à direita, medidos no dump do V1-PR7 e reproduzidos pelos
            tokens. Os quatro de COMPORTAMENTO ficam onde estão (o polegar
            apoia na borda e a posição aprendida se preserva, a decisão da Q4);
            os três de NAVEGAÇÃO vão para a borda direita, com a mesma margem
            de 24 dp da esquerda. O vão passa de 16 para ~547,8 dp, e é aí que
            a fronteira por função vira fronteira que se VÊ.
            É um espaçador `flex: 1`, não número cravado: vale em qualquer
            largura, no Tab S6 e em retrato. Com o `gap` de 16 já existente o
            espaçador mede ~515,8 dp e o vão fica 16 + 515,8 + 16 = 547,8 dp,
            contra os 547,1 da Proposta A — a diferença é o arredondamento de
            2560 px / 2,25.
            O DESIGN-V1 §5.3 dá à barra só a ALTURA (96 dp) e nada sobre
            distribuição horizontal; as seis molduras do S3 passam a mostrar
            uma barra que o app não desenha mais, e isso é a errata E16. */}
        <View style={styles.espacador} />
        {/* N4-R16 — o avulso sem hospedeira não tem índice: não há setlist a abrir. */}
        {setlist !== null ? (
          <Controle
            icone="indice"
            accessibilityLabel="Abrir o índice da setlist"
            cor={cor}
            onPress={onIndice}
            onMotivo={revelarMotivo}
            testID="indice"
          />
        ) : null}
        <Controle
          icone="busca"
          accessibilityLabel="Buscar na biblioteca"
          cor={cor}
          onPress={onBusca}
          onMotivo={revelarMotivo}
          testID="busca"
        />
        <Controle
          icone={avulsa ? 'voltar' : 'sair'}
          accessibilityLabel={avulsa ? nomeDoVoltarDoAvulso(origemDoAvulso ?? 'busca') : 'Sair do palco'}
          cor={cor}
          onPress={onSair}
          onMotivo={revelarMotivo}
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
 * gesto na linha acima da barra (que o `StageScreen` desenha, porque é a
 * mesma linha onde o motivo de um controle inerte aparece ao toque — V1-PR3).
 * S3e: o placeholder do arquivo que não está
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
    // N4-PR8: o PDF do leitor compartilhado (`Leitor.tsx`) — o mesmo `Pdf`, com as mesmas props (o `fitPolicy` e o
    // porquê dele moram lá); o que o palco faz quando ele carrega, vira a página ou falha continua aqui.
    return (
      <PdfDoLeitor
        uri={estado.uri}
        cor={cor}
        onLoadComplete={(total) => onPaginas(total)}
        onPageChanged={(atual, total) => onPagina(atual, total)}
        onError={(e: Error) => log(`pdf-error ${e.message}`)}
        testID="s3d"
      />
    )
  }

  if (estado.fase === 'buscando') {
    return <PlaceholderDoLeitor testID="s3-baixando" apoio={FRASES_DO_TABLET['baixando-o-arquivo']} cor={cor} />
  }

  // O S3e do leitor compartilhado; o controle é o do PALCO — a palavra *Baixar* (N4-D78: o palco não muda), com a
  // linha do erro em cima dela. Em V o mesmo S3e leva o ícone (N4-E8): o controle é a única diferença.
  return (
    <S3eDoLeitor testID="s3e" titulo={titulo} tipo={tipo} bytes={estado.bytes} online={online} cor={cor}>
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
        <Text style={[styles.botaoBaixarTexto, { color: cor.text }]}>{FRASES_DO_LEITOR.baixar}</Text>
      </Pressable>
    </S3eDoLeitor>
  )
}

/**
 * Um dos sete controles do palco — só ícone (V1-PR3, DESIGN-V1 §6.2).
 *
 * O `Pressable` É o alvo: 64 × 64 (66 com a moldura de 1 dp), e o `<Svg>` de
 * 28 vai dentro — pôr o toque no desenho é o modo de reprovar o G5. Os quatro
 * estados da folha: **padrão** (moldura `lineInfo`, E2 — é o único
 * delimitador de um ícone sem rótulo e deve os 3:1); **ativo** (acento no
 * traço, na moldura e no fundo a 12 %, e o desenho muda); **desabilitado**
 * (tinta cheia em `lineInfo` mais o desenho amputado, **sem opacidade**, E3);
 * **pressionado** (moldura `muted`, fundo da tinta a 8 %, só com o dedo
 * encostado). Sem rótulo textual: o nome é o `accessibilityLabel` (§6.4) e o
 * motivo do inerte vai para a linha acima da barra, ao toque (A15).
 *
 * ---------------------------------------------------------------------------
 * W2 — O INERTE TAMBÉM PRECISA SAIR NA ÁRVORE (div. 118)
 *
 * Até aqui o `inativo` virava `estado` e `tinta`, e mais nada: DESENHO puro.
 * Medido nos dumps do V1-PR7, nos dois aparelhos: a sub-árvore da barra é
 * IDÊNTICA no estado ativo e no inerte — mesmos sete `bounds`, todos com
 * `enabled=true clickable=true`. A única diferença entre "posso usar" e "não
 * posso" era o `content-desc`. Para quem navega pela árvore os dois estados
 * eram o MESMO estado: o leitor anuncia um botão utilizável e "indisponível"
 * chega como parte do nome, não como propriedade.
 *
 * E tem de ser esta linha, não a outra:
 *
 *     ✅  accessibilityState={{ disabled: inativo === true }}
 *     ❌  disabled={inativo === true}
 *
 * O `disabled` do `Pressable` IMPEDIRIA o `onPress` — e é o `onPress` do
 * inerte que revela o motivo na linha acima da barra. Consertaria a árvore e
 * quebraria o A15 exatamente na metade que a errata do PRD acabou de fixar.
 * O aceite da W2 mede as duas coisas no mesmo toque: `enabled=false` no dump
 * E o motivo ainda aparecendo.
 * ---------------------------------------------------------------------------
 */
function Controle({
  icone,
  accessibilityLabel,
  ativo,
  inativo,
  motivo,
  cor,
  onPress,
  onMotivo,
  testID,
}: {
  icone: NomeIcone
  accessibilityLabel: string
  ativo?: boolean
  inativo?: boolean
  motivo?: string
  cor: (typeof colors)[ThemeName]
  onPress: () => void
  onMotivo: (motivo: string) => void
  testID: string
}): React.JSX.Element {
  const estado: EstadoIcone = inativo === true ? 'inerte' : ativo === true ? 'ativo' : 'normal'
  const tinta = inativo === true ? cor.lineInfo : ativo === true ? cor.accent : cor.text
  return (
    <Pressable
      style={({ pressed }) => [
        styles.controle,
        { borderColor: ativo === true ? cor.accent : pressed ? cor.muted : cor.lineInfo },
        ativo === true && { backgroundColor: `${cor.accent}1F` },
        pressed && ativo !== true && { backgroundColor: `${cor.text}14` },
      ]}
      onPress={() => {
        if (inativo === true && motivo !== undefined) onMotivo(motivo)
        onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inativo === true }}
      testID={testID}
    >
      <Icone nome={icone} tamanho={28} cor={tinta} estado={estado} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  // A altura é token de faixa (`faixas[…].palco.barra`): 64 em C, 88 em B.
  barraTopo: {
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
  },
  // B (`N3-B-S3`): duas linhas empilhadas e centradas nos 88; a segunda é o
  // título, na largura inteira (663 em 711).
  barraEmpilhada: { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: space.xs },
  linhaDaBarra: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  nomeSetlistNaLinha: { flex: 1 },
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
  // Em B o título tem a linha só para ele: não cresce na vertical e começa à esquerda.
  tituloNaLinha: { flex: 0, textAlign: 'left' },
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
  borda: { position: 'absolute', top: 0 },
  // A geometria das seis molduras de S3 do design: caixa 66 × 66 (64 + a
  // moldura de 1 de cada lado), gap 16, fileira de 558 dp, os mesmos sete x
  // nas seis variantes (V1-PR3-PRECHECK §8.5, div. 36).
  barraBaixo: {
    height: bar.stage,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderTopWidth: bar.hairline,
  },
  /** O vão da Proposta A — ver o comentário no JSX da barra (div. 109). */
  espacador: { flex: 1 },
  controle: {
    width: touch.stage + 2,
    height: touch.stage + 2,
    borderWidth: bar.hairline,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
