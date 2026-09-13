/**
 * S4 — Busca na biblioteca (PRD T1-R20, R21, R22, R23; aceite A11), com o
 * acabamento do DESIGN-V1 na V1-PR6 (as molduras `S4a-vazio`,
 * `S4a-resultados` e `S4b` do `telas.html`, com as erratas da §9 prevalecendo).
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
 *
 * O que a V1-PR6 mudou é pintura, não comportamento:
 *
 *  - o `fechar` é um **X**, não uma seta: a busca é uma camada sobre a tela
 *    anterior, não um passo atrás. O glifo `◂` num alvo de 48 × 58 vira o
 *    ícone de 24 num alvo de 48 × 48;
 *  - o `apagar` era a palavra num alvo de 48,9 × 48; vira o `x-circle` de 24,
 *    dentro do campo, à direita;
 *  - o campo ganha a lupa de 24 e, quando tem conteúdo, contorno e lupa em
 *    `accentInk` — foco é uma das três casas que a §3.1 dá ao acento (E12);
 *  - cada resultado ganha o **chip de tipo** como ícone + rótulo de 20 dp,
 *    o mesmo do S2 — e é a segunda casa do app a renderizar a tab de quatro
 *    cordas da §6.3, pelo ramo `em20` do `Icone.tsx`;
 *  - a **régua de seção** ganha o fio e a contagem à direita. Ela fica em
 *    `muted`, não em `lineInfo`: é texto ativo abaixo de 24 dp, e a §3.3
 *    proíbe `lineInfo` aí;
 *  - o corpo vazio (`S4a-vazio`), que era uma lista sem nada, ganha o
 *    `buscar música` de 28 e a mesma frase de escopo que o `S4b` já mostrava;
 *  - o `S4b` ganha a lupa com o X dentro, em `muted` e não em `errorInk`: não
 *    achar não é erro.
 *
 * Nenhum controle deixa de aceitar toque e nenhuma linha de log muda — a
 * chamada não aparece escrita aqui de propósito: o G3 compara as linhas que
 * casam com a cadeia `log` seguida de parêntese SEM tirar comentários (ao
 * contrário do `gate:a20`, que os tira), então uma frase que a cite acusa
 * divergência. Instrumento conservador: erra para o lado de falar demais.
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
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
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

/** Ícone e rótulo do chip por tipo, na grafia do design (o mesmo do S2). */
const TIPO: Record<string, { icone: NomeIcone; rotulo: string }> = {
  Lyrics: { icone: 'letra', rotulo: 'Letra' },
  Chords: { icone: 'cifra', rotulo: 'Cifra' },
  Tab: { icone: 'tab', rotulo: 'Tab' },
  Sheet: { icone: 'partitura', rotulo: 'Partitura' },
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
  /**
   * O critério que a div. 74 da V1-PR5 deixou para esta PR, decidido para as
   * duas telas de uma vez: **o ícone de tipo existe quando o app sabe o tipo.**
   * Três casos, os três distinguíveis pelo dado:
   *   1. sabe e é um dos quatro do enum → o desenho do tipo;
   *   2. sabe e NÃO é um dos quatro → `tipo-desconhecido`, e o rótulo segue
   *      sendo o `content_type` cru, que é o que o app tem e o que ele já
   *      mostrava (§1 — não muda dado); o S2 pode dizer "?" no lugar porque a
   *      sublinha dele carrega o motivo por extenso, e a do S4 é artista e
   *      álbum;
   *   3. NÃO sabe — o `content` não está no cache → nenhum ícone e "—". Este
   *      caso **não existe no S4 por construção**: o índice é feito de
   *      `contents`, então todo hit tem o seu DTO. O "—" do S2 segue sendo o
   *      único do app.
   */
  const tipo = TIPO[content.content_type]
  return (
    <Pressable
      style={styles.item}
      onPress={onAbrir}
      accessibilityRole="button"
      testID={`resultado-${content.id.slice(0, 8)}`}
    >
      {/* §3.3 e E12 — o número aqui é posição, não "atual": vai em `muted`,
          como o do S2. O S4 não tem posição atual, e o acento fica sem dono. */}
      {posicao !== null ? <Text style={styles.numero}>{posicao}</Text> : <View style={styles.semNumero} />}
      <View style={styles.itemTexto}>
        <Text style={styles.titulo} numberOfLines={1}>
          {content.title}
        </Text>
        <Text style={styles.sublinha} numberOfLines={1}>
          {sublinha(content)}
        </Text>
      </View>
      <View style={styles.tipo}>
        <Icone nome={tipo?.icone ?? 'tipo-desconhecido'} tamanho={20} cor={dark.muted} />
        <Text style={styles.tipoTexto}>{tipo?.rotulo ?? content.content_type}</Text>
      </View>
    </Pressable>
  )
}

