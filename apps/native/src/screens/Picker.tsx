/**
 * O PICKER — N2-PR6 (DESIGN-N2 §5, molduras `N2-P-vazio`, `N2-P-resultados`
 * e `N2-P-relendo`; PRD T2-R6, R9, R11, R15, R16; N2-D15, D17, D30, D32).
 *
 * *"É o S4 com um rodapé."* Mesma barra de 88, mesmo `fechar` de 48 (mesmo
 * `testID`), mesmo campo, mesma ordem de resultados — **nesta setlist
 * primeiro, biblioteca depois** — e as mesmas réguas. A busca é a do core,
 * **a mesma chamada do S4**: `buildIndex` sobre a biblioteca do cache,
 * `searchIndex` com a normalização do T1-R21 e `groupResults` com o
 * agrupamento do T1-R22 (`packages/core/src/search.ts`). Nada de busca é
 * copiado para cá; a régua é o `Regua` do próprio S4.
 *
 * O que muda: cada resultado ganha um `Adicionar` de 48 dp e a marca do que
 * já está na setlist, e nasce um rodapé de 64 dp.
 *
 * ## Os cinco estados por linha (R1·3)
 *
 *   adicionar → adicionando… → *(201)* → relendo… → adicionada
 *                           ↘ falhou (a frase do servidor inteira)
 *
 * **O que sobe com o 201 e o que sobe com a releitura** (N2-D30): o 201 muda
 * a LINHA (sai do "adicionando…") e o `k` do rodapé, que é local e conta 2xx
 * confirmados. A marca `n×`, o total do rodapé e o "n músicas" de S2 só sobem
 * com a releitura — e sobem sozinhos, porque vêm da `setlist` que o pai
 * redesenha com o conjunto relido (o `aoReler`, o caminho da div. 270). O 201
 * chega aqui ANTES da releitura pelo `aoResponder` do `escrever()` (div.
 * 302); o "adicionada" entre o 201 e o começo da releitura dura o mesmo tick,
 * e o que se vê é `adicionando… → relendo… → adicionada` (div. 303).
 *
 * **Relendo… não tem botão**: tocar ali somaria um bis não pedido. **As
 * outras linhas seguem ativas** durante o relendo… — a trava do `escrever()`
 * é só do request (div. 232) —, mas ficam OCUPADAS durante o request de
 * outra: sem isso o segundo toque voltaria barrado com `reason=busy`, e a
 * frase dele seria a da espécie `rede`, mentira com a rede de pé. O motivo é
 * a própria linha em "adicionando…" (o mesmo raciocínio da S2, N2-D23).
 *
 * **Falhou**: a frase do servidor inteira na linha, e `Tentar de novo` só
 * DEPOIS de uma releitura (regra 3) — o `escrever()` só relê depois de 2xx e
 * de 404, então depois de uma falha quem relê é esta tela (`reason=reopen`,
 * como a remoção de S2). Se essa releitura falha, o botão não aparece: o
 * rodapé assume o aviso (N2-D32).
 *
 * ## As saídas
 *
 * `Concluir` e o `fechar` **não escrevem nada** — tudo já foi escrito música
 * por música — e S2 já tem o conjunto da última releitura. A exceção é sair
 * com o aviso de releitura aberto: aí S2 relê na volta (a legenda de
 * `N2-P-relendo`). Enquanto um REQUEST voa, as saídas ficam ocupadas: sair
 * ali esconderia uma falha que ainda não aconteceu (T2-R11). O voltar do
 * sistema segue a mesma regra.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  adicionadasNestaVisita,
  buildIndex,
  frase,
  groupResults,
  jaNaSetlist,
  musicasDisponiveis,
  nMusicas,
  placeholderDoPicker,
  reguaBiblioteca,
  reguaNestaSetlist,
  reordenavel,
  searchIndex,
  vazioDoPicker,
  type ContentDTO,
  type Resultado,
  type SetlistDTO,
} from '@octavia/core'
import { escrever, pedidoAdicionar, relerAoAbrir, type EstadoLocal } from '../escrita'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, faixas, font, radius, size, space, touch } from '../theme'
import { useFaixa } from '../useFaixa'
import { LinhaDeAviso } from './LinhaDeAviso'
import { Regua } from './SearchScreen'

export interface PickerProps {
  /** A setlist como o SERVIDOR a tem — o pai a troca a cada releitura. */
  setlist: SetlistDTO
  /** O cache de onde a escrita parte; a biblioteca é o `estado.content`. */
  estado: EstadoLocal
  online: boolean
  aoReler: (setlists: SetlistDTO[], syncedAtMs: number | null) => void
  /** A volta a S2. `true` = saiu com o aviso de releitura aberto: S2 relê. */
  aoFechar: (releituraFalhou: boolean) => void
  /** Uma releitura voltou em erro DEPOIS de o picker fechar. */
  aoSalvoNaoRelido: () => void
  /** T2-R10 — a setlist sumiu. A releitura já aconteceu. */
  aoSumir: (setlists: SetlistDTO[] | null, syncedAtMs: number | null) => void
}

