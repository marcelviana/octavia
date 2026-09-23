/**
 * S1 — Setlists, nos seis estados do design congelado (PRD T1-R13, T1-R17,
 * T1-R18; aceites A4, A19), redesenhada pelo DESIGN-V1 na V1-PR4 (as seis
 * molduras `S1a`…`S1f` do `telas.html`, com as erratas da §9 prevalecendo):
 *
 *  a. sincronizando, sem cache → "baixando suas setlists pela primeira vez"
 *  b. normal → lista + indicador garantida · parcial · nunca sincronizada
 *  c. offline com cache → chip "sem conexão · última sincronização há X"
 *  d. offline sem cache → erro acionável com "Tentar novamente"
 *  e. falha de sync com cache → banner de erro, a lista permanece
 *  f. vazia após sync bem-sucedido → "nenhuma setlist" (empty state honesto)
 *
 * Regra do SET-14 que o estado (a) protege: **nunca** mostrar "você não tem
 * setlists" antes do primeiro sync bem-sucedido.
 *
 * O que a V1-PR4 mudou é pintura, não comportamento: os três glifos textuais
 * `✓ ◔ ✗` viram os ícones `garantida` (neutro), `parcial` (arco proporcional a n/m) e
 * `nunca-sincronizada` de 28; o separador " · " dos metadados vira os ícones
 * `data` · `local` · `n-de-musicas` de 20; status, banner e botões passam a
 * ícone + rótulo. Nenhum texto muda, nenhum controle deixa de aceitar toque
 * (as propostas da §8 — desabilitados, ordenação por data — ficam fora).
 * Todo ícone aqui acompanha um rótulo, então nenhum leva `accessibilityLabel`
 * próprio; o SVG não é nó de texto e não entra no `content-desc`.
 *
 * ## O que a N2-PR3 acrescenta (DESIGN-N2 §1 e §3.3)
 *
 * S1 deixa de ser só leitura. Entram três coisas, e nenhuma delas toca o
 * cartão (*"o cartão não ganha nada: renomear, datar e apagar moram em S2 com
 * edição, um nível abaixo"*):
 *
 *  1. **`Nova setlist`** no grupo da direita da barra de 120 dp, à ESQUERDA de
 *     `Buscar música`. A ordem do congelado é *status de sync · escrever ·
 *     ler*: a escrita fica no meio porque o grupo cresce da esquerda para a
 *     direita e `Buscar música` não muda de lugar em relação ao V1 — quem já
 *     usa o app não perde o alvo que decorou. É ícone + rótulo, não um FAB
 *     (*"FAB flutua sobre o conteúdo, e aqui existe barra com folga"*).
 *
 *  2. **S1f muda de texto**: sai a frase que manda ir ao web, entra o mesmo
 *     ato aqui. O alvo central é o único lugar da folha com borda em
 *     `accentInk`, *"porque é o único controle da tela — e é deliberado"*. Os
 *     dois caminhos levam o MESMO `testID`, como a tabela do §7 manda.
 *
 *  3. **A linha de aviso de 48 dp** (§3.3), entre a barra e o primeiro cartão.
 *     Dois estados nesta PR — sem rede e salvo-não-relido —, e os outros três
 *     (falhou, limite, teto de 100) são da S2, na PR-4.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { frase, offlineStatus, type ContentDTO, type OfflineStatus, type SetlistDTO } from '@octavia/core'
import { relerAoAbrir, type EstadoLocal } from '../escrita'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'
import { FolhaDeSetlist } from './FolhaDeCriar'
import { LinhaDeAviso } from './LinhaDeAviso'

export type SyncState =
  | { fase: 'sincronizando' }
  | { fase: 'ok'; syncedAtMs: number }
  | { fase: 'offline'; syncedAtMs: number | null }
  /** `messageKey` vem do `errorFrom` do core — T1-R36: o texto deriva do código. */
  | { fase: 'falha'; syncedAtMs: number | null; messageKey: string }

