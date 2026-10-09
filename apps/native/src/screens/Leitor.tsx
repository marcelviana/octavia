/**
 * O LEITOR DO PALCO, COMPARTILHADO — N4-PR8 (N4-D24: *"o corpo da música na visualização usa o mesmo leitor do
 * palco"*; `N4-REQUISITOS.md` N4-R13, N4-R15).
 *
 * O que mora aqui é COMO o corpo se desenha — e só isso: o texto (mono, a entrelinha do texto ou da tablatura, sem
 * quebra de linha: o corpo dentro de uma rolagem HORIZONTAL, T1-R25/R31), o PDF do disco (S3d), os placeholders (o
 * S3e, o baixando, o item inválido, o formato) e as medidas do corpo do palco. Os literais `560` (a largura máxima do
 * apoio, o da S1 e da S4) vieram do palco como estavam. O palco
 * (`StageScreen.tsx`) e a visualização (`VisualizacaoScreen.tsx`) importam daqui; **o palco desenha exatamente o que
 * desenhava** — a prova é o G-inv 18/18 da `B3-referencia-paisagem/` (o palco com setlist, nó a nó) e 34/34 da
 * `B5-baseline/`. Uma mudança aqui muda os dois, e o G-inv a vê (o controle negativo do `N4-PR8-anexos/README.md`).
 *
 * O que NÃO mora aqui: os controles de tocar (rolagem automática, zoom, tema, as bordas de virar página) e a máquina
 * do arquivo do palco (o `buscarArquivo` e as linhas de log dele) — a visualização não toca, e as linhas de log do
 * palco não mudam de arquivo (G3). Os `testID` também ficam com quem desenha: cada tela passa o seu (o G2 coleta por
 * arquivo).
 *
 * QL-PR3 — A QUEBRA DE LINHA (`docs/native/QL-REQUISITOS.md` QL-R10…QL-R13; QL-D43, QL-D45). O corpo da Letra e da
 * Cifra passa a se desenhar nas LINHAS VISUAIS do `quebrar` do core, nas colunas que cabem na coluna do leitor:
 *   - as duas medidas (QL-R2): a largura do contêiner do corpo, menos o respiro de 2 × 32, e a de um caractere da mono
 *     no zoom corrente — um `Text` fora da tela, medido uma vez por zoom (como a régua de desenvolvimento mede); as
 *     colunas são ⌊coluna ÷ caractere⌋ (`colunasDoLeitor`);
 *   - a proteção (QL-D43): `quebrar` só é chamada com as duas medidas feitas e as colunas no domínio do contrato
 *     (inteiro > 2); até lá, e na Tab (R4), o corpo é o de hoje;
 *   - OS NÓS — a escolha declarada: **um nó só**, o mesmo `Text` dentro da mesma rolagem horizontal de hoje, com as
 *     linhas visuais juntadas pelo `\n`. Sem linha que passe da coluna, a rolagem horizontal não tem para onde ir (a Letra
 *     e a Cifra deixam de rolar para o lado), e a árvore é a de hoje nó a nó — no palco deitado, zoom 22, uma música de
 *     até 80 colunas sai byte a byte igual (QL-R11: sem continuação, o texto do nó É o corpo). Os três instrumentos
 *     (o G-par de V, o (e) do G-N3, o `corpo-logico.mjs`) leem todo `TextView` sob o id `corpo` como bloco partido no
 *     `\n` — o texto lógico se confere pela quebra (QL-D16);
 *   - a exceção da QL-D45 — a única vez em que o corpo vira mais de um nó: a linha da Cifra com um acorde maior que a
 *     coluna passa dela, e rola para o lado SÓ ELA (no par, o pedaço de acordes e o de letra juntos, para o acorde
 *     continuar sobre a sílaba); o resto segue em texto que não rola. O id `corpo` vai para o contêiner;
 *   - a âncora (QL-D18, QL-D37): as contas puras (`logicaNoTopo`, `inicioDoBloco`, `yDaLogica`); quem rola é o palco.
 */
import { useCallback, useState, type ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type TextStyle } from 'react-native'
import Pdf from 'react-native-pdf'
import {
  FRASES_DO_TABLET,
  RECUO_DA_CONTINUACAO,
  VOCABULARIO_DE_CONTENT,
  colunasDesenhadas,
  ehLinhaDeAcordes,
  naoEstaNesteAparelho,
  quebrar,
  type LinhaVisual,
} from '@octavia/core'
import { Icone } from '../icones/Icone'
import { colors, font, lineHeight, size, space, type ThemeName } from '../theme'

