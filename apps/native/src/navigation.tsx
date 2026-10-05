/**
 * Navegação da tela 1 (N1-D1: `@react-navigation/native` + native-stack).
 * Seis rotas: S0 Login, S1 Setlists, S2 Index, S3 Stage, S4 Search, S5 End.
 * Sem header — as barras são do design (T1-R27/R28).
 *
 * A **posição no palco vive nos params da rota** (`Stage.position`): assim
 * ela sobrevive à rotação do device sem estado extra (T1-R27: "girar na
 * música 4 → continua na 4").
 */
import { useCallback, useState } from 'react'
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native'
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { EndScreen } from './screens/EndScreen'
import { IndexScreen, type AvisoDeSaida } from './screens/IndexScreen'
import { LoginScreen } from './screens/LoginScreen'
import { SearchScreen } from './screens/SearchScreen'
import { SetlistsScreen, type SetlistsScreenProps } from './screens/SetlistsScreen'
import { StageScreen } from './screens/StageScreen'
import {
  destinoDoResultado,
  type Destino,
  type ParamsDaBusca,
  type ParamsDoPalco,
} from './rotas-do-avulso'
import { dark, font, size, space, tracking } from './theme'

export type RootStackParamList = {
  Login: undefined
  Setlists: undefined
  Index: { setlistId: string; posicaoAtual?: number }
  /**
   * `avulsa` (T1-R22): abrir pela busca uma música que NÃO está na setlist
   * empilha uma segunda instância do palco. O `goBack` devolve a primeira,
   * com a `position` intacta — a pilha É a restauração, sem estado global.
   *
   * N4-PR6 — ou o avulso SEM hospedeira (`{ avulsa, origem }`, sem setlist,
   * N4-R16): ver `rotas-do-avulso.ts`.
   */
  Stage: ParamsDoPalco
  /** `posicao` é a do palco na abertura; ausente quando a busca vem da S1/S2 ou do avulso sem hospedeira. */
  Search: ParamsDaBusca
  End: { setlistId: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: dark.accent,
    background: dark.bg,
    card: dark.bg,
    text: dark.text,
    border: dark.line,
    notification: dark.error,
  },
}

function Placeholder({ titulo, nota }: { titulo: string; nota: string }): React.JSX.Element {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{titulo}</Text>
      <Text style={styles.placeholderText}>{nota}</Text>
    </View>
  )
}

export interface NavigationProps {
  signedIn: boolean
  setlists: SetlistsScreenProps
  /** Dados que S2/S3/S5 consomem — os mesmos do cache já carregado. */
  dados: {
    lista: SetlistDTO[]
    /** A biblioteca inteira, em ordem — o que a busca indexa (T1-R22). */
    contents: ContentDTO[]
    contentById: Map<string, ContentDTO>
    syncDone: boolean
    online: boolean
    /** O disco de arquivos mudou (N1-PR5) — a raiz recalcula `filesPresent`. */
    onArquivosMudaram: () => void
  }
}

/**
 * Executa um `Destino` de `rotas-do-avulso.ts` — o `push` é o que faz o avulso
 * sem hospedeira e a busca dele EMPILHAREM sobre a origem, que volta no
 * `goBack` na mesma posição.
 */
function ir(navigation: NativeStackNavigationProp<RootStackParamList>, d: Destino): void {
  if (d.rota === 'Stage') {
    if (d.acao === 'push') navigation.push('Stage', d.params)
    else if (d.acao === 'replace') navigation.replace('Stage', d.params)
    else navigation.navigate('Stage', d.params)
  } else if (d.acao === 'push') navigation.push('Search', d.params)
  else navigation.navigate('Search', d.params)
}

