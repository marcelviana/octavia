/**
 * A FOLHA DE SETLIST — 720 × 420 dp a 100 dp do topo, sobre a tela de onde
 * veio, escurecida (DESIGN-N2 §2; molduras `N2-F-criar`, `N2-F-validacao`,
 * `N2-F-salvando`, `N2-F-falhou`, `N2-F-editar-igual`).
 *
 * Verbatim do congelado: *"Não é tela cheia: criar é um ato de dois campos, e
 * sair dele tem que custar um toque. […] o teclado do sistema cobre até 300 dp
 * de altura: a folha fica a 100 dp do topo, então os dois campos e os botões
 * continuam visíveis com o teclado aberto."*
 *
 * ## Os DOIS modos (N2-PR4), e por que é a mesma folha
 *
 * *"Mesma folha, três diferenças: ícone e título (`renomear`, novo), rótulo
 * `Salvar`, campos preenchidos."* Criar e editar são o mesmo ato de dois
 * campos; o que muda é de onde vêm os valores e para onde vai o request.
 * `Apagar` **não** mora aqui — mora em S2, com diálogo (regra 5), *"para que
 * o ato destrutivo não fique a um toque de distância do ato de digitar"*.
 *
 * **O arquivo mantém o nome `FolhaDeCriar.tsx` de propósito.** O G2 indexa
 * `testID` por ARQUIVO (`g2g3.sh`, `sed "s|^|$f\t|"`): mover os oito `form-*`
 * para um arquivo de nome novo os faria "sumir" e reprovaria o gate que
 * existe para impedir que um alvo desapareça em silêncio. O componente
 * exportado passa a se chamar `FolhaDeSetlist`; o arquivo espera a PR que
 * tiver uma razão melhor do que estética para pagar esse preço.
 *
 * ## As quatro regras que a folha obedece, e de onde vêm
 *
 * **1. Nada diz "salvo" antes do 2xx** (T2-R11, regra 1 da folha). Enquanto a
 * escrita está em voo a folha fica aberta, campos e botão inativos, e a frase
 * é do ato em curso, no presente: `Criando no servidor…`. `Cancelar` some —
 * ele sairia da tela sem cancelar a escrita, e prometer isso seria mentira.
 *
 * **2. Falhou → a folha NÃO fecha e o digitado fica** (R1·1). Fechar apagaria
 * o trabalho sem ter salvado nada. `Cancelar` vira `Fechar`: depois de uma
 * tentativa que pode ter gravado, "cancelar" prometeria desfazer, e não há
 * desfazer (regra 2).
 *
 * **3. A ordem dos três atos** (regra 3): falhou → **releitura da lista atrás
 * da folha** → só então `Tentar de novo`. Enquanto a releitura está em voo o
 * botão é `Tentar de novo` inativo com o motivo `relendo a lista…`.
 *
 * **4. Se a própria releitura falhar** (N2-D32 / Q8), não há retentativa de
 * ESCRITA: o bloco vermelho dá lugar à variante da regra 4 — a linha de aviso
 * de 48 dp — e o único botão recarrega. *"Sem estado real, repetir escrita é
 * apostar."*
 *
 * ## A faixa (N3-PR4; `DESIGN-N3/telas.html` §4, `N3-B-F-validacao`)
 *
 * *"A folha de 720 dp não cabe em 711. Ela passa a ter a largura da tela menos
 * a margem da faixa (663 em B […]) e altura de conteúdo, ancorada no topo
 * para que o teclado de 300 dp nunca cubra campo nem botão. Mesma folha,
 * mesmos campos, mesma ordem, mesmas frases de C."* Largura, topo e altura
 * mínima são token (`faixas[…].folha`, N3-D28); a linha de botões é a de C
 * (`Cancelar` à esquerda, motivo + ato à direita), que cabe em 599.
 *
 * ## O que esta folha não decide
 *
 * Nada. Quem valida é o `validarCriacao` do core (pelo `prepararCriacao`),
 * quem envia e relê é o `escrever()` do `src/escrita.ts`, e quem diz o que a
 * resposta significa é o `classificar()`. Aqui só se desenha e se encaminha —
 * é o que faz valer o "as telas usam só o que este módulo expõe" (T2-R9).
 */
