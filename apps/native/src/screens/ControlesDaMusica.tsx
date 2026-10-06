/**
 * OS DOIS CONTROLES DE UMA MÚSICA — a estrela (favoritar) e o ▶ (tocar). Nasceram na linha da biblioteca (N4-PR7,
 * `LinhaDaBiblioteca.tsx`) e moram aqui desde a N4-PR8, porque a visualização usa **o mesmo controle da linha**
 * (`DESIGN-N4/README.md` §4, m26; N4-R12). Os `testID` ficam com quem os põe na tela (a linha, V): o G2 coleta por
 * arquivo.
 *
 * **A estrela** (N4-R7, N4-R9): 48 × 48, sem borda, `accentInk`; vazada = favoritar (*Favoritar “{título}”*), cheia =
 * favorita (*Tirar “{título}” das favoritas*). EM VOO: inerte (traço 1,25), com o arco em volta, e o nome acessível da
 * P-F5 — e só muda quando o servidor responde (o estado mora no `favoritar.ts`, não aqui). SEM REDE: inerte em
 * `lineInfo`, sem arco; o motivo não vai no controle (vai uma vez, na linha de aviso da tela).
 *
 * **O ▶** (N4-D61): 48 × 48, com borda, só ícone, nome acessível *Tocar “{título}”* (P-F1). Inerte no item inválido,
 * com a moldura e o ícone em `lineInfo` (E3: sem opacidade).
 */
import { Pressable, StyleSheet } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { nomeFavoritando, nomeFavoritar, nomeTirando, nomeTirar, nomeTocar, type EspecieDoFavoritar } from '@octavia/core'
import type { EstadoDoFavoritar } from '../favoritar'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, radius, touch } from '../theme'

/**
 * O arco de andamento em volta da estrela em voo (`N4-*-L-favoritando`, `N4-*-V-favoritando`: a trilha em `line` e um
 * quarto em `accentInk`, traço 2, na caixa de 42 × 42 da folha, centrada no alvo de 48). É desenho da TELA, não do
 * catálogo — a N4-PR4 o registrou assim (`N4-PR4-anexos/README.md` §1.2: *"o 'em andamento' é o inerte mais um arco de
 * 42 × 42"*). **N4-D96** `[Marcel, 2026-10-06]`: os números da folha (42, r 19, traço 2) entram como literal declarado
 * — herança do bloco de identidade, com os 13 e 20 da N4-D79.
 */
function ArcoDeAndamento(): React.JSX.Element {
  return (
    <Svg width={42} height={42} viewBox="0 0 42 42" style={styles.arco} fill="none" strokeWidth={2} strokeLinecap="round">
      <Circle cx={21} cy={21} r={19} stroke={dark.line} />
      <Path d="M21 2a19 19 0 0 1 19 19" stroke={dark.accentInk} />
    </Svg>
  )
}

/**
 * N4-R8 — a falha do favoritar na linha de aviso: o ícone e a tinta por espécie — `falha` em `errorInk`; sem rede
 * (`sem-conexao`) e limite (`ultima-sincronizacao`) em `offlineInk`. Era da L (`LibraryScreen.tsx`, N4-PR7); V usa a
 * mesma.
 */
export function iconeDaEspecie(especie: Exclude<EspecieDoFavoritar, 'ok'>): { icone: NomeIcone; cor: string } {
  if (especie === 'rede') return { icone: 'sem-conexao', cor: dark.offlineInk }
  if (especie === 'limite') return { icone: 'ultima-sincronizacao', cor: dark.offlineInk }
  return { icone: 'falha', cor: dark.errorInk }
}

export interface EstrelaDoFavoritarProps {
  titulo: string
  favorita: boolean
  /** A música em voo no favoritar (`estadoDoFavoritar`), ou `null`. */
  emVoo: EstadoDoFavoritar | null
  online: boolean
  onFavoritar: (valor: boolean) => void
  testID: string
}

export function EstrelaDoFavoritar({ titulo, favorita, emVoo, online, onFavoritar, testID }: EstrelaDoFavoritarProps): React.JSX.Element {
  const inerte = emVoo !== null || !online
  const nome =
    emVoo === 'favoritando'
      ? nomeFavoritando(titulo)
      : emVoo === 'tirando'
        ? nomeTirando(titulo)
        : favorita
          ? nomeTirar(titulo)
          : nomeFavoritar(titulo)
  return (
    <Pressable
      style={styles.alvo}
      onPress={() => (inerte ? undefined : onFavoritar(!favorita))}
      accessibilityRole="button"
      accessibilityLabel={nome}
      accessibilityState={{ disabled: inerte, busy: emVoo !== null }}
      disabled={inerte}
      testID={testID}
    >
      {emVoo !== null ? <ArcoDeAndamento /> : null}
      <Icone
        nome="estrela"
        tamanho={24}
        cor={!online && emVoo === null ? dark.lineInfo : dark.accentInk}
        estado={inerte ? (favorita ? 'ativo-inerte' : 'inerte') : favorita ? 'ativo' : 'normal'}
      />
    </Pressable>
  )
}

export interface BotaoTocarProps {
  titulo: string
  inerte: boolean
  onTocar: () => void
  testID: string
}

export function BotaoTocar({ titulo, inerte, onTocar, testID }: BotaoTocarProps): React.JSX.Element {
  return (
    <Pressable
      style={[styles.alvo, styles.alvoComBorda, inerte ? styles.alvoInerte : null]}
      onPress={() => (inerte ? undefined : onTocar())}
      accessibilityRole="button"
      accessibilityLabel={nomeTocar(titulo)}
      accessibilityState={{ disabled: inerte }}
      disabled={inerte}
      testID={testID}
    >
      <Icone nome="tocar" tamanho={24} cor={inerte ? dark.lineInfo : dark.text} estado={inerte ? 'inerte' : 'normal'} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  // `width`/`height` e não `hitSlop`: o alvo tem de estar nos BOUNDS do dump (o G5), como o `botaoIcone` da S4.
  alvo: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alvoComBorda: { borderWidth: bar.hairline, borderColor: dark.line },
  // E3 (V1-PR4): o inerte é tinta `lineInfo` na moldura e no ícone, sem opacidade.
  alvoInerte: { borderColor: dark.lineInfo },
  arco: { position: 'absolute' },
})
