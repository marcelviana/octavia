/**
 * S1 — Setlists, nos seis estados do design congelado (PRD T1-R13, T1-R17,
 * T1-R18; aceites A4, A19):
 *
 *  a. sincronizando, sem cache → "baixando suas setlists pela primeira vez"
 *  b. normal → lista + indicador ✓ ◔ ✗
 *  c. offline com cache → chip "sem conexão · última sincronização há X"
 *  d. offline sem cache → erro acionável com "Tentar novamente"
 *  e. falha de sync com cache → banner vermelho, a lista permanece
 *  f. vazia após sync bem-sucedido → "nenhuma setlist" (empty state honesto)
 *
 * Regra do SET-14 que o estado (a) protege: **nunca** mostrar "você não tem
 * setlists" antes do primeiro sync bem-sucedido.
 */
import { useMemo } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { offlineStatus, type ContentDTO, type OfflineStatus, type SetlistDTO } from '@octavia/core'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'

export type SyncState =
  | { fase: 'sincronizando' }
  | { fase: 'ok'; syncedAtMs: number }
  | { fase: 'offline'; syncedAtMs: number | null }
  | { fase: 'falha'; syncedAtMs: number | null }

export interface SetlistsScreenProps {
  setlists: SetlistDTO[]
  contentById: Map<string, ContentDTO>
  /** URLs de arquivo já baixadas — vazio até a N1-PR5 (downloads). */
  filesPresent: Set<string>
  /** `false` enquanto nenhum sync bem-sucedido aconteceu neste aparelho. */
  temCache: boolean
  sync: SyncState
  online: boolean
  onTentarNovamente: () => void
  onAbrirSetlist: (setlistId: string) => void
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

/** Linha de metadados: data · local · N músicas (o " · " é do design). */
function metadados(setlist: SetlistDTO): string {
  const partes: string[] = [setlist.performance_date ?? 'sem data']
  if (setlist.venue !== null && setlist.venue.length > 0) partes.push(setlist.venue)
  const n = setlist.setlist_songs.length
  partes.push(`${n} ${n === 1 ? 'música' : 'músicas'}`)
  return partes.join('  ·  ')
}

const GLIFO: Record<OfflineStatus['kind'], string> = {
  guaranteed: '✓',
  partial: '◔',
  never: '✗',
}

const ROTULO: Record<OfflineStatus['kind'], string> = {
  guaranteed: 'garantida offline',
  partial: 'parcial',
  never: 'nunca sincronizada',
}

function corDe(kind: OfflineStatus['kind']): string {
  if (kind === 'guaranteed') return dark.accent
  if (kind === 'partial') return dark.offline
  return dark.muted
}

/** Sublinha do indicador — muda com a rede no estado ✗ (proposta 07). */
function sublinha(status: OfflineStatus, online: boolean): string {
  if (status.kind === 'guaranteed') {
    return status.need === 0 ? 'nada a baixar' : 'todos os arquivos neste aparelho'
  }
  if (status.kind === 'partial') return `${status.have} de ${status.need} arquivos baixados`
  return online ? 'nenhum arquivo neste aparelho' : 'sem conexão para baixar'
}

function textoDoStatus(sync: SyncState): string {
  switch (sync.fase) {
    case 'sincronizando':
      return 'sincronizando…'
    case 'ok':
      return `sincronizado ${haQuantoTempo(sync.syncedAtMs)}`
    case 'offline':
      return sync.syncedAtMs === null
        ? 'sem conexão'
        : `sem conexão · última sincronização ${haQuantoTempo(sync.syncedAtMs)}`
    case 'falha':
      return sync.syncedAtMs === null ? 'falha ao sincronizar' : 'mostrando dados salvos'
  }
}

function CartaoSetlist({
  setlist,
  status,
  online,
  onAbrir,
}: {
  setlist: SetlistDTO
  status: OfflineStatus
  online: boolean
  onAbrir: () => void
}): React.JSX.Element {
  const cor = corDe(status.kind)
  // "Baixar esta setlist" só faz sentido sem data de show (o prefetch de 7
  // dias cobre as datadas — T1-R15). A AÇÃO chega na N1-PR5: aqui o botão já
  // nasce desabilitado, e offline ele fica desabilitado por definição (07).
  const mostrarBaixar = setlist.performance_date === null

  return (
    <Pressable style={styles.cartao} onPress={onAbrir} accessibilityRole="button">
      <View style={styles.cartaoEsq}>
        <Text style={styles.nome} numberOfLines={1}>
          {setlist.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metadados(setlist)}
        </Text>
      </View>

      <View style={styles.cartaoDir}>
        {mostrarBaixar ? (
          <View style={[styles.botaoSecundario, styles.botaoInativo]}>
            <Text style={styles.botaoSecundarioTexto}>Baixar esta setlist</Text>
          </View>
        ) : null}

        <View style={styles.indicador}>
          <View style={[styles.badge, { borderColor: cor }]}>
            <Text style={[styles.glifo, { color: cor }]}>{GLIFO[status.kind]}</Text>
          </View>
          <View style={styles.indicadorTexto}>
            <Text style={[styles.indicadorRotulo, { color: cor }]}>{ROTULO[status.kind]}</Text>
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
  temCache,
  sync,
  online,
  onTentarNovamente,
  onAbrirSetlist,
}: SetlistsScreenProps): React.JSX.Element {
  const status = useMemo(
    () => new Map(setlists.map((s) => [s.id, offlineStatus(s, contentById, filesPresent)])),
    [setlists, contentById, filesPresent],
  )

  const semCache = !temCache
  const primeiraSincronizacao = semCache && sync.fase === 'sincronizando'
  const offlineSemCache = semCache && sync.fase === 'offline'
  const falhaSemCache = semCache && sync.fase === 'falha'
  const vaziaAposSync = temCache && setlists.length === 0

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <Text style={styles.titulo}>SETLISTS</Text>
        <Text style={styles.status}>{textoDoStatus(sync)}</Text>
        {/* A busca é a N1-PR6; o botão do design já ocupa o lugar, inativo. */}
        <View style={[styles.botaoSecundario, styles.botaoInativo]}>
          <Text style={styles.botaoSecundarioTexto}>Buscar música</Text>
        </View>
      </View>

      {/* (e) falha com cache: banner, e a lista continua embaixo */}
      {sync.fase === 'falha' && temCache ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTexto}>
            falha ao sincronizar · mostrando dados de {haQuantoTempo(sync.syncedAtMs)}
          </Text>
          <Pressable onPress={onTentarNovamente} accessibilityRole="button" testID="tentar-banner">
            <Text style={styles.bannerAcao}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : null}

