/**
 * V — A VISUALIZAÇÃO DE UMA MÚSICA NO TABLET (N4-PR8; `N4-REQUISITOS.md` N4-R12…N4-R15, e N4-R7…N4-R9 em V;
 * `DESIGN-N4/telas.html`, as molduras `N4-{C,B}-V-*`, com as erratas do `DESIGN-N4/README.md` §6 prevalecendo — a
 * N4-E8 em especial).
 *
 * O toque numa linha da biblioteca (L) abre esta tela (N4-R6). **O cabeçalho** (N4-R12), igual nas faixas: voltar ·
 * título + artista · tipo · a estrela · o ▶ (só ícone, com borda, 48 — os controles da linha, `ControlesDaMusica.tsx`).
 * Uma linha de 88 (`bar.top + space.xl`) que CRESCE quando o título ou a meta quebram — o título não elide. Sem
 * artista, a meta é só o tipo; o tipo desconhecido em `offlineInk`, com o ▶ inerte.
 *
 * **O corpo** (N4-R13): em C, DUAS colunas — os detalhes à esquerda, na largura do token P-T3 (`faixas.C.view.coluna`,
 * 340), e o leitor à direita; a coluna da esquerda fica mesmo vazia, para o corpo não mudar de lugar entre músicas. Em
 * B (e A), a P-T3 é INEXISTENTE: uma coluna só, os detalhes sobre o corpo, numa rolagem só. A tela não faz conta de
 * largura: lê se a coluna existe, e a grade de *Detalhes* tem o número de colunas do token (N4-D99).
 *
 * **O leitor é o do palco** (`Leitor.tsx`; N4-D24) — mono 22, a entrelinha do texto, sem quebra de linha, ESCURO
 * (N4-D66, P-O1) — e SEM os controles de tocar: nenhuma rolagem automática, nenhum zoom, nenhuma borda de virar
 * página. **Custo declarado** (N4-D65): ≈ 56 colunas em C; o leitor corta linhas que o palco mostra inteiras.
 *
 * **Os campos** (N4-R14): os salvos de verdade, na ordem da folha, com o nome do site (o core, `visualizacao.ts`);
 * as notas da música (P-F3) — só em V; as duas datas numa linha, no fim. Campo vazio não aparece. Compasso, capo e
 * afinação, nunca.
 */
import { useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  FRASES_DO_LEITOR,
  FRASES_N4,
  ROTULO_DO_TIPO,
  VOCABULARIO_DE_CONTENT,
  bodyOf,
  camposDaVisualizacao,
  isValidContent,
  linhaDasDatas,
  notasDaVisualizacao,
  type CampoDaVisualizacao,
  type ContentDTO,
} from '@octavia/core'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { INEXISTENTE, bar, colors, dark, faixas, font, lineHeight, radius, size, space, touch, tracking, zoomDefault } from '../theme'
import { useFaixa } from '../useFaixa'
import { BotaoTocar, EstrelaDoFavoritar } from './ControlesDaMusica'
import { CorpoDoLeitor, estiloDoLeitor, leitor } from './Leitor'

export interface VisualizacaoScreenProps {
  /** A música, do cache (`contentById`); `null` se sumiu dele com a tela aberta — V segue com a última que viu. */
  content: ContentDTO | null
  online: boolean
  /** Volta à biblioteca (o `goBack`: a L na mesma posição — rolagem, filtros e termo). */
  onVoltar: () => void
  /** O ▶: o palco avulso desta música, com a origem `visualizacao`. */
  onTocar: (contentId: string) => void
  /** O disco mudou (o leitor baixou o arquivo) — a raiz recalcula `filesPresent`. */
  onArquivosMudaram: () => void
}

/** O ícone de cada tipo do enum (o mesmo mapa da L, do S2 e da S4); fora do enum, nenhum. */
const ICONE_DO_TIPO: { readonly [k: string]: NomeIcone } = { Lyrics: 'letra', Chords: 'cifra', Tab: 'tab', Sheet: 'partitura' }

/** A régua de seção de V (*Detalhes*, *notas da música*): o rótulo em mono 12 maiúsculo e o fio — a da L e da S4. */
function Regua({ rotulo }: { rotulo: string }): React.JSX.Element {
  return (
    <View style={styles.regua}>
      <Text style={styles.reguaTexto}>{rotulo}</Text>
      <View style={styles.reguaFio} />
    </View>
  )
}

function Campo({ campo }: { campo: CampoDaVisualizacao }): React.JSX.Element {
  return (
    <View style={styles.celula} testID={`view-campo-${campo.chave}`}>
      <Text style={styles.campoRotulo}>{campo.rotulo}</Text>
      <Text style={styles.campoValor}>{campo.valor}</Text>
    </View>
  )
}

