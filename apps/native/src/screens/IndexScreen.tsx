/**
 * S2 — Índice da setlist (PRD T1-R11, T1-R24, T1-R28, T1-R35; aceites A6, A8,
 * A12, A14, A18), redesenhada pelo DESIGN-V1 na V1-PR5 (as molduras `S2` e
 * `S2-invalidos` do `telas.html`, com as erratas da §9 prevalecendo).
 *
 * Grade de duas colunas como o design: número (mono), título, "artista ·
 * nota" e o tipo. A música **atual** leva uma barra de 4 dp no acento (não um
 * bloco cheio — correção 4 do revisor ao design). Um tap abre o palco naquela
 * posição: com o índice a 1 tap do palco, o salto 1 → 47 custa 2 taps no
 * total, dentro dos 3 do T1-R28.
 *
 * A identidade da linha é `setlist_songs.id` (T1-R24): um bis aparece duas
 * vezes, em posições distintas, cada uma com sua nota.
 *
 * O que a V1-PR5 mudou é pintura, não comportamento: o chip com contorno vira
 * **ícone + rótulo** (§6.4), e os quatro tipos ganham os desenhos `letra`,
 * `cifra`, `tab` e `partitura` de 20 dp — este é o primeiro e único lugar do
 * app que renderiza a **tab de quatro cordas** da §6.3, pelo ramo `em20` do
 * `Icone.tsx`; o glifo `◂` do voltar morre e vira o ícone `voltar` de 24 num
 * alvo de 48 × 48; o subtítulo ganha `n-de-musicas`, `data` e `local` como o
 * cartão do S1; e os itens inválidos passam a dizer o que fazer. Nenhum
 * controle deixa de aceitar toque — a contagem "2 sem conteúdo" do cabeçalho
 * é proposta (§8.2) e fica fora.
 *
 * O acento tem **um dono só** nesta tela (§3.1, E12): a posição atual. A
 * barra de 4 dp, o número e o título dela; mais nada.
 *
 * ## O que a N2-PR4 acrescenta — S2 COM EDIÇÃO (DESIGN-N2 §3, §6, §7)
 *
 * S2 passa a ter **dois estados de entrada** (T2-R19, N2-D19), e o que os
 * separa é de onde se veio:
 *
 *  - **de S1** → edição. Uma **faixa de 64 dp** abaixo da barra de 88, um
 *    `remover` em cada linha, a folha de renomear, o diálogo de apagar e a
 *    linha de aviso de 48 dp;
 *  - **do palco** → nada. *"Se a implementação puser um único controle de
 *    escrita nesta moldura, ela está errada."* O palco é endereçado por
 *    `position` e um reorder muda a música que uma posição aponta.
 *
 * O discriminante é o **`posicaoAtual`**, que já existia e já servia a isto:
 * `null` quando o índice foi aberto de S1, preenchido quando veio do palco.
 * Ele decide o nome acessível do `voltar` desde a V1-PR5; agora decide também
 * se a tela escreve. Quem o passa é o `navigation.tsx`.
 *
 * **A faixa nasce com DOIS controles, e isso é estado intermediário
 * declarado**: `Renomear e datar` e `Apagar setlist`. `Reordenar` é da PR-5 e
 * `Adicionar música` é da PR-6 — a faixa do congelado tem quatro, e ela vai
 * ganhá-los sem mudar de forma. Não é errata do congelado; é a ordem das PRs.
 *
 * ## O que a N2-PR5 acrescenta — `Reordenar` e o modo (DESIGN-N2 §3)
 *
 * O terceiro controle da faixa entra no grupo da ESQUERDA, onde a moldura
 * `N2-S2e` o desenha (logo depois do `Adicionar música` da PR-6) — e por isso
 * os dois da PR-4, à direita, não mudam de lugar. Tocar nele troca a barra, a
 * faixa, o aviso e a grade pelo `ModoDeReordenar`, que é outra tela dentro
 * desta: coluna única, alça, um só `PUT …/order` ao salvar. Acima de 100
 * músicas ele fica inativo com a linha `N2-X-100` (regra 8: só ele).
 *
 * ## O que a N2-PR6 acrescenta — `Adicionar música` e o picker (DESIGN-N2 §5)
 *
 * O quarto controle entra à ESQUERDA de `Reordenar` (N2-E11), com o contorno
 * em `accentInk` — *"é o ato principal desta tela"* —, e com ele a faixa fica
 * completa. Tocar nele troca S2 pelo `Picker`, como o `Reordenar` a troca
 * pelo modo: S2 continua montada (nenhum `index open` intercalado), e o
 * conjunto de cada releitura chega à raiz pelo mesmo `aoReler` de sempre — é
 * por isso que a volta não precisa de request.
 *
 * **Nada aqui toca o cache.** Toda escrita passa pelo `escrever()` do
 * `src/escrita.ts`, que relê e grava (T2-R9); esta tela recebe o conjunto
 * novo por `edicao.aoReler` e quem o aplica é a raiz. É a mesma regra que a
 * folha de criar já obedecia.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  frase,
  labelFor,
  reordenavel,
  resolveSong,
  songKey,
  type ContentDTO,
  type ContentValidity,
  type Resultado,
  type SetlistDTO,
  type SetlistSongDTO,
  type SongLabel,
} from '@octavia/core'
import { barrarPorTeto, escrever, pedidoRemover, relerAoAbrir, type EstadoLocal } from '../escrita'
import { Icone, type TamanhoIcone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { log } from '../log'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'
import { DialogoDeApagar } from './DialogoDeApagar'
import { FolhaDeSetlist } from './FolhaDeCriar'
import { LinhaDeAviso } from './LinhaDeAviso'
import { ModoDeReordenar } from './ModoDeReordenar'
import { Picker } from './Picker'

/**
 * O que S2 precisa para ESCREVER, e ela só o recebe quando veio de S1
 * (T2-R19). `null` = a S2 do palco, que é a do V1 sem uma vírgula de
 * diferença.
 */
