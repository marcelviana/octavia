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
 * do arquivo do palco (o `buscarArquivo` e as linhas de log dele) — a visualização não toca, e as linhas `log(` do
 * palco não mudam de arquivo (G3). Os `testID` também ficam com quem desenha: cada tela passa o seu (o G2 coleta por
 * arquivo).
 */
import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native'
import Pdf from 'react-native-pdf'
import { FRASES_DO_TABLET, VOCABULARIO_DE_CONTENT, naoEstaNesteAparelho } from '@octavia/core'
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

/**
 * O corpo de texto: a cadeia inteira num `Text`, dentro de um `ScrollView` HORIZONTAL — é ele que impede a re-quebra
 * da linha longa em qualquer zoom (T1-R25/R31, provado no spike da N1-PR4). Sem quebra de linha no N4, no palco e em V
 * (N4-D66, P-O5): a linha mais longa que a coluna rola para o lado.
 */
export function CorpoDoLeitor({ corpo, estilo, testID }: { corpo: string | null; estilo: TextStyle; testID: string }): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Text style={estilo} testID={testID}>
        {corpo ?? ''}
      </Text>
    </ScrollView>
  )
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
