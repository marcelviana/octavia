/**
 * S4 — Busca na biblioteca (PRD T1-R20, R21, R22, R23; aceite A11).
 *
 * Toda local, sobre o cache: em modo avião ela funciona igual (T1-R23), e é
 * por isso que o chip do design diz "busca local" quando não há rede — não é
 * um aviso de degradação, é a explicação de por que ainda funciona.
 *
 * Escopo é a **biblioteca inteira** (T1-R22): o caso do J5 é justamente a
 * música que NÃO está na setlist. O que está na setlist atual aparece
 * agrupado primeiro, com a posição, quando a busca foi aberta do palco.
 *
 * O índice é memoizado por `contents`: reconstruí-lo a cada tecla custaria
 * 66 normalizações por caractere na conta de audit — barato hoje, mas o
 * palco não pode engasgar (T1-R34) e a conta cresce.
 *
 * **Nunca** entra em log o termo digitado, só o comprimento (N1-D5, regra 2).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  buildIndex,
  groupResults,
  searchIndex,
  type ContentDTO,
  type SearchHit,
  type SetlistDTO,
} from '@octavia/core'
import { log } from '../log'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'

export interface SearchScreenProps {
  /** A biblioteca inteira, do cache local (T1-R22). */
  contents: ContentDTO[]
  /** Setlist de onde a busca foi aberta; `null` quando veio da S1. */
  setlist: SetlistDTO | null
  /** Posição no palco na abertura — o que o `search close restore` devolve. */
  posicao: number | null
  online: boolean
  onFechar: () => void
  /**
   * Abrir um resultado. `posicaoNaSetlist` é a posição quando o item já está
   * na setlist atual, e `null` quando é uma música avulsa da biblioteca — as
   * duas navegações são diferentes, e quem decide é a raiz.
   */
  onAbrir: (contentId: string, posicaoNaSetlist: number | null) => void
}

/** Rótulo do chip por tipo, na grafia do design (o mesmo do S2). */
const CHIP: Record<string, string> = {
  Lyrics: 'Letra',
  Chords: 'Cifra',
  Tab: 'Tab',
  Sheet: 'Partitura',
}

/** O que a linha do resultado mostra sob o título. */
function sublinha(content: ContentDTO): string {
  const partes: string[] = []
  if (content.artist !== null && content.artist.length > 0) partes.push(content.artist)
  if (content.album !== null && content.album.length > 0) partes.push(content.album)
  return partes.join('  ·  ')
}

function Resultado({
  content,
  posicao,
  onAbrir,
}: {
  content: ContentDTO
  /** Posição na setlist atual, quando o item pertence a ela. */
  posicao: number | null
  onAbrir: () => void
}): React.JSX.Element {
  return (
    <Pressable
      style={styles.item}
      onPress={onAbrir}
      accessibilityRole="button"
      testID={`resultado-${content.id.slice(0, 8)}`}
    >
      {posicao !== null ? <Text style={styles.numero}>{posicao}</Text> : <View style={styles.semNumero} />}
      <View style={styles.itemTexto}>
        <Text style={styles.titulo} numberOfLines={1}>
          {content.title}
        </Text>
        <Text style={styles.sublinha} numberOfLines={1}>
          {sublinha(content)}
        </Text>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipTexto}>{CHIP[content.content_type] ?? content.content_type}</Text>
      </View>
    </Pressable>
  )
}

/** Uma linha da lista: cabeçalho de grupo ou resultado. */
type Linha =
  | { kind: 'cabecalho'; id: string; texto: string }
  | { kind: 'hit'; id: string; hit: SearchHit; posicao: number | null }