/** A régua de seção: rótulo à esquerda, fio no meio, contagem à direita. */
function Regua({ texto, n }: { texto: string; n: number }): React.JSX.Element {
  return (
    <View style={styles.regua}>
      <Text style={styles.reguaTexto}>{texto}</Text>
      <View style={styles.reguaFio} />
      <Text style={styles.reguaTexto}>{`${n} ${n === 1 ? 'resultado' : 'resultados'}`}</Text>
    </View>
  )
}

/** Uma linha da lista: cabeçalho de grupo ou resultado. */
type Linha =
  | { kind: 'cabecalho'; id: string; texto: string; n: number }
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
      out.push({
        kind: 'cabecalho',
        id: 'h-setlist',
        texto: `Nesta setlist · ${setlist.name}`,
        n: grupos.inSetlist.length,
      })
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
        n: grupos.library.length,
      })
      for (const hit of grupos.library) {
        out.push({ kind: 'hit', id: `l-${hit.id}`, hit, posicao: null })
      }
    }
    return out
  }, [consultou, setlist, grupos, posicaoDe, contents.length])

  /** A frase de escopo — a mesma nos dois vazios, `S4a-vazio` e `S4b`. */
  const escopo = `busca em título, artista, álbum e letra de toda a biblioteca (${contents.length} ${
    contents.length === 1 ? 'música' : 'músicas'
  })`

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <Pressable
          style={styles.botaoIcone}
          onPress={fechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar a busca"
          testID="fechar-busca"
        >
          <Icone nome="fechar" tamanho={24} cor={dark.text} />
        </Pressable>

        <View style={[styles.campo, consultou && styles.campoAtivo]}>
          <Icone nome="busca" tamanho={24} cor={consultou ? dark.accentInk : dark.lineInfo} />
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
              accessibilityLabel="Apagar o que foi digitado"
              testID="apagar"
            >
              <Icone nome="apagar" tamanho={24} cor={dark.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* T1-R23: sem rede a busca é a mesma — o chip explica, não alarma. */}
        {!online ? (
          <View style={styles.chipOffline} testID="chip-offline">
            <Icone nome="sem-conexao" tamanho={20} cor={dark.offlineInk} />
            <Text style={styles.chipOfflineTexto}>sem conexão</Text>
            <Text style={styles.chipOfflineApoio}>· busca local</Text>
          </View>
        ) : null}
      </View>

      {!consultou ? (
        // S4a-vazio — o corpo era uma lista sem nada; ganha o ícone do botão
        // que trouxe o usuário até aqui e a frase de escopo que o S4b já tinha.
        <View style={styles.centro} testID="s4a-vazio">
          <Icone nome="buscar-musica" tamanho={28} cor={dark.muted} />
          <Text style={styles.centroApoio}>{escopo}</Text>
        </View>
      ) : linhas.length === 0 ? (
        // S4b — "nada encontrado", nunca tela vazia (J5 critério 3)
        <View style={styles.centro} testID="s4b">
          <Icone nome="nada-encontrado" tamanho={28} cor={dark.muted} />
          <Text style={styles.centroTitulo}>{`nada encontrado para “${termo.trim()}”`}</Text>
          <Text style={styles.centroApoio}>{escopo}</Text>
        </View>
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(linha) => linha.id}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item.kind === 'cabecalho') {
              return <Regua texto={item.texto} n={item.n} />
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

/**
 * Medidas das três molduras do S4. Onde a moldura usa um número fora das
 * escalas do `theme.ts`, entra o degrau mais próximo — a regra da **errata
 * E10**; a tabela desta tela está no anexo da PR. Ficam como literal,
 * declarados, os que não têm degrau nem escala: a altura da régua (38), a do
 * resultado (80), o corpo 13 da sublinha e do rótulo de tipo (§4.4 "chip /
 * status"), o título de resultado de 20 (§4.4, "bate" com o app) e os
 * `minWidth` 32 do número e 56 da coluna de rótulo — o 56 é o que alinha os
 * quatro rótulos de tipo no mesmo x, igual ao do S2.
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  // §5.3 — a barra superior de S2/S4 é 88: `bar.top` + 24, como a do índice
  barra: {
    height: bar.top + space.xl,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  // `width`/`height` e não `hitSlop`: o alvo tem de estar nos BOUNDS do dump,
  // que é o instrumento do G5 (a mesma nota do `IndexScreen`).
  botaoIcone: {
    width: touch.min,
    height: touch.min,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  campo: {
    flex: 1,
    height: touch.list + 2,
    paddingLeft: space.lg,
    paddingRight: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  // E12 — acento em ativo, atual ou FOCO. O campo com conteúdo é o foco, e é
  // o único acento desta tela.
  campoAtivo: { borderColor: dark.accentInk },
  // O `campo` mede 58 dp, mas quem recebe o toque é o TextInput, e ele só
  // tinha a altura do texto (46,2 dp no dump). O `minHeight` põe o ALVO
  // acima de 48 sem mexer no campo em volta.
  input: { flex: 1, minHeight: touch.min, color: dark.text, fontFamily: font.ui, fontSize: size.body },
  // O rótulo textual media 48,9 × 21,8 dp antes da V1-PR1; agora é o ícone
  // dentro de um alvo próprio, na posição convencional (dentro, à direita).
  apagarAlvo: {
    minWidth: touch.min,
    minHeight: touch.min,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOffline: { flexDirection: 'row', alignItems: 'center', gap: space.sm, maxWidth: 260 },
  chipOfflineTexto: { color: dark.offlineInk, fontFamily: font.ui, fontSize: 13 },
  chipOfflineApoio: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  lista: { paddingTop: space.sm, paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md },
  regua: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: space.md },
  // §3.3 — régua de seção é TEXTO ATIVO abaixo de 24 dp: `muted`, nunca
  // `lineInfo`. O fio entre os dois é que é decorativo, e vai em `line`.
  reguaTexto: {
    color: dark.muted,
    fontFamily: font.mono,
    fontSize: size.labelSmall,
    letterSpacing: size.labelSmall * tracking.display,
    textTransform: 'uppercase',
  },
  reguaFio: { flex: 1, height: bar.hairline, backgroundColor: dark.line },
  item: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  numero: { color: dark.muted, fontFamily: font.mono, fontSize: 20, minWidth: 32, textAlign: 'right' },
  semNumero: { width: 32 },
  itemTexto: { flex: 1, gap: space.xs },
  titulo: { color: dark.text, fontFamily: font.uiBold, fontSize: 20 },
  sublinha: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  tipo: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tipoTexto: { color: dark.muted, fontFamily: font.ui, fontSize: 13, minWidth: 56 },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xxxl,
  },
  centroTitulo: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.label,
  },
  centroApoio: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: size.bodySmall,
    lineHeight: size.bodySmall * 1.5,
    textAlign: 'center',
    maxWidth: 560,
  },
})