/**
 * Os detalhes: *Detalhes* e a grade dos campos (N4-D99: o número de colunas é o token da faixa; as etiquetas na largura
 * inteira, como a folha), as notas da música (P-F3) e a linha das datas, no fim. Sem campo, sem a régua *Detalhes*;
 * sem notas, sem o bloco; sem nada, sobra a linha das datas.
 */
function Detalhes({ content, colunas }: { content: ContentDTO; colunas: number }): React.JSX.Element {
  const campos = camposDaVisualizacao(content)
  const naGrade = campos.filter((c) => c.chave !== 'etiquetas')
  const etiquetas = campos.find((c) => c.chave === 'etiquetas')
  const linhas: (CampoDaVisualizacao | null)[][] = []
  for (let i = 0; i < naGrade.length; i += colunas) {
    const linha: (CampoDaVisualizacao | null)[] = naGrade.slice(i, i + colunas)
    while (linha.length < colunas) linha.push(null)
    linhas.push(linha)
  }
  const notas = notasDaVisualizacao(content)
  const datas = linhaDasDatas(content)
  return (
    <>
      {campos.length > 0 ? (
        <>
          <Regua rotulo={VOCABULARIO_DE_CONTENT.detalhes} />
          <View style={styles.grade}>
            {linhas.map((linha, i) => (
              <View key={i} style={styles.gradeLinha} testID="view-grade-linha">
                {linha.map((c, j) => (c === null ? <View key={j} style={styles.celula} /> : <Campo key={c.chave} campo={c} />))}
              </View>
            ))}
            {etiquetas !== undefined ? <Campo campo={etiquetas} /> : null}
          </View>
        </>
      ) : null}
      {notas !== null ? (
        <View testID="view-notas">
          <Regua rotulo={FRASES_N4['notas-da-musica']} />
          <Text style={styles.notas}>{notas}</Text>
        </View>
      ) : null}
      {datas !== null ? (
        <Text style={styles.datas} testID="view-datas">
          {datas}
        </Text>
      ) : null}
    </>
  )
}

