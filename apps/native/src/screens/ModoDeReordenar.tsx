/**
 * O MODO DE REORDENAR (N2-PR5; DESIGN-N2 §3 — molduras `N2-S2e-reordenar`,
 * `N2-S2e-ordem-salvando` e `N2-S2e-ordem-falhou`; N2-D27; PRD T2-R8).
 *
 * *"Modo de reordenar, em coluna única. Entrar custa 1 toque; cada movimento
 * é 1 arrasto; sair salvando custa 1 toque."* A grade de duas colunas some
 * enquanto o modo dura, e com ela a ambiguidade de soltar numa grade que
 * embrulha (o diagrama B, recusado).
 *
 * ## O gesto — `PanResponder`, sem módulo nativo (item 1.1 da PR)
 *
 * `[medido]` nem `react-native-gesture-handler` nem `react-native-reanimated`
 * estão em `apps/native/package.json` ou no `app.json`. Trazer os dois seria
 * módulo nativo novo e dev client novo nos dois aparelhos (o caminho do
 * `datetimepicker`); o `PanResponder` do próprio RN cobre o custo que a R1·7b
 * pede — alça de 48 × 72, arrasto só por ela, rolagem automática a 48 dp das
 * bordas — sem dependência nenhuma. O preço declarado: o arrasto anda na
 * thread de JS, um `setState` por evento de toque; com linhas memoizadas só a
 * erguida e as que abrem o buraco se redesenham.
 *
 * **Nenhuma linha muda de lugar na árvore durante o gesto.** As outras linhas
 * se afastam por `translateY` e o buraco é um nó absoluto por baixo. Se a
 * linha erguida fosse remontada noutra posição da árvore, o nó que detém o
 * toque desmontaria e o Android encerraria o gesto no meio.
 *
 * ## O que o modo guarda — e o que ele NÃO guarda
 *
 * A ordem arrastada é **estado da tela, não do cache** (R2·1; T2-R8): ela
 * nasce da setlist quando o modo abre e não é mais tocada pelas props. A
 * releitura da regra 3 atualiza a setlist ATRÁS do modo (`aoRelerAtras`, que
 * a raiz aplica) e o modo continua mostrando o arrasto — é isso que faz
 * `Tentar de novo` reenviar **o arrasto**, e não a ordem do servidor.
 *
 * Nada é escrito durante o gesto: o único request é o `PUT …/order` do
 * `Salvar a ordem`, com a ordem inteira (T2-R8).
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  alvoDoArrasto,
  deParaPosicao,
  frase,
  mesmaOrdem,
  movidaDe,
  mover,
  resolveSong,
  soltarAquiPosicao,
  tituloDoReordenar,
  type ContentDTO,
  type Resultado,
  type SetlistDTO,
  type SetlistSongDTO,
} from '@octavia/core'
import { escrever, prepararReordenacao, relerPelaOrdem, type EstadoLocal } from '../escrita'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'
import { LinhaDeAviso } from './LinhaDeAviso'

/** A linha do modo: *"A linha cai de 116 para 72 dp"* (`N2-S2e-reordenar`). */
const LINHA = 72
/** Linha mais o vão de 8 da coluna — a distância entre duas posições. */
const PASSO = LINHA + space.sm
/** *"a rolagem durante o arrasto acontece a 48 dp das bordas"*. */
const BORDA_DE_ROLAGEM = touch.min
/** dp por quadro de rolagem automática (~60 quadros por segundo). */
const ROLAGEM_POR_QUADRO = 12

type Fase = 'editando' | 'salvando' | 'falhou'
type EstadoDaReleitura = 'relendo' | 'ok' | 'falhou'

interface Arrasto {
  /** Índice (a partir de 0) de onde a linha saiu. */
  de: number
  /** Índice onde ela cai se soltar agora. */
  alvo: number
  /** Deslocamento da linha erguida, em dp, com a rolagem já somada. */
  dy: number
}

