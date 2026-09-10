/**
 * Navegação da tela 1 (N1-D1: `@react-navigation/native` + native-stack).
 * As seis rotas do design são declaradas aqui desde já — S0 Login, S1
 * Setlists, S2 Index, S3 Stage, S4 Search, S5 End — para que as PRs seguintes
 * só troquem o componente de cada uma. Sem header: as barras são do design
 * (T1-R27/R28), não do sistema.
 *
 * Nesta PR (N1-PR3a) só `Login` e um `Setlists` placeholder têm tela; as
 * outras quatro existem como rota registrada e componente vazio.
 */
import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'
import { LoginScreen } from './screens/LoginScreen'
import { dark, font, size, space, tracking } from './theme'

/** Parâmetros de rota da tela 1 — preenchidos nas PRs 3b a 6. */
export type RootStackParamList = {
  Login: undefined
  Setlists: undefined
  Index: { setlistId: string }
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

/** Placeholder da S1 — a tela real é a N1-PR3b (sync + seis estados). */
function SetlistsPlaceholder(): React.JSX.Element {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>SETLISTS</Text>
      <Text style={styles.placeholderText}>S1 — próxima PR</Text>
    </View>
  )
}

/** Rotas ainda sem tela (S2, S3, S4, S5): registradas, vazias. */
function Vazia(): React.JSX.Element {
  return <View style={styles.placeholder} />
}

export function Navigation({ signedIn }: { signedIn: boolean }): React.JSX.Element {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: dark.bg } }}>
        {signedIn ? (
          <Stack.Group>
            <Stack.Screen name="Setlists" component={SetlistsPlaceholder} />
            <Stack.Screen name="Index" component={Vazia} />
            <Stack.Screen name="Stage" component={Vazia} />
            <Stack.Screen name="Search" component={Vazia} />
            <Stack.Screen name="End" component={Vazia} />
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
