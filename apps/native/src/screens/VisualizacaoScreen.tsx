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
 *
 * **O corpo por tipo e os arquivos** (N4-R15): o texto pelo leitor (a Cifra com seções com o nome de cada seção, como o
 * editor gravou — o core, `bodyOf`; a Tab como foi importada); a Partitura pelo PDF do leitor, a página na largura da
 * coluna; o item sem corpo (*este item não tem conteúdo*, os quatro tipos) e o tipo desconhecido; *baixando o
 * arquivo…* com o arco (o `baixando` do catálogo, N4-E6); o arquivo não baixado — o S3e do palco com o **Baixar como
 * ÍCONE** (N4-D78, N4-E8: o `baixar-setlist`, com borda e alvo de 48, nome *Baixar*; o controle é a única diferença
 * entre os dois); a falha — *não consegui baixar* e a espécie embaixo, com o mesmo ícone; o formato que o app ainda não
 * mostra (o do palco, pela extensão). O ▶ segue ativo no arquivo não baixado.
 *
 * **O favoritar** (N4-R7, N4-R8): a estrela é a da linha — só online, SEM OTIMISMO (inerte com o arco enquanto o
 * pedido voa; só muda quando o servidor responde, e a linha devolvida chega pelo cache, `content`). O pedido CONTINUA
 * se o músico sai de V (ele mora no `favoritar.ts`, não aqui) e **não há aviso na volta**: o estado final aparece onde a
 * estrela estiver. A falha vira UMA linha de aviso sob o cabeçalho, por espécie (o nome do controle · a frase), que
 * cresce e nunca elide; some no próximo favoritar ou ao sair da tela. **Sem rede** (N4-R9): só a estrela fica inerte, e
 * o motivo (P-F4) está numa linha de aviso, à vista sem toque; a leitura e o ▶ funcionam.
 *
 * **O ▶** abre o palco avulso desta música com a origem `visualizacao` (o voltar dele é *Voltar para a visualização*,
 * P-F6, e devolve esta tela). **O voltar** de V devolve a biblioteca na mesma posição (o `goBack`: a L não desmonta).
 *
 * **O arquivo** segue a decisão do palco (T1-R26): disco primeiro, rede se preciso, e sem arquivo nem rede o S3e — sem
 * retry automático (o Baixar é a nova tentativa, T1-R37). **Nenhuma linha de log nova**: o palco loga o
 * `placeholder kind=file-missing` e o `download-error` dele; V não toca e não loga (o `file-reject` e o `file src=…` do
 * `files.ts` continuam saindo de lá) — declarado no anexo (G3 igual).
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import {
  FRASES_DO_LEITOR,
  FRASES_DO_TABLET,
  FRASES_N4,
  ROTULO_DO_TIPO,
  VOCABULARIO_DE_CONTENT,
  avisoDoFavoritar,
  bodyOf,
  camposDaVisualizacao,
  ehFormatoQueOAppMostra,
  isValidContent,
  linhaDasDatas,
  notasDaVisualizacao,
  type CampoDaVisualizacao,
  type ContentDTO,
  type EspecieDoFavoritar,
} from '@octavia/core'
import { assinarFavoritar, estadoDoFavoritar, favoritar } from '../favoritar'
import { ensureFile, fileNameFromUrl, fraseDaFalha, hasFile, knownBytes } from '../files'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { INEXISTENTE, bar, colors, dark, faixas, font, lineHeight, radius, size, space, touch, tracking, zoomDefault } from '../theme'
import { useFaixa } from '../useFaixa'
import { BotaoTocar, EstrelaDoFavoritar, iconeDaEspecie } from './ControlesDaMusica'
import { LinhaDeAviso } from './LinhaDeAviso'
import {
  CorpoDoLeitor,
  FormatoDoLeitor,
  PdfDoLeitor,
  PlaceholderDoLeitor,
  S3eDoLeitor,
  estiloDoLeitor,
  leitor,
  linhasDoLeitor,
  logicasDasVisuais,
  useAncora,
  useColunasDoLeitor,
  type EstadoDoArquivoDoLeitor,
} from './Leitor'

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