type Cor = (typeof colors)[ThemeName]

/**
 * O estilo do corpo de texto do palco: IBM Plex Mono no tamanho do zoom (22 é o padrão, T1-R31), a entrelinha 1,55 do
 * texto ou 1,45 da tablatura, na tinta do tema. Era o `estiloTexto` do `StageScreen.tsx` (o mesmo objeto).
 */
export function estiloDoLeitor(tipo: string | null, zoom: number, cor: Cor): TextStyle {
  return {
    fontFamily: font.mono,
    fontSize: zoom,
    lineHeight: zoom * (tipo === 'Tab' ? lineHeight.tab : lineHeight.text),
    color: cor.text,
  }
}

// ── a quebra de linha (QL-PR3) ─────────────────────────────────────────────────────────────────────────────────────

/** O respiro do corpo dos lados e em cima (o `conteudoPad`): a coluna é o contêiner menos 2 × ele (QL-R2). */
const RESPIRO = space.xxl

/**
 * As colunas do leitor: ⌊(largura do contêiner do corpo − 2 × 32) ÷ largura de um caractere⌋ — ou `null` (QL-D43) se uma
 * das duas medidas ainda não existe, não é um número de verdade, ou se as colunas caem fora do domínio de `quebrar`
 * (inteiro maior que o recuo de 2). `null` é o corpo de hoje.
 */
export function colunasDoLeitor(larguraDoContainer: number | null, caractere: number | null): number | null {
  if (larguraDoContainer === null || caractere === null) return null
  if (!Number.isFinite(larguraDoContainer) || !Number.isFinite(caractere) || caractere <= 0) return null
  const n = Math.floor((larguraDoContainer - 2 * RESPIRO) / caractere)
  return Number.isInteger(n) && n > RECUO_DA_CONTINUACAO ? n : null
}

/** As linhas visuais do corpo, ou `null` — sem colunas, sem corpo de texto, ou na Tab, que não quebra (R4). */
export function linhasDoLeitor(corpo: string | null, tipo: string | null, colunas: number | null): LinhaVisual[] | null {
  if (corpo === null || tipo === 'Tab') return null
  if (colunas === null || !Number.isInteger(colunas) || colunas <= RECUO_DA_CONTINUACAO) return null
  return quebrar(corpo, tipo ?? '', colunas)
}

/** A amostra do medidor: 100 caracteres, como a régua mede (`QL-PR1-anexos/medida-por-zoom.txt`). */
const AMOSTRA = '0'.repeat(100)

/**
 * As duas medidas e as colunas (QL-R2). `zooms` são os zooms a medir de uma vez (o palco mede os cinco na montagem, e o
 * passo de zoom já encontra o caractere medido; V só tem o padrão). `aoMedirContainer` vai no `onLayout` do contêiner do
 * corpo — o que tem o respiro de 32 por dentro. `medidor` é o `Text` que mede o caractere: fica FORA DA TELA (o dump não
 * o vê — `uiautomator` omite o nó inteiro fora da tela —, e também não é importante para a acessibilidade) e sai da
 * árvore assim que os zooms estão medidos.
 */
export function useColunasDoLeitor(
  tipo: string | null,
  zoom: number,
  zooms: readonly number[],
  cor: Cor,
): { colunas: number | null; aoMedirContainer: (e: LayoutChangeEvent) => void; medidor: React.JSX.Element | null } {
  const [container, setContainer] = useState<number | null>(null)
  const [caracteres, setCaracteres] = useState<Readonly<Record<number, number>>>({})
  const aoMedirContainer = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setContainer((a) => (a === w ? a : w))
  }, [])
  const faltam = zooms.filter((z) => caracteres[z] === undefined)
  const medidor =
    faltam.length === 0 ? null : (
      <View style={estilos.medidor} pointerEvents="none" importantForAccessibility="no-hide-descendants">
        <ScrollView horizontal>
          {faltam.map((z) => (
            <Text
              key={z}
              style={estiloDoLeitor(tipo, z, cor)}
              onLayout={(e: LayoutChangeEvent) => {
                const w = e.nativeEvent.layout.width
                if (w > 0) setCaracteres((c) => (c[z] !== undefined ? c : { ...c, [z]: w / AMOSTRA.length }))
              }}
            >
              {AMOSTRA}
            </Text>
          ))}
        </ScrollView>
      </View>
    )
  return { colunas: colunasDoLeitor(container, caracteres[zoom] ?? null), aoMedirContainer, medidor }
}