export interface ModoDeReordenarProps {
  setlist: SetlistDTO
  contentById: Map<string, ContentDTO>
  estado: EstadoLocal
  online: boolean
  /** `Cancelar`, `Sair sem salvar` e a N2-D36 — nenhum request. */
  aoFechar: () => void
  /** 2xx e releitura: o modo fecha e a grade volta com a ordem do servidor. */
  aoSalvar: (novas: SetlistDTO[] | null, syncedAtMs: number | null) => void
  /** 2xx com a releitura falhando (N2-D22): o modo fecha e S2 diz por quê. */
  aoSalvoNaoRelido: () => void
  /** 404 (T2-R10): a setlist sumiu. A releitura já aconteceu. */
  aoSumir: (novas: SetlistDTO[] | null, syncedAtMs: number | null) => void
  /** A releitura da regra 3 trouxe conjunto novo — para ATRÁS do modo. */
  aoRelerAtras: (novas: SetlistDTO[], syncedAtMs: number | null) => void
}

function ordenadas(s: SetlistDTO): SetlistSongDTO[] {
  return [...s.setlist_songs].sort((a, b) => a.position - b.position)
}

/** O que o gesto de uma alça chama — estável entre renders, lido na hora. */
interface Gesto {
  iniciar: (indice: number) => void
  mover: (dy: number, moveY: number) => void
  soltar: () => void
  desistir: () => void
}

interface LinhaProps {
  indice: number
  numero: number
  titulo: string
  artista: string | null
  deslocamento: number
  erguida: boolean
  rotulo: string | null
  alcaAtiva: boolean
  gesto: React.RefObject<Gesto | null>
}

/**
 * Uma linha de 72 dp: alça, número, título, "· artista" — *"sem tipo, sem
 * remover"*. Memoizada: durante o gesto só mudam a erguida e as que se
 * afastam para abrir o buraco.
 */
const Linha = memo(function Linha({
  indice,
  numero,
  titulo,
  artista,
  deslocamento,
  erguida,
  rotulo,
  alcaAtiva,
  gesto,
}: LinhaProps): React.JSX.Element {
  const ativa = useRef(alcaAtiva)
  ativa.current = alcaAtiva
  const alca = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => ativa.current,
        onMoveShouldSetPanResponder: () => ativa.current,
        // A lista não toma o gesto de volta no meio do arrasto.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => gesto.current?.iniciar(indice),
        onPanResponderMove: (_e, g) => gesto.current?.mover(g.dy, g.moveY),
        onPanResponderRelease: () => gesto.current?.soltar(),
        onPanResponderTerminate: () => gesto.current?.desistir(),
      }),
    [indice, gesto],
  )
  return (
    <View
      style={[
        styles.linha,
        // A erguida fica NO LUGAR, invisível, e segura o toque; quem aparece
        // é a `LinhaFlutuante`, desenhada por último (div. 286).
        erguida ? styles.linhaNoLugar : null,
        deslocamento !== 0 ? { transform: [{ translateY: deslocamento }] } : null,
      ]}
    >
      {/* R1·7b — o ALVO é 48 × 72, a altura toda da linha, encostado na
          borda esquerda; o desenho de 24 fica centrado nele. O alvo não é
          desenhado. Arrastar pelo corpo não reordena: só aqui há gesto. */}
      <View
        style={styles.alca}
        {...alca.panHandlers}
        accessibilityRole="adjustable"
        accessibilityLabel="Arrastar para mudar a posição"
        accessibilityState={{ disabled: !alcaAtiva }}
        testID={`alca-${numero}`}
      >
        {/* Aqui a alça só fica sem tinta DURANTE o salvamento, e a moldura
            `N2-S2e-ordem-salvando` a desenha INTEIRA em `lineInfo` — seis
            marcadores: é "ocupada", não "inativa com motivo" (div. 280). A
            amputação de quatro é a do `Reordenar` da faixa. */}
        <Icone nome="alca" tamanho={24} cor={alcaAtiva ? dark.accentInk : dark.lineInfo} />
      </View>
      <Texto numero={numero} titulo={titulo} artista={artista} rotulo={erguida ? null : rotulo} acento={false} />
    </View>
  )
})

/** Número, título, "· artista" e o rótulo da direita — o miolo das duas linhas. */
function Texto({
  numero,
  titulo,
  artista,
  rotulo,
  acento,
}: {
  numero: number
  titulo: string
  artista: string | null
  rotulo: string | null
  acento: boolean
}): React.JSX.Element {
  return (
    <>
      <Text style={[styles.numero, acento ? { color: dark.accent } : null]}>{numero}</Text>
      <Text style={styles.titulo} numberOfLines={1}>
        {titulo}
      </Text>
      {artista !== null ? (
        <Text style={styles.artista} numberOfLines={1}>
          {`· ${artista}`}
        </Text>
      ) : null}
      <View style={styles.vao} />
      {rotulo !== null ? <Text style={styles.rotulo}>{rotulo}</Text> : null}
    </>
  )
}