export function Navigation({ signedIn, setlists, dados }: NavigationProps): React.JSX.Element {
  const acharSetlist = (id: string): SetlistDTO | undefined => dados.lista.find((s) => s.id === id)

  /**
   * **T2-R10 — o aviso que S2 deixa para S1.** Quando uma escrita volta 404, a
   * tela é abandonada: *"fecha o que estiver aberto, sai de S2 e cai em S1 já
   * relida, com a linha de aviso de 48 dp […] sem botão"*. O estado mora AQUI
   * e não em S2 pela razão mais simples possível: quando o aviso aparece, S2
   * já não existe.
   *
   * Ele se apaga ao abrir qualquer setlist — a partir daí a tela já não é a
   * que mudou debaixo do músico.
   *
   * **N2-E21**: o aviso tem duas formas, porque o 404 pode chegar sem a lista
   * relida (`'sumiu-nao-relido'`) — e aí S1 não pode dizer que ela é a do
   * servidor.
   */
  const [sumiu, setSumiu] = useState<AvisoDeSaida>(null)

  /**
   * N2-PR4 — o que S2 precisa para escrever (T2-R19). O `estadoLocal` e o
   * `aoRelerNaEscrita` são os MESMOS que S1 usa: a escrita parte do cache que
   * a tela mostra, e quem grava é o `escrita.ts` nas duas telas.
   */
  const edicaoDeS2 = useCallback(
    (sair: (aviso: AvisoDeSaida) => void) =>
      setlists.estadoLocal === null
        ? null
        : {
            estado: setlists.estadoLocal,
            online: dados.online,
            aoReler: setlists.aoRelerNaEscrita,
            aoSairParaS1: sair,
          },
    [setlists.estadoLocal, setlists.aoRelerNaEscrita, dados.online],
  )

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: dark.bg } }}
      >
        {signedIn ? (
          <Stack.Group>
            <Stack.Screen name="Setlists">
              {({ navigation }) => (
                <SetlistsScreen
                  {...setlists}
                  sumiu={sumiu === 'sumiu' || sumiu === 'sumiu-nao-relido'}
                  sumiuNaoRelido={sumiu === 'sumiu-nao-relido'}
                  apagadaNaoRelida={typeof sumiu === 'object' && sumiu !== null ? sumiu.apagadaNaoRelida : null}
                  onAbrirSetlist={(setlistId) => {
                    setSumiu(null)
                    navigation.navigate('Index', { setlistId })
                  }}
                  onBuscar={() => navigation.navigate('Search', {})}
                />
              )}
            </Stack.Screen>

            <Stack.Screen name="Index">
              {({ navigation, route }) => {
                const setlist = acharSetlist(route.params.setlistId)
                if (setlist === undefined) {
                  return <Placeholder titulo="SETLIST" nota="não está no cache" />
                }
                return (
                  <IndexScreen
                    setlist={setlist}
                    contentById={dados.contentById}
                    syncDone={dados.syncDone}
                    posicaoAtual={route.params.posicaoAtual ?? null}
                    /**
                     * **T2-R19 — quem veio do palco não edita.** O
                     * discriminante é o `posicaoAtual` dos params, o mesmo que
                     * escolhe o nome acessível do `voltar` desde a V1-PR5:
                     * ausente = veio de S1 (`navigate('Index', { setlistId })`
                     * acima), presente = veio do palco (`onIndice`, que manda
                     * a posição junto).
                     */
                    edicao={
                      route.params.posicaoAtual === undefined
                        ? edicaoDeS2((aviso) => {
                            setSumiu(aviso)
                            navigation.navigate('Setlists')
                          })
                        : null
                    }
                    onVoltar={() => navigation.goBack()}
                    onAbrirPosicao={(position) =>
                      navigation.navigate('Stage', { setlistId: setlist.id, position })
                    }
                    onBuscar={() =>
                      navigation.navigate('Search', {
                        setlistId: setlist.id,
                        posicao: route.params.posicaoAtual,
                      })
                    }
                  />
                )
              }}
            </Stack.Screen>

            <Stack.Screen name="Stage">
              {({ navigation, route }) => {
                const p = route.params
                // N4-R16 — o avulso SEM hospedeira: nenhuma setlist é procurada,
                // então zero setlists abre igual (div. 1001).
                if ('origem' in p) {
                  return (
                    <StageScreen
                      setlist={null}
                      contentById={dados.contentById}
                      posicao={1}
                      avulsaContentId={p.avulsa}
                      origemDoAvulso={p.origem}
                      online={dados.online}
                      onPosicao={() => undefined}
                      onFim={() => undefined}
                      onIndice={() => undefined}
                      onBusca={() => navigation.push('Search', {})}
                      onSair={() => navigation.goBack()}
                      onArquivosMudaram={dados.onArquivosMudaram}
                    />
                  )
                }
                const setlist = acharSetlist(p.setlistId)
                if (setlist === undefined) {
                  return <Placeholder titulo="SETLIST" nota="não está no cache" />
                }
                return (
                  <StageScreen
                    setlist={setlist}
                    contentById={dados.contentById}
                    posicao={p.position}
                    avulsaContentId={p.avulsa ?? null}
                    origemDoAvulso={null}
                    online={dados.online}
                    onPosicao={(position) => navigation.setParams({ position })}
                    onFim={() => navigation.navigate('End', { setlistId: setlist.id })}
                    onIndice={() =>
                      navigation.navigate('Index', {
                        setlistId: setlist.id,
                        posicaoAtual: p.position,
                      })
                    }
                    onBusca={() =>
                      navigation.navigate('Search', {
                        setlistId: setlist.id,
                        posicao: p.position,
                      })
                    }
                    // No avulso "Sair" é "Voltar": desempilha e o palco de
                    // baixo reaparece na posição em que ficou (T1-R22).
                    onSair={() =>
                      p.avulsa !== undefined
                        ? navigation.goBack()
                        : navigation.navigate('Setlists')
                    }
                    onArquivosMudaram={dados.onArquivosMudaram}
                  />
                )
              }}
            </Stack.Screen>

            <Stack.Screen name="End">
              {({ navigation, route }) => {
                const setlist = acharSetlist(route.params.setlistId)
                const total = setlist?.setlist_songs.length ?? 0
                return (
                  <EndScreen
                    nomeSetlist={setlist?.name ?? ''}
                    total={total}
                    onVoltarUltima={() =>
                      navigation.navigate('Stage', {
                        setlistId: route.params.setlistId,
                        position: total,
                      })
                    }
                    onVoltarInicio={() =>
                      navigation.navigate('Stage', {
                        setlistId: route.params.setlistId,
                        position: 1,
                      })
                    }
                    onSair={() => navigation.navigate('Setlists')}
                  />
                )
              }}
            </Stack.Screen>

            <Stack.Screen name="Search">
              {({ navigation, route }) => {
                const setlist =
                  route.params.setlistId === undefined
                    ? null
                    : (acharSetlist(route.params.setlistId) ?? null)
                return (
                  <SearchScreen
                    contents={dados.contents}
                    setlist={setlist}
                    posicao={route.params.posicao ?? null}
                    online={dados.online}
                    onFechar={() => navigation.goBack()}
                    // Na setlist: é um SALTO — o palco existente vai para a
                    // posição. Fora dela: `replace` põe o palco avulso no
                    // lugar da busca, e o `goBack` volta ao palco original.
                    // Sem setlist (de S1, ou do avulso): o avulso SEM
                    // hospedeira empilha, e o voltar devolve esta busca no
                    // mesmo termo (N4-R16) — `rotas-do-avulso.ts`.
                    onAbrir={(contentId, posicaoNaSetlist) =>
                      ir(navigation, destinoDoResultado(setlist, route.params.posicao ?? null, contentId, posicaoNaSetlist))
                    }
                  />
                )
              }}
            </Stack.Screen>
          </Stack.Group>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: dark.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  placeholderTitle: {
    color: dark.text,
    fontFamily: font.display,
    fontSize: size.title,
    letterSpacing: size.title * tracking.displayWide,
  },
  placeholderText: { color: dark.muted, fontFamily: font.ui, fontSize: size.body },
})
