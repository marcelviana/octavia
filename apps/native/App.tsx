/**
 * Raiz do app (N1-PR3a). Responsabilidade única: saber se há sessão e montar
 * a navegação. As fontes NÃO são carregadas aqui — o config plugin do
 * `expo-font` (N1-D6) as embarca no build, então já estão prontas quando o
 * app abre ("No additional code required to load fonts", doc da Expo).
 *
 * Nesta PR o app **não** chama `/api/*`: uma linha `api status=` no logcat
 * seria defeito, não sucesso (o sync é a N1-PR3b).
 */
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { log } from './src/log'
import { Navigation } from './src/navigation'
import { onAuth, signedInThisRun, type User } from './src/session'
import { dark } from './src/theme'

type Estado = { fase: 'carregando' } | { fase: 'fora' } | { fase: 'dentro'; user: User }

export default function App(): React.JSX.Element {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' })

  useEffect(() => {
    return onAuth((user) => {
      if (user === null) {
        log('login-screen')
        setEstado({ fase: 'fora' })
        return
      }
      // `src` distingue login digitado de sessão restaurada do cache do SDK
      // (T1-R19 / A5). A marca vem do `session.ts`, posta ANTES da chamada.
      log(`auth uid=${user.uid} src=${signedInThisRun() ? 'login' : 'restored'}`)
      setEstado({ fase: 'dentro', user })
    })
  }, [])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.raiz} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="light" />
        {estado.fase === 'carregando' ? (
          <View style={styles.centro}>
            <ActivityIndicator color={dark.accent} />
          </View>
        ) : (
          <Navigation signedIn={estado.fase === 'dentro'} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: dark.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