/**
 * **A linha erguida, como DESENHO** — div. 286, medida no §4.
 *
 * A primeira forma erguia a própria linha com `zIndex` e `elevation`, e no
 * Tab S6 o buraco tracejado (um irmão ANTERIOR, que devia ficar por baixo)
 * aparecia POR CIMA dela: "soltar aqui · posição 2" escrito dentro da linha
 * erguida — nem com a linha opaca isso mudou. No Android a ordem de desenho
 * entre irmãos com `transform` não obedece ao `zIndex` com segurança; o que
 * obedece sempre é a ordem da árvore. Então a linha que segura o toque fica
 * no lugar, invisível, e esta cópia — sem gesto e sem `testID` — é desenhada
 * como o ÚLTIMO filho da lista.
 */
function LinhaFlutuante({
  topo,
  numero,
  titulo,
  artista,
  rotulo,
}: {
  topo: number
  numero: number
  titulo: string
  artista: string | null
  rotulo: string
}): React.JSX.Element {
  return (
    <View style={[styles.linha, styles.linhaErguida, { top: topo }]} pointerEvents="none">
      {/* O acento a 12% é uma CAMADA sobre a linha opaca, não o fundo dela. */}
      <View style={styles.veu} />
      <View style={styles.alca}>
        <Icone nome="alca" tamanho={24} cor={dark.accentInk} />
      </View>
      <Texto numero={numero} titulo={titulo} artista={artista} rotulo={rotulo} acento />
    </View>
  )
}

