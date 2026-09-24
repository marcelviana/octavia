/**
 * A LINHA DE AVISO DE 48 dp — componente das DUAS telas (DESIGN-N2 §3.3,
 * achado R1·2a da revisão 1; molduras `N2-S1-sem-rede`,
 * `N2-S1-salvo-nao-relido` e as cinco amostras em tamanho real do §7).
 *
 * Verbatim da folha: *"uma linha de 48 dp, sempre com ícone de 20, sempre com
 * o motivo escrito — nunca um tooltip, nunca um toast que passa"*. Em S1 fica
 * entre a barra de 120 dp e o primeiro cartão; em S2 (PR-4), logo abaixo da
 * faixa de edição. Quando existe, a lista perde 48 dp e nada mais muda de
 * lugar.
 *
 * **Só um aviso por vez, e quem decide é quem chama**: *"se dois caberiam,
 * vale o que bloqueia mais"* — se "salvo; não foi possível recarregar" e "sem
 * conexão" coincidirem, vale a de rede. A regra mora em S1 (`avisoDe`), não
 * aqui: este componente desenha UM aviso, e não sabe da existência de outro.
 *
 * O botão é opcional e, quando existe, tem 48 dp de alvo próprio (G5, a regra
 * das duas bordas) — o mesmo tratamento que a V1-PR1 deu ao "Tentar
 * novamente" do banner de S1e, que era o alvo mais baixo do app.
 *
 * **N3-D19 (N3-PR2): a linha cresce e nunca elide.** *"48 dp mínimos, +20 por
 * linha de texto"*, em toda faixa — é regra do componente, então S1, S2, o
 * reordenar e o picker a herdam sem mudar nada. O motivo não tem mais teto de
 * linhas (o `numberOfLines={2}` da N2 cortava o terceiro verso em A e,
 * com a altura fixa de 48, desenhava a segunda linha por cima da borda). O
 * crescimento vem do respiro de 12 acima e abaixo do TEXTO: com uma linha
 * (≈ 21,8 dp no aparelho) o texto pede 45,8 e a linha fica nos 48 mínimos,
 * com o texto no mesmo lugar de antes — em C nada muda, e o G-inv prova; com
 * duas, 12 + 2 linhas + 12 ≈ 68 (N3-B-X-sem-rede). O alvo da ação continua
 * com 48 próprios e centrado na altura da linha, à direita, em B e C; em A a
 * ação desce para baixo do texto, e isso é do N5.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, font, radius, size, space, touch } from '../theme'

export interface AcaoDoAviso {
  rotulo: string
  onPress: () => void
  /** Inativo com o motivo escrito ao lado (N2-D23) — nunca sem motivo. */
  inativo?: boolean
  motivoInativo?: string
}

export interface LinhaDeAvisoProps {
  icone: NomeIcone
  /** A tinta do ícone e do texto: `offlineInk` sem rede, `muted` no resto. */
  cor: string
  motivo: string
  acao?: AcaoDoAviso
  /** §3.3: recuo de 32 dp em S1, 24 em S2. */
  recuo?: number
}

export function LinhaDeAviso({
  icone,
  cor,
  motivo,
  acao,
  recuo = space.xxl,
}: LinhaDeAvisoProps): React.JSX.Element {
  const inativo = acao?.inativo === true
  return (
    <View style={[styles.linha, { marginHorizontal: recuo }]}>
      <View style={styles.esq}>
        <Icone nome={icone} tamanho={20} cor={cor} />
        <Text style={[styles.motivo, { color: cor }]} testID="aviso-motivo">
          {motivo}
        </Text>
      </View>
      {acao !== undefined ? (
        <View style={styles.dir}>
          {inativo && acao.motivoInativo !== undefined ? (
            <Text style={styles.motivoInativo}>{acao.motivoInativo}</Text>
          ) : null}
          <Pressable
            style={[styles.alvo, inativo ? styles.alvoInativo : null]}
            onPress={() => (inativo ? undefined : acao.onPress())}
            accessibilityRole="button"
            accessibilityState={{ disabled: inativo }}
            testID="aviso-acao"
          >
            <Icone
              nome="tentar-novamente"
              tamanho={20}
              cor={inativo ? dark.lineInfo : dark.text}
              estado={inativo ? 'inerte' : 'normal'}
            />
            <Text style={[styles.acao, inativo ? styles.acaoInativa : null]}>{acao.rotulo}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  // 48 dp MÍNIMOS (§7 — "aviso 48 (novo)"; N3-D19): é o que a lista desconta
  // com uma linha de texto, e a linha cresce com o texto.
  linha: {
    minHeight: touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  esq: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  motivo: { fontFamily: font.ui, fontSize: size.bodySmall, flexShrink: 1 },
  dir: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  motivoInativo: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  // E3 (V1-PR4): desabilitado é tinta `lineInfo` na moldura, no ícone e no
  // rótulo — sem opacidade. O inativo carrega informação e deve os 3:1.
  alvo: {
    minHeight: touch.min,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  alvoInativo: { borderColor: dark.lineInfo },
  acao: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  acaoInativa: { color: dark.lineInfo },
})