export interface SetlistsScreenProps {
  setlists: SetlistDTO[]
  contentById: Map<string, ContentDTO>
  /** URLs de arquivo já no disco — de `listFiles()` (N1-PR5). */
  filesPresent: Set<string>
  /** Setlists com "baixar esta setlist" em andamento agora. */
  baixando: Set<string>
  /** `false` enquanto nenhum sync bem-sucedido aconteceu neste aparelho. */
  temCache: boolean
  sync: SyncState
  online: boolean
  onTentarNovamente: () => void
  onAbrirSetlist: (setlistId: string) => void
  /** T1-R15 manual — baixa todos os arquivos desta setlist agora. */
  onBaixarSetlist: (setlistId: string) => void
  /** T1-R22 — busca na biblioteca inteira, sem setlist de contexto. */
  onBuscar: () => void
  /**
   * N2-PR3 — o cache de onde a escrita parte (T2-R9). `null` enquanto não há
   * sessão: sem ele a folha não abre, porque não haveria a que voltar.
   */
  estadoLocal: EstadoLocal | null
  /**
   * A releitura de uma escrita trouxe conjunto novo — quem grava é o `App`.
   * S1 **não** toca o cache: quem o faz é o `escrita.ts`, e esta chamada só
   * avisa a raiz para que a tela mostre o que já foi gravado (T2-R9).
   */
  aoRelerNaEscrita: (setlists: SetlistDTO[], syncedAtMs: number | null) => void
  /**
   * N2-PR4 / T2-R10 — S2 foi abandonada por um 404 e caiu aqui. A lista
   * **já vem relida** (a releitura é do `escrita.ts`, antes de sair de lá);
   * o que falta é dizer por que a tela mudou sozinha. Sem botão: *"não há o
   * que tentar de novo, e a releitura já aconteceu"* (§3 do congelado).
   *
   * Quem guarda este estado é o `navigation.tsx`, e não S2 — quando o aviso
   * aparece, S2 já não existe.
   */
  sumiu?: boolean
  /**
   * **N2-E21** — o 404 chegou e a releitura FALHOU: S1 não tem a lista do
   * servidor. A frase é `sumiu-nao-relido` (as duas primeiras orações de
   * origem) e o botão é `Tentar recarregar`; relida com sucesso, a frase
   * inteira do 404 volta a ser verdade e o botão some.
   */
  sumiuNaoRelido?: boolean
  /**
   * **N2-E23** (div. 333) — o nome da setlist que S2 apagou com 200 e cuja
   * releitura falhou: o cache não mudou e ela pode ainda aparecer na lista.
   */
  apagadaNaoRelida?: string | null
}