/** Na Cifra, a linha `i` abre um par (R2/R4: a de acordes com uma linha de letra embaixo) — a regra do `quebrar`. */
function abrePar(L: readonly string[], tipo: string | null, i: number): boolean {
  const cima = L[i]
  const baixo = L[i + 1]
  return tipo === 'Chords' && cima !== undefined && baixo !== undefined && ehLinhaDeAcordes(cima) && baixo.trim() !== '' && !ehLinhaDeAcordes(baixo)
}

/**
 * Os grupos do corpo desenhado: as linhas que cabem juntam-se num bloco de texto; a que passa da coluna (QL-D45) vira um
 * grupo próprio, que rola para o lado — no par, o pedaço de acordes e o de letra logo depois andam juntos.
 */
function gruposDoCorpo(corpo: string, tipo: string | null, linhas: LinhaVisual[], colunas: number): { linhas: string[]; rola: boolean }[] {
  const L = corpo.split('\n')
  const out: { linhas: string[]; rola: boolean }[] = []
  for (let v = 0; v < linhas.length; v++) {
    const l = linhas[v]!
    const prox = linhas[v + 1]
    const unidade = abrePar(L, tipo, l.logica) && prox !== undefined && prox.logica === l.logica + 1 ? [l, prox] : [l]
    if (unidade.length === 2) v++
    const rola = unidade.some((u) => colunasDesenhadas(u.texto) > colunas)
    const ultimo = out[out.length - 1]
    if (!rola && ultimo !== undefined && !ultimo.rola) ultimo.linhas.push(...unidade.map((u) => u.texto))
    else out.push({ linhas: unidade.map((u) => u.texto), rola })
  }
  return out
}

/**
 * O corpo de texto. Sem linhas visuais (`null`: ainda sem as medidas, ou a Tab) é o de sempre — a cadeia inteira num
 * `Text`, dentro de um `ScrollView` HORIZONTAL (T1-R25, a linha longa rola para o lado). Com as linhas visuais (QL-PR3):
 * o MESMO nó, com as linhas juntadas pelo `\n` (sem continuação nenhuma, o texto do nó é o próprio corpo, byte a byte);
 * e, só quando uma linha passa da coluna (QL-D45), um contêiner com o id e um grupo por trecho (ver o cabeçalho).
 */
export function CorpoDoLeitor({
  corpo,
  tipo = null,
  linhas = null,
  colunas = null,
  estilo,
  testID,
}: {
  corpo: string | null
  tipo?: string | null
  linhas?: LinhaVisual[] | null
  colunas?: number | null
  estilo: TextStyle
  testID: string
}): React.JSX.Element {
  if (corpo !== null && linhas !== null && colunas !== null) {
    const grupos = gruposDoCorpo(corpo, tipo, linhas, colunas)
    if (grupos.some((g) => g.rola)) {
      return (
        <View testID={testID}>
          {grupos.map((g, k) =>
            g.rola ? (
              <ScrollView key={k} horizontal showsHorizontalScrollIndicator={false}>
                <Text style={estilo}>{g.linhas.join('\n')}</Text>
              </ScrollView>
            ) : (
              <Text key={k} style={estilo}>
                {g.linhas.join('\n')}
              </Text>
            ),
          )}
        </View>
      )
    }
  }
  const texto = corpo !== null && linhas !== null && linhas.some((l) => l.continuacao) ? linhas.map((l) => l.texto).join('\n') : corpo
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text style={estilo} testID={testID}>
        {texto ?? ''}
      </Text>
    </ScrollView>
  )
}

// ── a âncora (QL-D18, QL-D37) — as contas; quem rola é o palco ─────────────────────────────────────────────────────

/** A linha lógica de cada linha visual, na ordem do desenho (sem linhas visuais, as lógicas mesmas). */
export function logicasDasVisuais(corpo: string, linhas: LinhaVisual[] | null): number[] {
  return linhas === null ? corpo.split('\n').map((_, i) => i) : linhas.map((l) => l.logica)
}

/**
 * A linha lógica no topo da rolagem `y`: a da primeira linha visual com algum pedaço à vista. No conteúdo a linha visual
 * `v` ocupa `[32 + v × entrelinha, 32 + (v + 1) × entrelinha)` — o respiro de 32 em cima, e cada linha do `Text` com a
 * entrelinha do estilo.
 */
