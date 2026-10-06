/**
 * L — A BIBLIOTECA NO TABLET (N4-PR7; `N4-REQUISITOS.md` N4-R1…N4-R11; `DESIGN-N4/telas.html`, as molduras
 * `N4-{C,B}-L-*`, com as erratas do `DESIGN-N4/README.md` §6 prevalecendo).
 *
 * `Buscar música` em S1 abre esta tela (N4-R1, N4-D59). **Fixos no topo**, de cima para baixo: a barra de 88 (voltar ·
 * campo — a da S4), a linha de aviso quando há (sob a barra), a faixa de filtros (P-T1) e a régua (*Biblioteca · {n}
 * músicas* · *{n} resultados*). **Só a lista rola** — a régua fica, porque *"é ela que diz quantos resultados sobraram
 * depois de um filtro"* (a folha).
 *
 * **Abre sem teclado** (N4-R2, N4-D60): o campo não tem `autoFocus`; o teclado sobe no toque nele. Com o teclado de
 * pé, a janela encolhe (o `adjustResize` do Android, o padrão do Expo) e a lista — o único `flex: 1` da tela — termina
 * acima dele; barra, aviso, filtros e régua não se mexem.
 *
 * **A busca** (N4-R11) é a da S4 sobre o mesmo índice (`buildIndex`, memoizado por `contents`), sem o corte de 50
 * (N4-D90): `consultarBiblioteca` do core compõe busca, tipos ("ou") e Favoritas ("e") e devolve as cinco contagens
 * da biblioteca inteira. Nenhuma linha de log nova: a busca de L não loga (o `search q=` é da S4 e do A11).
 *
 * **Os estados de sincronização** (N4-R10), da raiz (`sync`, `temCache`, as mesmas props de S1):
 *  - **carregando** — a 1ª vez, sem nada no aparelho: *carregando…*, o ícone `baixando`; os filtros à vista, inertes e
 *    sem contagem; a régua *Biblioteca* e *—*; o campo aceita digitar;
 *  - **falha sem nada no aparelho** — a composição do S1d com a P-F11 e *Tentar novamente*;
 *  - **vazia** — a conta sem música: *nenhum conteúdo ainda* e a P-F10, a marca em repouso; os chips com 0, inertes;
 *  - **falha com o que está no aparelho** — a frase do S1e na linha de aviso, com *Tentar novamente*; a lista é a do
 *    aparelho.
 *
 * **A linha de aviso** (uma de cada vez, a regra da `LinhaDeAviso`; quem decide é a tela, `avisoDaTela`): a falha do
 * último favoritar (N4-R8, por espécie — cresce e nunca elide; some no próximo favoritar ou ao sair da tela), senão o
 * sem rede (N4-R9, P-F4: o motivo uma vez, à vista sem toque — nenhum motivo repetido por linha), senão a falha do
 * sync com o que está no aparelho.
 *
 * **O ▶** abre o palco avulso desta música com a origem `biblioteca` (N4-R16): o palco EMPILHA sobre a L, e o voltar
 * dele (*Voltar para a biblioteca*) devolve esta tela na mesma posição — rolagem, filtros e termo —, porque o
 * native-stack não desmonta a tela de baixo.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  FRASES_DO_TABLET,
  VOCABULARIO_DE_CONTENT,
  buildIndex,
  consultarBiblioteca,
  escopoDaBusca,
  estadoDoArquivo,
  nadaEncontradoPara,
  nResultados,
  reguaBiblioteca,
  type ContentDTO,
  type ContentType,
} from '@octavia/core'
import { favoritar, assinarFavoritar, estadoDoFavoritar } from '../favoritar'
import { assinarDownloads, estadoDosDownloads } from '../files'
import { Icone } from '../icones/Icone'
import type { NomeIcone } from '../icones/dados'
import { bar, dark, faixas, font, radius, size, space, touch, tracking } from '../theme'
import { useFaixa } from '../useFaixa'
import { FiltrosDaBiblioteca } from './FiltrosDaBiblioteca'
import { LinhaDaBiblioteca } from './LinhaDaBiblioteca'
import type { SyncState } from './SetlistsScreen'

export interface LibraryScreenProps {
  /** A biblioteca inteira, do cache (o mesmo conjunto da S4). */
  contents: ContentDTO[]
  /** URLs de arquivo no disco (`presentUrls`, o mesmo de S1). */
  filesPresent: Set<string>
  online: boolean
  /** O sync da raiz e se há cache — os estados da N4-R10 (as mesmas props de S1). */
  sync: SyncState
  temCache: boolean
  onTentarNovamente: () => void
  /** Volta a S1. */
  onVoltar: () => void
  /** O ▶: o palco avulso desta música, com a origem `biblioteca`. */
  onTocar: (contentId: string) => void
}