import { useCallback, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import {
  dataCalendarioLocal,
  frase,
  validarAtualizacao,
  type CamposSetlist,
  type MotivoInvalido,
  type Resultado,
  type SetlistDTO,
} from '@octavia/core'
import { escrever, prepararCriacao, prepararEdicao, relerAoAbrir, type EstadoLocal } from '../escrita'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, faixas, font, radius, size, space, touch, tracking } from '../theme'
import { useFaixa } from '../useFaixa'

/**
 * O modo EDITAR (T2-R4): a setlist que se renomeia e o que o servidor tem
 * dela agora. `null` = criar. Os valores do servidor entram nos campos ao
 * abrir e são a referência do "nada mudou" (N2-D21 (iii)) — comparar com o
 * que a tela mostra, e não com o que o cache tinha na abertura do app, é o
 * que faz a terceira validação dizer a verdade.
 */
export interface Editando {
  setlistId: string
  noServidor: CamposSetlist
}

export interface FolhaDeSetlistProps {
  /** O cache de onde a escrita parte, e ao qual a releitura volta. */
  estado: EstadoLocal
  /** `null` = criar (o modo da N2-PR3); preenchido = renomear e datar. */
  editando?: Editando | null
  /** `Cancelar` / `Fechar` — sai sem ter escrito nada. */
  aoFechar: () => void
  /** 2xx com a releitura de volta: o conjunto novo, e a folha fecha. */
  aoConcluir: (setlists: SetlistDTO[] | null, syncedAtMs: number | null) => void
  /** N2-D22 — 2xx e a releitura falhou: quem avisa é a tela de trás. */
  aoSalvoNaoRelido: (nome: string) => void
  /**
   * T2-R10 — 404 numa escrita: a folha fecha e quem sai da tela é quem a
   * abriu. Só o modo editar o alcança: um `POST /api/setlists` não tem id
   * para não achar.
   *
   * **Leva o conjunto da releitura** (div. 270): o congelado manda cair em
   * S1 *"já relida"*, e uma S1 que ainda mostra a setlist que não existe
   * mais é o contrário disso.
   */
  aoSumir?: (setlists: SetlistDTO[] | null, syncedAtMs: number | null) => void
  /**
   * A releitura da lista ATRÁS da folha (regra 3) voltou. A folha **não**
   * fecha: ela continua com o digitado e com o banner, e o que muda é a lista
   * por baixo. Callback separado do `aoCriar` de propósito — a primeira forma
   * disto reusava o `aoConcluir`, e a folha fechava sozinha logo depois de
   * falhar, levando junto o que o músico tinha escrito.
   */
  aoRelerAtras: (setlists: SetlistDTO[], syncedAtMs: number | null) => void
}

/** Os quatro estados do congelado, e só eles. */
type Fase = 'editando' | 'salvando' | 'falhou'

/**
 * div. 256 — quanto o foco do campo espera depois de o `Modal` aparecer.
 * Acima dos ~300 ms do `animationType="fade"`; ver a tabela de n=10 na ref
 * `campoNome`, abaixo. Não é número de gosto: é medida de aparelho.
 */
const MS_FOCO_APOS_ANIMACAO = 350

