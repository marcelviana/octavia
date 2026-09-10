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
import { SetlistsScreen, type SetlistsScreenProps } from './screens/SetlistsScreen'
import { StageScreen } from './screens/StageScreen'
import { dark, font, size, space, tracking } from './theme'

export type RootStackParamList = {
  Login: undefined
  Setlists: undefined
  Index: { setlistId: string; posicaoAtual?: number }
  Stage: { setlistId: string; position: number }
  Search: { setlistId?: string }
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
                    online={dados.online}
                    onPosicao={(position) => navigation.setParams({ position })}
                    onFim={() => navigation.navigate('End', { setlistId: setlist.id })}
                    onIndice={() =>
                      navigation.navigate('Index', {
                        setlistId: setlist.id,
                        posicaoAtual: route.params.position,
                      })
                    }
                    onSair={() => navigation.navigate('Setlists')}
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

            {/* A busca é a N1-PR6. */}
            <Stack.Screen name="Search">
              {() => <Placeholder titulo="BUSCA" nota="S4 — próxima PR" />}
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