export function VisualizacaoScreen({ content: atual, online, onVoltar }: VisualizacaoScreenProps): React.JSX.Element {
  const t = faixas[useFaixa()]
  // A música que sumiu do cache com V aberta (um sync que a apagou): V segue com a última que viu.
  const ultimo = useRef<ContentDTO | null>(atual)
  if (atual !== null) ultimo.current = atual
  const content = atual ?? ultimo.current

  const voltar = (
    <Pressable
      style={styles.botaoIcone}
      onPress={onVoltar}
      accessibilityRole="button"
      accessibilityLabel={VOCABULARIO_DE_CONTENT['voltar-biblioteca']}
      testID="view-voltar"
    >
      <Icone nome="voltar" tamanho={24} cor={dark.text} />
    </Pressable>
  )
  if (content === null) {
    return (
      <View style={styles.tela} testID="view-tela">
        <View style={styles.cabecalho} testID="view-cabecalho">
          {voltar}
        </View>
      </View>
    )
  }

  const validade = isValidContent(content.content_type, content.content_data, content.file_url)
  const invalido = validade.ok ? null : validade.reason
  const iconeDoTipo = ICONE_DO_TIPO[content.content_type]
  const rotulo = (ROTULO_DO_TIPO as { readonly [k: string]: string })[content.content_type]
  const artista = content.artist !== null && content.artist.length > 0 ? content.artist : null
  const favorita = content.is_favorite === true
  const duasColunas = t.view.coluna !== INEXISTENTE

  const cabecalho = (
    <View style={styles.cabecalho} testID="view-cabecalho">
      {voltar}
      <View style={styles.cabecalhoTexto}>
        <Text style={styles.titulo} testID="view-titulo">
          {content.title}
        </Text>
        <View style={styles.meta} testID="view-meta">
          {artista !== null ? (
            <>
              <Text style={styles.metaTexto}>{artista}</Text>
              <Text style={styles.ponto}>·</Text>
            </>
          ) : null}
          {iconeDoTipo !== undefined && rotulo !== undefined ? (
            <View style={styles.metaTipo}>
              <Icone nome={iconeDoTipo} tamanho={20} cor={dark.muted} />
              <Text style={styles.metaTexto}>{rotulo}</Text>
            </View>
          ) : (
            <View style={styles.metaTipo}>
              <Icone nome="tipo-desconhecido" tamanho={20} cor={dark.offlineInk} />
              <Text style={[styles.metaTexto, { color: dark.offlineInk }]}>{FRASES_DO_LEITOR['tipo-desconhecido']}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.controles}>
        <EstrelaDoFavoritar
          titulo={content.title}
          favorita={favorita}
          emVoo={null}
          online={online}
          onFavoritar={() => undefined}
          testID="view-favoritar"
        />
        <BotaoTocar titulo={content.title} inerte={invalido !== null} onTocar={() => undefined} testID="view-tocar" />
      </View>
    </View>
  )

  const corpo = bodyOf(content.content_type, content.content_data)
  const texto = <CorpoDoLeitor corpo={corpo} estilo={estiloDoLeitor(content.content_type, zoomDefault, colors.dark)} testID="corpo" />
  const detalhes = <Detalhes content={content} colunas={t.view.grade} />

  if (duasColunas) {
    return (
      <View style={styles.tela} testID="view-tela">
        {cabecalho}
        <View style={styles.colunas}>
          <ScrollView
            style={[styles.colunaDetalhes, { width: t.view.coluna as number }]}
            contentContainerStyle={styles.detalhesPad}
            testID="view-detalhes"
          >
            {detalhes}
          </ScrollView>
          <View style={styles.colunaLeitor} testID="view-leitor">
            <ScrollView style={leitor.conteudo} contentContainerStyle={leitor.conteudoPad}>
              {texto}
            </ScrollView>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.tela} testID="view-tela">
      {cabecalho}
      <ScrollView style={styles.rolagem} testID="view-rolagem">
        <View style={styles.detalhesPad} testID="view-detalhes">
          {detalhes}
        </View>
        <View style={[styles.leitorEmB, leitor.conteudoPad]} testID="view-leitor">
          {texto}
        </View>
      </ScrollView>
    </View>
  )
}

/**
 * Medidas da folha (`N4-C-V-letra`, `N4-B-V-letra`), todas do pacote: o cabeçalho de 88 (`bar.top + space.xl`, m12),
 * o voltar de 48 com borda (o da L e da S4), o título em Manrope 600 de 22 (`size.title`), a meta em 17
 * (`size.button`), o tipo com o ícone de 20; a coluna de 340 (P-T3) com 24 de respiro; a régua de seção a da L; a
 * grade com 24 entre colunas e 12 entre linhas (a folha: 20 e 14 — não são token; a diferença fica abaixo de 4 dp, na
 * tabela das estimadas do anexo); o rótulo do campo e as datas em 13 (N4-D100, o literal da N4-D79), o valor em 17,
 * as notas em 16 com a entrelinha do texto. O leitor: o do palco (`Leitor.tsx`).
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  cabecalho: {
    minHeight: bar.top + space.xl,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    borderBottomWidth: bar.hairline,
    borderBottomColor: dark.line,
  },
  botaoIcone: {
    width: touch.min,
    height: touch.min,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabecalhoTexto: { flex: 1 },
  titulo: { color: dark.text, fontFamily: font.uiBold, fontSize: size.title },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.sm },
  metaTipo: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  metaTexto: { color: dark.muted, fontFamily: font.ui, fontSize: size.button },
  ponto: { color: dark.lineInfo, fontFamily: font.ui, fontSize: size.button },
  controles: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  colunas: { flex: 1, flexDirection: 'row' },
  colunaDetalhes: { flexGrow: 0, flexShrink: 0, borderRightWidth: bar.hairline, borderRightColor: dark.line },
  colunaLeitor: { flex: 1 },
  rolagem: { flex: 1 },
  detalhesPad: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xl },
  leitorEmB: { borderTopWidth: bar.hairline, borderTopColor: dark.line },
  // a régua de seção da L e da S4 (§3.3: texto ativo abaixo de 24 dp é `muted`, nunca `lineInfo`)
  regua: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.lg, paddingBottom: space.md },
  reguaTexto: {
    color: dark.muted,
    fontFamily: font.mono,
    fontSize: size.labelSmall,
    letterSpacing: size.labelSmall * tracking.display,
    textTransform: 'uppercase',
  },
  reguaFio: { flex: 1, height: bar.hairline, backgroundColor: dark.line },
  grade: { gap: space.md },
  gradeLinha: { flexDirection: 'row', gap: space.xl },
  celula: { flex: 1 },
  // N4-D100 [Marcel, 2026-10-06]: o rótulo e as datas em 13, o literal da N4-D79 — herança do bloco de identidade.
  campoRotulo: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  campoValor: { color: dark.text, fontFamily: font.ui, fontSize: size.button },
  notas: { color: dark.text, fontFamily: font.ui, fontSize: size.body, lineHeight: size.body * lineHeight.text },
  datas: { color: dark.muted, fontFamily: font.ui, fontSize: 13, marginTop: space.lg },
})
