/**
 * A LINHA DA BIBLIOTECA (L) — N4-PR7 (`N4-REQUISITOS.md` N4-R6, N4-R7, N4-R9; as amostras `N4-*-L-linhas`, que são
 * normativas para a linha — N4-E7).
 *
 * Duas colunas: o texto (o título numa linha, com reticência em C e B; a segunda linha) e os dois controles próprios,
 * de 48 × 48 com 4 entre eles — a **estrela** (favoritar, sem borda, `accentInk`) e o **▶** (tocar, com borda, só
 * ícone, nome acessível *Tocar “{título}”*, P-F1).
 *
 * **A segunda linha** leva sempre o TIPO (ícone de 20 + a palavra) e o ARTISTA depois, quando existe — o ponto vai com
 * o artista; nunca *artista desconhecido*. Música com arquivo: o estado do arquivo depois (o `estadoDoArquivo` do
 * core): *arquivo não baixado* (`offlineInk`), *baixando o arquivo…*, *não consegui baixar* (`errorInk`) — **sem
 * Baixar na linha** (N4-D62). Item inválido: a frase do índice (*tipo não reconhecido…*, *nada para mostrar…*) e o
 * ▶ INERTE; a estrela continua.
 *
 * **O toque na linha VISUALIZA** (N4-R6, N4-D61; N4-PR8 — o estado intermediário da N4-PR7 se fecha): a linha inteira
 * é o alvo, com o nome acessível *Ver “{título}”* (P-F7). Pressionada: o contorno em `accentInk` e o fundo do acento a
 * 6 % (N4-D101, `[Marcel, 2026-10-06]`: o literal da folha, medido no DOM — herança do bloco de identidade, como a
 * N4-D96). A estrela e o ▶ continuam controles próprios: o toque neles é deles (no RN, o Pressable mais fundo).
 *
 * **A estrela** (N4-R7, N4-R9): vazada = favoritar (*Favoritar “{título}”*), cheia = favorita (*Tirar “{título}” das
 * favoritas*). EM VOO: inerte (traço 1,25), com o arco em volta, e o nome acessível da P-F5 — e só muda quando o
 * servidor responde (o estado mora no `favoritar.ts`, não aqui). SEM REDE: inerte em `lineInfo`, sem arco; o motivo
 * NÃO vai na linha (vai uma vez, na linha de aviso da tela).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FRASES_DO_TABLET, ROTULO_DO_TIPO, isValidContent, nomeVer, type ContentDTO, type EstadoDoArquivo } from '@octavia/core'
import type { EstadoDoFavoritar } from '../favoritar'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, font, radius, size, space, type TokensDaFaixa } from '../theme'
import { BotaoTocar, EstrelaDoFavoritar } from './ControlesDaMusica'
import { comAlfa } from './FiltrosDaBiblioteca'

/** O ícone de cada tipo do enum (o mesmo mapa do S2 e da S4); fora do enum, nenhum. */
const ICONE_DO_TIPO: { readonly [k: string]: NomeIcone } = { Lyrics: 'letra', Chords: 'cifra', Tab: 'tab', Sheet: 'partitura' }

/** O que a segunda linha diz do arquivo — `null` quando não há o que dizer (sem arquivo, baixado, formato). */
function estadoNaLinha(e: EstadoDoArquivo): { icone: NomeIcone; cor: string; texto: string } | null {
  switch (e.tipo) {
    case 'nao-baixado':
      return { icone: 'arquivo-nao-baixado', cor: dark.offlineInk, texto: FRASES_DO_TABLET['arquivo-nao-baixado'] }
    case 'baixando':
      return { icone: 'baixando', cor: dark.muted, texto: FRASES_DO_TABLET['baixando-o-arquivo'] }
    case 'falhou':
      return { icone: 'falha', cor: dark.errorInk, texto: FRASES_DO_TABLET['nao-consegui-baixar'] }
    default:
      return null
  }
}

export interface LinhaDaBibliotecaProps {
  content: ContentDTO
  arquivo: EstadoDoArquivo
  /** A música em voo no favoritar (`estadoDoFavoritar`), ou `null`. */
  emVoo: EstadoDoFavoritar | null
  online: boolean
  tokens: TokensDaFaixa
  onFavoritar: (valor: boolean) => void
  onTocar: () => void
  /** N4-PR8 — o toque na linha: a visualização (N4-R6). */
  onVer: () => void
}

