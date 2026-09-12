/**
 * S2 — Índice da setlist (PRD T1-R11, T1-R24, T1-R28, T1-R35; aceites A8,
 * A12, A14, A18).
 *
 * Grade de duas colunas como o design: número (mono), título, "artista ·
 * nota" e o chip do tipo. A música **atual** leva uma barra de 4 dp no acento
 * (não um bloco cheio — correção 4 do revisor ao design). Um tap abre o palco
 * naquela posição: com o índice a 1 tap do palco, o salto 1 → 47 custa 3 taps
 * no total (T1-R28).
 *
 * A identidade da linha é `setlist_songs.id` (T1-R24): um bis aparece duas
 * vezes, em posições distintas, cada uma com sua nota.
 */
import { useEffect } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  labelFor,
  resolveSong,
  songKey,
  type ContentDTO,
  type SetlistDTO,
  type SetlistSongDTO,
  type SongLabel,
} from '@octavia/core'
import { log } from '../log'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'

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
}

/** Rótulo do chip por tipo, na grafia do design. */
const CHIP: Record<string, string> = {
  Lyrics: 'Letra',
  Chords: 'Cifra',
  Tab: 'Tab',
  Sheet: 'Partitura',
}

/** Segunda linha do item: o que o design mostra sob o título. */
function sublinha(song: SetlistSongDTO, titulo: { artist: string | null }, rotulo: SongLabel): string {
  const partes: string[] = []
  if (rotulo === 'loading') partes.push('carregando…')
  if (rotulo === 'unavailable') partes.push('indisponível')
  if (rotulo === 'invalid') partes.push('sem conteúdo')
  if (titulo.artist !== null && titulo.artist.length > 0) partes.push(titulo.artist)
  if (song.notes !== null && song.notes.length > 0) partes.push(song.notes)
  return partes.join('  ·  ')
}

function Item({
  song,
  contentById,
  syncDone,
  atual,
  onAbrir,
}: {
  song: SetlistSongDTO
  contentById: Map<string, ContentDTO>
  syncDone: boolean
  atual: boolean
  onAbrir: () => void
}): React.JSX.Element {
  const { content } = resolveSong(song, contentById)
  const rotulo = labelFor(song, contentById, syncDone)
  const titulo = content?.title ?? '(sem título)'
  const tipo = content !== null ? (CHIP[content.content_type] ?? content.content_type) : '—'
  const problema = rotulo !== 'ready'
  const cor = atual ? dark.accent : dark.text

  return (
    <Pressable
      style={[styles.item, atual && styles.itemAtual]}
      onPress={onAbrir}
      accessibilityRole="button"
      testID={`song-${song.position}`}
    >
      <Text style={[styles.numero, atual && { color: dark.accent }]}>{song.position}</Text>
      <View style={styles.itemTexto}>
        <Text style={[styles.titulo, { color: cor }]} numberOfLines={1}>
          {titulo}
        </Text>
        <Text
          style={[styles.sublinha, problema && { color: dark.offline }]}
          numberOfLines={1}
        >
          {sublinha(song, { artist: content?.artist ?? null }, rotulo)}
        </Text>
      </View>
      <View style={[styles.chip, atual && { borderColor: dark.accent }]}>
        <Text style={[styles.chipTexto, atual && { color: dark.accent }]}>{tipo}</Text>
      </View>
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
}: IndexScreenProps): React.JSX.Element {
  const songs = [...setlist.setlist_songs].sort((a, b) => a.position - b.position)
  const n = songs.length

  useEffect(() => {
    log('index open')
  }, [])

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <Pressable style={styles.botaoSecundario} onPress={onVoltar} testID="voltar">
          <Text style={styles.botaoSecundarioTexto}>◂</Text>
        </Pressable>
        <View style={styles.barraTexto}>
          <Text style={styles.nomeSetlist} numberOfLines={1}>
            {setlist.name}
          </Text>
          <Text style={styles.barraSub} numberOfLines={1}>
            {`${n} ${n === 1 ? 'música' : 'músicas'}`}
            {setlist.performance_date !== null ? `  ·  ${setlist.performance_date}` : ''}
            {setlist.venue !== null && setlist.venue.length > 0 ? `  ·  ${setlist.venue}` : ''}
          </Text>
        </View>
        <Pressable style={styles.botaoSecundario} onPress={onBuscar} testID="buscar">
          <Text style={styles.botaoSecundarioTexto}>Buscar na biblioteca</Text>
        </Pressable>
      </View>

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
            onAbrir={() => {
              log(`index jump n=${item.position}`)
              onAbrirPosicao(item.position)
            }}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  barra: {
    height: bar.top + space.lg,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  barraTexto: { flex: 1, gap: space.xs },
  nomeSetlist: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.display,
    textTransform: 'uppercase',
  },
  barraSub: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  lista: { padding: space.xl, gap: space.sm },
  coluna: { gap: space.sm },
  item: {
    flex: 1,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    // A barra de 4 dp da música atual entra AQUI: transparente nas demais,
    // para que nada mude de largura quando a posição muda.
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    borderRadius: 8,
  },
  itemAtual: { borderLeftColor: dark.accent, backgroundColor: dark.line },
  numero: { color: dark.muted, fontFamily: font.mono, fontSize: 20, minWidth: 32 },
  itemTexto: { flex: 1, gap: space.xs },
  titulo: { fontFamily: font.uiBold, fontSize: 20 },
  sublinha: { color: dark.muted, fontFamily: font.ui, fontSize: size.label },
  chip: {
    height: 27,
    paddingHorizontal: space.sm,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTexto: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: 12,
    letterSpacing: 12 * tracking.label,
  },
  botaoSecundario: {
    // `minWidth` e não `hitSlop`: o alvo tem de estar nos BOUNDS do dump, que
    // é o instrumento do G5 e do A14 — `hitSlop` aumenta a área de toque sem
    // aparecer em medição nenhuma (V1-PRECHECK §3.3, T1-R27/R28).
    minWidth: touch.min,
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
})