export function ModoDeReordenar({
  setlist,
  contentById,
  estado,
  online,
  aoFechar,
  aoSalvar,
  aoSalvoNaoRelido,
  aoSumir,
  aoRelerAtras,
}: ModoDeReordenarProps): React.JSX.Element {
  // A ordem arrastada nasce da setlist e NÃO acompanha as props (R2·1).
  const [ordem, setOrdem] = useState<SetlistSongDTO[]>(() => ordenadas(setlist))
  /** Posição no servidor de cada linha quando o modo abriu — o "de" do "movida de 5". */
  const [origem, setOrigem] = useState(() => new Map(ordenadas(setlist).map((s) => [s.id, s.position])))
  /**
   * A setlist como a ÚLTIMA releitura deste modo a trouxe — ou `null`, e aí
   * vale a das props. É contra ela que o "nada mudou" se mede (N2-D36): depois
   * de uma falha, "a ordem do servidor" é a relida, não a de quando o modo abriu.
   */
  const [relidaAqui, setRelidaAqui] = useState<SetlistDTO | null>(null)
  /** N2-D37 — o 400 de permutação descartou o arrasto e pôs a relida na tela. */
  const [descartado, setDescartado] = useState(false)
  /** As linhas que o músico arrastou — só elas levam o "movida de". */
  const [arrastadas, setArrastadas] = useState<ReadonlySet<string>>(() => new Set())
  const [arrasto, setArrasto] = useState<Arrasto | null>(null)
  const [fase, setFase] = useState<Fase>('editando')
  const [falha, setFalha] = useState<Resultado | null>(null)
  const [releitura, setReleitura] = useState<EstadoDaReleitura | null>(null)

  const salvando = fase === 'salvando'

  // ---------------------------------------------------------------- gesto
  const ordemRef = useRef(ordem)
  ordemRef.current = ordem
  const arrastoRef = useRef<Arrasto | null>(null)
  const listaRef = useRef<ScrollView>(null)
  /** A caixa da lista — é ela que se mede na janela (o `ScrollView` não mede). */
  const corpoRef = useRef<View>(null)
  /** Onde a lista está na janela — medida no início de cada arrasto. */
  const janela = useRef({ y: 0, h: 0 })
  const rolagem = useRef({ atual: 0, noInicio: 0, conteudo: 0, visivel: 0 })
  const toque = useRef({ dy: 0 })
  const direcao = useRef(0)
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null)

  const recalcular = useCallback(() => {
    const a = arrastoRef.current
    if (a === null) return
    const dy = toque.current.dy + (rolagem.current.atual - rolagem.current.noInicio)
    const novo = { de: a.de, alvo: alvoDoArrasto(a.de, dy, PASSO, ordemRef.current.length), dy }
    arrastoRef.current = novo
    setArrasto(novo)
  }, [])

  const pararRolagem = useCallback(() => {
    if (relogio.current !== null) clearInterval(relogio.current)
    relogio.current = null
    direcao.current = 0
  }, [])

  /** A 48 dp de uma borda, a lista rola sozinha enquanto o dedo ficar ali. */
  const rolarSePerto = useCallback(
    (moveY: number) => {
      const { y, h } = janela.current
      const d = h <= 0 ? 0 : moveY < y + BORDA_DE_ROLAGEM ? -1 : moveY > y + h - BORDA_DE_ROLAGEM ? 1 : 0
      direcao.current = d
      if (d === 0) {
        pararRolagem()
        return
      }
      if (relogio.current !== null) return
      relogio.current = setInterval(() => {
        const r = rolagem.current
        const max = Math.max(0, r.conteudo - r.visivel)
        const prox = Math.min(max, Math.max(0, r.atual + direcao.current * ROLAGEM_POR_QUADRO))
        if (prox === r.atual) return
        r.atual = prox
        listaRef.current?.scrollTo({ y: prox, animated: false })
        recalcular()
      }, 16)
    },
    [pararRolagem, recalcular],
  )

  const gesto = useRef<Gesto>(null)
  gesto.current = {
    iniciar: (indice) => {
      corpoRef.current?.measureInWindow?.((_x, y, _w, h) => {
        janela.current = { y, h }
      })
      rolagem.current.noInicio = rolagem.current.atual
      toque.current = { dy: 0 }
      const a = { de: indice, alvo: indice, dy: 0 }
      arrastoRef.current = a
      setArrasto(a)
    },
    mover: (dy, moveY) => {
      toque.current = { dy }
      recalcular()
      rolarSePerto(moveY)
    },
    soltar: () => {
      pararRolagem()
      const a = arrastoRef.current
      arrastoRef.current = null
      setArrasto(null)
      if (a === null || a.alvo === a.de) return
      const id = ordemRef.current[a.de]?.id
      // Renumeração só DEPOIS de soltar: é aqui, e só aqui, que a ordem muda.
      setOrdem((o) => mover(o, a.de, a.alvo))
      if (id !== undefined) setArrastadas((s) => new Set(s).add(id))
    },
    desistir: () => {
      pararRolagem()
      arrastoRef.current = null
      setArrasto(null)
    },
  }
  useEffect(() => pararRolagem, [pararRolagem])

  // -------------------------------------------------------------- escrita
  /** A releitura da regra 3, com o `reason=order`: atualiza ATRÁS do modo. */
  const reler = useCallback(
    async (descartar: boolean) => {
      setReleitura('relendo')
      const r = await relerPelaOrdem(estado)
      const nova = r.setlists?.find((s) => s.id === setlist.id) ?? null
      if (r.setlists !== null) aoRelerAtras(r.setlists, r.syncedAtMs)
      if (nova !== null) {
        setRelidaAqui(nova)
        /**
         * **N2-D37** (div. 289): o 400 de permutação inválida — no contrato,
         * `VALIDATION_ERROR` com `details[].field = "order"`, que o core chama
         * de `ordem-mudou` (div. 295) — quer dizer que a setlist mudou atrás
         * do modo: o arrasto já não é permutação dela, e reenviá-lo daria 400
         * para sempre. A tela DESCARTA o arrasto e mostra a ordem relida, e a
         * frase do servidor ("a ordem foi recarregada") passa a ser verdade.
         * Para todo outro erro, a R2·1 vale como está.
         */
        if (descartar) {
          const relidas = ordenadas(nova)
          setOrdem(relidas)
          setOrigem(new Map(relidas.map((s) => [s.id, s.position])))
          setArrastadas(new Set())
          setDescartado(true)
        }
      }
      setReleitura(r.leu ? 'ok' : 'falhou')
    },
    [estado, setlist.id, aoRelerAtras],
  )

  const doServidor = relidaAqui ?? setlist
  /** N2-D36 revista: a ordem na tela é a do servidor → `Salvar a ordem` inativo. */
  const nadaMudou = mesmaOrdem(
    ordenadas(doServidor).map((s) => s.id),
    ordem.map((s) => s.id),
  )

  const salvar = useCallback(async () => {
    if (salvando || !online) return
    const preparo = prepararReordenacao(
      setlist.id,
      ordenadas(doServidor).map((s) => s.id),
      ordem.map((s) => s.id),
    )
    // N2-D36 revista: o toque no `Salvar a ordem` inativo não fecha nada —
    // deixa a linha `write blocked … nada-mudou` (quem a escreve é o
    // `prepararReordenacao`) e o modo continua, como o formulário.
    if (!preparo.enviar) return
    setFase('salvando')
    setFalha(null)
    setReleitura(null)
    setDescartado(false)
    const saida = await escrever(preparo.pedido, estado, { contexto: 'setlist' })
    const { especie } = saida.resultado
    if (especie === 'ok') {
      aoSalvar(saida.setlists, saida.syncedAtMs)
      return
    }
    if (especie === 'ok-nao-relido') {
      aoSalvoNaoRelido()
      return
    }
    if (especie === 'sumiu') {
      aoSumir(saida.setlists, saida.syncedAtMs)
      return
    }
    // R2·1: o modo fica aberto, o arrasto fica, e a releitura vem ANTES de
    // `Tentar de novo` ficar ativo (regra 3).
    setFalha(saida.resultado)
    setFase('falhou')
    await reler(saida.resultado.chave === 'ordem-mudou')
  }, [salvando, online, setlist.id, doServidor, ordem, estado, aoSalvar, aoSalvoNaoRelido, aoSumir, reler])

  // O voltar do sistema é o `Cancelar` / `Sair sem salvar`. Durante o
  // salvamento ele é engolido: o `Cancelar` some de propósito (regra 1), e
  // sair da tela não cancelaria a escrita em voo.
  const salvandoRef = useRef(salvando)
  salvandoRef.current = salvando
  const fecharRef = useRef(aoFechar)
  fecharRef.current = aoFechar
  useEffect(() => {
    const s = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!salvandoRef.current) fecharRef.current()
      return true
    })
    return () => s.remove()
  }, [])

  // ----------------------------------------------------------------- tela
  const falhou = fase === 'falhou'
  /** A falha que PRESERVA o arrasto (R2·1) — todas, menos a da N2-D37. */
  const comArrasto = falhou && !descartado
  const relendo = releitura === 'relendo'
  const releituraFalhou = releitura === 'falhou'
  const alcaAtiva = !salvando

  const aviso = useMemo((): { icone: NomeIcone; cor: string; motivo: string } | null => {
    if (!online) return { icone: 'sem-conexao', cor: dark.offlineInk, motivo: frase('sem-rede-s2') }
    if (falha === null) return null
    if (falha.especie === 'limite') return { icone: 'ultima-sincronizacao', cor: dark.offlineInk, motivo: falha.frase }
    // As três orações da moldura `N2-S2e-ordem-falhou`; a terceira só depois
    // da releitura — antes dela seria promessa sobre uma leitura em voo.
    const oracoes = [frase('falhou-ordem'), falha.frase]
    // "a ordem dela não foi aplicada aqui" seria mentira depois da N2-D37,
    // que aplicou exatamente a ordem relida.
    if (releitura === 'ok' && !descartado) oracoes.push(frase('ordem-relida'))
    return { icone: 'falha', cor: dark.errorInk, motivo: oracoes.join('  ·  ') }
  }, [online, falha, releitura, descartado])

  const deslocamentoDe = (i: number): number => {
    if (arrasto === null) return 0
    const { de, alvo } = arrasto
    if (i === de) return arrasto.dy
    if (de < alvo && i > de && i <= alvo) return -PASSO
    if (alvo < de && i >= alvo && i < de) return PASSO
    return 0
  }

  /** `Tentar recarregar` relê, não escreve — o "nada mudou" não o alcança. */
  const recarregar = comArrasto && releituraFalhou
  const semMudanca = nadaMudou && !recarregar
  const principalInativo = salvando || relendo || !online || semMudanca
  const rotuloPrincipal = comArrasto ? (releituraFalhou ? 'Tentar recarregar' : 'Tentar de novo') : 'Salvar a ordem'

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <View style={styles.barraTexto}>
          <Text style={styles.titulo26} numberOfLines={1}>
            {tituloDoReordenar(setlist.name)}
          </Text>
          {salvando ? (
            <View style={styles.progresso}>
              <Icone nome="baixando" tamanho={20} cor={dark.accentInk} />
              <Text style={styles.progressoTexto}>{frase('salvando-ordem')}</Text>
            </View>
          ) : (
            <Text style={styles.apoio} numberOfLines={1}>
              {frase(comArrasto ? 'ordem-arrastada' : 'reordenar-apoio')}
            </Text>
          )}
        </View>
        {/* Regra 1: durante o salvamento o `Cancelar` some — sair da tela não
            cancelaria a escrita, e prometer isso seria mentira. */}
        {!salvando ? (
          <Pressable style={styles.texto} onPress={aoFechar} accessibilityRole="button" testID="reordenar-sair">
            <Text style={styles.textoRotulo}>{falhou ? 'Sair sem salvar' : 'Cancelar'}</Text>
          </Pressable>
        ) : null}
        {relendo ? (
          <Text style={styles.motivoInativo} testID="reordenar-motivo">
            {frase('relendo')}
          </Text>
        ) : semMudanca && !salvando ? (
          // N2-D36 revista / N2-D23: o motivo do inativo, escrito ao lado — a
          // MESMA frase do formulário (T2-R3 (iii)), sem redação nova.
          <Text style={styles.motivoInativo} testID="reordenar-salvar-motivo">
            {frase('nada-mudou')}
          </Text>
        ) : null}
        <Pressable
          style={[
            comArrasto ? styles.vazado : styles.cheio,
            principalInativo ? styles.inativo : null,
          ]}
          onPress={() => {
            // O toque no inativo por "nada mudou" RODA: é ele que deixa a linha
            // `write blocked … nada-mudou` (o mesmo do `BotaoCheio` da folha).
            if (salvando || relendo || !online) return
            if (recarregar) void reler(false)
            else void salvar()
          }}
          accessibilityRole="button"
          accessibilityState={{ disabled: principalInativo }}
          testID="reordenar-salvar"
        >
          {comArrasto ? (
            <Icone
              nome="tentar-novamente"
              tamanho={24}
              cor={principalInativo ? dark.lineInfo : dark.text}
              estado={principalInativo ? 'inerte' : 'normal'}
            />
          ) : (
            // O visto não é amputável (exceção R2·2): inativo é o desenho
            // inteiro em `lineInfo`, traço 1,25.
            <Icone
              nome="garantida"
              tamanho={24}
              cor={principalInativo ? dark.lineInfo : dark.bg}
              estado={principalInativo ? 'inerte' : 'normal'}
            />
          )}
          <Text
            style={[
              comArrasto ? styles.vazadoTexto : styles.cheioTexto,
              principalInativo ? styles.inativoTexto : null,
            ]}
          >
            {rotuloPrincipal}
          </Text>
        </Pressable>
      </View>

      {aviso !== null ? (
        <LinhaDeAviso icone={aviso.icone} cor={aviso.cor} motivo={aviso.motivo} recuo={space.xl} />
      ) : null}

      <View ref={corpoRef} style={styles.corpo}>
        <ScrollView
          ref={listaRef}
          style={styles.corpo}
          contentContainerStyle={styles.lista}
          // Durante o arrasto quem rola é o modo (a 48 dp das bordas), não o dedo.
          scrollEnabled={arrasto === null}
          scrollEventThrottle={16}
          onScroll={(e) => {
            rolagem.current.atual = e.nativeEvent.contentOffset.y
          }}
          onLayout={(e) => {
            rolagem.current.visivel = e.nativeEvent.layout.height
          }}
          onContentSizeChange={(_w, h) => {
            rolagem.current.conteudo = h
          }}
        >
          {/* O buraco tracejado — *"tracejado no V1 significa uma coisa só —
              ausente"*. Fica POR BAIXO das linhas, na posição onde a erguida cai. */}
          {arrasto !== null ? (
            <View style={[styles.buraco, { top: space.xl + arrasto.alvo * PASSO }]}>
              <Text style={styles.buracoTexto}>{soltarAquiPosicao(arrasto.alvo + 1)}</Text>
            </View>
          ) : null}
          {ordem.map((song, i) => {
            const { content } = resolveSong(song, contentById)
            const erguida = arrasto !== null && arrasto.de === i
            const deOnde = origem.get(song.id)
            const rotulo = erguida
              ? deParaPosicao(i + 1, (arrasto?.alvo ?? i) + 1)
              : comArrasto && arrastadas.has(song.id) && deOnde !== undefined && deOnde !== i + 1
                ? movidaDe(deOnde)
                : null
            return (
              <Linha
                key={song.id}
                indice={i}
                numero={i + 1}
                titulo={content?.title ?? '(sem título)'}
                artista={content?.artist !== undefined && content?.artist !== null && content.artist.length > 0 ? content.artist : null}
                deslocamento={deslocamentoDe(i)}
                erguida={erguida}
                rotulo={rotulo}
                alcaAtiva={alcaAtiva}
                gesto={gesto}
              />
            )
          })}
          {arrasto !== null && ordem[arrasto.de] !== undefined
            ? (() => {
                const song = ordem[arrasto.de] as SetlistSongDTO
                const { content } = resolveSong(song, contentById)
                return (
                  <LinhaFlutuante
                    topo={space.xl + arrasto.de * PASSO + arrasto.dy}
                    numero={arrasto.de + 1}
                    titulo={content?.title ?? '(sem título)'}
                    artista={content?.artist !== undefined && content?.artist !== null && content.artist.length > 0 ? content.artist : null}
                    rotulo={deParaPosicao(arrasto.de + 1, arrasto.alvo + 1)}
                  />
                )
              })()
            : null}
        </ScrollView>
      </View>
    </View>
  )
}

