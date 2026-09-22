/**
 * A FOLHA DE CRIAR — 720 × 420 dp a 100 dp do topo, sobre a tela de onde veio,
 * escurecida (DESIGN-N2 §2; molduras `N2-F-criar`, `N2-F-validacao`,
 * `N2-F-salvando`, `N2-F-falhou`).
 *
 * Verbatim do congelado: *"Não é tela cheia: criar é um ato de dois campos, e
 * sair dele tem que custar um toque. […] o teclado do sistema cobre até 300 dp
 * de altura: a folha fica a 100 dp do topo, então os dois campos e os botões
 * continuam visíveis com o teclado aberto."*
 *
 * **O modo "renomear e datar" NÃO está aqui** — é da PR-4, com a faixa de
 * edição de S2 que o abre. Esta folha só cria.
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
 * ## O que esta folha não decide
 *
 * Nada. Quem valida é o `validarCriacao` do core (pelo `prepararCriacao`),
 * quem envia e relê é o `escrever()` do `src/escrita.ts`, e quem diz o que a
 * resposta significa é o `classificar()`. Aqui só se desenha e se encaminha —
 * é o que faz valer o "as telas usam só o que este módulo expõe" (T2-R9).
 */
import { useCallback, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import {
  dataCalendarioLocal,
  frase,
  type MotivoInvalido,
  type Resultado,
  type SetlistDTO,
} from '@octavia/core'
import { escrever, prepararCriacao, relerAoAbrir, type EstadoLocal } from '../escrita'
import { Icone } from '../icones/Icone'
import { bar, dark, font, radius, size, space, tracking } from '../theme'

export interface FolhaDeCriarProps {
  /** O cache de onde a escrita parte, e ao qual a releitura volta. */
  estado: EstadoLocal
  /** `Cancelar` / `Fechar` — sai sem ter criado nada. */
  aoFechar: () => void
  /** 2xx com a releitura de volta: o conjunto novo, e a folha fecha. */
  aoCriar: (setlists: SetlistDTO[] | null, syncedAtMs: number | null) => void
  /** N2-D22 — 2xx e a releitura falhou: quem avisa é S1, nomeando a setlist. */
  aoSalvoNaoRelido: (nome: string) => void
  /**
   * A releitura da lista ATRÁS da folha (regra 3) voltou. A folha **não**
   * fecha: ela continua com o digitado e com o banner, e o que muda é a lista
   * por baixo. Callback separado do `aoCriar` de propósito — a primeira forma
   * disto reusava o `aoCriar`, e a folha fechava sozinha logo depois de
   * falhar, levando junto o que o músico tinha escrito.
   */
  aoRelerAtras: (setlists: SetlistDTO[], syncedAtMs: number | null) => void
}

/** Os quatro estados do congelado, e só eles. */
type Fase = 'editando' | 'salvando' | 'falhou'

export function FolhaDeCriar({ estado, aoFechar, aoCriar, aoSalvoNaoRelido, aoRelerAtras }: FolhaDeCriarProps): React.JSX.Element {
  const [nome, setNome] = useState('')
  /** `null` = "sem data", que é estado de primeira classe (T2-R2). */
  const [data, setData] = useState<string | null>(null)
  const [calendario, setCalendario] = useState(false)
  const [fase, setFase] = useState<Fase>('editando')
  const [falha, setFalha] = useState<Resultado | null>(null)
  /** Regra 3: enquanto a lista atrás da folha é relida, não há o que repetir. */
  const [relendo, setRelendo] = useState(false)
  /** N2-D32: a releitura também falhou — só `Tentar recarregar`. */
  const [releituraFalhou, setReleituraFalhou] = useState(false)

  const preparo = prepararCriacao({ name: nome, performance_date: data })
  const motivo: MotivoInvalido | null = preparo.enviar ? null : preparo.motivo
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

  const criar = useCallback(async () => {
    // O botão nasce inativo quando a validação bloqueia (N2-D23): um toque
    // aqui não é um toque num controle de escrita, e não gera linha de log.
    if (!preparo.enviar || salvando) return
    setFase('salvando')
    setFalha(null)
    setReleituraFalhou(false)
    const saida = await escrever(preparo.pedido, estado, { contexto: 'setlist' })
    const { especie } = saida.resultado
    if (especie === 'ok') {
      aoCriar(saida.setlists, saida.syncedAtMs)
      return
    }
    if (especie === 'ok-nao-relido') {
      // Regra 4: nunca "salvo" limpo, nunca "falhou". O servidor CONFIRMOU —
      // a folha fecha e quem avisa é S1, que é onde o objeto da frase não
      // está visível (div. 227).
      aoSalvoNaoRelido(nome.trim())
      return
    }
    setFalha(saida.resultado)
    setFase('falhou')
    void relerAtras()
  }, [preparo, salvando, estado, aoCriar, aoSalvoNaoRelido, nome, relerAtras])

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
  const podeCriar = preparo.enviar && !salvando

  return (
    <Modal visible transparent animationType="fade" onRequestClose={aoFechar}>
      <View style={styles.cortina}>
        <View style={styles.folha}>
          <View style={styles.cabeca}>
            <Icone nome="nova-setlist" tamanho={24} cor={dark.accentInk} />
            {/* `telas.html`, moldura `N2-F-criar` — o título da folha. */}
            <Text style={styles.titulo}>Nova setlist</Text>
          </View>

          {fase === 'falhou' && falha !== null ? <BlocoDeFalha falha={falha} relendo={relendo} caiu={releituraFalhou} /> : null}

          <View style={styles.campos}>
            <Campo rotulo="Nome">
              <TextInput
                value={nome}
                onChangeText={setNome}
                editable={editavel}
                // Congelado: "Ao abrir, o nome já está em foco e o teclado sobe."
                autoFocus
                style={[styles.entrada, motivo === 'nome-vazio' ? styles.entradaComErro : null]}
                placeholderTextColor={dark.lineInfo}
                testID="form-nome"
              />
              {motivo === 'nome-vazio' ? <Erro texto={frase('nome-vazio')} testID="form-erro-nome" /> : null}
            </Campo>

            <Campo rotulo="Data do show" apoio="opcional">
              <Pressable
                style={[styles.entrada, styles.entradaToque, motivo === 'data-impossivel' ? styles.entradaComErro : null]}
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
                <Text style={styles.progressoTexto}>{frase('criando')}</Text>
              </View>
              <BotaoCheio rotulo="Criar" inativo onPress={() => undefined} />
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
                  onPress={() => (releituraFalhou ? void relerAtras() : void criar())}
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
                  rotulo="Criar"
                  inativo={!podeCriar}
                  onPress={() => void criar()}
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
function BlocoDeFalha({ falha, relendo, caiu }: { falha: Resultado; relendo: boolean; caiu: boolean }): React.JSX.Element {
  return (
    <View style={styles.falha} testID="form-falha">
      <View style={styles.falhaCabeca}>
        <Icone nome="falha" tamanho={24} cor={dark.errorInk} />
        <Text style={styles.falhaTitulo}>{frase('falhou-criar')}</Text>
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
      onPress={() => (inativo ? undefined : onPress())}
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
  // 720 × 420 a 100 dp do topo: com o teclado de até 300 dp, campos e botões
  // continuam visíveis.
  folha: {
    marginTop: 100,
    width: 720,
    minHeight: 420,
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