/** A régua de L — a da S4 (rótulo · fio · contagem, mono 12 em `muted`), fixa sobre a lista. */
function Regua({ esquerda, direita }: { esquerda: string; direita: string }): React.JSX.Element {
  return (
    <View style={styles.regua} testID="lib-regua">
      <Text style={styles.reguaTexto}>{esquerda}</Text>
      <View style={styles.reguaFio} />
      <Text style={styles.reguaTexto}>{direita}</Text>
    </View>
  )
}

/** O corpo quando não há lista: ícone de 28, título (opcional), apoio (opcional), ação (opcional). */
function Centro({
  icone,
  titulo,
  apoio,
  testID,
}: {
  icone?: { nome: NomeIcone; cor: string; estado?: 'normal' | 'inerte' }
  titulo?: string
  apoio?: string
  testID: string
}): React.JSX.Element {
  return (
    <View style={styles.centro} testID={testID}>
      {icone !== undefined ? <Icone nome={icone.nome} tamanho={28} cor={icone.cor} estado={icone.estado} /> : null}
      {titulo !== undefined ? <Text style={styles.centroTitulo}>{titulo}</Text> : null}
      {apoio !== undefined ? <Text style={styles.centroApoio}>{apoio}</Text> : null}
    </View>
  )
}

export function LibraryScreen({
  contents,
  filesPresent,
  online,
  onVoltar,
  onTocar,
}: LibraryScreenProps): React.JSX.Element {
  const t = faixas[useFaixa()]
  const [termo, setTermo] = useState('')
  const [tipos, setTipos] = useState<ContentType[]>([])
  const [soFavoritas, setSoFavoritas] = useState(false)

  // O estado em voo do favoritar e o dos downloads moram nos módulos (sobrevivem à tela); a tela assina e redesenha.
  const [, setVersao] = useState(0)
  useEffect(() => {
    const redesenhar = (): void => setVersao((v) => v + 1)
    const a = assinarFavoritar(redesenhar)
    const b = assinarDownloads(redesenhar)
    return () => {
      a()
      b()
    }
  }, [])

  const indice = useMemo(() => buildIndex(contents), [contents])
  const resposta = useMemo(
    () => consultarBiblioteca(contents, indice, { termo, tipos, favoritas: soFavoritas }),
    [contents, indice, termo, tipos, soFavoritas],
  )

  const alternarTipo = useCallback((tipo: ContentType) => {
    setTipos((atual) => (atual.includes(tipo) ? atual.filter((x) => x !== tipo) : [...atual, tipo]))
  }, [])

  const aoFavoritar = useCallback((content: ContentDTO, valor: boolean) => {
    void favoritar(content.id, valor)
  }, [])

  const presentes = filesPresent
  const downloads = estadoDosDownloads()
  const consultou = termo.trim().length > 0
  const filtrou = tipos.length > 0 || soFavoritas

  let corpo: React.JSX.Element
  if (resposta.n === 0 && soFavoritas && tipos.length === 0 && !consultou && resposta.contagens.favoritas === 0) {
    corpo = (
      <Centro
        testID="lib-favoritas-0"
        icone={{ nome: 'estrela', cor: dark.lineInfo }}
        titulo={VOCABULARIO_DE_CONTENT['vazio-favoritas']}
      />
    )
  } else if (resposta.n === 0 && filtrou) {
    corpo = (
      <Centro
        testID="lib-filtro-sem-resultado"
        titulo={VOCABULARIO_DE_CONTENT['vazio-filtro']}
        apoio={VOCABULARIO_DE_CONTENT['vazio-filtro-apoio']}
      />
    )
  } else if (resposta.n === 0 && consultou) {
    // N4-R11 — as duas frases da S4b, intactas; a lupa com o X em `muted` (não achar não é erro).
    corpo = (
      <Centro
        testID="lib-busca-sem-resultado"
        icone={{ nome: 'nada-encontrado', cor: dark.muted }}
        titulo={nadaEncontradoPara(termo.trim())}
        apoio={escopoDaBusca(contents.length)}
      />
    )
  } else {
    corpo = (
      <FlatList
        data={resposta.itens}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        testID="lib-lista"
        renderItem={({ item }) => (
          <LinhaDaBiblioteca
            content={item}
            arquivo={estadoDoArquivo(item, presentes, downloads)}
            emVoo={estadoDoFavoritar(item.id)}
            online={online}
            tokens={t}
            onFavoritar={(valor) => aoFavoritar(item, valor)}
            onTocar={() => onTocar(item.id)}
          />
        )}
      />
    )
  }

  return (
    <View style={styles.tela}>
      <View style={styles.barra}>
        <Pressable
          style={styles.botaoIcone}
          onPress={onVoltar}
          accessibilityRole="button"
          accessibilityLabel={FRASES_DO_TABLET['voltar-setlists']}
          testID="lib-voltar"
        >
          <Icone nome="voltar" tamanho={24} cor={dark.text} />
        </Pressable>
        <View style={[styles.campo, consultou && styles.campoAtivo]}>
          <Icone nome="busca" tamanho={24} cor={consultou ? dark.accentInk : dark.lineInfo} />
          <TextInput
            style={styles.input}
            value={termo}
            onChangeText={setTermo}
            placeholder={FRASES_DO_TABLET['buscar-musica']}
            placeholderTextColor={dark.muted}
            autoCorrect={false}
            autoCapitalize="none"
            testID="lib-campo"
          />
          {termo.length > 0 ? (
            <Pressable
              style={styles.apagarAlvo}
              onPress={() => setTermo('')}
              accessibilityRole="button"
              accessibilityLabel="Apagar o que foi digitado"
              testID="lib-apagar"
            >
              <Icone nome="apagar" tamanho={24} cor={dark.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FiltrosDaBiblioteca
        contagens={resposta.contagens}
        tipos={tipos}
        favoritas={soFavoritas}
        inertes={false}
        tokens={t}
        onTipo={alternarTipo}
        onFavoritas={() => setSoFavoritas((v) => !v)}
      />

      <Regua
        esquerda={reguaBiblioteca(contents.length)}
        direita={nResultados(resposta.n)}
      />

      {corpo}
    </View>
  )
}

/**
 * Medidas da folha (`N4-B-L-base`), todas do pacote: a barra de 88 (`bar.top + space.xl`) é a da S4, medida a medida
 * (m2, *"= S4"*) — o voltar de 48 com borda no lugar do `fechar`, o campo de `touch.list + 2` com o alvo do texto de
 * 48, a lupa de 24 e o `apagar` dentro; a régua com 16 acima e 12 abaixo do texto (a folha
 * dá 16 · 18,2 · 14 = a m6; o 14 não é token — 12, e a diferença de 2 dp está na tabela das estimadas do anexo); a lista
 * com 24 de margem e 12 entre as linhas (m8). Os textos do centro são os da S4 e do S1.
 */
const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
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
  input: { flex: 1, minHeight: touch.min, color: dark.text, fontFamily: font.ui, fontSize: size.body },
  apagarAlvo: {
    minWidth: touch.min,
    minHeight: touch.min,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regua: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  // §3.3 — régua de seção é TEXTO ATIVO abaixo de 24 dp: `muted`, nunca `lineInfo` (a da S4).
  reguaTexto: {
    color: dark.muted,
    fontFamily: font.mono,
    fontSize: size.labelSmall,
    letterSpacing: size.labelSmall * tracking.display,
    textTransform: 'uppercase',
  },
  reguaFio: { flex: 1, height: bar.hairline, backgroundColor: dark.line },
  lista: { paddingHorizontal: space.xl, paddingBottom: space.xl, gap: space.md },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    paddingHorizontal: space.xxxl,
  },
  centroTitulo: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.label,
    textAlign: 'center',
  },
  centroApoio: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: size.bodySmall,
    lineHeight: size.bodySmall * 1.5,
    textAlign: 'center',
    // N4-D97 [Marcel, 2026-10-06]: o mesmo 560 de S1 e S4 (literal, não token) — cópia declarada; herança do bloco de
    // identidade, com os 13 e 20 da N4-D79.
    maxWidth: 560,
  },
})