export interface EdicaoDeS2 {
  /** O cache de onde a escrita parte, e ao qual a releitura volta (T2-R9). */
  estado: EstadoLocal
  /** T2-R12 — sem rede não há escrita, e o motivo fica escrito uma vez. */
  online: boolean
  /** A releitura trouxe conjunto novo; quem grava o cache foi o `escrita.ts`. */
  aoReler: (setlists: SetlistDTO[], syncedAtMs: number | null) => void
  /**
   * A tela acabou: ou a setlist foi apagada aqui (`null`), ou ela sumiu
   * debaixo do músico (`'sumiu'`, T2-R10 — e aí S1 explica por quê). Nos dois
   * casos a releitura **já aconteceu** antes desta chamada.
   */
  aoSairParaS1: (aviso: 'sumiu' | null) => void
}

export interface IndexScreenProps {
  setlist: SetlistDTO
  contentById: Map<string, ContentDTO>
  /** Sincronização terminada? Decide "carregando…" × "indisponível" (T1-R11). */
  syncDone: boolean
  /** Posição atual no palco (1-based), ou `null` se o índice foi aberto da S1. */
  posicaoAtual: number | null
  onVoltar: () => void
  onAbrirPosicao: (posicao: number) => void
  /** T1-R22 — busca na biblioteca, com esta setlist como contexto. */
  onBuscar: () => void
  /** N2-PR4 — presente só na S2 vinda de S1 (T2-R19). */
  edicao?: EdicaoDeS2 | null
}

/** Ícone e rótulo por tipo (§6.4): o rótulo **é** o nome acessível. */
const TIPO: Record<string, { icone: NomeIcone; rotulo: string }> = {
  Lyrics: { icone: 'letra', rotulo: 'Letra' },
  Chords: { icone: 'cifra', rotulo: 'Cifra' },
  Tab: { icone: 'tab', rotulo: 'Tab' },
  Sheet: { icone: 'partitura', rotulo: 'Partitura' },
}

/**
 * O que o item inválido mostra, por `reason` do contrato do core — e não pela
 * ordem em que a fixture os põe na lista. A moldura `S2-invalidos` dá o
 * `tipo-desconhecido` ao item 10, que é um `no-key` (Chords sem a chave
 * `chords`): pelo contrato, `no-key` é falta de CORPO, não tipo fora do enum,
 * e só o `unknown-type` é "tipo não reconhecido". Quem sabe é o core.
 *
 * A tinta é `offlineInk` e não `errorInk` (a nota da moldura): o app está
 * íntegro, o dado é que está incompleto. Âmbar = "não está pronta" (§6.1).
 */
type MotivoInvalido = Extract<ContentValidity, { ok: false }>['reason']

function invalidoDe(reason: MotivoInvalido): { icone: NomeIcone; rotulo: string; motivo: string } {
  return reason === 'unknown-type'
    ? { icone: 'tipo-desconhecido', rotulo: '?', motivo: 'tipo não reconhecido — edite na versão web' }
    : { icone: 'sem-conteudo', rotulo: 'vazia', motivo: 'nada para mostrar — edite na versão web' }
}

/** Segunda linha do item: o que o design mostra sob o título. */
function sublinha(
  song: SetlistSongDTO,
  titulo: { artist: string | null },
  rotulo: SongLabel,
  motivo: string | null,
): string {
  const partes: string[] = []
  if (rotulo === 'loading') partes.push('carregando…')
  if (rotulo === 'unavailable') partes.push('indisponível')
  if (motivo !== null) partes.push(motivo)
  if (titulo.artist !== null && titulo.artist.length > 0) partes.push(titulo.artist)
  if (song.notes !== null && song.notes.length > 0) partes.push(song.notes)
  return partes.join('  ·  ')
}