/** QL-PR3: V não tem zoom — o leitor mede o caractere só no padrão. */
const ZOOM_DE_V = [zoomDefault] as const

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

/**
 * O arquivo do corpo de V, pela decisão do palco (`StageScreen.tsx`, `buscarArquivo`): disco primeiro; sem o arquivo e
 * sem rede, o S3e (e nenhum pedido); senão o `ensureFile` (que baixa e guarda). O *Baixar* pede de novo, com ou sem
 * rede (a rejeição é a falha). Sem log (ver o cabeçalho).
 */
function useArquivoDaVisualizacao(
  url: string | null,
  online: boolean,
  onArquivosMudaram: () => void,
): { arquivo: EstadoDoArquivoDoLeitor; baixar: () => void } {
  const [arquivo, setArquivo] = useState<EstadoDoArquivoDoLeitor>({ fase: 'buscando' })
  const montada = useRef(true)
  useEffect(
    () => () => {
      montada.current = false
    },
    [],
  )
  const buscar = useCallback(
    async (u: string, pedidoPeloUsuario: boolean): Promise<void> => {
      if (!hasFile(u) && !online && !pedidoPeloUsuario) {
        setArquivo({ fase: 'ausente', bytes: knownBytes(u) })
        return
      }
      setArquivo({ fase: 'buscando' })
      try {
        const r = await ensureFile(u)
        if (montada.current) setArquivo({ fase: 'pronto', uri: r.uri })
        if (r.src === 'download') onArquivosMudaram()
      } catch (e: unknown) {
        if (montada.current) setArquivo({ fase: 'erro', mensagem: fraseDaFalha(e), bytes: knownBytes(u) })
      }
    },
    [online, onArquivosMudaram],
  )
  useEffect(() => {
    if (url === null) return
    void buscar(url, false)
  }, [url, buscar])
  return { arquivo, baixar: () => (url === null ? undefined : void buscar(url, true)) }
}

/** O *Baixar* de V — ÍCONE (N4-D78, N4-E8): o `baixar-setlist` do catálogo (div. 1025), 48 com borda, nome *Baixar*. */
function BaixarComoIcone({ onBaixar }: { onBaixar: () => void }): React.JSX.Element {
  return (
    <Pressable
      style={styles.botaoIcone}
      onPress={onBaixar}
      accessibilityRole="button"
      accessibilityLabel={FRASES_DO_LEITOR.baixar}
      testID="view-baixar"
    >
      <Icone nome="baixar-setlist" tamanho={24} cor={dark.text} />
    </Pressable>
  )
}

/** A falha do último favoritar: a frase composta e a espécie (que escolhe o ícone e a tinta, N4-R8). */
interface AvisoDoFavoritar {
  motivo: string
  especie: Exclude<EspecieDoFavoritar, 'ok'>
}