export function LinhaDaBiblioteca({
  content,
  arquivo,
  emVoo,
  online,
  tokens,
  onFavoritar,
  onTocar,
  onVer,
}: LinhaDaBibliotecaProps): React.JSX.Element {
  const id8 = content.id.slice(0, 8)
  const validade = isValidContent(content.content_type, content.content_data, content.file_url)
  const invalido = validade.ok ? null : validade.reason
  const icone = ICONE_DO_TIPO[content.content_type]
  const rotulo = (ROTULO_DO_TIPO as { readonly [k: string]: string })[content.content_type]
  const artista = content.artist !== null && content.artist.length > 0 ? content.artist : null
  const favorita = content.is_favorite === true
  const estado = invalido === null ? estadoNaLinha(arquivo) : null

  const tocarInerte = invalido !== null

  return (
    <Pressable
      style={({ pressed }) => [styles.linha, { minHeight: tokens.lib.linha }, pressed ? styles.pressionada : null]}
      onPress={onVer}
      accessibilityRole="button"
      accessibilityLabel={nomeVer(content.title)}
      testID={`lib-linha-${id8}`}
    >
      <View style={styles.texto}>
        <Text style={styles.titulo} numberOfLines={1}>
          {content.title}
        </Text>
        <View style={styles.segunda}>
          {invalido === 'unknown-type' ? (
            <>
              <Icone nome="tipo-desconhecido" tamanho={20} cor={dark.offlineInk} />
              <Text style={[styles.segundaTexto, styles.offline]} numberOfLines={1}>
                {FRASES_DO_TABLET['tipo-nao-reconhecido']}
              </Text>
            </>
          ) : (
            <>
              <Icone nome={icone ?? 'tipo-desconhecido'} tamanho={20} cor={dark.muted} />
              {/* O item sem corpo (`no-body`, `no-key`, `not-string`): o ícone do tipo e a frase do índice no lugar da
                  palavra — a amostra `L-linhas` ("Item sem conteúdo da fixture"). */}
              {invalido !== null ? (
                <Text style={[styles.segundaTexto, styles.encolhe]} numberOfLines={1}>
                  {FRASES_DO_TABLET['nada-para-mostrar']}
                </Text>
              ) : (
                <Text style={styles.segundaTexto}>{rotulo ?? content.content_type}</Text>
              )}
              {artista !== null && invalido === null ? (
                <>
                  <Text style={styles.ponto}>·</Text>
                  <Text style={[styles.segundaTexto, styles.encolhe]} numberOfLines={1}>
                    {artista}
                  </Text>
                </>
              ) : null}
              {estado !== null ? (
                <View style={styles.estado}>
                  <Icone nome={estado.icone} tamanho={20} cor={estado.cor} />
                  <Text style={[styles.segundaTexto, { color: estado.cor }]} numberOfLines={1}>
                    {estado.texto}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>

      {/* N4-PR8: a estrela e o ▶ são os controles comuns da linha e da visualização (`ControlesDaMusica.tsx`, m26). */}
      <View style={styles.controles}>
        <EstrelaDoFavoritar
          titulo={content.title}
          favorita={favorita}
          emVoo={emVoo}
          online={online}
          onFavoritar={onFavoritar}
          testID={`lib-favoritar-${id8}`}
        />
        <BotaoTocar titulo={content.title} inerte={tocarInerte} onTocar={onTocar} testID={`lib-tocar-${id8}`} />
      </View>
    </Pressable>
  )
}

/**
 * A linha da folha (`N4-B-L-base`, `N4-*-L-linhas`): 663 × 80 em B (a largura da lista menos a margem de 24), borda
 * de 1 em `line`, raio de controle; o texto à esquerda com 24 de respiro e os controles à direita com 12; 4 entre a
 * coluna de texto e a estrela, e 4 entre a estrela e o ▶. A altura mínima é o P-T2 (`tokens.lib.linha`). O título
 * 20/600 e a contagem 13 são os literais da S4 (N4-D79, herança do bloco de identidade).
 */
const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingLeft: space.xl,
    paddingRight: space.md,
    paddingVertical: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  // Sem vão entre o título e a segunda linha: as caixas medidas (régua, e3) são 29,8 e 21,8 — com os 12 de respiro e a
  // borda, 77,6 cabem nos 80 do P-T2; a folha desenha 26 + 2 + 22 (o vão de 2 não é token).
  texto: { flex: 1 },
  titulo: { color: dark.text, fontFamily: font.uiBold, fontSize: 20 },
  segunda: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  segundaTexto: { color: dark.muted, fontFamily: font.ui, fontSize: size.bodySmall, flexShrink: 0 },
  encolhe: { flexShrink: 1 },
  offline: { color: dark.offlineInk, flexShrink: 1 },
  ponto: { color: dark.lineInfo, fontFamily: font.ui, fontSize: size.bodySmall },
  estado: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  controles: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  // N4-D101: pressionada — o contorno do acento e o fundo a 6 % (o literal da folha).
  pressionada: { borderColor: dark.accentInk, backgroundColor: comAlfa(dark.accentInk, 0.06) },
})