/**
 * O `remover` da linha (§3): *"o círculo com menos, 24 em `accentInk`, alvo de
 * 48, no fim da linha. Ele come 56 dp da caixa do título (336 → 280 dp) e
 * nada mais."*
 *
 * **Cada bis tem o seu** — o `testID` é a POSIÇÃO (`remover-<n>`) e o id que
 * vai no request é o `setlist_songs.id` daquela linha (T2-R7). É a diferença
 * que a div. 156 manda não copiar do web, onde remover por `content_id`
 * apagava as duas posições de um bis.
 *
 * Enquanto a remoção voa, o alvo dá lugar ao estado `removendo…` — sem botão,
 * como a linha do picker em `adicionando…`: tocar de novo aqui não teria o que
 * remover duas vezes.
 */
function Remover({
  posicao,
  inativo,
  removendo,
  onPress,
}: {
  posicao: number
  inativo: boolean
  removendo: boolean
  onPress: () => void
}): React.JSX.Element {
  if (removendo) {
    return (
      <View style={styles.removendo} testID={`remover-${posicao}`}>
        <Icone nome="baixando" tamanho={24} cor={dark.accentInk} />
        <Text style={styles.removendoTexto}>{frase('removendo')}</Text>
      </View>
    )
  }
  return (
    <Pressable
      style={styles.remover}
      onPress={() => (inativo ? undefined : onPress())}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      // §6.4: ícone sem rótulo visível leva o nome acessível do anexo D.
      accessibilityLabel="Remover da setlist"
      testID={`remover-${posicao}`}
    >
      <Icone
        nome="remover"
        tamanho={24}
        cor={inativo ? dark.lineInfo : dark.accentInk}
        estado={inativo ? 'inerte' : 'normal'}
      />
    </Pressable>
  )
}

function Item({
  song,
  contentById,
  syncDone,
  atual,
  remover,
  onAbrir,
}: {
  song: SetlistSongDTO
  contentById: Map<string, ContentDTO>
  syncDone: boolean
  atual: boolean
  /** `null` na S2 do palco: lá a linha não tem alvo de escrita nenhum. */
  remover: { inativo: boolean; removendo: boolean; onPress: () => void } | null
  onAbrir: () => void
}): React.JSX.Element {
  const { content, validity } = resolveSong(song, contentById)
  const rotulo = labelFor(song, contentById, syncDone)
  const titulo = content?.title ?? '(sem título)'
  const invalido =
    rotulo === 'invalid' && validity !== null && !validity.ok ? invalidoDe(validity.reason) : null
  const tipo = content !== null ? TIPO[content.content_type] : undefined
  // §5.5 — o tipo é ícone DENTRO de texto (20); o inválido é placeholder (28,
  // como a §6.4 lhe dá nas duas casas, o S3 e a linha do S2).
  const icone: { nome: NomeIcone; tamanho: TamanhoIcone } | null =
    invalido !== null
      ? { nome: invalido.icone, tamanho: 28 }
      : tipo !== undefined
        ? { nome: tipo.icone, tamanho: 20 }
        : null
  const corTipo = invalido !== null ? dark.offlineInk : dark.muted

  return (
    <Pressable
      style={[styles.item, atual && styles.itemAtual, invalido !== null && styles.itemInvalido]}
      onPress={onAbrir}
      accessibilityRole="button"
      testID={`song-${song.position}`}
    >
      {/* §3.3: o número do inválido fica em `muted`, igual ao do válido — item
          navegável não é item desabilitado, e é por ele que se chega ao
          placeholder do palco. O acento aqui é a posição ATUAL, e só ela. */}
      <Text style={[styles.numero, atual && { color: dark.accent }]}>{song.position}</Text>
      <View style={styles.itemTexto}>
        <Text
          style={[styles.titulo, { color: atual ? dark.accent : invalido !== null ? dark.muted : dark.text }]}
          numberOfLines={1}
        >
          {titulo}
        </Text>
        <Text style={[styles.sublinha, { color: corTipo }]} numberOfLines={1}>
          {sublinha(song, { artist: content?.artist ?? null }, rotulo, invalido?.motivo ?? null)}
        </Text>
      </View>
      <View style={styles.tipo}>
        {icone !== null ? <Icone nome={icone.nome} tamanho={icone.tamanho} cor={corTipo} /> : null}
        <Text style={[styles.tipoTexto, { color: corTipo }]}>
          {invalido?.rotulo ?? tipo?.rotulo ?? (content !== null ? content.content_type : '—')}
        </Text>
      </View>
      {remover !== null ? (
        <Remover
          posicao={song.position}
          inativo={remover.inativo}
          removendo={remover.removendo}
          onPress={remover.onPress}
        />
      ) : null}
    </Pressable>
  )
}

