/**
 * Navegação da tela 1 (N1-D1: `@react-navigation/native` + native-stack).
 * As seis rotas do design são declaradas aqui — S0 Login, S1 Setlists, S2
 * Index, S3 Stage, S4 Search, S5 End — para que as PRs seguintes só troquem o
 * componente de cada uma. Sem header: as barras são do design (T1-R27/R28).
 *
 * Nesta PR (N1-PR3b) `Login` e `Setlists` são reais; S2, S3, S4 e S5 seguem
 * como placeholder rotulado, para que um tap na setlist tenha efeito visível
 * em vez de abrir tela preta.
 */
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { LoginScreen } from './screens/LoginScreen'
import { SetlistsScreen, type SetlistsScreenProps } from './screens/SetlistsScreen'
import { SpikeScreen } from './screens/SpikeScreen'
import { dark, font, size, space, tracking } from './theme'

/** Parâmetros de rota da tela 1 — preenchidos nas PRs 4 a 6. */
export type RootStackParamList = {
  Login: undefined
  Setlists: undefined
  Index: { setlistId: string }
  Stage: { setlistId: string; position: number }
  Search: { setlistId?: string }
  End: { setlistId: string }
  /** TEMPORÁRIA — spike do C3, sai no commit 2 da N1-PR4. */
  Spike: undefined
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
}

export function Navigation({ signedIn, setlists }: NavigationProps): React.JSX.Element {
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
                  onSpike={() => navigation.navigate('Spike')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Index">
              {() => <Placeholder titulo="ÍNDICE" nota="S2 — próxima PR" />}
            </Stack.Screen>
            <Stack.Screen name="Stage">
              {() => <Placeholder titulo="PALCO" nota="S3 — próxima PR" />}
            </Stack.Screen>
            <Stack.Screen name="Search">
              {() => <Placeholder titulo="BUSCA" nota="S4 — próxima PR" />}
            </Stack.Screen>
            <Stack.Screen name="End">
              {() => <Placeholder titulo="FIM DA SETLIST" nota="S5 — próxima PR" />}
            </Stack.Screen>
            <Stack.Screen name="Spike">
              {({ navigation }) => <SpikeScreen onSair={() => navigation.goBack()} />}
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