/** O estado de UMA linha, por `content_id`. Ausente = "adicionar". */
type Fase =
  | { fase: 'adicionando' }
  | { fase: 'relendo' }
  | { fase: 'adicionada' }
  | {
      fase: 'falhou'
      /** A primeira linha: o que não deu certo — ou a dúvida (N2-D18). */
      titulo: string
      /** A segunda: a frase do servidor, inteira (T2-R15). */
      motivo: string
      /** Há o que repetir? Não no limite de taxa (é tempo) nem no 404. */
      repetivel: boolean
      /** A releitura da regra 3 está em voo — o botão espera por ela. */
      relendo: boolean
    }

type Linha =
  | { kind: 'regua'; id: string; texto: string; n: number }
  | { kind: 'resultado'; id: string; n: number; content: ContentDTO; posicao: number | null }

export function Picker({
  setlist,
  estado,
  online,
  aoReler,
  aoFechar,
  aoSalvoNaoRelido,
  aoSumir,
}: PickerProps): React.JSX.Element {
  const [termo, setTermo] = useState('')
  const [fases, setFases] = useState<Record<string, Fase>>({})
  /** N2-D30 — LOCAL: 2xx confirmados desde que o picker abriu. */
  const [k, setK] = useState(0)
  /** N2-D22 no picker: o aviso assume o rodapé. */
  const [releituraFalhou, setReleituraFalhou] = useState(false)
  const [recarregando, setRecarregando] = useState(false)

  /**
   * As adições continuam DEPOIS de o picker fechar (a releitura em voo ainda
   * volta), e o que elas trazem tem de chegar a quem ainda está montado — a
   * raiz e a S2. Os `ref` guardam os retornos mais novos e se o picker ainda
   * existe; nada aqui cancela uma escrita, que não se cancela (regra 1).
   */
  const montado = useRef(true)
  const retornos = useRef({ aoReler, aoSalvoNaoRelido, aoSumir })
  retornos.current = { aoReler, aoSalvoNaoRelido, aoSumir }
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const mudar = useCallback((contentId: string, fase: Fase) => {
    setFases((atual) => ({ ...atual, [contentId]: fase }))
  }, [])

  // ------------------------------------------------------------- a busca
  // A MESMA do S4: índice memoizado pela biblioteca, busca e agrupamento do core.
  const biblioteca = estado.content
  const indice = useMemo(() => buildIndex(biblioteca), [biblioteca])
  const porId = useMemo(() => new Map(biblioteca.map((c) => [c.id, c])), [biblioteca])

  /** `content_id` → quantas posições da setlist relida apontam para ele. */
  const vezes = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const s of setlist.setlist_songs) mapa.set(s.content_id, (mapa.get(s.content_id) ?? 0) + 1)
    return mapa
  }, [setlist])
  /** `content_id` → primeira posição (o número à esquerda, como no S4). */
  const posicaoDe = useMemo(() => {
    const mapa = new Map<string, number>()
    for (const s of [...setlist.setlist_songs].sort((a, b) => a.position - b.position)) {
      if (!mapa.has(s.content_id)) mapa.set(s.content_id, s.position)
    }
    return mapa
  }, [setlist])

  const hits = useMemo(() => searchIndex(indice, termo), [indice, termo])
  const grupos = useMemo(() => groupResults(hits, new Set(vezes.keys())), [hits, vezes])
  const consultou = termo.trim().length > 0

  const linhas: Linha[] = useMemo(() => {
    if (!consultou) return []
    const out: Linha[] = []
    let n = 0
    const resultado = (id: string, posicao: number | null): void => {
      const content = porId.get(id)
      if (content === undefined) return
      n++
      out.push({ kind: 'resultado', id: `r-${id}`, n, content, posicao })
    }
    if (grupos.inSetlist.length > 0) {
      out.push({ kind: 'regua', id: 'h-setlist', texto: reguaNestaSetlist(setlist.name), n: grupos.inSetlist.length })
      for (const hit of grupos.inSetlist) resultado(hit.id, posicaoDe.get(hit.id) ?? null)
    }
    if (grupos.library.length > 0) {
      out.push({ kind: 'regua', id: 'h-lib', texto: reguaBiblioteca(biblioteca.length), n: grupos.library.length })
      for (const hit of grupos.library) resultado(hit.id, null)
    }
    return out
  }, [consultou, grupos, porId, posicaoDe, setlist.name, biblioteca.length])

  // ------------------------------------------------------------ escrever
  /** Um REQUEST em voo ocupa as outras linhas e as saídas (T2-R11). */
  const ocupado = Object.values(fases).some((f) => f.fase === 'adicionando')

  /** A releitura da regra 3, depois de uma falha: `reason=reopen`. */
  const relerDepoisDaFalha = useCallback(
    async (contentId: string, falha: Extract<Fase, { fase: 'falhou' }>) => {
      const novas = await relerAoAbrir(estado)
      if (novas !== null) {
        retornos.current.aoReler(novas, Date.now())
        setReleituraFalhou(false)
      } else {
        // N2-D32: sem estado real, nenhuma repetição — o rodapé avisa.
        setReleituraFalhou(true)
      }
      if (montado.current) mudar(contentId, { ...falha, relendo: false })
    },
    [estado, mudar],
  )

  const adicionar = useCallback(
    async (contentId: string) => {
      if (!online || ocupado) return
      mudar(contentId, { fase: 'adicionando' })
      const saida = await escrever(pedidoAdicionar(setlist.id, contentId), estado, {
        contexto: 'setlist',
        aoResponder: (preliminar) => {
          if (preliminar.especie !== 'ok') return
          // O 201: a linha sai do "adicionando…" e o `k` sobe. A releitura
          // começa agora — é ela que traz a marca e o total.
          setK((atual) => atual + 1)
          mudar(contentId, { fase: 'relendo' })
        },
      })
      const r = saida.resultado
      if (r.especie === 'ok') {
        if (saida.setlists !== null) retornos.current.aoReler(saida.setlists, saida.syncedAtMs)
        setReleituraFalhou(false)
        mudar(contentId, { fase: 'adicionada' })
        return
      }
      if (r.especie === 'ok-nao-relido') {
        mudar(contentId, { fase: 'adicionada' })
        if (montado.current) setReleituraFalhou(true)
        else retornos.current.aoSalvoNaoRelido()
        return
      }
      if (r.especie === 'sumiu') {
        const aindaExiste = saida.setlists?.some((s) => s.id === setlist.id) ?? true
        if (!aindaExiste) {
          // T2-R10 — a lista relida vai JUNTO, antes da saída (div. 270).
          retornos.current.aoSumir(saida.setlists, saida.syncedAtMs)
          return
        }
        // A setlist está lá; quem sumiu foi a MÚSICA da biblioteca (outro
        // aparelho a apagou). A frase de `sumiu-setlist` mentiria, e não há
        // o que repetir (div. 307).
        if (saida.setlists !== null) retornos.current.aoReler(saida.setlists, saida.syncedAtMs)
        else setReleituraFalhou(true)
        mudar(contentId, falhou(r, { motivo: frase('generica'), repetivel: false, relendo: false }))
        return
      }
      if (r.especie === 'limite') {
        // O que falta é tempo, e o prazo já está na frase: sem botão e sem
        // releitura — a mesma decisão da linha de aviso de S2.
        mudar(contentId, falhou(r, { repetivel: false, relendo: false }))
        return
      }
      // servidor, auth, rede: a frase já, o botão depois da releitura.
      const f = falhou(r, { repetivel: true, relendo: true })
      mudar(contentId, f)
      void relerDepoisDaFalha(contentId, f)
    },
    [online, ocupado, setlist.id, estado, mudar, relerDepoisDaFalha],
  )

  const recarregar = useCallback(async () => {
    if (recarregando) return
    setRecarregando(true)
    try {
      const novas = await relerAoAbrir(estado)
      if (novas !== null) {
        retornos.current.aoReler(novas, Date.now())
        setReleituraFalhou(false)
      }
    } finally {
      if (montado.current) setRecarregando(false)
    }
  }, [estado, recarregando])

  // --------------------------------------------------------------- sair
  const fechar = useCallback(() => {
    if (ocupado) return
    aoFechar(releituraFalhou)
  }, [ocupado, releituraFalhou, aoFechar])

  const fecharRef = useRef(fechar)
  fecharRef.current = fechar
  useEffect(() => {
    const s = BackHandler.addEventListener('hardwareBackPress', () => {
      fecharRef.current()
      return true
    })
    return () => s.remove()
  }, [])

  // ------------------------------------------------------------- rodapé
  const n = setlist.setlist_songs.length
  /**
   * Um aviso por vez, o que bloqueia mais (§3.3). Sem rede bloqueia toda
   * adição; a releitura falha diz que o total pode estar velho; o teto não
   * bloqueia nada aqui — adicionar continua (N2-D17) —, e só avisa o que vai
   * acontecer em S2 (T2-R6). Extra X3, div. 305.
   */
  const aviso = !online
    ? { icone: 'sem-conexao' as NomeIcone, cor: dark.offlineInk, motivo: frase('sem-rede-s2'), acao: undefined }
    : releituraFalhou
      ? {
          icone: 'ultima-sincronizacao' as NomeIcone,
          cor: dark.muted,
          motivo: frase('salvo-nao-relido-picker'),
          acao: {
            rotulo: 'Tentar recarregar',
            onPress: () => void recarregar(),
            inativo: recarregando,
            motivoInativo: recarregando ? frase('relendo') : undefined,
          },
        }
      : !reordenavel(n)
        ? { icone: 'n-de-musicas' as NomeIcone, cor: dark.muted, motivo: frase('teto-100'), acao: undefined }
        : null

  const vazio = vazioDoPicker(setlist.name)

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        {/* O `fechar` do S4: mesmo desenho, mesmo lugar, mesmo `testID`. */}
        <Pressable
          style={[styles.botaoIcone, ocupado ? styles.bordaInativa : null]}
          onPress={fechar}
          accessibilityRole="button"
          accessibilityState={{ disabled: ocupado }}
          accessibilityLabel="Fechar e voltar à setlist"
          testID="fechar-busca"
        >
          <Icone nome="fechar" tamanho={24} cor={ocupado ? dark.lineInfo : dark.text} />
        </Pressable>

        <View style={[styles.campo, consultou && styles.campoAtivo]}>
          <Icone nome="busca" tamanho={24} cor={consultou ? dark.accentInk : dark.lineInfo} />
          <TextInput
            style={styles.input}
            value={termo}
            onChangeText={setTermo}
            // R1·5 — o que separa o picker (escrita) da busca da barra (leitura).
            placeholder={placeholderDoPicker(setlist.name)}
            placeholderTextColor={dark.lineInfo}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            testID="picker-campo"
          />
          {termo.length > 0 ? (
            <Pressable
              style={styles.apagarAlvo}
              onPress={() => setTermo('')}
              accessibilityRole="button"
              accessibilityLabel="Apagar o que foi digitado"
              testID="apagar"
            >
              <Icone nome="apagar" tamanho={24} cor={dark.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!consultou ? (
        <View style={styles.centro}>
          <View style={styles.centroCaixa} testID="picker-vazio">
            <Icone nome="buscar-musica" tamanho={28} cor={dark.lineInfo} />
            <Text style={styles.centroApoio}>
              {vazio.antes}
              <Text style={styles.centroNome}>{vazio.nome}</Text>
              {vazio.depois}
              {'\n'}
              {musicasDisponiveis(biblioteca.length)}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={linhas}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.lista}
          // O `Adicionar` tem de receber o toque com o teclado de pé: é o
          // "1 toque por música" do §5.
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            item.kind === 'regua' ? (
              <Regua texto={item.texto} n={item.n} />
            ) : (
              <Resultado
                n={item.n}
                content={item.content}
                posicao={item.posicao}
                vezes={vezes.get(item.content.id) ?? 0}
                fase={fases[item.content.id] ?? null}
                inativo={!online || ocupado}
                semEstadoReal={releituraFalhou}
                onAdicionar={() => void adicionar(item.content.id)}
              />
            )
          }
        />
      )}

      <View>
        {/* Releitura falhou: *"o aviso assume o rodapé, na linha de 48 dp do
            §7, empurrando a barra de 64 para baixo (48 + 64 = 112)"*. */}
        {aviso !== null ? (
          <View style={styles.avisoDoRodape}>
            <LinhaDeAviso icone={aviso.icone} cor={aviso.cor} motivo={aviso.motivo} acao={aviso.acao} recuo={space.xl} />
          </View>
        ) : null}
        <View style={styles.barraDoRodape}>
          <View style={styles.rodapeTexto} testID="picker-rodape">
            <Text style={styles.rodapeNome} numberOfLines={1}>{`${setlist.name} · `}</Text>
            {/* O total vem da RELEITURA; não relido, é "não está pronta". */}
            <Text style={[styles.rodapeParte, releituraFalhou ? styles.rodapeVelho : null]} testID="picker-total">
              {nMusicas(n)}
            </Text>
            <Text style={styles.rodapeParte}>{` · ${adicionadasNestaVisita(k)}`}</Text>
          </View>
          <Pressable
            style={[styles.concluir, ocupado ? styles.bordaInativa : null]}
            onPress={fechar}
            accessibilityRole="button"
            accessibilityState={{ disabled: ocupado }}
            testID="picker-concluir"
          >
            <Text style={[styles.concluirTexto, ocupado ? styles.textoInativo : null]}>Concluir</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