/** Um metadado do cabeçalho: ícone de 20 em `lineInfo` + texto de 13 em `muted`. */
function Metadado({ icone, texto }: { icone: NomeIcone; texto: string }): React.JSX.Element {
  return (
    <View style={styles.metadado}>
      <Icone nome={icone} tamanho={20} cor={dark.lineInfo} />
      <Text style={styles.metadadoTexto} numberOfLines={1}>
        {texto}
      </Text>
    </View>
  )
}

/** Um controle da faixa de 64 dp: ícone acentuado + rótulo, alvo de 48. */
function ControleDaFaixa({
  icone,
  rotulo,
  tinta,
  inativo,
  onPress,
  aoTocarInativo,
  principal,
  testID,
}: {
  icone: NomeIcone
  rotulo: string
  /** §3.1: escrita é `accentInk`; `apagar setlist` é a única exceção. */
  tinta: string
  inativo: boolean
  onPress: () => void
  /**
   * N2-PR5 — o toque num controle INATIVO que tem linha de log própria: o
   * `Reordenar` acima de 100 músicas (A-N2-9, `reason=ceiling`). Sem isto o
   * toque some sem rastro, como nos outros inativos da faixa.
   */
  aoTocarInativo?: () => void
  /**
   * N2-PR6 — o ato principal da tela ganha o contorno em `accentInk` (§3:
   * *"`Adicionar música`, contorno em accentInk porque é o ato principal"*).
   * Só ativo: inativo é `lineInfo`, como os outros (E3).
   */
  principal?: boolean
  testID: string
}): React.JSX.Element {
  return (
    <Pressable
      style={[
        styles.controle,
        principal === true && !inativo ? styles.controlePrincipal : null,
        inativo ? styles.controleInativo : null,
      ]}
      onPress={() => (inativo ? aoTocarInativo?.() : onPress())}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      testID={testID}
    >
      <Icone
        nome={icone}
        tamanho={24}
        cor={inativo ? dark.lineInfo : tinta}
        estado={inativo ? 'inerte' : 'normal'}
      />
      <Text style={[styles.controleTexto, inativo ? styles.controleTextoInativo : null]}>{rotulo}</Text>
    </Pressable>
  )
}

