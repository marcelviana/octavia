/**
 * O DIÁLOGO DE APAGAR — 620 × 300 dp (DESIGN-N2 §6, moldura `N2-D-apagar`;
 * T2-R5, N2-D14, N2-D28).
 *
 * **Por que apagar tem diálogo e remover não** (N2-D28, Q4): *"Apagar a
 * setlist tem diálogo; tirar uma música de uma lista de sete, não."* Remover
 * é reversível em três toques; apagar não é reversível de jeito nenhum — não
 * há "desfazer" nesta tela 2 e o congelado proíbe prometê-lo.
 *
 * **Os quatro itens obrigatórios da regra 5, nesta ordem**: o nome, a
 * contagem, a frase dos arquivos baixados, dois botões. *"Os rótulos dizem o
 * que fazem — `Manter a setlist` e `Apagar`, nunca `Cancelar` / `OK`."*
 *
 * **O destrutivo fica à direita, no lugar do ato principal**, e é o único
 * botão da folha com contorno em `errorInk` e rótulo em `text` — *"não é
 * botão cheio, porque cheio é o que se toca sem ler"*.
 *
 * ## O que este diálogo NÃO decide
 *
 * Nada. Quem envia, relê e classifica é o `escrever()` do `src/escrita.ts`;
 * aqui se desenha, se encaminha e se mostra o que voltou. A sequência é a do
 * congelado: *"Toque em `Apagar`: o diálogo fica, os dois botões inativam e a
 * frase passa a `Apagando no servidor…`. Confirmado, o diálogo fecha, volta
 * para S1 e S1 relê."*
 *
 * E a falha, verbatim: *"O diálogo **não fecha**. A frase `Apagando no
 * servidor…` é substituída pelo bloco de falha do `N2-F-falhou` (triângulo de
 * 24, causa do servidor em mono) e os dois botões voltam, com `Apagar`
 * virando `Tentar de novo` — depois da releitura de S2 atrás do diálogo,
 * nunca antes (regra 3). Não há a segunda linha de 'pode já ter sido
 * gravada': se tiver sido, a releitura mostra a setlist sumindo, e aí vale o
 * 404."* — e essa ausência é por construção, não por omissão: o
 * `podeTerGravado` do core só é verdade em `create` e `add`.
 *
 * **Sem rede o diálogo não abre** — o controle da faixa já está inativo com o
 * motivo na linha de aviso (§7). Quem o barra é S2.
 */