/** A `Fase` de falha a partir do resultado, com o título que não mente. */
function falhou(
  r: Resultado,
  o: { motivo?: string; repetivel: boolean; relendo: boolean },
): Extract<Fase, { fase: 'falhou' }> {
  return {
    fase: 'falhou',
    // N2-D18: na falha de rede o `add` PODE ter passado — "não entrou" seria
    // mentira. N2-E19 (div. 308): a primeira linha é a frase da espécie,
    // "sem resposta do servidor", e a SEGUNDA é a dúvida. O barrado por
    // offline não saiu: "não entrou" é verdade, e "nada foi salvo" também.
    titulo: r.podeTerGravado ? r.frase : frase('falhou-adicionar'),
    motivo: o.motivo ?? (r.podeTerGravado ? frase('pode-ter-gravado') : r.frase),
    repetivel: o.repetivel,
    relendo: o.relendo,
  }
}

/**
 * Uma linha de resultado (§5): número (só na setlist), título e artista, a
 * marca do que já está na setlist, e o estado — que é o alvo de 48 dp,
 * `picker-adicionar-<n>`, quando há o que tocar.
 */
function Resultado({
  n,
  content,
  posicao,
  vezes,
  fase,
  inativo,
  semEstadoReal,
  onAdicionar,
}: {
  n: number
  content: ContentDTO
  posicao: number | null
  vezes: number
  fase: Fase | null
  /** Sem rede ou outro request em voo: o `Adicionar` fica inativo. */
  inativo: boolean
  /**
   * A última releitura falhou (N2-D32): não há estado real que autorize
   * REPETIR uma escrita — o `Tentar de novo` some. Adicionar outra música
   * continua: não é repetição, é outra escrita.
   */
  semEstadoReal: boolean
  onAdicionar: () => void
}): React.JSX.Element {
  const falhou = fase?.fase === 'falhou' ? fase : null
  // N3-E18: em B a linha que falha empilha — a frase e o `Tentar de novo` no
  // 2º andar, abaixo do título. Qualquer outra fase fica na fileira de 80.
  const t = faixas[useFaixa()].picker
  const empilha = falhou !== null && t.empilhaFalha
  const numero = posicao !== null ? <Text style={styles.numero}>{posicao}</Text> : null
  const textoDaLinha = (
    <View style={styles.itemTexto}>
      <Text style={styles.titulo} numberOfLines={1}>
        {content.title}
      </Text>
      {content.artist !== null && content.artist.length > 0 ? (
        <Text style={styles.sublinha} numberOfLines={1}>
          {content.artist}
        </Text>
      ) : null}
    </View>
  )
  const marca =
    vezes > 0 ? (
      // "A marca usa o visto de 20 em lineInfo — é contorno informativo."
      <View style={styles.marca}>
        <Icone nome="garantida" tamanho={20} cor={dark.lineInfo} />
        <Text style={styles.marcaTexto}>{jaNaSetlist(vezes)}</Text>
      </View>
    ) : null
  const estadoEl = (
    <View style={[styles.estado, empilha ? styles.estadoNoAndar : null]} testID={`picker-estado-${n}`}>
      {fase === null ? (
        <Alvo n={n} inativo={inativo} icone="adicionar" rotulo="Adicionar" onPress={onAdicionar} />
      ) : fase.fase === 'adicionando' ? (
        // Mantém o contorno: o request ainda é do botão.
        <View style={styles.alvo}>
          <Icone nome="baixando" tamanho={24} cor={dark.accentInk} />
          <Text style={[styles.alvoTexto, styles.capital]}>{frase('adicionando')}</Text>
        </View>
      ) : fase.fase === 'relendo' ? (
        // "Mesmo arco partido, mesma tinta de acento, sem contorno."
        <View style={[styles.alvo, styles.semContorno]}>
          <Icone nome="baixando" tamanho={24} cor={dark.accentInk} />
          <Text style={[styles.alvoTexto, styles.acento, styles.capital]}>{frase('relendo')}</Text>
        </View>
      ) : fase.fase === 'adicionada' ? (
        // "Adicionada aparece com o 201 e perde o contorno de botão."
        <View style={[styles.alvo, styles.semContorno]}>
          <Icone nome="garantida" tamanho={24} cor={dark.accentInk} />
          <Text style={[styles.alvoTexto, styles.acento, styles.capital]}>{frase('adicionada')}</Text>
        </View>
      ) : (
        <View style={[styles.falha, empilha ? styles.falhaNoAndar : null]}>
          <Icone nome="falha" tamanho={20} cor={dark.errorInk} />
          <View style={styles.falhaTexto}>
            <Text style={styles.falhaTitulo}>{fase.titulo}</Text>
            <Text style={styles.falhaMotivo}>{fase.motivo}</Text>
          </View>
          {/* Regra 3: o botão só depois da releitura — e nunca sem ela. */}
          {fase.repetivel && !fase.relendo && !semEstadoReal ? (
            <Alvo n={n} inativo={inativo} icone="tentar-novamente" rotulo="Tentar de novo" onPress={onAdicionar} />
          ) : null}
        </View>
      )}
    </View>
  )

  if (empilha) {
    // B: dois andares. O recuo do 2º é o do título (o lugar do número).
    return (
      <View style={[styles.item, styles.itemFalhou, styles.itemEmpilhado, { minHeight: t.linhaFalha }]}>
        <View style={styles.andar}>
          {numero}
          {textoDaLinha}
          {marca}
        </View>
        <View style={styles.andar}>
          {posicao !== null ? <View style={styles.recuoDoNumero} /> : null}
          {estadoEl}
        </View>
      </View>
    )
  }
  return (
    <View style={[styles.item, falhou !== null ? styles.itemFalhou : null, { minHeight: falhou !== null ? t.linhaFalha : 80 }]}>
      {/* "O número à esquerda existe só nos resultados que já estão na
          setlist, como no S4 de hoje: na biblioteca não há posição." */}
      {numero}
      {textoDaLinha}
      {marca}
      {estadoEl}
    </View>
  )
}