export function IndexScreen({
  setlist,
  contentById,
  syncDone,
  posicaoAtual,
  onVoltar,
  onAbrirPosicao,
  onBuscar,
  edicao = null,
}: IndexScreenProps): React.JSX.Element {
  const songs = [...setlist.setlist_songs].sort((a, b) => a.position - b.position)
  const n = songs.length

  const [folha, setFolha] = useState(false)
  /** N2-PR5 — o modo de reordenar ocupa a tela enquanto dura. */
  const [reordenando, setReordenando] = useState(false)
  /** N2-PR6 — o picker também. */
  const [adicionando, setAdicionando] = useState(false)
  const [dialogo, setDialogo] = useState(false)
  /** O `setlist_songs.id` da linha cuja remoção está em voo, ou `null`. */
  const [removendo, setRemovendo] = useState<string | null>(null)
  /** A falha da última escrita SEM folha (o `remover`) — a linha de aviso. */
  const [falha, setFalha] = useState<Resultado | null>(null)
  /** N2-D22 — 2xx com a releitura falhando. */
  const [salvoNaoRelido, setSalvoNaoRelido] = useState(false)
  const [relendo, setRelendo] = useState(false)
  /** O que `Tentar de novo` repete, quando há o que repetir. */
  const [repetir, setRepetir] = useState<(() => void) | null>(null)

  useEffect(() => {
    log('index open')
  }, [])

  const online = edicao?.online ?? false
  /**
   * **Enquanto uma escrita voa, os outros controles de escrita param** — é a
   * última frase do T2-R11 ("os outros controles de escrita da mesma tela
   * ficam ocupados"), e aqui ela não é folclore: sem isso um segundo toque
   * cairia na trava do módulo, voltaria barrado com `reason=busy` e a tela
   * teria de mostrar a frase da espécie `rede` — *"sem conexão — nada foi
   * salvo"* — que seria **mentira** com a rede de pé.
   *
   * O motivo continua legível sem toque (N2-D23), e é a própria linha em
   * `removendo…`: escrever o mesmo motivo ao lado de cada um dos outros
   * alvos seria o ruído que o congelado recusa em `N2-X-sem-rede` (*"cinco
   * motivos iguais repetidos ao lado de cada alvo seria ruído"*).
   */
  const escrevendo = removendo !== null
  const podeEscrever = edicao !== null && online && !escrevendo
  /** N2-X-100 — acima do teto do contrato, só `Reordenar` inativa (regra 8). */
  const cabeNoTeto = reordenavel(n)

  /** A releitura de trás da tela (regra 3 e N2-D22): o mesmo `reason=reopen`. */
  const recarregar = useCallback(async () => {
    if (edicao === null || relendo) return
    setRelendo(true)
    try {
      const novas = await relerAoAbrir(edicao.estado)
      if (novas !== null) {
        edicao.aoReler(novas, Date.now())
        setSalvoNaoRelido(false)
      }
    } finally {
      setRelendo(false)
    }
  }, [edicao, relendo])

  /**
   * T2-R7 / N2-D28 — remover é **escrita imediata, sem diálogo**, com o ciclo
   * do §7: linha em `removendo…`, releitura depois da confirmação.
   *
   * O 404 tem dois significados e quem os separa é a releitura (o `contexto`
   * do core): se a setlist voltou no conjunto novo, quem sumiu foi a MÚSICA e
   * a tela fica (T2-R10); se não voltou, a tela acaba.
   */
  const remover = useCallback(
    async (song: SetlistSongDTO) => {
      if (edicao === null || !podeEscrever) return
      setRemovendo(song.id)
      setFalha(null)
      setSalvoNaoRelido(false)
      // Nada de `Tentar de novo` herdado da falha anterior: o botão da linha
      // de aviso repete a ÚLTIMA escrita, e a última é esta.
      setRepetir(null)
      try {
        const saida = await escrever(pedidoRemover(setlist.id, song.id), edicao.estado, {
          contexto: 'musica',
        })
        const { especie } = saida.resultado
        if (especie === 'ok') {
          if (saida.setlists !== null) edicao.aoReler(saida.setlists, saida.syncedAtMs)
          return
        }
        if (especie === 'ok-nao-relido') {
          setSalvoNaoRelido(true)
          return
        }
        if (especie === 'sumiu') {
          const aindaExiste = (saida.setlists ?? []).some((s) => s.id === setlist.id)
          if (!aindaExiste) {
            // A lista que a releitura trouxe vai JUNTO: o congelado manda cair
            // em S1 "já relida", e sem isto S1 mostraria a setlist que não
            // existe mais até o próximo sync (div. 270, medido no §4).
            if (saida.setlists !== null) edicao.aoReler(saida.setlists, saida.syncedAtMs)
            edicao.aoSairParaS1('sumiu')
            return
          }
          // A setlist está lá; a música é que não. A lista nova já chegou, e
          // não há o que repetir: o que se queria tirar já não estava lá.
          if (saida.setlists !== null) edicao.aoReler(saida.setlists, saida.syncedAtMs)
          setFalha(saida.resultado)
          return
        }
        setFalha(saida.resultado)
        setRepetir(() => () => void remover(song))
        void recarregar()
      } finally {
        setRemovendo(null)
      }
    },
    [edicao, podeEscrever, setlist.id, recarregar],
  )

  /**
   * §3.3 / §7 — **um aviso por vez; vale o que bloqueia mais**. A ordem é a
   * do congelado lido de cima para baixo: sem rede bloqueia tudo; o limite de
   * taxa bloqueia toda escrita; a falha é de uma escrita só; e o
   * "salvo, não relido" não bloqueia nada — só diz que o que está na tela
   * pode estar velho.
   *
   * O teto de 100 (`N2-X-100`, N2-PR5) entra DEPOIS da falha e ANTES do
   * "salvo, não relido": ele bloqueia um controle só — menos que uma falha,
   * que é de uma escrita que o músico acabou de fazer, e mais que o "salvo",
   * que não bloqueia nada.
   */
  const aviso = useMemo(() => {
    if (edicao === null) return null
    if (!online) {
      return { icone: 'sem-conexao' as NomeIcone, cor: dark.offlineInk, motivo: frase('sem-rede-s2'), acao: undefined }
    }
    if (falha !== null && falha.especie === 'limite') {
      // Âmbar: é "não está pronta", não erro (V1 §6.1). Sem ação — o que
      // falta é tempo, e o prazo já está na frase.
      return { icone: 'ultima-sincronizacao' as NomeIcone, cor: dark.offlineInk, motivo: falha.frase, acao: undefined }
    }
    if (falha !== null) {
      // As três orações da moldura `N2-X-falhou`, nesta ordem: o que não deu
      // certo, o que o servidor disse, e o que a tela mostra agora. A
      // terceira só existe DEPOIS da releitura (regra 3) — antes dela seria
      // uma promessa sobre uma lista que ainda não chegou.
      const oracoes = [frase('falhou-salvar'), falha.frase]
      if (!relendo) oracoes.push(frase('lista-relida'))
      return {
        icone: 'falha' as NomeIcone,
        cor: dark.errorInk,
        motivo: oracoes.join('  ·  '),
        acao:
          repetir === null
            ? undefined
            : {
                rotulo: 'Tentar de novo',
                onPress: repetir,
                inativo: relendo || !podeEscrever,
                motivoInativo: relendo ? frase('relendo') : undefined,
              },
      }
    }
    if (!cabeNoTeto) {
      // A tinta é `muted` e não a `lineInfo` do ícone da moldura: a linha
      // pinta ícone e texto com a mesma cor, e `lineInfo` nunca é texto (§3.3).
      return { icone: 'n-de-musicas' as NomeIcone, cor: dark.muted, motivo: frase('teto-100'), acao: undefined }
    }
    if (salvoNaoRelido) {
      return {
        icone: 'ultima-sincronizacao' as NomeIcone,
        cor: dark.muted,
        motivo: frase('salvo-nao-relido-s2'),
        acao: {
          rotulo: 'Tentar recarregar',
          onPress: () => void recarregar(),
          inativo: relendo,
          motivoInativo: relendo ? frase('relendo') : undefined,
        },
      }
    }
    return null
  }, [edicao, online, falha, cabeNoTeto, salvoNaoRelido, relendo, repetir, podeEscrever, recarregar])

  if (adicionando && edicao !== null) {
    return (
      <Picker
        setlist={setlist}
        estado={edicao.estado}
        online={online}
        aoReler={edicao.aoReler}
        aoFechar={(releituraFalhou) => {
          setAdicionando(false)
          setFalha(null)
          // A legenda de `N2-P-relendo`: *"Sair com o aviso aberto é
          // permitido: S2 relê na volta, e se essa releitura também falhar, o
          // aviso é o mesmo, na linha de 48 de S2."* Sem o aviso, S2 já tem o
          // conjunto da última releitura, e a volta não pede nada (div. 304).
          if (releituraFalhou) {
            setSalvoNaoRelido(true)
            void recarregar()
          }
        }}
        aoSalvoNaoRelido={() => setSalvoNaoRelido(true)}
        aoSumir={(novas, syncedAtMs) => {
          if (novas !== null) edicao.aoReler(novas, syncedAtMs)
          edicao.aoSairParaS1('sumiu')
        }}
      />
    )
  }

  if (reordenando && edicao !== null) {
    return (
      <ModoDeReordenar
        setlist={setlist}
        contentById={contentById}
        estado={edicao.estado}
        online={online}
        aoFechar={() => setReordenando(false)}
        aoSalvar={(novas, syncedAtMs) => {
          setReordenando(false)
          setFalha(null)
          setSalvoNaoRelido(false)
          if (novas !== null) edicao.aoReler(novas, syncedAtMs)
        }}
        aoSalvoNaoRelido={() => {
          setReordenando(false)
          setSalvoNaoRelido(true)
        }}
        aoSumir={(novas, syncedAtMs) => {
          if (novas !== null) edicao.aoReler(novas, syncedAtMs)
          edicao.aoSairParaS1('sumiu')
        }}
        aoRelerAtras={(novas, syncedAtMs) => edicao.aoReler(novas, syncedAtMs)}
      />
    )
  }

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        {/* Sem rótulo textual, o `voltar` precisa do nome acessível — e a §6.4
            dá dois, por origem. `posicaoAtual` é exatamente o discriminante:
            `null` quando o índice foi aberto da S1, preenchido quando veio do
            palco (`navigation.tsx`). */}
        <Pressable
          style={styles.botaoIcone}
          onPress={onVoltar}
          accessibilityRole="button"
          accessibilityLabel={posicaoAtual === null ? 'Voltar para as setlists' : 'Voltar para o palco'}
          testID="voltar"
        >
          <Icone nome="voltar" tamanho={24} cor={dark.text} />
        </Pressable>
        <View style={styles.barraTexto}>
          <Text style={styles.nomeSetlist} numberOfLines={1}>
            {setlist.name}
          </Text>
          {/* O separador "  ·  " do subtítulo vira o ícone, como no cartão do S1 */}
          <View style={styles.meta}>
            <Metadado icone="n-de-musicas" texto={`${n} ${n === 1 ? 'música' : 'músicas'}`} />
            {setlist.performance_date !== null ? (
              <Metadado icone="data" texto={setlist.performance_date} />
            ) : null}
            {setlist.venue !== null && setlist.venue.length > 0 ? (
              <Metadado icone="local" texto={setlist.venue} />
            ) : null}
          </View>
        </View>
        <Pressable style={styles.botaoSecundario} onPress={onBuscar} testID="buscar">
          <Icone nome="buscar-musica" tamanho={24} cor={dark.text} />
          <Text style={styles.botaoSecundarioTexto}>Buscar na biblioteca</Text>
        </Pressable>
      </View>

      {/*
        A FAIXA DE 64 dp (N2-D26) — *"é o que distingue as duas S2"*. Custo
        declarado: 64 dp de lista (551,1 → 487,1).

        O congelado agrupa os quatro atos **por consequência**: à esquerda o
        que acrescenta (`Adicionar música`, PR-6), à direita o que altera a
        setlist inteira. Os dois desta PR são os da direita, e é por isso que
        a faixa já nasce com o grupo encostado nesse lado — quando os outros
        dois chegarem, nenhum destes muda de lugar.
      */}
      {edicao !== null ? (
        <View style={styles.faixa}>
          {/* A esquerda é o que acrescenta e o que muda a ordem: o
              `Adicionar música` (PR-6) entra ANTES do `Reordenar`. */}
          <View style={styles.faixaEsq}>
            {/* N2-D17: acima de 100 ADICIONAR continua — só o `Reordenar`
                olha o teto. */}
            <ControleDaFaixa
              icone="adicionar"
              rotulo="Adicionar música"
              tinta={dark.accentInk}
              inativo={!podeEscrever}
              principal
              onPress={() => setAdicionando(true)}
              testID="picker-abrir"
            />
            <ControleDaFaixa
              icone="alca"
              rotulo="Reordenar"
              tinta={dark.accentInk}
              inativo={!podeEscrever || !cabeNoTeto}
              onPress={() => setReordenando(true)}
              // A-N2-9: só o teto tem linha de log; sem rede e "ocupado"
              // seguem a faixa da PR-4, que não loga toque em inativo.
              aoTocarInativo={podeEscrever && !cabeNoTeto ? barrarPorTeto : undefined}
              testID="reordenar"
            />
          </View>
          <View style={styles.faixaDir}>
            <ControleDaFaixa
              icone="renomear"
              rotulo="Renomear e datar"
              tinta={dark.accentInk}
              inativo={!podeEscrever}
              onPress={() => setFolha(true)}
              testID="setlist-editar"
            />
            {/* §3.1, a exceção declarada: o único ícone de escrita em
                `errorInk` — e mesmo assim exige diálogo (§6). */}
            <ControleDaFaixa
              icone="apagar-setlist"
              rotulo="Apagar setlist"
              tinta={dark.errorInk}
              inativo={!podeEscrever}
              onPress={() => setDialogo(true)}
              testID="setlist-apagar"
            />
          </View>
        </View>
      ) : null}

      {/* §3.3 — a linha de 48 dp, com recuo de 24 em S2 (32 é o de S1). */}
      {aviso !== null ? (
        <LinhaDeAviso
          icone={aviso.icone}
          cor={aviso.cor}
          motivo={aviso.motivo}
          acao={aviso.acao}
          recuo={space.xl}
        />
      ) : null}

      <FlatList
        data={songs}
        keyExtractor={songKey}
        numColumns={2}
        columnWrapperStyle={styles.coluna}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Item
            song={item}
            contentById={contentById}
            syncDone={syncDone}
            atual={item.position === posicaoAtual}
            remover={
              edicao === null
                ? null
                : {
                    inativo: !podeEscrever,
                    removendo: removendo === item.id,
                    onPress: () => void remover(item),
                  }
            }
            onAbrir={() => {
              log(`index jump n=${item.position}`)
              onAbrirPosicao(item.position)
            }}
          />
        )}
      />

      {folha && edicao !== null ? (
        <FolhaDeSetlist
          estado={edicao.estado}
          editando={{
            setlistId: setlist.id,
            // O que o SERVIDOR tem agora é o que a tela mostra — o conjunto
            // desta tela vem da última releitura (T2-R9).
            noServidor: { name: setlist.name, performance_date: setlist.performance_date },
          }}
          aoFechar={() => setFolha(false)}
          aoConcluir={(novas, syncedAtMs) => {
            setFolha(false)
            setFalha(null)
            setSalvoNaoRelido(false)
            if (novas !== null) edicao.aoReler(novas, syncedAtMs)
          }}
          aoSalvoNaoRelido={() => {
            // Em S2 o objeto da frase É o título da tela, então a frase não o
            // nomeia (div. 227, o outro lado): `salvo-nao-relido-s2`.
            setFolha(false)
            setSalvoNaoRelido(true)
          }}
          aoSumir={(novas, syncedAtMs) => {
            setFolha(false)
            if (novas !== null) edicao.aoReler(novas, syncedAtMs)
            edicao.aoSairParaS1('sumiu')
          }}
          aoRelerAtras={(novas, syncedAtMs) => edicao.aoReler(novas, syncedAtMs)}
        />
      ) : null}

      {dialogo && edicao !== null ? (
        <DialogoDeApagar
          setlist={setlist}
          estado={edicao.estado}
          aoManter={() => setDialogo(false)}
          aoApagar={(novas, syncedAtMs) => {
            setDialogo(false)
            if (novas !== null) edicao.aoReler(novas, syncedAtMs)
            edicao.aoSairParaS1(null)
          }}
          aoSumir={(novas, syncedAtMs) => {
            setDialogo(false)
            if (novas !== null) edicao.aoReler(novas, syncedAtMs)
            edicao.aoSairParaS1('sumiu')
          }}
          aoSalvoNaoRelido={() => {
            // A setlist FOI apagada; o que não se conseguiu foi reler a
            // lista. Quem mostra isso é S1, que é onde a lista está — e por
            // isso a tela sai, como sai no sucesso.
            setDialogo(false)
            edicao.aoSairParaS1(null)
          }}
          aoRelerAtras={(novas, syncedAtMs) => edicao.aoReler(novas, syncedAtMs)}
        />
      ) : null}
    </View>
  )
}

