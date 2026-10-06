/**
 * OS CINCO FILTROS DA BIBLIOTECA (L) — N4-PR7 (`N4-REQUISITOS.md` N4-R5; P-X2, P-F9; molduras `N4-*-L-base`,
 * `*-L-filtro-sem-resultado`, `*-L-favoritas-1`, `*-L-favoritas-0`, `*-L-carregando`, `*-L-vazia`).
 *
 * Letra · Cifra · Tab · Partitura · Favoritas, cada um com a **contagem fixa da biblioteca inteira** — ela vem do core
 * (`consultarBiblioteca(...).contagens`) e não muda com a busca nem com os outros chips. Tipos por "ou", Favoritas por
 * "e": quem combina é o core; aqui só se marca e desmarca.
 *
 * Nome acessível de cada chip: *Só {tipo} ({n})* e, no quinto, *Só as favoritas ({n})* (P-F9, N4-D85). O chip
 * marcado com 0 continua tocável — é por ele que se desmarca.
 *
 * **Carregando** (sem nada no aparelho): os cinco à vista, INERTES e sem contagem. **Vazia** (a conta sem música):
 * as contagens 0, inertes. A faixa tem a altura do P-T1 (`tokens.lib.filtros`: 64 em C e B; 120 em A, onde os chips
 * quebram em duas linhas) — a tela não faz conta de largura: os chips quebram sozinhos (`flexWrap`).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  ROTULO_DO_TIPO,
  VOCABULARIO_DE_CONTENT,
  nomeDoFiltro,
  nomeDoFiltroFavoritas,
  type ContagensDaBiblioteca,
  type ContentType,
} from '@octavia/core'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, font, radius, size, space, touch, type TokensDaFaixa } from '../theme'

/** Os quatro tipos, na ordem da folha, com o ícone do catálogo e o `testID` da P-X3 (`lib-filtro-{tipo}`). */
const TIPOS: readonly { tipo: ContentType; icone: NomeIcone; id: string }[] = [
  { tipo: 'Lyrics', icone: 'letra', id: 'letra' },
  { tipo: 'Chords', icone: 'cifra', id: 'cifra' },
  { tipo: 'Tab', icone: 'tab', id: 'tab' },
  { tipo: 'Sheet', icone: 'partitura', id: 'partitura' },
]

/**
 * A cor do pacote com a alfa do pacote, em `#RRGGBBAA` (o React Native lê os oito dígitos). O fundo do item marcado é o
 * `alfaMarcado` do bloco `web` (*"accent a 12 % — navegação ativa, aba ativa, Favorita, página atual"*): a mesma marca
 * nos dois lados, nenhum valor fora do pacote.
 */
function comAlfa(hex: string, alfa: number): string {
  return `${hex}${Math.round(alfa * 255).toString(16).padStart(2, '0').toUpperCase()}`
}

function Chip({
  icone,
  rotulo,
  n,
  marcado,
  inerte,
  nome,
  testID,
  onPress,
  fundoMarcado,
}: {
  icone: NomeIcone
  rotulo: string
  /** `null` = sem contagem (carregando). */
  n: number | null
  marcado: boolean
  inerte: boolean
  nome: string
  testID: string
  onPress: () => void
  /** O fundo do marcado — o `accentInk` com a alfa do marcado do pacote. */
  fundoMarcado: string
}): React.JSX.Element {
  return (
    <Pressable
      style={[styles.chip, marcado ? [styles.chipMarcado, { backgroundColor: fundoMarcado }] : null]}
      onPress={() => (inerte ? undefined : onPress())}
      disabled={inerte}
      accessibilityRole="button"
      accessibilityLabel={nome}
      accessibilityState={{ selected: marcado, disabled: inerte }}
      testID={testID}
    >
      <Icone
        nome={icone}
        tamanho={20}
        cor={inerte ? dark.lineInfo : dark.text}
        estado={inerte ? 'inerte' : marcado && icone === 'estrela' ? 'ativo' : 'normal'}
      />
      <Text style={[styles.rotulo, inerte ? styles.inerte : null]}>{rotulo}</Text>
      {n !== null ? <Text style={[styles.n, inerte ? styles.inerte : null]}>{n}</Text> : null}
    </Pressable>
  )
}

export interface FiltrosDaBibliotecaProps {
  /** `null` enquanto não há biblioteca (carregando): os chips sem contagem. */
  contagens: ContagensDaBiblioteca | null
  tipos: readonly ContentType[]
  favoritas: boolean
  /** Carregando ou vazia: os cinco à vista e inertes. */
  inertes: boolean
  tokens: TokensDaFaixa
  onTipo: (tipo: ContentType) => void
  onFavoritas: () => void
}

export function FiltrosDaBiblioteca({
  contagens,
  tipos,
  favoritas,
  inertes,
  tokens,
  onTipo,
  onFavoritas,
}: FiltrosDaBibliotecaProps): React.JSX.Element {
  const fundoMarcado = comAlfa(dark.accentInk, tokens.web.alfaMarcado)
  return (
    <View style={[styles.faixa, { height: tokens.lib.filtros }]}>
      {TIPOS.map(({ tipo, icone, id }) => {
        const n = contagens === null ? null : contagens[tipo]
        return (
          <Chip
            key={tipo}
            icone={icone}
            rotulo={ROTULO_DO_TIPO[tipo]}
            n={n}
            marcado={tipos.includes(tipo)}
            inerte={inertes}
            nome={nomeDoFiltro(ROTULO_DO_TIPO[tipo], n ?? 0)}
            testID={`lib-filtro-${id}`}
            onPress={() => onTipo(tipo)}
            fundoMarcado={fundoMarcado}
          />
        )
      })}
      <Chip
        icone="estrela"
        rotulo={VOCABULARIO_DE_CONTENT.favoritas}
        n={contagens === null ? null : contagens.favoritas}
        marcado={favoritas}
        inerte={inertes}
        nome={nomeDoFiltroFavoritas(contagens?.favoritas ?? 0)}
        testID="lib-filtro-favoritas"
        onPress={onFavoritas}
        fundoMarcado={fundoMarcado}
      />
    </View>
  )
}

/**
 * O chip da folha (`N4-B-L-base`): borda de 1 em `line`, 12 de respiro, ícone de 20 · 8 · o rótulo em 15 · 8 · a
 * contagem em mono 13 (o literal da S4, N4-D79); 48 de altura (`touch.min`); 8 entre os chips e acima/abaixo deles.
 * Marcado: contorno em `accentInk` (E12: o acento é ativo · atual · foco) e o fundo a 12 % (`comAlfa`). O raio é o de controle (a folha desenha 10,
 * que não é token; o app usa 12 nos controles com borda da S4).
 */
const styles = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  chip: {
    height: touch.min,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  chipMarcado: { borderColor: dark.accentInk },
  rotulo: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  n: { color: dark.muted, fontFamily: font.mono, fontSize: 13 },
  inerte: { color: dark.lineInfo },
})