export function logicaNoTopo(logicas: readonly number[], y: number, entrelinha: number): number {
  if (logicas.length === 0) return 0
  const v = Math.max(0, Math.floor((y - RESPIRO) / entrelinha))
  return logicas[Math.min(v, logicas.length - 1)]!
}

/** Na Cifra, a letra de um par ancora na linha de acordes de cima (o acorde continua à vista, sobre a sílaba). */
export function inicioDoBloco(corpo: string, tipo: string | null, logica: number): number {
  return logica > 0 && abrePar(corpo.split('\n'), tipo, logica - 1) ? logica - 1 : logica
}

/** A rolagem que põe a primeira linha visual da lógica a 32 do topo (o respiro): o começo dela, sem sinal de rearranjo. */
export function yDaLogica(logicas: readonly number[], logica: number, entrelinha: number): number {
  const v = logicas.indexOf(logica)
  return v <= 0 ? 0 : v * entrelinha
}

/**
 * O arquivo do corpo, nas quatro situações que a tela precisa distinguir (o S3d, o baixando, o S3e e a falha). `bytes`
 * sobrevive ao despejo (o índice lembra o tamanho), e é por isso que o S3e consegue dizer o tamanho de algo que não
 * está aqui.
 */
export type EstadoDoArquivoDoLeitor =
  | { fase: 'buscando' }
  | { fase: 'pronto'; uri: string }
  | { fase: 'ausente'; bytes: number | null }
  | { fase: 'erro'; mensagem: string; bytes: number | null }

/** "242.176 B" → "237 KB" — o "(1,2 MB)" do S3e e do formato. */
export function tamanhoLegivel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
  return `${Math.round(bytes / 1024)} KB`
}

/**
 * S3d — o PDF do disco, paginado (`enablePaging`), com pinça e pan do próprio `react-native-pdf`. Quem desenha decide o
 * que fazer quando ele carrega, vira a página ou falha (o palco loga e mostra *página n de N*; V não).
 */
export function PdfDoLeitor({
  uri,
  cor,
  onLoadComplete,
  onPageChanged,
  onError,
  testID,
}: {
  uri: string
  cor: Cor
  onLoadComplete: (total: number) => void
  onPageChanged: (atual: number, total: number) => void
  onError: (e: Error) => void
  testID: string
}): React.JSX.Element {
  return (
    <View style={estilos.pdfArea} testID={testID}>
      <Pdf
        source={{ uri, cache: false }}
        style={[estilos.pdf, { backgroundColor: cor.bg }]}
        enablePaging
        enableDoubleTapZoom
        /**
         * `fitPolicy={0}` = **fit width**, a partitura ocupando a largura.
         *
         * A N1-PR6 tinha posto `{2}` (página inteira) porque ali **um**
         * gesto virava **uma** página, contra ~4 com `{0}`. O aceite no Tab
         * S6 mediu o outro lado da conta: com `{2}` a página A4 fica em
         * ~548 px de 2560, ou seja **~244 dp de largura** — pequena demais
         * para ler no palco (N1-PR7 §3.6). Decisão do Marcel, 2026-09-10:
         * legibilidade ganha de contagem de gestos, volta a `{0}`.
         *
         * LIMITAÇÃO CONHECIDA, registrada: com fit width o deslize rola
         * dentro da página antes de virar, então virar uma página custa
         * vários gestos — o T1-R27 ("avançar: 1 tap ou 1 gesto") **não** se
         * cumpre para a PÁGINA do PDF. Ele continua valendo para a MÚSICA:
         * as bordas de 15% avançam e voltam em 1 tap, em PDF como em texto.
         *
         * N4-PR8: em V a mesma página ajustada à LARGURA DA COLUNA do leitor
         * (N4-R15) — o `fitPolicy` mede o contêiner, não a janela.
         */
        fitPolicy={0}
        minScale={1}
        maxScale={4}
        spacing={0}
        onLoadComplete={onLoadComplete}
        onPageChanged={onPageChanged}
        onError={onError}
      />
    </View>
  )
}

/**
 * Um placeholder do corpo — nunca tela vazia (T1-R26, a regra C3-1): um ícone opcional, o título, o apoio, e o que vier
 * dentro (a linha do erro e o *Baixar* do palco; o *Baixar* de ícone de V). A composição e as medidas são as do palco
 * (o S3e, o baixando, o motivo do item inválido): no topo do corpo, centrado na largura.
 */