import { useCallback, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { frase, perguntaDeApagar, type Resultado, type SetlistDTO } from '@octavia/core'
import { escrever, pedidoApagar, relerAoAbrir, type EstadoLocal } from '../escrita'
import { Icone } from '../icones/Icone'
import { bar, dark, font, radius, size, space, touch, tracking } from '../theme'

export interface DialogoDeApagarProps {
  setlist: SetlistDTO
  estado: EstadoLocal
  /** `Manter a setlist` — fecha sem escrever nada. */
  aoManter: () => void
  /**
   * 200: a setlist não existe mais, e quem sai de S2 é quem abriu o diálogo.
   *
   * **Leva o conjunto da releitura**, e isso não é detalhe de assinatura:
   * medido no §4, a primeira forma disto não o levava, o cache ficava certo
   * (quem o grava é o `escrita.ts`) e **S1 voltava mostrando a setlist
   * apagada** até o próximo sync. `[div. 270]`
   */
  aoApagar: (setlists: SetlistDTO[] | null, syncedAtMs: number | null) => void
  /** T2-R10 — 404: já tinha sido apagada em outro lugar (N2-D12). Idem. */
  aoSumir: (setlists: SetlistDTO[] | null, syncedAtMs: number | null) => void
  /** N2-D22 — 2xx com a releitura falhando: o aviso é de S1, na volta. */
  aoSalvoNaoRelido: () => void
  /** A releitura de trás do diálogo trouxe conjunto novo (regra 3). */
  aoRelerAtras: (setlists: SetlistDTO[], syncedAtMs: number | null) => void
}

type Fase = 'perguntando' | 'apagando' | 'falhou'

export function DialogoDeApagar({
  setlist,
  estado,
  aoManter,
  aoApagar,
  aoSumir,
  aoSalvoNaoRelido,
  aoRelerAtras,
}: DialogoDeApagarProps): React.JSX.Element {
  const [fase, setFase] = useState<Fase>('perguntando')
  const [falha, setFalha] = useState<Resultado | null>(null)
  const [relendo, setRelendo] = useState(false)
  const [releituraFalhou, setReleituraFalhou] = useState(false)

  /** A releitura de S2 atrás do diálogo — a mesma da regra 3, `reason=reopen`. */
  const relerAtras = useCallback(async () => {
    setRelendo(true)
    try {
      const novas = await relerAoAbrir(estado)
      setReleituraFalhou(novas === null)
      if (novas !== null) aoRelerAtras(novas, Date.now())
    } finally {
      setRelendo(false)
    }
  }, [estado, aoRelerAtras])

  const apagar = useCallback(async () => {
    if (fase === 'apagando') return
    setFase('apagando')
    setFalha(null)
    setReleituraFalhou(false)
    const saida = await escrever(pedidoApagar(setlist.id), estado, { contexto: 'setlist' })
    const { especie } = saida.resultado
    if (especie === 'ok') {
      aoApagar(saida.setlists, saida.syncedAtMs)
      return
    }
    if (especie === 'ok-nao-relido') {
      // Regra 4: o servidor CONFIRMOU. A setlist foi apagada — o que não se
      // conseguiu foi reler a lista, e quem diz isso é S1, que é onde a lista
      // está.
      aoSalvoNaoRelido()
      return
    }
    if (especie === 'sumiu') {
      // N2-D12 (#307): já tinha sido apagada em outro aparelho. O app não
      // trata como erro grave — a releitura já aconteceu, e S1 diz o que
      // houve, **com a lista que a releitura trouxe** (div. 270).
      aoSumir(saida.setlists, saida.syncedAtMs)
      return
    }
    setFalha(saida.resultado)
    setFase('falhou')
    void relerAtras()
  }, [fase, setlist, estado, aoApagar, aoSalvoNaoRelido, aoSumir, relerAtras])

  const apagando = fase === 'apagando'
  const n = setlist.setlist_songs.length

  return (
    <Modal visible transparent animationType="fade" onRequestClose={aoManter}>
      <View style={styles.cortina}>
        <View style={styles.dialogo}>
          <View style={styles.cabeca}>
            <Icone nome="apagar-setlist" tamanho={24} cor={dark.errorInk} />
            <Text style={styles.titulo}>Apagar a setlist</Text>
          </View>

          {/* Item 1 e 2 da regra 5: o nome e a contagem. São DADO — quem monta
              a pergunta é o core, que é onde a redação mora (div. 227). */}
          <Text style={styles.pergunta}>{perguntaDeApagar(setlist.name, n)}</Text>
          {/* Item 3: o que NÃO se perde. */}
          <Text style={styles.arquivos}>{frase('apagar-arquivos')}</Text>

          {fase === 'falhou' && falha !== null ? (
            <View style={styles.falha} testID="apagar-falha">
              <View style={styles.falhaCabeca}>
                <Icone nome="falha" tamanho={24} cor={dark.errorInk} />
                <Text style={styles.falhaTitulo}>{frase('falhou-salvar')}</Text>
              </View>
              <Text style={styles.falhaCausa}>{falha.frase}</Text>
            </View>
          ) : null}

          <View style={styles.rodape}>
            {/*
              **Os DOIS botões inativam, e nenhum some** (§6, verbatim: *"o
              diálogo fica, os dois botões inativam e a frase passa a
              `Apagando no servidor…`"*).

              É o contrário da folha de criar, e de propósito: lá o `Cancelar`
              SOME durante a escrita porque ele prometeria cancelar o que já
              está em voo (regra 1). Aqui o par de botões é a própria pergunta
              do diálogo — tirar um deles do lugar no meio do ato mudaria a
              pergunta debaixo de quem está lendo. `[medido no §4: a primeira
              forma disto somia com o Manter, e o aparelho mostrou o congelado
              a dizer outra coisa — div. 269]`
            */}
            <Pressable
              style={[styles.manter, apagando ? styles.manterInativo : null]}
              onPress={() => (apagando ? undefined : aoManter())}
              accessibilityRole="button"
              accessibilityState={{ disabled: apagando }}
              testID="apagar-manter"
            >
              <Text style={[styles.manterTexto, apagando ? styles.textoInativo : null]}>
                Manter a setlist
              </Text>
            </Pressable>

            <View style={styles.acaoComMotivo}>
              {apagando ? (
                <View style={styles.progresso}>
                  <Icone nome="baixando" tamanho={24} cor={dark.accentInk} />
                  <Text style={styles.progressoTexto}>{frase('apagando')}</Text>
                </View>
              ) : null}
              {relendo ? (
                <Text style={styles.motivoInativo} testID="apagar-motivo">
                  {frase('relendo-a-lista')}
                </Text>
              ) : null}
              <Pressable
                style={[styles.destrutivo, apagando || relendo ? styles.destrutivoInativo : null]}
                onPress={() => (apagando || relendo ? undefined : void apagar())}
                accessibilityRole="button"
                accessibilityState={{ disabled: apagando || relendo }}
                testID="apagar-confirmar"
              >
                <Icone
                  nome="apagar-setlist"
                  tamanho={24}
                  cor={apagando || relendo ? dark.lineInfo : dark.errorInk}
                  estado={apagando || relendo ? 'inerte' : 'normal'}
                />
                <Text style={[styles.destrutivoTexto, apagando || relendo ? styles.textoInativo : null]}>
                  {/* N2-D32: quando a própria releitura falha não há retentativa
                      de ESCRITA — o único botão recarrega. É a mesma decisão
                      que a folha de criar tomou (N2-E3). */}
                  {fase === 'falhou' ? (releituraFalhou ? 'Tentar recarregar' : 'Tentar de novo') : 'Apagar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

/**
 * Medidas da moldura `N2-D-apagar`: diálogo 620 × 300, botões 58. Onde a
 * moldura usa número fora das escalas do `theme.ts` entra o degrau mais
 * próximo (errata E10 do V1); ficam como literal, declarados, os que não têm
 * degrau nem escala — as duas dimensões do diálogo e a altura de 58 dos
 * botões, que é a mesma da folha.
 */
const styles = StyleSheet.create({
  cortina: { flex: 1, backgroundColor: '#000000A8', alignItems: 'center', justifyContent: 'center' },
  dialogo: {
    width: 620,
    minHeight: 300,
    padding: space.xxl,
    gap: space.lg,
    backgroundColor: dark.bg,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  cabeca: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  titulo: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.label,
  },
  pergunta: { color: dark.text, fontFamily: font.uiBold, fontSize: size.input },
  arquivos: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: size.bodySmall,
    lineHeight: size.bodySmall * 1.45,
  },
  falha: {
    padding: space.lg,
    gap: space.sm,
    borderWidth: bar.hairline,
    borderColor: dark.errorInk,
    borderRadius: radius.control,
    backgroundColor: `${dark.errorInk}12`,
  },
  falhaCabeca: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  falhaTitulo: { color: dark.errorInk, fontFamily: font.uiBold, fontSize: size.body },
  falhaCausa: { color: dark.errorInk, fontFamily: font.mono, fontSize: size.label },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
    marginTop: 'auto',
  },
  acaoComMotivo: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexShrink: 1 },
  motivoInativo: { color: dark.muted, fontFamily: font.ui, fontSize: size.bodySmall, flexShrink: 1 },
  progresso: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progressoTexto: { color: dark.accentInk, fontFamily: font.ui, fontSize: size.bodySmall },
  manter: {
    height: 58,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  manterInativo: { borderColor: dark.lineInfo },
  manterTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.button },
  // O único contorno em `errorInk` da tela 2 (§3.1, a primeira exceção).
  destrutivo: {
    height: 58,
    minWidth: touch.min,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.errorInk,
    borderRadius: radius.control,
  },
  // E3: inativo é tinta na moldura, no ícone e no rótulo — sem opacidade.
  destrutivoInativo: { borderColor: dark.lineInfo },
  destrutivoTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.button },
  textoInativo: { color: dark.lineInfo },
})
