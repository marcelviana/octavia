/**
 * Navegação da tela 1 (N1-D1: `@react-navigation/native` + native-stack).
 * Seis rotas: S0 Login, S1 Setlists, S2 Index, S3 Stage, S4 Search, S5 End.
 * Sem header — as barras são do design (T1-R27/R28).
 *
 * A **posição no palco vive nos params da rota** (`Stage.position`): assim
 * ela sobrevive à rotação do device sem estado extra (T1-R27: "girar na
 * música 4 → continua na 4").
 */
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { EndScreen } from './screens/EndScreen'
import { IndexScreen } from './screens/IndexScreen'
import { LoginScreen } from './screens/LoginScreen'
import { SearchScreen } from './screens/SearchScreen'
import { SetlistsScreen, type SetlistsScreenProps } from './screens/SetlistsScreen'
import { StageScreen } from './screens/StageScreen'
import { dark, font, size, space, tracking } from './theme'

export type RootStackParamList = {
  Login: undefined
  Setlists: undefined
  Index: { setlistId: string; posicaoAtual?: number }
  /**
   * `avulsa` (T1-R22): abrir pela busca uma música que NÃO está na setlist
   * empilha uma segunda instância do palco. O `goBack` devolve a primeira,
   * com a `position` intacta — a pilha É a restauração, sem estado global.
   */
  Stage: { setlistId: string; position: number; avulsa?: string }
  /** `posicao` é a do palco na abertura; ausente quando a busca vem da S1/S2. */
  Search: { setlistId?: string; posicao?: number }
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

export function Navigation({ signedIn, setlists, dados }: NavigationProps): React.JSX.Element {
  const acharSetlist = (id: string): SetlistDTO | undefined => dados.lista.find((s) => s.id === id)

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
                  onAbrirSetlist={(setlistId) => navigation.navigate('Index', { setlistId })}
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
                const setlist = acharSetlist(route.params.setlistId)
                if (setlist === undefined) {
                  return <Placeholder titulo="SETLIST" nota="não está no cache" />
                }
                return (
                  <StageScreen
                    setlist={setlist}
                    contentById={dados.contentById}
                    posicao={route.params.position}
                    avulsaContentId={route.params.avulsa ?? null}
                    online={dados.online}
                    onPosicao={(position) => navigation.setParams({ position })}
                    onFim={() => navigation.navigate('End', { setlistId: setlist.id })}
                    onIndice={() =>
                      navigation.navigate('Index', {
                        setlistId: setlist.id,
                        posicaoAtual: route.params.position,
                      })
                    }
                    onBusca={() =>
                      navigation.navigate('Search', {
                        setlistId: setlist.id,
                        posicao: route.params.position,
                      })
                    }
                    // No avulso "Sair" é "Voltar": desempilha e o palco de
                    // baixo reaparece na posição em que ficou (T1-R22).
                    onSair={() =>
                      route.params.avulsa !== undefined
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
                    onAbrir={(contentId, posicaoNaSetlist) => {
                      // Na setlist: é um SALTO — o palco existente vai para a
                      // posição. Fora dela: `replace` põe o palco avulso no
                      // lugar da busca, e o `goBack` volta ao palco original.
                      if (setlist !== null && posicaoNaSetlist !== null) {
                        navigation.navigate('Stage', {
                          setlistId: setlist.id,
                          position: posicaoNaSetlist,
                        })
                        return
                      }
                      navigation.replace('Stage', {
                        setlistId: setlist?.id ?? dados.lista[0]?.id ?? '',
                        position: route.params.posicao ?? 1,
                        avulsa: contentId,
                      })
                    }}
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