/** O alvo de 48 dp da linha: `Adicionar` ou `Tentar de novo` — o mesmo id. */
function Alvo({
  n,
  inativo,
  icone,
  rotulo,
  onPress,
}: {
  n: number
  inativo: boolean
  icone: NomeIcone
  rotulo: string
  onPress: () => void
}): React.JSX.Element {
  const escrita = icone === 'adicionar'
  return (
    <Pressable
      style={[styles.alvo, inativo ? styles.bordaInativa : null]}
      onPress={() => (inativo ? undefined : onPress())}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo }}
      testID={`picker-adicionar-${n}`}
    >
      <Icone
        nome={icone}
        tamanho={24}
        // §3.1: escrita é ícone em `accentInk`; o `Tentar de novo` é do V1.
        cor={inativo ? dark.lineInfo : escrita ? dark.accentInk : dark.text}
        estado={inativo ? 'inerte' : 'normal'}
      />
      <Text style={[styles.alvoTexto, inativo ? styles.textoInativo : null]}>{rotulo}</Text>
    </Pressable>
  )
}

/**
 * Medidas das molduras `N2-P-*`. A barra, o campo e a régua são as do S4
 * (`SearchScreen.tsx`, mesmos tokens); o que é novo: o alvo de 48 da linha,
 * a marca de 20 em `lineInfo`, o bloco de falha (20 · 14 · mono 12) e o
 * rodapé de 64 (+ 48 do aviso). Ficam como literal, declarados como no S4, a
 * altura do resultado (80), o corpo de 13 e o título de 20.
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  // A barra de 88 do S4.
  barra: {
    height: bar.top + space.xl,
    paddingHorizontal: space.xl,
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
  campo: {
    flex: 1,
    height: touch.list + 2,
    paddingLeft: space.lg,
    paddingRight: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  campoAtivo: { borderColor: dark.accentInk },
  // R1·5: "texto de 18 dp em lineInfo" — o placeholder; o digitado é `text`.
  input: { flex: 1, minHeight: touch.min, color: dark.text, fontFamily: font.ui, fontSize: size.input },
  apagarAlvo: {
    minWidth: touch.min,
    minHeight: touch.min,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxxl },
  centroCaixa: { alignItems: 'center', gap: space.lg, maxWidth: 560 },
  centroApoio: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: size.body,
    lineHeight: size.body * 1.55,
    textAlign: 'center',
  },
  centroNome: { color: dark.text, fontFamily: font.uiBold },
  lista: { paddingTop: space.sm, paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md },
  item: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  // A linha que falhou ganha o contorno de erro (moldura `N2-P-resultados`).
  itemFalhou: { borderColor: dark.errorInk },
  // N3-E18 (B): a linha que falha em dois andares; o vão entre eles é o da fileira.
  itemEmpilhado: { flexDirection: 'column', alignItems: 'stretch', gap: space.md },
  andar: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  // o lugar do número (`numero.minWidth`), para o 2º andar começar sob o título
  recuoDoNumero: { width: 32 },
  estadoNoAndar: { flex: 1 },
  falhaNoAndar: { flex: 1, maxWidth: undefined },
  numero: { color: dark.muted, fontFamily: font.mono, fontSize: 20, minWidth: 32, textAlign: 'right' },
  itemTexto: { flex: 1, gap: space.xs },
  titulo: { color: dark.text, fontFamily: font.uiBold, fontSize: 20 },
  sublinha: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  marcaTexto: { color: dark.muted, fontFamily: font.ui, fontSize: 13 },
  estado: { flexDirection: 'row', alignItems: 'center' },
  // O alvo de 48 — `height` e não `hitSlop`: o G5 lê BOUNDS.
  alvo: {
    height: touch.min,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  semContorno: { borderColor: 'transparent' },
  bordaInativa: { borderColor: dark.lineInfo },
  alvoTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
  acento: { color: dark.accentInk },
  // A moldura escreve "Adicionando…", "Relendo…", "Adicionada" dentro da
  // linha; o conjunto guarda as três em minúscula (div. 310).
  capital: { textTransform: 'capitalize' },
  textoInativo: { color: dark.lineInfo },
  falha: { flexDirection: 'row', alignItems: 'center', gap: space.md, maxWidth: 520 },
  falhaTexto: { flexShrink: 1, gap: 2 },
  falhaTitulo: { color: dark.errorInk, fontFamily: font.ui, fontSize: size.label },
  falhaMotivo: { color: dark.muted, fontFamily: font.mono, fontSize: size.labelSmall },
  // O fio que separa o aviso da lista. A linha de aviso é o componente de 48
  // do §3.3 e não se deforma; o fio fica por cima dela (div. 313).
  avisoDoRodape: { borderTopWidth: bar.hairline, borderTopColor: dark.line },
  // §5: "rodapé 64 (novo)" — com o fio DENTRO dos 64, como o congelado o
  // desenha (`border-box`). A primeira forma punha o fio num invólucro, fora
  // dos 64, e o Tab S6 mediu 64,9 (div. 313).
  barraDoRodape: {
    height: touch.stage,
    borderTopWidth: bar.hairline,
    borderTopColor: dark.line,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  rodapeTexto: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rodapeNome: { color: dark.muted, fontFamily: font.ui, fontSize: size.label, flexShrink: 1 },
  rodapeParte: { color: dark.muted, fontFamily: font.ui, fontSize: size.label },
  // Âmbar é "não está pronta" (V1 §6.1) — o total não relido.
  rodapeVelho: { color: dark.offlineInk },
  concluir: {
    height: touch.min,
    paddingHorizontal: space.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: bar.hairline,
    borderColor: dark.line,
    borderRadius: radius.control,
  },
  concluirTexto: { color: dark.text, fontFamily: font.ui, fontSize: size.bodySmall },
})