/**
 * Medidas das molduras `S2` e `S2-invalidos`. Onde a moldura usa um número
 * fora das escalas do `theme.ts`, entra o degrau mais próximo — a regra da
 * **errata E10** (que a E6 estreou no raio do palco e a V1-PR4 mediu
 * inteira); a tabela desta tela está no anexo da PR. Ficam como literal,
 * declarados, os que não têm degrau nem escala: o corpo de 13 da sublinha, do
 * subtítulo e do rótulo de tipo (§4.4 "chip / status"), o título de item de
 * 20 (§4.4, "bate" com o app), o `minWidth` de 32 do número e o de 56 da
 * coluna de tipo (que é o que alinha os quatro rótulos no mesmo x).
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  // §5.3 — a barra superior de S2/S4 é 88: `bar.top` + 24, não + 16
  barra: {
    height: bar.top + space.xl,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xl,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  // §3 — faixa de 64 dp abaixo da barra de 88 (N2-D26). A lista desconta
  // exatamente isto, e nada mais muda de lugar.
  faixa: {
    height: touch.stage,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  faixaEsq: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  faixaDir: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  controle: {
    height: touch.min,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  // E3: inativo é tinta na moldura, no ícone e no rótulo — sem opacidade.
  controleInativo: { borderColor: dark.lineInfo },
  controlePrincipal: { borderColor: dark.accentInk },
  controleTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  controleTextoInativo: { color: dark.lineInfo },
  // O alvo de 48 do `remover`, no fim da linha — `width`/`height` e não
  // `hitSlop`, pela mesma razão do `botaoIcone` abaixo: o G5 lê BOUNDS.
  remover: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
  removendo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  removendoTexto: { color: dark.accentInk, fontFamily: font.ui, fontSize: 13 },
  barraTexto: { flex: 1, gap: space.xs },
  nomeSetlist: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.display,
    textTransform: 'uppercase',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  metadado: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  metadadoTexto: { color: dark.muted, fontFamily: font.ui, fontSize: 13, flexShrink: 1 },
  lista: { padding: space.xl, gap: space.sm },
  coluna: { gap: space.lg },
  item: {
    flex: 1,
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    // A barra de 4 dp da música atual entra AQUI, e não como largura extra:
    // ela existe em TODO item, na tinta da borda, para que nada mude de
    // largura quando a posição muda — vira acento no item atual e só nele.
    borderLeftWidth: 4,
    borderLeftColor: dark.line,
    borderRadius: radius.control,
  },
  itemAtual: { borderLeftColor: dark.accent, backgroundColor: dark.line },
  // §3.3 — o fundo a 5% separa o inválido do normal sem inventar cor; a
  // altura é a MESMA, 116, porque inválido não é desabilitado (§5.4).
  itemInvalido: { backgroundColor: `${dark.offlineInk}0D` },
  numero: {
    color: dark.muted,
    fontFamily: font.mono,
    fontSize: 20,
    minWidth: 32,
    textAlign: 'right',
  },
  itemTexto: { flex: 1, gap: space.sm },
  titulo: { fontFamily: font.uiBold, fontSize: 20 },
  sublinha: { fontFamily: font.ui, fontSize: 13 },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tipoTexto: { fontFamily: font.ui, fontSize: 13, minWidth: 56 },
  // `width`/`height` e não `hitSlop`: o alvo tem de estar nos BOUNDS do dump,
  // que é o instrumento do G5 e do A14 — `hitSlop` aumenta a área de toque
  // sem aparecer em medição nenhuma (V1-PRECHECK §3.3, T1-R27/R28).
  botaoIcone: {
    width: touch.min,
    height: touch.min,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundario: {
    height: touch.list + 2,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  botaoSecundarioTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
})
