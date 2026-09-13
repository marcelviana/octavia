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
 */
import { useEffect } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  labelFor,
  resolveSong,
  songKey,
  type ContentDTO,
  type ContentValidity,
  type SetlistDTO,
  type SetlistSongDTO,
  type SongLabel,
} from '@octavia/core'
import { Icone, type TamanhoIcone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
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