/**
 * Medidas das três molduras do §3. Onde a moldura usa um número fora das
 * escalas do `theme.ts`, entra o degrau mais próximo (errata E10): o raio 10
 * dos botões vira `radius.control` (12), os recuos de 18/20 viram `space.lg`
 * e `space.xl`. Ficam como literal, declarados, o 72 da linha (o número da
 * própria moldura, e o que a CN mede), o 20 do número e do título (§4.4,
 * como na grade) e o 32 de largura do número.
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  barra: {
    height: bar.top + space.xl,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xl,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  barraTexto: { flex: 1, minWidth: 0, gap: space.sm },
  titulo26: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.titleSmall,
    letterSpacing: size.titleSmall * tracking.displayWide,
    textTransform: 'uppercase',
  },
  apoio: { color: dark.muted, fontFamily: font.ui, fontSize: size.label },
  progresso: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progressoTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.label },
  texto: { height: touch.min, paddingHorizontal: space.lg, justifyContent: 'center', borderRadius: radius.control },
  textoRotulo: { color: dark.muted, fontFamily: font.ui, fontSize: size.bodySmall },
  motivoInativo: { color: dark.muted, fontFamily: font.ui, fontSize: size.bodySmall },
  cheio: {
    height: touch.min,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.control,
    backgroundColor: dark.text,
  },
  cheioTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.bodySmall },
  vazado: {
    height: touch.min,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  vazadoTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  // E3: inativo é tinta na moldura, no ícone e no rótulo — sem opacidade.
  inativo: { backgroundColor: 'transparent', borderWidth: bar.hairline, borderColor: dark.lineInfo },
  inativoTexto: { color: dark.lineInfo },
  corpo: { flex: 1 },
  lista: { padding: space.xl, gap: space.sm },
  linha: {
    height: LINHA,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingRight: space.xl,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
    backgroundColor: dark.bg,
  },
  // V1 §6.2, estado ATIVO: contorno e fundo de acento a 12% (`1F` = 31/255),
  // e a sombra — no Android, `elevation`, que é a que o aparelho desenha.
  linhaErguida: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    borderColor: dark.accent,
    elevation: 8,
  },
  // A linha que segura o toque durante o arrasto: no lugar, sem desenho.
  linhaNoLugar: { opacity: 0 },
  veu: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.control,
    backgroundColor: `${dark.accent}1F`,
  },
  alca: { width: touch.min, height: LINHA, alignItems: 'center', justifyContent: 'center' },
  numero: { color: dark.muted, fontFamily: font.ui, fontSize: 20, width: 32 },
  titulo: { color: dark.text, fontFamily: font.uiBold, fontSize: 20, flexShrink: 1 },
  artista: { color: dark.muted, fontFamily: font.ui, fontSize: size.label, flexShrink: 1 },
  vao: { flex: 1 },
  rotulo: { color: dark.accent, fontFamily: font.ui, fontSize: size.label },
  buraco: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    height: LINHA,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: bar.hairline,
    borderStyle: 'dashed',
    borderColor: dark.lineInfo,
    borderRadius: radius.control,
  },
  buracoTexto: { color: dark.lineInfo, fontFamily: font.ui, fontSize: size.label },
})