export function FolhaDeSetlist({
  estado,
  editando = null,
  aoFechar,
  aoConcluir,
  aoSalvoNaoRelido,
  aoSumir,
  aoRelerAtras,
}: FolhaDeSetlistProps): React.JSX.Element {
  const f = faixas[useFaixa()].folha
  // Editar abre com os valores DO SERVIDOR (`N2-F-editar-igual`); criar, vazio.
  const [nome, setNome] = useState(editando?.noServidor.name ?? '')
  /** `null` = "sem data", que é estado de primeira classe (T2-R2). */
  const [data, setData] = useState<string | null>(editando?.noServidor.performance_date ?? null)
  const [calendario, setCalendario] = useState(false)
  const [fase, setFase] = useState<Fase>('editando')
  /**
   * div. 256 — o `autoFocus` não sobe o teclado dentro de um `Modal`.
   *
   * Medido no Tab S6 (`N2-PR3-anexos/ime-antes.txt`): com `autoFocus`, o campo
   * VIRA `mServedView` do IME — o dumpsys mostra o `ReactEditText` nos bounds
   * exatos do `form-nome` — e mesmo assim `mShowRequested=false`. O foco vai e
   * **ninguém pede o teclado**. Com `console.log` temporário mediu-se que o
   * `focus()` é chamado e que o campo passa de `isFocused=false` para `true`:
   * o foco nunca foi o problema, o pedido de teclado é que se perde.
   *
   * O foco passou para o `onShow` do `Modal` (`:186`) **dentro de um
   * `setTimeout` de 350 ms**, e o ATRASO é a parte que funciona. Medido neste
   * aparelho, abrindo a folha pelo botão, **n=10 por forma**:
   *
   * | forma                                      | com teclado |
   * |--------------------------------------------|-------------|
   * | `autoFocus` na montagem (o de antes)       | 0 / 1       |
   * | `focus()` direto no `onShow`               | 0 / 1       |
   * | `InteractionManager.runAfterInteractions`  | 0 / 1       |
   * | `setTimeout(…, 0)`                         | **5 / 10**  |
   * | `setTimeout(…, 150)`                       | 10 / 10     |
   * | `setTimeout(…, 350)`                       | **10 / 10** |
   *
   * **O `setTimeout(0)` é cara-ou-coroa** — e passou nas primeiras tentativas
   * porque foram amostras de UMA rodada. Só com n=10 o 5/10 apareceu. É a
   * regra da V1-PR5 outra vez: uma medição não vira referência sem n.
   *
   * Por que **350** e não 150, já que os dois deram 10/10: o `animationType`
   * desta folha é `fade` (`:184`), cuja animação no RN dura ~300 ms. Em 150 ms
   * o pedido ainda cai DENTRO da animação e passa por causa do tempo deste
   * aparelho; em 350 ms ele cai depois de a janela do modal ter assentado como
   * janela ativa do IME, que é a condição de que o teclado realmente depende.
   * **Quem mudar o `animationType` ou a duração da animação mexe neste número**
   * — e mede de novo com n, no aparelho, porque nenhum teste de tela vê isto.
   */
  const campoNome = useRef<TextInput>(null)
  const [falha, setFalha] = useState<Resultado | null>(null)
  /** Regra 3: enquanto a lista atrás da folha é relida, não há o que repetir. */
  const [relendo, setRelendo] = useState(false)
  /** N2-D32: a releitura também falhou — só `Tentar recarregar`. */
  const [releituraFalhou, setReleituraFalhou] = useState(false)

  /**
   * **A validação da RENDERIZAÇÃO é pura, e isso não é detalhe.**
   *
   * No modo editar quem sabe dizer "nada mudou" é o `validarAtualizacao` do
   * core; o `prepararEdicao` do `src/escrita.ts` **emite a linha**
   * `write blocked … reason=nada-mudou`, porque ele é o caminho do TOQUE. Se
   * a renderização o chamasse, a linha sairia a cada tecla digitada e o
   * A-N2-24 mediria um log cheio de barradas que ninguém pediu. Por isso:
   * `validarAtualizacao` aqui, `prepararEdicao` no `salvar()`.
   */
  const validacao = editando === null
    ? prepararCriacao({ name: nome, performance_date: data })
    : validarAtualizacao(editando.noServidor, { name: nome, performance_date: data })
  const podeEnviar = editando === null
    ? (validacao as { enviar: boolean }).enviar
    : (validacao as { ok: boolean }).ok
  const motivo: MotivoInvalido | null = podeEnviar
    ? null
    : ((validacao as { motivo: MotivoInvalido }).motivo)
  const salvando = fase === 'salvando'

  /**
   * A releitura da lista atrás da folha (regra 3). É o MESMO `GET` da N2-D22,
   * com `reason=reopen` e sem `op` — a leitura que mostra o estado real antes
   * de a folha oferecer repetir. Não há razão nova no conjunto fechado do
   * T2-R16 para "relê porque a escrita falhou", e inventar uma seria alargar
   * um conjunto que existe para não crescer em silêncio.
   */
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

  /**
   * O ato principal da folha, nos dois modos.
   *
   * **O toque chega aqui mesmo com o botão inativo**, e é de propósito: o
   * caso (iii) do T2-R3 — abriu, nada mudou, tocou em `Salvar` — tem linha
   * de log PRÓPRIA (`write blocked … reason=nada-mudou`, a quinta razão da
   * N2-PR2), e quem a emite é o `prepararEdicao`. Um `Pressable` que
   * engolisse o toque apagaria justamente o evento que o A-N2-24 mede. Nas
   * outras duas validações não sai linha nenhuma — o `prepararCriacao` e o
   * `validarAtualizacao` não emitem —, e é o que o T2-R3 diz: nome vazio e
   * data impossível têm o motivo escrito ao lado, não no log.
   */
  const salvar = useCallback(async () => {
    if (salvando) return
    const preparo = editando === null
      ? prepararCriacao({ name: nome, performance_date: data })
      : prepararEdicao(editando.setlistId, editando.noServidor, { name: nome, performance_date: data })
    if (!preparo.enviar) return
    setFase('salvando')
    setFalha(null)
    setReleituraFalhou(false)
    const saida = await escrever(preparo.pedido, estado, { contexto: 'setlist' })
    const { especie } = saida.resultado
    if (especie === 'ok') {
      aoConcluir(saida.setlists, saida.syncedAtMs)
      return
    }
    if (especie === 'ok-nao-relido') {
      // Regra 4: nunca "salvo" limpo, nunca "falhou". O servidor CONFIRMOU —
      // a folha fecha e quem avisa é a tela de trás, que é onde o objeto da
      // frase está (div. 227).
      aoSalvoNaoRelido(nome.trim())
      return
    }
    if (especie === 'sumiu' && aoSumir !== undefined) {
      // T2-R10 — a releitura do 404 já aconteceu (é do `escrever`); o que
      // falta é abandonar a tela COM o que ela trouxe, e quem a abandona é
      // quem abriu a folha.
      aoSumir(saida.setlists, saida.syncedAtMs)
      return
    }
    setFalha(saida.resultado)
    setFase('falhou')
    void relerAtras()
  }, [salvando, editando, nome, data, estado, aoConcluir, aoSalvoNaoRelido, aoSumir, relerAtras])

  /**
   * T2-R2 — `YYYY-MM-DD` pelos componentes LOCAIS do `Date` que o seletor do
   * sistema devolveu, **nunca** `toISOString()`: às 23:30 num fuso a oeste o
   * ISO devolve o DIA SEGUINTE, e o show de sábado vira domingo no servidor.
   * Quem faz a conta é o `dataCalendarioLocal` do core, que é a mesma do
   * `hoje()` do prefetch.
   */
  const aoEscolherData = useCallback((evento: DateTimePickerEvent, escolhida?: Date) => {
    setCalendario(false)
    if (evento.type !== 'set' || escolhida === undefined) return
    setData(dataCalendarioLocal(escolhida))
  }, [])

  const editavel = fase !== 'salvando'
  const podeSalvar = podeEnviar && !salvando
  /** As três diferenças do congelado, e só elas. */
  const iconeDoTitulo: NomeIcone = editando === null ? 'nova-setlist' : 'renomear'
  const titulo = editando === null ? 'Nova setlist' : 'Renomear e datar'
  const rotuloDoAto = editando === null ? 'Criar' : 'Salvar'

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={aoFechar}
      // div. 256 — o foco vai aqui, e não no `autoFocus` do campo, e com o
      // atraso de 350 ms: sem ele o teclado sobe em metade das aberturas.
      // Ver a tabela das seis formas medidas (n=10) no comentário da ref.
      onShow={() => {
        setTimeout(() => campoNome.current?.focus(), MS_FOCO_APOS_ANIMACAO)
      }}
    >
      <View style={styles.cortina}>
        <View style={[styles.folha, { width: f.largura, marginTop: f.topo, minHeight: f.alturaMin }]}>
          <View style={styles.cabeca}>
            <Icone nome={iconeDoTitulo} tamanho={24} cor={dark.accentInk} />
            {/* `telas.html`, molduras `N2-F-criar` e `N2-F-editar-igual`. */}
            <Text style={styles.titulo}>{titulo}</Text>
          </View>

          {fase === 'falhou' && falha !== null ? (
            <BlocoDeFalha
              falha={falha}
              relendo={relendo}
              caiu={releituraFalhou}
              criando={editando === null}
            />
          ) : null}

          <View style={styles.campos}>
            <Campo rotulo="Nome">
              <TextInput
                value={nome}
                onChangeText={setNome}
                editable={editavel}
                // Congelado: "Ao abrir, o nome já está em foco e o teclado sobe."
                // O foco é dado pelo `onShow` do `Modal` acima, não por
                // `autoFocus`: dentro de um modal o `autoFocus` dá foco e NÃO
                // sobe o teclado (div. 256).
                ref={campoNome}
                style={[styles.entrada, motivo === 'nome-vazio' ? styles.entradaComErro : null]}
                placeholderTextColor={dark.lineInfo}
                testID="form-nome"
              />
              {motivo === 'nome-vazio' ? <Erro texto={frase('nome-vazio')} testID="form-erro-nome" /> : null}
            </Campo>

            <Campo rotulo="Data do show" apoio="opcional">
              <View style={styles.linhaDoCampo}>
                <Pressable
                  style={[
                    styles.entrada,
                    styles.entradaToque,
                    styles.entradaLarga,
                    motivo === 'data-impossivel' ? styles.entradaComErro : null,
                  ]}
                  onPress={() => (editavel ? setCalendario(true) : undefined)}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !editavel }}
                  testID="form-data"
                >
                  {/* `dd / mm / aaaa` é placeholder, não valor — tinta `lineInfo`. */}
                  <Text style={data === null ? styles.placeholder : styles.valor}>
                    {data === null ? 'dd / mm / aaaa' : formatar(data)}
                  </Text>
                </Pressable>
                {/*
                  **Errata N2-E8 — o controle que o congelado não desenha e a
                  regra exige.** A legenda de `N2-F-editar-igual` diz, verbatim:
                  *"Limpar a data é permitido e conta como mudança: a data é
                  opcional na criação e continua opcional depois."* O seletor
                  do sistema **não sabe devolver "sem data"** (é o outro lado
                  da div. 244, que já registrou o que ele não sabe produzir),
                  então sem um controle próprio a permissão do congelado é
                  inalcançável pela UI. Ele só existe quando há data para
                  limpar, e por isso não muda nenhuma moldura desenhada.
                */}
                {data !== null ? (
                  <Pressable
                    style={styles.limpar}
                    onPress={() => (editavel ? setData(null) : undefined)}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !editavel }}
                    testID="form-data-limpar"
                  >
                    <Icone nome="fechar" tamanho={20} cor={dark.accentInk} />
                    <Text style={styles.limparTexto}>Limpar</Text>
                  </Pressable>
                ) : null}
              </View>
              {motivo === 'data-impossivel' ? <Erro texto={frase('data-impossivel')} testID="form-erro-data" /> : null}
            </Campo>
          </View>

          {calendario ? (
            <DateTimePicker value={new Date()} mode="date" display="calendar" onChange={aoEscolherData} />
          ) : null}

          {salvando ? (
            <View style={styles.rodape}>
              <View style={styles.progresso}>
                <Icone nome="baixando" tamanho={24} cor={dark.accentInk} />
                <Text style={styles.progressoTexto}>{frase(editando === null ? 'criando' : 'salvando')}</Text>
              </View>
              {/*
                div. 254, fechada aqui: o ramo `salvando` renderizava o botão
                **sem `testID`**, e o G6 ficava sem `resource-id` próprio para
                o estado `N2-F-salvando`. O alvo é o mesmo dos outros dois
                ramos, e agora tem o mesmo nome.
              */}
              <BotaoCheio rotulo={rotuloDoAto} inativo onPress={() => undefined} testID="form-salvar" />
            </View>
          ) : fase === 'falhou' ? (
            <View style={styles.rodape}>
              <BotaoVazado rotulo="Fechar" onPress={aoFechar} testID="form-cancelar" />
              <View style={styles.acaoComMotivo}>
                {relendo ? (
                  <Text style={styles.motivoInativo} testID="form-salvar-motivo">
                    {frase('relendo-a-lista')}
                  </Text>
                ) : null}
                {/*
                  N2-D32 / Q8 — quando a PRÓPRIA releitura falha não há
                  retentativa de ESCRITA: o único botão recarrega. *"Sem estado
                  real, repetir escrita é apostar."*

                  **Divergência declarada (247).** O congelado diz, verbatim,
                  que aqui a folha mostra *"a variante da regra 4 no lugar do
                  banner vermelho"* — e a variante da regra 4 é a frase
                  `salvo-nao-relido`, que começa por "foi criada". Dentro desta
                  folha esse texto seria MENTIRA: o único jeito de chegar a
                  "releitura falhou" aqui é depois de uma escrita que **não**
                  passou (o 2xx com releitura falha fecha a folha e vira aviso
                  de S1, N2-D22). O banner FICA — ele diz a verdade sobre a
                  escrita, incluindo o "pode já ter sido gravada" quando é o
                  caso — e o que muda é só o botão, que é exatamente o que a
                  N2-D32 prescreve.
                */}
                <BotaoCheio
                  rotulo={releituraFalhou ? 'Tentar recarregar' : 'Tentar de novo'}
                  inativo={relendo}
                  onPress={() => (releituraFalhou ? void relerAtras() : void salvar())}
                  testID="form-tentar"
                />
              </View>
            </View>
          ) : (
            <View style={styles.rodape}>
              <BotaoVazado rotulo="Cancelar" onPress={aoFechar} testID="form-cancelar" />
              <View style={styles.acaoComMotivo}>
                {/* R1·7c: o motivo do inativo é a MESMA frase do campo que
                    bloqueia; com duas validações abertas vale a do campo mais
                    alto, e a ordem é a do `validarCriacao` (nome, depois data). */}
                {motivo !== null ? (
                  <Text style={styles.motivoInativo} testID="form-salvar-motivo">
                    {frase(motivo)}
                  </Text>
                ) : null}
                <BotaoCheio
                  rotulo={rotuloDoAto}
                  inativo={!podeSalvar}
                  onPress={() => void salvar()}
                  testID="form-salvar"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

/**
 * O bloco de falha (`N2-F-falhou`): *"Duas frases, dois papéis: a do servidor,
 * em mono, diz **o que houve**; a segunda, minha e fixa, diz **o que fazer** —
 * e ela só aparece em criar e adicionar, os dois casos em que a escrita pode
 * ter passado."* Quem sabe se pode ter passado é o core (`podeTerGravado`),
 * que só o diz na rede e só em `create`/`add`.
 */
function BlocoDeFalha({
  falha,
  relendo,
  caiu,
  criando,
}: {
  falha: Resultado
  relendo: boolean
  caiu: boolean
  criando: boolean
}): React.JSX.Element {
  return (
    <View style={styles.falha} testID="form-falha">
      <View style={styles.falhaCabeca}>
        <Icone nome="falha" tamanho={24} cor={dark.errorInk} />
        {/* Dois títulos, dois atos (N2-E7): o `N2-F-falhou` diz "Não foi
            possível criar"; o `N2-X-falhou` de S2, "Não foi possível salvar". */}
        <Text style={styles.falhaTitulo}>{frase(criando ? 'falhou-criar' : 'falhou-salvar')}</Text>
      </View>
      <Text style={styles.falhaCausa}>{falha.frase}</Text>
      {falha.podeTerGravado && !relendo && !caiu ? (
        <Text style={styles.falhaConselho}>{frase('pode-ter-gravado-folha')}</Text>
      ) : null}
    </View>
  )
}

function Campo({ rotulo, apoio, children }: { rotulo: string; apoio?: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <View style={styles.campo}>
      <Text style={styles.rotuloDoCampo}>
        {rotulo}
        {apoio !== undefined ? <Text style={styles.apoioDoCampo}>{` · ${apoio}`}</Text> : null}
      </Text>
      {children}
    </View>
  )
}

function Erro({ texto, testID }: { texto: string; testID: string }): React.JSX.Element {
  return (
    <View style={styles.erro}>
      <Icone nome="falha" tamanho={20} cor={dark.errorInk} />
      <Text style={styles.erroTexto} testID={testID}>
        {texto}
      </Text>
    </View>
  )
}

/**
 * O único botão cheio da tela 2 (§2): *"uma folha modal tem um ato principal,
 * e ele é o que fecha a folha"*. Inativo é o desenho INTEIRO em `lineInfo` com
 * traço 1,25 — a exceção R2·2 do anexo D: o visto não é amputável, porque sem
 * a haste longa sobram 4 dp de traço, que se leem como caractere perdido.
 *
 * **O `onPress` roda mesmo inativo** (N2-PR4), e quem decide o que fazer é o
 * `salvar()`: o caso (iii) do T2-R3 tem linha de log própria, e ela nasce
 * exatamente de um toque num botão que não aceita o ato. O `enabled=false` do
 * dump continua vindo do `accessibilityState`, que é o que o G5/G6 lê.
 */
function BotaoCheio({
  rotulo,
  inativo = false,
  onPress,
  testID,
}: {
  rotulo: string
  inativo?: boolean
  onPress: () => void
  testID?: string
}): React.JSX.Element {
  return (
    <Pressable
      style={[styles.cheio, inativo ? styles.cheioInativo : null]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      testID={testID}
    >
      <Icone nome="garantida" tamanho={24} cor={inativo ? dark.lineInfo : dark.bg} estado={inativo ? 'inerte' : 'normal'} />
      <Text style={[styles.cheioTexto, inativo ? styles.cheioTextoInativo : null]}>{rotulo}</Text>
    </Pressable>
  )
}

function BotaoVazado({ rotulo, onPress, testID }: { rotulo: string; onPress: () => void; testID: string }): React.JSX.Element {
  return (
    <Pressable style={styles.vazado} onPress={onPress} accessibilityRole="button" testID={testID}>
      <Text style={styles.vazadoTexto}>{rotulo}</Text>
    </Pressable>
  )
}

/** `2026-10-03` → `03 / 10 / 2026`, como a moldura escreve. Sem fuso. */
function formatar(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia} / ${mes} / ${ano}`
}

const styles = StyleSheet.create({
  // A folha escurece a tela atrás — não é tela cheia (§2).
  cortina: { flex: 1, backgroundColor: '#000000A8', alignItems: 'center' },
  // 720 × 420 a 100 dp do topo em C (663 × conteúdo a 96 em B — a faixa):
  // com o teclado de até 300 dp, campos e botões continuam visíveis.
  folha: {
    padding: space.xxl,
    gap: space.xl,
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
  campos: { gap: space.lg },
  campo: { gap: space.sm },
  rotuloDoCampo: { color: dark.muted, fontFamily: font.ui, fontSize: size.label },
  apoioDoCampo: { color: dark.lineInfo },
  // Campo de 60 dp (§2 — "campo 60").
  entrada: {
    height: 60,
    paddingHorizontal: space.lg,
    color: dark.text,
    fontFamily: font.ui,
    fontSize: size.input,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  entradaToque: { justifyContent: 'center' },
  // O campo de data e o `Limpar` na mesma linha (errata N2-E8): o campo
  // continua com a largura toda quando não há data para limpar.
  linhaDoCampo: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  entradaLarga: { flex: 1 },
  limpar: {
    height: touch.min,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  limparTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  entradaComErro: { borderColor: dark.errorInk },
  placeholder: { color: dark.lineInfo, fontFamily: font.ui, fontSize: size.input },
  valor: { color: dark.text, fontFamily: font.ui, fontSize: size.input },
  erro: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  erroTexto: { color: dark.errorInk, fontFamily: font.ui, fontSize: size.bodySmall },
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
  // A causa do servidor em MONO, como a moldura desenha.
  falhaCausa: { color: dark.errorInk, fontFamily: font.mono, fontSize: size.label },
  falhaConselho: { color: dark.muted, fontFamily: font.ui, fontSize: size.bodySmall, lineHeight: size.bodySmall * 1.45 },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.lg },
  acaoComMotivo: { flexDirection: 'row', alignItems: 'center', gap: space.md, flexShrink: 1 },
  motivoInativo: { color: dark.muted, fontFamily: font.ui, fontSize: size.bodySmall, flexShrink: 1 },
  progresso: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progressoTexto: { color: dark.accentInk, fontFamily: font.ui, fontSize: size.bodySmall },
  // Botões de 58 dp (§2 — "botões 58").
  cheio: {
    height: 58,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.control,
    backgroundColor: dark.text,
  },
  // E3: inativo é tinta na moldura, no ícone e no rótulo — sem opacidade.
  cheioInativo: { backgroundColor: 'transparent', borderWidth: bar.hairline, borderColor: dark.lineInfo },
  cheioTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.button },
  cheioTextoInativo: { color: dark.lineInfo },
  vazado: {
    height: 58,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  vazadoTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.button },
})