export function VisualizacaoScreen({
  content: atual,
  online,
  onVoltar,
  onTocar,
  onArquivosMudaram,
}: VisualizacaoScreenProps): React.JSX.Element {
  const t = faixas[useFaixa()]
  const [aviso, setAviso] = useState<AvisoDoFavoritar | null>(null)

  // O estado em voo do favoritar mora no módulo (sobrevive à tela); a tela assina e redesenha.
  const [, setVersao] = useState(0)
  useEffect(() => assinarFavoritar(() => setVersao((v) => v + 1)), [])

  // N4-R7/R8: a linha da falha some ao sair da tela; e a resposta que chega com a tela fora de foco (o palco avulso por
  // cima, ou o voltar) NÃO vira aviso na volta.
  const focada = useRef(true)
  useFocusEffect(
    useCallback(() => {
      focada.current = true
      return () => {
        focada.current = false
        setAviso(null)
      }
    }, []),
  )
  // A música que sumiu do cache com V aberta (um sync que a apagou): V segue com a última que viu.
  const ultimo = useRef<ContentDTO | null>(atual)
  if (atual !== null) ultimo.current = atual
  const content = atual ?? ultimo.current

  // O corpo é um ARQUIVO? (Sheet, e a Cifra escaneada — o core decide.) De um formato que o app mostra? (N4-D43: só
  // `.pdf`, pela extensão; o resto vai ao placeholder de formato, sem pedir o arquivo.)
  const validade = content === null ? null : isValidContent(content.content_type, content.content_data, content.file_url)
  const urlArquivo = validade !== null && validade.ok && validade.body === 'file' ? (content?.file_url ?? null) : null
  const formato = urlArquivo !== null && !ehFormatoQueOAppMostra(urlArquivo)
  const { arquivo, baixar } = useArquivoDaVisualizacao(formato ? null : urlArquivo, online, onArquivosMudaram)
  // QL-PR3 — as colunas do leitor (QL-R2): o contêiner do corpo (o `onLayout` abaixo, em C e em B) e o caractere no zoom
  // padrão. Até as duas existirem, o corpo é o de hoje (QL-D43).
  const { colunas, aoMedirContainer, medidor } = useColunasDoLeitor(content?.content_type ?? null, zoomDefault, ZOOM_DE_V, colors.dark)

  /**
   * QL-PR4 — A ÂNCORA EM V (QL-D49), pelo gancho do leitor (`useAncora`, a conta do palco). Ao girar (C ↔ B, 55 ↔ 48
   * colunas), a linha lógica na marca de 32 volta à marca, sem sinal. Em C o leitor tem a rolagem dele e o corpo começa
   * no respiro (`inicio` 0); em B o corpo divide a rolagem com os *Detalhes*, e a conta começa no COMEÇO DO CORPO dentro
   * dela: o `y` do `view-leitor` mais a borda de cima dele (`inicio`), medido a cada vez que B monta — até lá, `null`
   * (a âncora espera). Com a marca nos *Detalhes*, ou nada rolado, o topo (QL-D52). Ao girar a tela troca de
   * `ScrollView`: a rolagem vista é da de antes até a nova falar (`rolagemNova`). V não tem zoom; a Tab não ancora.
   */
  const scroll = useRef<ScrollView | null>(null)
  const duasColunasAgora = t.view.coluna !== INEXISTENTE
  const tipoDoCorpo = content?.content_type ?? null
  const validadeDoCorpo = content === null ? null : isValidContent(content.content_type, content.content_data, content.file_url)
  const corpoDeTexto =
    content !== null && validadeDoCorpo !== null && validadeDoCorpo.ok && validadeDoCorpo.body !== 'file'
      ? bodyOf(content.content_type, content.content_data)
      : null
  const linhasDoCorpo = useMemo(() => linhasDoLeitor(corpoDeTexto, tipoDoCorpo, colunas), [corpoDeTexto, tipoDoCorpo, colunas])
  const logicas = useMemo(() => (corpoDeTexto === null ? [] : logicasDasVisuais(corpoDeTexto, linhasDoCorpo)), [corpoDeTexto, linhasDoCorpo])
  const entrelinha = estiloDoLeitor(tipoDoCorpo, zoomDefault, colors.dark).lineHeight ?? zoomDefault
  const [inicioEmB, setInicioEmB] = useState<number | null>(null)
  const ancora = useAncora(scroll, {
    chave: content?.id ?? '',
    corpo: corpoDeTexto,
    tipo: tipoDoCorpo,
    logicas,
    entrelinha,
    inicio: duasColunasAgora ? 0 : inicioEmB,
  })
  const faixaAntes = useRef(duasColunasAgora)
  const { rolagemNova } = ancora
  useLayoutEffect(() => {
    if (faixaAntes.current === duasColunasAgora) return
    faixaAntes.current = duasColunasAgora
    rolagemNova()
    // B se mede de novo a cada vez que monta: o começo do corpo de antes não vale
    if (duasColunasAgora) setInicioEmB(null)
  }, [duasColunasAgora, rolagemNova])
  const medirLeitorEmB = useCallback(
    (e: LayoutChangeEvent) => {
      aoMedirContainer(e)
      const ini = e.nativeEvent.layout.y + bar.hairline
      setInicioEmB((a) => (a !== null && Math.abs(a - ini) < 0.01 ? a : ini))
    },
    [aoMedirContainer],
  )

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

  const invalido = validade === null || validade.ok ? null : validade.reason
  const iconeDoTipo = ICONE_DO_TIPO[content.content_type]
  const rotulo = (ROTULO_DO_TIPO as { readonly [k: string]: string })[content.content_type]
  const artista = content.artist !== null && content.artist.length > 0 ? content.artist : null
  const favorita = content.is_favorite === true
  const duasColunas = t.view.coluna !== INEXISTENTE
  const id = content.id
  const titulo = content.title

  const aoFavoritar = (valor: boolean): void => {
    setAviso(null) // a linha some no próximo favoritar (N4-R8)
    void favoritar(id, valor).then((r) => {
      const motivo = avisoDoFavoritar(titulo, valor, r)
      if (motivo !== null && r.especie !== 'ok' && focada.current) setAviso({ motivo, especie: r.especie })
    })
  }

  // Uma linha de aviso por vez (N4-R8 > N4-R9): a falha do último favoritar, senão o sem rede (P-F4).
  const avisoDaTela =
    aviso !== null
      ? { ...iconeDaEspecie(aviso.especie), motivo: aviso.motivo }
      : !online
        ? { icone: 'sem-conexao' as const, cor: dark.offlineInk, motivo: FRASES_N4['sem-rede-favoritar'] }
        : null
  const linhaDeAviso =
    avisoDaTela !== null ? <LinhaDeAviso icone={avisoDaTela.icone} cor={avisoDaTela.cor} motivo={avisoDaTela.motivo} recuo={space.xl} /> : null

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
          emVoo={estadoDoFavoritar(id)}
          online={online}
          onFavoritar={aoFavoritar}
          testID="view-favoritar"
        />
        <BotaoTocar titulo={content.title} inerte={invalido !== null} onTocar={() => onTocar(id)} testID="view-tocar" />
      </View>
    </View>
  )

  const cor = colors.dark
  const detalhes = <Detalhes content={content} colunas={t.view.grade} />
  const tipoDoArquivo = (ROTULO_DO_TIPO as { readonly [k: string]: string })[content.content_type] ?? 'arquivo'

  // O que vai no lugar do leitor: o texto (que rola) ou um corpo de altura própria (o PDF, os placeholders).
  let corpoFixo: React.JSX.Element | null = null
  let texto: React.JSX.Element | null = null
  if (invalido !== null) {
    corpoFixo =
      invalido === 'unknown-type' ? (
        <PlaceholderDoLeitor
          testID="view-placeholder"
          icone={<Icone nome="tipo-desconhecido" tamanho={28} cor={cor.offlineInk} />}
          titulo={FRASES_DO_LEITOR['tipo-desconhecido']}
          cor={cor}
        />
      ) : (
        <PlaceholderDoLeitor testID="view-placeholder" titulo={FRASES_DO_LEITOR['sem-conteudo']} cor={cor} />
      )
  } else if (urlArquivo !== null && formato) {
    corpoFixo = (
      <FormatoDoLeitor nome={fileNameFromUrl(urlArquivo)} tipo={tipoDoArquivo} bytes={knownBytes(urlArquivo)} cor={cor} testID="view-formato" />
    )
  } else if (urlArquivo !== null) {
    corpoFixo =
      arquivo.fase === 'pronto' ? (
        <PdfDoLeitor uri={arquivo.uri} cor={cor} onLoadComplete={() => undefined} onPageChanged={() => undefined} onError={() => undefined} testID="view-pdf" />
      ) : arquivo.fase === 'buscando' ? (
        <PlaceholderDoLeitor
          testID="view-baixando"
          icone={<Icone nome="baixando" tamanho={28} cor={cor.accentInk} />}
          apoio={FRASES_DO_TABLET['baixando-o-arquivo']}
          cor={cor}
        />
      ) : arquivo.fase === 'ausente' ? (
        <S3eDoLeitor
          testID="view-nao-baixado"
          titulo={content.title}
          tipo={tipoDoArquivo.toLowerCase()}
          bytes={arquivo.bytes}
          online={online}
          cor={cor}
        >
          <BaixarComoIcone onBaixar={baixar} />
        </S3eDoLeitor>
      ) : (
        // A falha (N4-R15, `N4-*-V-arquivo-falhou`): *não consegui baixar* e a espécie embaixo — a genérica não se repete.
        <PlaceholderDoLeitor
          testID="view-falha"
          icone={<Icone nome="falha" tamanho={28} cor={cor.errorInk} />}
          titulo={FRASES_DO_TABLET['nao-consegui-baixar']}
          apoio={arquivo.mensagem === FRASES_DO_TABLET['nao-consegui-baixar'] ? undefined : arquivo.mensagem}
          cor={cor}
        >
          <BaixarComoIcone onBaixar={baixar} />
        </PlaceholderDoLeitor>
      )
  } else {
    texto = (
      <CorpoDoLeitor
        corpo={corpoDeTexto}
        tipo={content.content_type}
        linhas={linhasDoCorpo}
        colunas={colunas}
        estilo={estiloDoLeitor(content.content_type, zoomDefault, cor)}
        testID="corpo"
      />
    )
  }

  if (duasColunas) {
    return (
      <View style={styles.tela} testID="view-tela">
        {cabecalho}
        {linhaDeAviso}
        <View style={styles.colunas}>
          <ScrollView
            style={[styles.colunaDetalhes, { width: t.view.coluna as number }]}
            contentContainerStyle={styles.detalhesPad}
            testID="view-detalhes"
          >
            {detalhes}
          </ScrollView>
          <View style={styles.colunaLeitor} testID="view-leitor">
            {texto !== null ? (
              <ScrollView
                ref={scroll}
                style={leitor.conteudo}
                contentContainerStyle={leitor.conteudoPad}
                onLayout={aoMedirContainer}
                onScroll={ancora.aoRolar}
                scrollEventThrottle={16}
                onContentSizeChange={ancora.aoMudarConteudo}
                onScrollBeginDrag={ancora.aoArrastar}
              >
                {texto}
              </ScrollView>
            ) : (
              corpoFixo
            )}
          </View>
        </View>
        {texto !== null ? medidor : null}
      </View>
    )
  }

  // B (e A): uma coluna. O PDF tem a rolagem DELE (a página, ajustada à largura): os detalhes ficam em cima e ele
  // ocupa o resto. Fora isso, uma rolagem só — os detalhes e o corpo (texto ou placeholder) juntos.
  if (urlArquivo !== null && !formato && arquivo.fase === 'pronto') {
    return (
      <View style={styles.tela} testID="view-tela">
        {cabecalho}
        {linhaDeAviso}
        <View style={styles.detalhesPad} testID="view-detalhes">
          {detalhes}
        </View>
        <View style={[styles.colunaLeitor, styles.leitorEmB]} testID="view-leitor">
          {corpoFixo}
        </View>
      </View>
    )
  }
  return (
    <View style={styles.tela} testID="view-tela">
      {cabecalho}
      {linhaDeAviso}
      <ScrollView
        ref={scroll}
        style={styles.rolagem}
        testID="view-rolagem"
        onScroll={ancora.aoRolar}
        scrollEventThrottle={16}
        onContentSizeChange={ancora.aoMudarConteudo}
        onScrollBeginDrag={ancora.aoArrastar}
      >
        <View style={styles.detalhesPad} testID="view-detalhes">
          {detalhes}
        </View>
        <View
          style={[styles.leitorEmB, texto !== null ? leitor.conteudoPad : null]}
          onLayout={texto !== null ? medirLeitorEmB : undefined}
          testID="view-leitor"
        >
          {texto ?? corpoFixo}
        </View>
      </ScrollView>
      {texto !== null ? medidor : null}
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