export function PlaceholderDoLeitor({
  testID,
  icone,
  titulo,
  apoio,
  cor,
  children,
}: {
  testID: string
  icone?: ReactNode
  titulo?: string
  apoio?: string
  cor: Cor
  children?: ReactNode
}): React.JSX.Element {
  return (
    <View style={estilos.placeholder} testID={testID}>
      {icone ?? null}
      {titulo !== undefined ? <Text style={[estilos.placeholderTitulo, { color: cor.text }]}>{titulo}</Text> : null}
      {apoio !== undefined ? <Text style={[estilos.placeholderApoio, { color: cor.muted }]}>{apoio}</Text> : null}
      {children}
    </View>
  )
}

/**
 * S3e — o arquivo que não está aqui: *arquivo não baixado*, o título da música · o tipo (o tamanho, quando o aparelho
 * já o conhece) e a segunda frase pela rede. O controle de baixar vem de quem desenha: no palco a PALAVRA (N4-D78, como
 * sempre, com a linha do erro); em V o ÍCONE (N4-E8). **O controle é a única diferença entre os dois** (N4-D78).
 */
export function S3eDoLeitor({
  testID,
  titulo,
  tipo,
  bytes,
  online,
  cor,
  children,
}: {
  testID: string
  titulo: string
  tipo: string
  bytes: number | null
  online: boolean
  cor: Cor
  children: ReactNode
}): React.JSX.Element {
  const tamanho = bytes === null ? '' : ` (${tamanhoLegivel(bytes)})`
  return (
    <PlaceholderDoLeitor
      testID={testID}
      titulo={FRASES_DO_TABLET['arquivo-nao-baixado']}
      apoio={naoEstaNesteAparelho(titulo, tipo, tamanho, online)}
      cor={cor}
    >
      {children}
    </PlaceholderDoLeitor>
  )
}

/**
 * N4-D43, N4-D83 — o arquivo de um formato que o app ainda não mostra (pela extensão; o core decide). A moldura é a
 * `N4-*-S3-avulso-formato` (e a `N4-*-V-formato`): o `tipo-desconhecido` de 28 em `offlineInk`, a frase do site
 * (*"não foi possível abrir o arquivo — confira o formato"*, `view.erro.formato`) e, em mono, o nome do arquivo · o tipo
 * (o tamanho se conhecido). Sem *Baixar*: baixar não o faria abrir. O mesmo componente no palco com setlist, no avulso
 * e em V. O lugar é o dos outros placeholders do palco (no topo do corpo), e os tamanhos são os do pacote: a frase em
 * `size.button` (17, o da folha) e o nome em mono `size.label` (o da página do S3d, que a folha desenha em 13).
 */
export function FormatoDoLeitor({
  nome,
  tipo,
  bytes,
  cor,
  testID,
}: {
  nome: string
  tipo: string
  bytes: number | null
  cor: Cor
  testID: string
}): React.JSX.Element {
  const tamanho = bytes === null ? '' : ` (${tamanhoLegivel(bytes)})`
  return (
    <View style={estilos.placeholder} testID={testID}>
      <Icone nome="tipo-desconhecido" tamanho={28} cor={cor.offlineInk} />
      <View style={estilos.formatoTexto}>
        <Text style={[estilos.formatoFrase, { color: cor.text }]}>{VOCABULARIO_DE_CONTENT['erro-formato']}</Text>
        <Text style={[estilos.formatoArquivo, { color: cor.muted }]}>{`${nome} · ${tipo}${tamanho}`}</Text>
      </View>
    </View>
  )
}

/** As medidas do corpo do palco: a rolagem vertical e o respiro de 32 (48 embaixo) em volta do texto. */
export const leitor = StyleSheet.create({
  conteudo: { flex: 1 },
  conteudoPad: { padding: space.xxl, paddingBottom: space.xxxl },
})

const estilos = StyleSheet.create({
  // o medidor do caractere: fora da tela, sem tocar em nada e fora da conta de qualquer layout
  medidor: { position: 'absolute', top: -10000, left: 0, opacity: 0 },
  pdfArea: { flex: 1 },
  pdf: { flex: 1, width: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: space.lg, paddingTop: space.xxxl },
  placeholderTitulo: { fontFamily: font.uiBold, fontSize: size.titleLarge },
  placeholderApoio: {
    fontFamily: font.ui,
    fontSize: size.body,
    textAlign: 'center',
    maxWidth: 560,
  },
  formatoTexto: { alignItems: 'center', gap: space.xs },
  formatoFrase: { fontFamily: font.ui, fontSize: size.button, textAlign: 'center', maxWidth: 560 },
  formatoArquivo: { fontFamily: font.mono, fontSize: size.label, textAlign: 'center' },
})