export function SearchScreen({
  contents,
  setlist,
  posicao,
  online,
  onFechar,
  onAbrir,
}: SearchScreenProps): React.JSX.Element {
  const [termo, setTermo] = useState('')

  const indice = useMemo(() => buildIndex(contents), [contents])
  const porId = useMemo(() => new Map(contents.map((c) => [c.id, c])), [contents])

  /** `content_id` → primeira posição na setlist atual (um bis usa a 1ª). */
  const posicaoDe = useMemo(() => {
    const mapa = new Map<string, number>()
    if (setlist === null) return mapa
    for (const song of [...setlist.setlist_songs].sort((a, b) => a.position - b.position)) {
      if (!mapa.has(song.content_id)) mapa.set(song.content_id, song.position)
    }
    return mapa
  }, [setlist])

  const hits = useMemo(() => searchIndex(indice, termo), [indice, termo])
  const grupos = useMemo(
    () => groupResults(hits, new Set(posicaoDe.keys())),
    [hits, posicaoDe],
  )

  const consultou = termo.trim().length > 0

  // A linha do A11. Sai a cada consulta não-vazia — o termo NUNCA entra,
  // só o comprimento (o `adb shell input text` digita letra a letra, então
  // no aceite a última linha é a da consulta completa).
  useEffect(() => {
    if (!consultou) return
    log(`search q=${termo.trim().length} n=${hits.length} in-setlist=${grupos.inSetlist.length}`)
  }, [termo, consultou, hits.length, grupos.inSetlist.length])

  /**
   * T1-R22 — fechar a busca devolve o palco onde ele estava. O log sai uma
   * vez só: sem o ref, um segundo toque no "voltar" durante a animação de
   * saída emitiria a linha duas vezes e o aceite contaria errado.
   */
  const fechou = useRef(false)
  const fechar = useCallback(() => {
    if (fechou.current) return
    fechou.current = true
    if (setlist !== null && posicao !== null) {
      log(`search close restore n=${posicao}/${setlist.setlist_songs.length}`)
    }
    onFechar()
  }, [setlist, posicao, onFechar])

  const linhas: Linha[] = useMemo(() => {
    if (!consultou) return []
    const out: Linha[] = []
    if (setlist !== null && grupos.inSetlist.length > 0) {
      out.push({ kind: 'cabecalho', id: 'h-setlist', texto: `Nesta setlist · ${setlist.name}` })
      for (const hit of grupos.inSetlist) {
        out.push({ kind: 'hit', id: `s-${hit.id}`, hit, posicao: posicaoDe.get(hit.id) ?? null })
      }
    }
    if (grupos.library.length > 0) {
      const n = contents.length
      out.push({
        kind: 'cabecalho',
        id: 'h-lib',
        texto: `Biblioteca · ${n} ${n === 1 ? 'música' : 'músicas'}`,
      })
      for (const hit of grupos.library) {
        out.push({ kind: 'hit', id: `l-${hit.id}`, hit, posicao: null })
      }
    }
    return out
  }, [consultou, setlist, grupos, posicaoDe, contents.length])

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <Pressable style={styles.botaoSecundario} onPress={fechar} testID="fechar-busca">
          <Text style={styles.botaoSecundarioTexto}>◂</Text>
        </Pressable>

        <View style={styles.campo}>
          <TextInput
            style={styles.input}
            value={termo}
            onChangeText={setTermo}
            placeholder="Buscar por título, artista, álbum ou letra"
            placeholderTextColor={dark.muted}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            testID="campo-busca"
          />
          {termo.length > 0 ? (
            <Pressable
              style={styles.apagarAlvo}
              onPress={() => setTermo('')}
              accessibilityRole="button"
              testID="apagar"
            >
              <Text style={styles.apagar}>apagar</Text>
            </Pressable>
          ) : null}
        </View>

        {/* T1-R23: sem rede a busca é a mesma — o chip explica, não alarma. */}
        {!online ? (
          <Text style={styles.chipOffline} testID="chip-offline">
            sem conexão · busca local
          </Text>
        ) : null}
      </View>

      {consultou && linhas.length === 0 ? (
        // S4b — "nada encontrado", nunca tela vazia (J5 critério 3)
        <View style={styles.centro} testID="s4b">
          <Text style={styles.centroTitulo}>{`nada encontrado para “${termo.trim()}”`}</Text>
          <Text style={styles.centroApoio}>
            {`busca em título, artista, álbum e letra de toda a biblioteca (${contents.length} ${
              contents.length === 1 ? 'música' : 'músicas'
            })`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(linha) => linha.id}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item.kind === 'cabecalho') {
              return <Text style={styles.cabecalho}>{item.texto}</Text>
            }
            const content = porId.get(item.hit.id)
            if (content === undefined) return null
            return (
              <Resultado
                content={content}
                posicao={item.posicao}
                onAbrir={() => onAbrir(content.id, item.posicao)}
              />
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  barra: {
    minHeight: bar.top + space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  campo: {
    flex: 1,
    height: touch.stage,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  // O `campo` mede 64 dp, mas quem recebe o toque é o TextInput, e ele só
  // tinha a altura do texto (46,2 dp no dump). O `minHeight` põe o ALVO
  // acima de 48 sem mexer no campo em volta.
  input: { flex: 1, minHeight: touch.min, color: dark.text, fontFamily: font.ui, fontSize: size.input },
  // O rótulo textual media 48,9 × 21,8 dp: largura passava, altura não.
  apagarAlvo: {
    minWidth: touch.min,
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apagar: { color: dark.muted, fontFamily: font.ui, fontSize: size.bodySmall },
  chipOffline: {
    color: dark.offline,
    fontFamily: font.ui,
    fontSize: 13,
    maxWidth: 220,
  },
  lista: { padding: space.xl, gap: space.sm },
  cabecalho: {
    color: dark.muted,
    fontFamily: font.uiBold,
    fontSize: size.labelSmall,
    letterSpacing: size.labelSmall * tracking.displayWide,
    textTransform: 'uppercase',
    paddingTop: space.lg,
    paddingBottom: space.xs,
  },
  item: {
    minHeight: touch.list + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  numero: { color: dark.accent, fontFamily: font.mono, fontSize: 20, minWidth: 32 },
  semNumero: { width: 32 },
  itemTexto: { flex: 1, gap: space.xs },
  titulo: { color: dark.text, fontFamily: font.uiBold, fontSize: 20 },
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
    // Ver a nota do `IndexScreen`: o alvo cresce de verdade, não por hitSlop.
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
})