      {primeiraSincronizacao ? (
        // (a) nunca "você não tem setlists" antes do primeiro 200 (SET-14)
        <View style={styles.centro} testID="s1a">
          <Text style={styles.centroApoio}>baixando suas setlists pela primeira vez</Text>
        </View>
      ) : offlineSemCache || falhaSemCache ? (
        // (d) erro acionável — nunca o empty state
        <View style={styles.centro} testID="s1d">
          <Text style={styles.centroTitulo}>
            {offlineSemCache ? 'sem conexão' : 'falha ao sincronizar'}
          </Text>
          <Text style={styles.centroApoio}>
            Nenhuma setlist foi salva neste aparelho ainda. Conecte-se à internet uma vez para
            baixar tudo — depois funciona offline.
          </Text>
          <Pressable style={styles.botaoPrimario} onPress={onTentarNovamente} testID="tentar">
            <Text style={styles.botaoPrimarioTexto}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : vaziaAposSync ? (
        // (f) empty state honesto: só depois de um sync bem-sucedido
        <View style={styles.centro} testID="s1f">
          <Text style={styles.centroTitulo}>nenhuma setlist</Text>
          <Text style={styles.centroApoio}>
            Sua conta não tem setlists. Crie na versão web — elas aparecem aqui na próxima
            sincronização.
          </Text>
        </View>
      ) : (
        // (b) normal e (c) offline com cache — a mesma lista; o que muda é o chip
        <FlatList
          data={setlists}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <CartaoSetlist
              setlist={item}
              status={status.get(item.id) ?? { kind: 'never', have: 0, need: 0 }}
              online={online}
              onAbrir={() => onAbrirSetlist(item.id)}
            />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  barra: {
    height: bar.top + space.xxl,
    paddingHorizontal: space.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  titulo: {
    flex: 1,
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.titleLarge,
    letterSpacing: size.titleLarge * tracking.displayWide,
  },
  status: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  lista: { padding: space.xxl, gap: space.md },
  cartao: {
    minHeight: 138,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xxl,
    paddingVertical: space.xl,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  cartaoEsq: { flex: 1, gap: space.md },
  cartaoDir: { flexDirection: 'row', alignItems: 'center', gap: space.xl },
  nome: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: 24,
    letterSpacing: 24 * tracking.display,
    textTransform: 'uppercase',
  },
  meta: { color: dark.muted, fontFamily: font.ui, fontSize: size.body },
  indicador: { flexDirection: 'row', alignItems: 'center', gap: space.md, width: 220 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glifo: { fontFamily: font.monoBold, fontSize: 20 },
  indicadorTexto: { flex: 1, gap: space.xs },
  indicadorRotulo: { fontFamily: font.uiBold, fontSize: size.bodySmall },
  indicadorSub: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  botaoSecundario: {
    height: touch.list + 2,
    paddingHorizontal: space.lg,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundarioTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  botaoInativo: { opacity: 0.4 },
  banner: {
    margin: space.xxl,
    marginBottom: 0,
    minHeight: touch.list + 2,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    borderWidth: bar.hairline,
    borderColor: dark.error,
    borderRadius: radius.control,
  },
  bannerTexto: { color: dark.error, fontFamily: font.uiBold, fontSize: size.bodySmall },
  bannerAcao: { color: dark.text, fontFamily: font.uiBold, fontSize: size.bodySmall },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xxxl,
  },
  centroTitulo: { color: dark.text, fontFamily: font.uiBold, fontSize: size.titleLarge },
  centroApoio: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: size.body,
    textAlign: 'center',
    maxWidth: 560,
  },
  botaoPrimario: {
    marginTop: space.sm,
    height: touch.list,
    paddingHorizontal: space.xxl,
    borderRadius: radius.control,
    backgroundColor: dark.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPrimarioTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.button },
})