/** "há 2 h", "há 15 min", "agora" — o texto do chip de status do design. */
function haQuantoTempo(ms: number | null): string {
  if (ms === null) return 'nunca'
  const min = Math.floor((Date.now() - ms) / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.floor(h / 24)} d`
}

const ROTULO: Record<OfflineStatus['kind'], string> = {
  guaranteed: 'garantida offline',
  partial: 'parcial',
  never: 'nunca sincronizada',
}

/**
 * O indicador de garantia (§6.4 · §6.1): `garantida` em tinta NEUTRA — ícone
 * em `text`, rótulo em `muted` (E12: a moldura S1b pintava em accentInk e
 * estava errada; o acento fica com um significado só, ativo · atual · foco,
 * §3.1); `parcial` e `nunca sincronizada` em `offlineInk` — âmbar é "não
 * está pronta", neutro é "pode ir"; `baixando` no acento, porque é ação em
 * curso, e leva o rótulo "Baixando…" que a §6.4 lhe dá.
 */
function indicadorDe(
  kind: OfflineStatus['kind'],
  baixando: boolean,
): { icone: NomeIcone; cor: string; corRotulo: string; rotulo: string } {
  if (baixando) return { icone: 'baixando', cor: dark.accentInk, corRotulo: dark.accentInk, rotulo: 'Baixando…' }
  if (kind === 'guaranteed') return { icone: 'garantida', cor: dark.text, corRotulo: dark.muted, rotulo: ROTULO.guaranteed }
  if (kind === 'partial') return { icone: 'parcial', cor: dark.offlineInk, corRotulo: dark.offlineInk, rotulo: ROTULO.partial }
  return { icone: 'nunca-sincronizada', cor: dark.offlineInk, corRotulo: dark.offlineInk, rotulo: ROTULO.never }
}

/** Sublinha do indicador — muda com a rede no estado ✗ (proposta 07). */
function sublinha(status: OfflineStatus, online: boolean): string {
  if (status.kind === 'guaranteed') {
    return status.need === 0 ? 'nada a baixar' : 'todos os arquivos neste aparelho'
  }
  if (status.kind === 'partial') return `${status.have} de ${status.need} arquivos baixados`
  return online ? 'nenhum arquivo neste aparelho' : 'sem conexão para baixar'
}

/**
 * T1-R36 — o texto pt-BR deriva do `code` da resposta, nunca do campo `error`
 * (que é inglês e dado de UI). As chaves são exatamente as sete que o
 * `errorFrom` do core emite: nada é inventado aqui, e uma chave nova do core
 * cai no genérico em vez de sumir.
 *
 * Antes da N1-PR8 a tela mostrava só "falha ao sincronizar" para tudo: o
 * `messageKey` era calculado e descartado (achado do aceite, N1-PR7 §3.2 —
 * o A3 passava no comportamento e falhava no que o músico lê).
 */
const TEXTO_DE_ERRO: Record<string, string> = {
  'erro.sem_conexao': 'sem conexão',
  'erro.sessao_invalida': 'sua sessão expirou',
  'erro.servidor_ocupado': 'servidor ocupado · tente em instantes',
  'erro.nao_encontrado': 'não encontrado no servidor',
  'erro.requisicao_invalida': 'o servidor recusou o pedido',
  'erro.falha_do_servidor': 'falha no servidor',
  'erro.desconhecido': 'falha ao sincronizar',
}

function textoDoErro(messageKey: string): string {
  return TEXTO_DE_ERRO[messageKey] ?? TEXTO_DE_ERRO['erro.desconhecido'] ?? 'falha ao sincronizar'
}

/**
 * O chip de status do cabeçalho: ícone de 20 + texto de 13, uma tinta por
 * estado (as molduras): `tentar-novamente` no acento enquanto sincroniza,
 * `ultima-sincronizacao` em `muted` quando há dado, `sem-conexao` em
 * `offlineInk` sem rede — e aí a hora da última sincronização vai em `muted`,
 * como `complemento`, no MESMO nó de texto (a string não muda). A falha sem
 * cache não tem moldura: leva `falha` em `errorInk`, por paralelo com o S1d.
 */
function chipDoStatus(sync: SyncState): { icone: NomeIcone; cor: string; texto: string; complemento?: string } {
  switch (sync.fase) {
    case 'sincronizando':
      return { icone: 'tentar-novamente', cor: dark.accentInk, texto: 'sincronizando…' }
    case 'ok':
      return { icone: 'ultima-sincronizacao', cor: dark.muted, texto: `sincronizado ${haQuantoTempo(sync.syncedAtMs)}` }
    case 'offline':
      return sync.syncedAtMs === null
        ? { icone: 'sem-conexao', cor: dark.offlineInk, texto: 'sem conexão' }
        : {
            icone: 'sem-conexao',
            cor: dark.offlineInk,
            texto: 'sem conexão',
            complemento: ` · última sincronização ${haQuantoTempo(sync.syncedAtMs)}`,
          }
    case 'falha':
      return sync.syncedAtMs === null
        ? { icone: 'falha', cor: dark.errorInk, texto: textoDoErro(sync.messageKey) }
        : { icone: 'ultima-sincronizacao', cor: dark.muted, texto: 'mostrando dados salvos' }
  }
}

/**
 * `Nova setlist` — o MESMO ato nos dois lugares, com o MESMO `testID` (a
 * tabela do §7: *"botão da barra e do estado vazio (mesmo id nos dois)"*).
 *
 * `acentuado` é a única diferença de pintura: em S1f o alvo central ganha
 * borda em `accentInk` porque é o único controle da tela, e o congelado diz
 * que é *"o único lugar da folha onde a borda é acentuada, e é deliberado"*.
 *
 * Inativo (sem rede) é a §3.2: tinta `lineInfo`, traço 1,25 e o desenho
 * AMPUTADO — a cruz perde a haste vertical e fica só o traço horizontal. O
 * motivo não vai aqui: vai na linha de aviso de 48 dp, uma vez (N2-D23).
 */
function BotaoNovaSetlist({
  rotulo,
  inativo,
  acentuado = false,
  onPress,
}: {
  rotulo: string
  inativo: boolean
  acentuado?: boolean
  onPress: () => void
}): React.JSX.Element {
  const tinta = inativo ? dark.lineInfo : dark.text
  return (
    <Pressable
      style={[
        styles.botaoSecundario,
        acentuado ? styles.botaoAcentuado : null,
        inativo ? styles.botaoInativo : null,
      ]}
      onPress={() => (inativo ? undefined : onPress())}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      testID="criar-setlist"
    >
      {/* §3.1 da folha: escrita é ícone em `accentInk`, rótulo em `text`. */}
      <Icone
        nome="nova-setlist"
        tamanho={24}
        cor={inativo ? dark.lineInfo : dark.accentInk}
        estado={inativo ? 'inerte' : 'normal'}
      />
      <Text style={[styles.botaoSecundarioTexto, { color: tinta }]}>{rotulo}</Text>
    </Pressable>
  )
}

/** Um metadado do cartão: ícone de 20 em `lineInfo` + texto de 14 em `muted`. */
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

function CartaoSetlist({
  setlist,
  status,
  online,
  baixando,
  compacto,
  onAbrir,
  onBaixar,
}: {
  setlist: SetlistDTO
  status: OfflineStatus
  online: boolean
  baixando: boolean
  /** §5.4 — o cartão do S1e, com o banner em cima, é 112; os outros, 132. */
  compacto: boolean
  onAbrir: () => void
  onBaixar: () => void
}): React.JSX.Element {
  const indicador = indicadorDe(status.kind, baixando)
  // "Baixar esta setlist" só faz sentido sem data de show (o prefetch de 7
  // dias cobre as datadas — T1-R15). Offline ele fica desabilitado por
  // definição (proposta 07); com tudo no disco, não há o que baixar.
  const mostrarBaixar = setlist.performance_date === null
  const podeBaixar = online && !baixando && status.have < status.need
  // E3 (decisão do Marcel na V1-PR4): desabilitado é tinta `lineInfo` na
  // moldura, no ícone e no rótulo — sem opacidade. O inativo carrega
  // informação e deve os 3:1 (§3.3, item 3); opacidade não os garante.
  const tintaBaixar = podeBaixar ? dark.muted : dark.lineInfo
  const n = setlist.setlist_songs.length

  return (
    <Pressable
      style={[styles.cartao, compacto ? styles.cartaoCompacto : null]}
      onPress={onAbrir}
      accessibilityRole="button"
      // O alvo principal do S1 não tinha identidade: invisível para o G2 e
      // para o G6 (V1-PRECHECK div. 10). O recorte de 8 é o mesmo do
      // `baixar-<id8>` abaixo, para que os dois se correspondam no dump.
      testID={`setlist-${setlist.id.slice(0, 8)}`}
    >
      <View style={styles.cartaoEsq}>
        <Text style={styles.nome} numberOfLines={1}>
          {setlist.name}
        </Text>
        {/* data · local · N músicas — o separador do design agora é o ícone; "sem data" continua escrito */}
        <View style={styles.meta}>
          <Metadado icone="data" texto={setlist.performance_date ?? 'sem data'} />
          {setlist.venue !== null && setlist.venue.length > 0 ? <Metadado icone="local" texto={setlist.venue} /> : null}
          <Metadado icone="n-de-musicas" texto={`${n} ${n === 1 ? 'música' : 'músicas'}`} />
        </View>
      </View>

      <View style={styles.cartaoDir}>
        {mostrarBaixar ? (
          <Pressable
            style={[styles.botaoSecundario, podeBaixar ? null : styles.botaoInativo]}
            onPress={() => (podeBaixar ? onBaixar() : undefined)}
            accessibilityRole="button"
            accessibilityState={{ disabled: !podeBaixar }}
            testID={`baixar-${setlist.id.slice(0, 8)}`}
          >
            <Icone nome={baixando ? 'baixando-acao' : 'baixar-setlist'} tamanho={24} cor={tintaBaixar} />
            <Text style={[styles.baixarTexto, { color: tintaBaixar }]}>{baixando ? 'Baixando…' : 'Baixar esta setlist'}</Text>
          </Pressable>
        ) : null}

        <View style={styles.indicador}>
          <Icone
            nome={indicador.icone}
            tamanho={28}
            cor={indicador.cor}
            fracao={status.kind === 'partial' && status.need > 0 ? status.have / status.need : undefined}
          />
          <View style={styles.indicadorTexto}>
            <Text style={[styles.indicadorRotulo, { color: indicador.corRotulo }]}>{indicador.rotulo}</Text>
            <Text style={styles.indicadorSub}>{sublinha(status, online)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export function SetlistsScreen({
  setlists,
  contentById,
  filesPresent,
  baixando,
  temCache,
  sync,
  online,
  onTentarNovamente,
  onAbrirSetlist,
  onBaixarSetlist,
  onBuscar,
  estadoLocal,
  aoRelerNaEscrita,
  sumiu = false,
  sumiuNaoRelido = false,
  apagadaNaoRelida = null,
}: SetlistsScreenProps): React.JSX.Element {
  const [folhaAberta, setFolhaAberta] = useState(false)
  /** N2-D22 — o nome da setlist que foi criada e que a lista não releu. */
  const [salvoNaoRelido, setSalvoNaoRelido] = useState<string | null>(null)
  const [recarregando, setRecarregando] = useState(false)
  /** N2-E21 — o `Tentar recarregar` do 404 sem lista já trouxe a lista. */
  const [relidaDepoisDoSumico, setRelidaDepoisDoSumico] = useState(false)
  useEffect(() => setRelidaDepoisDoSumico(false), [sumiuNaoRelido])
  /** N2-E23 — o `Tentar recarregar` do apagar sem releitura já trouxe a lista. */
  const [relidaDepoisDoApagar, setRelidaDepoisDoApagar] = useState(false)
  useEffect(() => setRelidaDepoisDoApagar(false), [apagadaNaoRelida])

  /**
   * §3.3 — **só um aviso por vez; se dois caberiam, vale o que bloqueia
   * mais**. O congelado nomeia justamente este par: *"se 'salvo; não foi
   * possível recarregar' e 'sem conexão' coincidirem, vale a de rede"*. A
   * regra mora aqui, e não no componente: a `LinhaDeAviso` desenha UM aviso e
   * não sabe da existência de outro.
   */
  const recarregar = useCallback(async () => {
    if (estadoLocal === null || recarregando) return
    setRecarregando(true)
    try {
      const novas = await relerAoAbrir(estadoLocal)
      if (novas !== null) {
        aoRelerNaEscrita(novas, Date.now())
        setSalvoNaoRelido(null)
        setRelidaDepoisDoSumico(true)
        setRelidaDepoisDoApagar(true)
      }
    } finally {
      setRecarregando(false)
    }
  }, [estadoLocal, recarregando, aoRelerNaEscrita])

  const status = useMemo(
    () => new Map(setlists.map((s) => [s.id, offlineStatus(s, contentById, filesPresent)])),
    [setlists, contentById, filesPresent],
  )

  const semCache = !temCache
  const primeiraSincronizacao = semCache && sync.fase === 'sincronizando'
  const offlineSemCache = semCache && sync.fase === 'offline'
  const falhaSemCache = semCache && sync.fase === 'falha'
  const vaziaAposSync = temCache && setlists.length === 0
  const comBanner = sync.fase === 'falha' && temCache
  const chip = chipDoStatus(sync)

  /**
   * T2-R12 — sem rede não há escrita, e o motivo fica escrito. Sem
   * `estadoLocal` também não há: a folha não teria cache a que voltar.
   */
  const podeCriar = online && estadoLocal !== null

  /**
   * §3.3 — **um aviso por vez; vale o que bloqueia mais**. A ordem, e o
   * porquê de cada degrau:
   *
   *  1. **sem rede** — o congelado nomeia este par ("se 'salvo; não foi
   *     possível recarregar' e 'sem conexão' coincidirem, vale a de rede");
   *  2. **a setlist sumiu** (T2-R10) — a tela mudou sozinha debaixo do
   *     músico, e essa é a única coisa nesta lista que ele ainda não sabe;
   *  3. **salvo, não relido** — fala do que ELE acabou de fazer, e o dado na
   *     tela pode estar velho, o que é menos urgente do que uma tela trocada.
   */
  const aviso = !online
    ? {
        icone: 'sem-conexao' as NomeIcone,
        cor: dark.offlineInk,
        motivo: frase('sem-rede-s1'),
        acao: undefined,
      }
    : sumiu && sumiuNaoRelido && !relidaDepoisDoSumico
      ? {
          icone: 'falha' as NomeIcone,
          cor: dark.muted,
          motivo: frase('sumiu-nao-relido'),
          acao: {
            rotulo: 'Tentar recarregar',
            onPress: () => void recarregar(),
            inativo: recarregando,
            motivoInativo: recarregando ? frase('relendo') : undefined,
          },
        }
    : sumiu
      ? {
          icone: 'falha' as NomeIcone,
          cor: dark.muted,
          motivo: frase('sumiu-declarado'),
          acao: undefined,
        }
    : apagadaNaoRelida !== null && !relidaDepoisDoApagar
      ? {
          icone: 'ultima-sincronizacao' as NomeIcone,
          cor: dark.muted,
          // N2-E23 — espelho do "foi criada" abaixo (div. 227): o core guarda
          // a metade fixa, S1 monta `<nome> foi apagada. ` na frente.
          motivo: `${apagadaNaoRelida} foi apagada. ${frase('apagada-nao-relida')}`,
          acao: {
            rotulo: 'Tentar recarregar',
            onPress: () => void recarregar(),
            inativo: recarregando,
            motivoInativo: recarregando ? frase('relendo') : undefined,
          },
        }
    : salvoNaoRelido !== null
      ? {
          icone: 'ultima-sincronizacao' as NomeIcone,
          cor: dark.muted,
          // Div. 227 — o core guarda a segunda oração, verbatim; S1 monta
          // `<nome> foi criada. ` na frente, porque nome de setlist é DADO e
          // não texto, e em S1 o objeto da frase não está em lugar nenhum da
          // tela (em S2 ele é o título).
          motivo: `${salvoNaoRelido} foi criada. ${frase('salvo-nao-relido-s1')}`,
          acao: {
            rotulo: 'Tentar recarregar',
            onPress: () => void recarregar(),
            inativo: recarregando,
            motivoInativo: recarregando ? frase('relendo') : undefined,
          },
        }
      : null

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <Text style={styles.titulo}>SETLISTS</Text>
        <View style={styles.chip}>
          <Icone nome={chip.icone} tamanho={20} cor={chip.cor} />
          <Text style={[styles.status, { color: chip.cor }]}>
            {chip.texto}
            {chip.complemento !== undefined ? <Text style={styles.statusComplemento}>{chip.complemento}</Text> : null}
          </Text>
        </View>
        {/* Ordem do congelado: status de sync · ESCREVER · ler. */}
        <BotaoNovaSetlist rotulo="Nova setlist" inativo={!podeCriar} onPress={() => setFolhaAberta(true)} />
        <Pressable style={styles.botaoSecundario} onPress={onBuscar} testID="buscar">
          <Icone nome="buscar-musica" tamanho={24} cor={dark.text} />
          <Text style={styles.botaoSecundarioTexto}>Buscar música</Text>
        </Pressable>
      </View>

      {aviso !== null ? (
        <LinhaDeAviso
          icone={aviso.icone}
          cor={aviso.cor}
          motivo={aviso.motivo}
          acao={aviso.acao}
          recuo={space.xxl}
        />
      ) : null}

      {/* (e) falha com cache: banner, e a lista continua embaixo. A causa em
          errorInk; a idade do dado em muted, porque não é erro, é fato. */}
      {comBanner && sync.fase === 'falha' ? (
        <View style={styles.banner}>
          <View style={styles.bannerEsq}>
            <Icone nome="falha" tamanho={24} cor={dark.errorInk} />
            <Text style={styles.bannerTexto} numberOfLines={2}>
              {textoDoErro(sync.messageKey)}
              <Text style={styles.bannerIdade}>{` · mostrando dados de ${haQuantoTempo(sync.syncedAtMs)}`}</Text>
            </Text>
          </View>
          <Pressable
            style={styles.bannerAlvo}
            onPress={onTentarNovamente}
            accessibilityRole="button"
            testID="tentar-banner"
          >
            <Icone nome="tentar-novamente" tamanho={24} cor={dark.text} />
            <Text style={styles.bannerAcao}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {primeiraSincronizacao ? (
        // (a) nunca "você não tem setlists" antes do primeiro 200 (SET-14)
        <View style={[styles.centro, styles.centroSincronizando]} testID="s1a">
          <Icone nome="baixando" tamanho={28} cor={dark.accentInk} />
          <Text style={styles.centroApoio}>baixando suas setlists pela primeira vez</Text>
        </View>
      ) : offlineSemCache || falhaSemCache ? (
        // (d) erro acionável — nunca o empty state. O ícone repete o do chip
        // de propósito (a moldura): o chip diz o estado da rede, o bloco diz
        // a consequência para os dados.
        <View style={styles.centro} testID="s1d">
          <Icone
            nome={offlineSemCache ? 'sem-conexao' : 'falha'}
            tamanho={28}
            cor={offlineSemCache ? dark.offlineInk : dark.errorInk}
          />
          <Text style={styles.centroTitulo}>
            {offlineSemCache ? 'sem conexão' : textoDoErro(sync.fase === 'falha' ? sync.messageKey : 'erro.desconhecido')}
          </Text>
          <Text style={styles.centroApoio}>
            Nenhuma setlist foi salva neste aparelho ainda. Conecte-se à internet uma vez para
            baixar tudo — depois funciona offline.
          </Text>
          <Pressable style={styles.botaoPrimario} onPress={onTentarNovamente} testID="tentar">
            <Icone nome="tentar-novamente" tamanho={24} cor={dark.bg} />
            <Text style={styles.botaoPrimarioTexto}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : vaziaAposSync ? (
        // (f) empty state honesto: só depois de um sync bem-sucedido. Vazio
        // por sucesso, não por falha: sem tinta de alerta, sem botão, e a
        // segunda casa da marca (§8.4, a única proposta aplicada): só o laço
        // do oito do PNG oficial, recortado a 60 dp, sem wordmark.
        <View style={styles.centro} testID="s1f">
          <View style={styles.marca} accessibilityRole="image" accessibilityLabel="Octavia">
            <Image
              source={require('../../assets/logo-octavia-dark.png')}
              style={styles.marcaImagem}
              resizeMode="stretch"
            />
          </View>
          {/* Moldura `N2-S1f-criar`: sai a frase que manda ir ao web, entra o
              mesmo ato, aqui. O título em caixa alta do V1 sai com ela — o
              estado vazio passa a ser duas orações e um botão. */}
          <Text style={styles.centroApoio}>{frase('primeira-setlist')}</Text>
          <BotaoNovaSetlist
            rotulo="Criar a primeira setlist"
            inativo={!podeCriar}
            acentuado
            onPress={() => setFolhaAberta(true)}
          />
        </View>
      ) : (
        // (b) normal e (c) offline com cache — a mesma lista; o que muda é o chip
        <FlatList
          data={setlists}
          keyExtractor={(s) => s.id}
          contentContainerStyle={[styles.lista, comBanner ? styles.listaComBanner : null]}
          renderItem={({ item }) => (
            <CartaoSetlist
              setlist={item}
              status={status.get(item.id) ?? { kind: 'never', have: 0, need: 0 }}
              online={online}
              baixando={baixando.has(item.id)}
              compacto={comBanner}
              onAbrir={() => onAbrirSetlist(item.id)}
              onBaixar={() => onBaixarSetlist(item.id)}
            />
          )}
        />
      )}

      {folhaAberta && estadoLocal !== null ? (
        <FolhaDeSetlist
          estado={estadoLocal}
          aoFechar={() => setFolhaAberta(false)}
          aoConcluir={(novas, syncedAtMs) => {
            // Congelado (`N2-F-salvando`): "Confirmado o servidor, a folha
            // fecha e S1 relê a lista." A releitura já aconteceu no core — o
            // que chega aqui é o conjunto dela.
            setFolhaAberta(false)
            setSalvoNaoRelido(null)
            if (novas !== null) aoRelerNaEscrita(novas, syncedAtMs)
          }}
          aoSalvoNaoRelido={(nome) => {
            setFolhaAberta(false)
            setSalvoNaoRelido(nome)
          }}
          aoRelerAtras={(novas, syncedAtMs) => aoRelerNaEscrita(novas, syncedAtMs)}
        />
      ) : null}
    </View>
  )
}

/**
 * Medidas das molduras. Onde a moldura usa um número fora das escalas do
 * `theme.ts`, entra o degrau mais próximo (o mesmo critério da E6: a escala
 * declarada vence o número desenhado) — a lista está no anexo da PR. Ficam
 * como literal, declarados, os que não têm degrau nem escala: a barra do S1
 * (120, §5.3 "minha"), o cartão (132 / 112, §5.4), o banner (66), o
 * indicador (230) e o corpo de 13 do chip e da sublinha (§4.3).
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  barra: {
    height: 120,
    paddingHorizontal: space.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xl,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  titulo: {
    flex: 1,
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.titleSmall,
    letterSpacing: size.titleSmall * tracking.displayWide,
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  status: { fontFamily: font.ui, fontSize: 13 },
  statusComplemento: { color: dark.muted },
  lista: { padding: space.xxl, gap: space.md },
  listaComBanner: { paddingTop: space.md },
  cartao: {
    minHeight: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  cartaoCompacto: { minHeight: 112 },
  cartaoEsq: { flex: 1, gap: space.md },
  nome: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.label,
    textTransform: 'uppercase',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  metadado: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  metadadoTexto: { color: dark.muted, fontFamily: font.ui, fontSize: size.label, flexShrink: 1 },
  cartaoDir: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  indicador: { flexDirection: 'row', alignItems: 'center', gap: space.md, width: 230 },
  indicadorTexto: { flex: 1, gap: space.xs },
  indicadorRotulo: { fontFamily: font.ui, fontSize: size.label },
  indicadorSub: { color: dark.muted, fontFamily: font.ui, fontSize: 13, lineHeight: 13 * 1.35 },
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
  baixarTexto: { fontFamily: font.ui, fontSize: size.bodySmall },
  botaoInativo: { borderColor: dark.lineInfo },
  // §3.1, exceção declarada: o ÚNICO lugar da folha com borda em `accentInk`
  // — o alvo central de S1f, porque é o único controle da tela.
  botaoAcentuado: { borderColor: dark.accentInk, marginTop: space.sm },
  banner: {
    marginTop: space.xl,
    marginHorizontal: space.xxl,
    minHeight: 66,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    borderWidth: bar.hairline,
    borderColor: dark.errorInk,
    borderRadius: radius.control,
    backgroundColor: `${dark.errorInk}12`,
  },
  bannerEsq: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  bannerTexto: { color: dark.errorInk, fontFamily: font.ui, fontSize: size.bodySmall, flexShrink: 1 },
  bannerIdade: { color: dark.muted },
  // 130,7 × 22,7 dp no dump da V1-PRECHECK: o "Tentar novamente" do banner era
  // o alvo mais baixo do app (corrigido na V1-PR1 para 48). Agora com contorno
  // próprio e o `tentar-novamente` de 24, como na moldura S1e.
  bannerAlvo: {
    minHeight: touch.min,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  bannerAcao: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xxxl,
  },
  centroSincronizando: { gap: space.xl },
  centroTitulo: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.display,
    textTransform: 'uppercase',
  },
  centroApoio: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: size.bodySmall,
    lineHeight: size.bodySmall * 1.5,
    textAlign: 'center',
    maxWidth: 560,
  },
  botaoPrimario: {
    marginTop: space.sm,
    height: touch.list,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.control,
    backgroundColor: dark.text,
  },
  botaoPrimarioTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.body },
  // §8.4: o laço a 60 dp — a moldura recorta o PNG de 952 × 614 a um quarto
  // (238 × 154) e mostra a janela [88…148] × [6…96]. Medido no arquivo: é o
  // oito com o ponto, sem o wordmark.
  marca: { width: 60, height: 90, overflow: 'hidden' },
  marcaImagem: { position: 'absolute', left: -88, top: -6, width: 238, height: 154 },
})
