/**
 * Raiz do app. Responsabilidade única: sessão, cache e sync — a UI é das
 * telas. As fontes não são carregadas aqui: o config plugin do `expo-font`
 * (N1-D6) as embarca no build.
 *
 * **Cache-first** (T1-R13 passo 1): ao entrar, o cache local é lido e
 * renderizado ANTES de qualquer request; o sync (passo 2) roda depois e só
 * substitui o conjunto quando o `planSync` do core diz `apply`.
 */
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { log } from './src/log'
import { Navigation } from './src/navigation'
import { useOnline } from './src/net'
import type { SyncState } from './src/screens/SetlistsScreen'
import { onAuth, signedInThisRun, type User } from './src/session'
import { load } from './src/store'
import { sincronizar } from './src/sync'
import { dark } from './src/theme'

type Estado = { fase: 'carregando' } | { fase: 'fora' } | { fase: 'dentro'; user: User }

interface Dados {
  setlists: SetlistDTO[]
  content: ContentDTO[]
  contentById: Map<string, ContentDTO>
  /** `true` só depois de um sync bem-sucedido gravado neste aparelho. */
  temCache: boolean
  syncedAtMs: number | null
}

const SEM_DADOS: Dados = {
  setlists: [],
  content: [],
  contentById: new Map(),
  temCache: false,
  syncedAtMs: null,
}

export default function App(): React.JSX.Element {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' })
  const [dados, setDados] = useState<Dados>(SEM_DADOS)
  const [sync, setSync] = useState<SyncState>({ fase: 'sincronizando' })
  const online = useOnline()

  useEffect(() => {
    return onAuth((user) => {
      if (user === null) {
        log('login-screen')
        setDados(SEM_DADOS)
        setSync({ fase: 'sincronizando' })
        setEstado({ fase: 'fora' })
        return
      }
      // `src` distingue login digitado de sessão restaurada do cache do SDK
      // (T1-R19 / A5). A marca vem do `session.ts`, posta ANTES da chamada.
      log(`auth uid=${user.uid} src=${signedInThisRun() ? 'login' : 'restored'}`)
      setEstado({ fase: 'dentro', user })
    })
  }, [])

  /** Passo 2 do T1-R13 — roda depois de a tela já mostrar o cache. */
  const rodarSync = useCallback(async (uid: string, anterior: Dados): Promise<void> => {
    setSync({ fase: 'sincronizando' })
    const r = await sincronizar(
      uid,
      anterior.temCache ? { content: anterior.content, setlists: anterior.setlists } : null,
    )
    if (r.kind === 'ok') {
      setDados({
        setlists: r.setlists,
        content: r.content,
        contentById: new Map(r.content.map((c) => [c.id, c])),
        temCache: true,
        syncedAtMs: r.syncedAtMs,
      })
      setSync({ fase: 'ok', syncedAtMs: r.syncedAtMs })
      return
    }
    // Falha ou offline: o cache anterior fica exatamente como está (A21) e o
    // estado da tela conta o que houve, sem esconder e sem bloquear (T1-R18).
    setSync(
      r.kind === 'skipped-offline'
        ? { fase: 'offline', syncedAtMs: anterior.syncedAtMs }
        : { fase: 'falha', syncedAtMs: anterior.syncedAtMs },
    )
  }, [])

  useEffect(() => {
    if (estado.fase !== 'dentro') return
    const uid = estado.user.uid
    const cache = load(uid)
    const iniciais: Dados = {
      setlists: cache.setlists,
      content: cache.content,
      contentById: cache.contentById,
      temCache: cache.present,
      syncedAtMs: cache.syncedAtMs,
    }
    setDados(iniciais)
    setSync(
      cache.present
        ? { fase: 'ok', syncedAtMs: cache.syncedAtMs ?? Date.now() }
        : { fase: 'sincronizando' },
    )
    void rodarSync(uid, iniciais)
  }, [estado, rodarSync])

  const tentarNovamente = useCallback(() => {
    if (estado.fase !== 'dentro') return
    void rodarSync(estado.user.uid, dados)
  }, [estado, dados, rodarSync])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.raiz} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style="light" />
        {estado.fase === 'carregando' ? (
          <View style={styles.centro}>
            <ActivityIndicator color={dark.accent} />
          </View>
        ) : (
          <Navigation
            signedIn={estado.fase === 'dentro'}
            dados={{
              lista: dados.setlists,
              contentById: dados.contentById,
              syncDone: sync.fase !== 'sincronizando',
              online,
            }}
            setlists={{
              setlists: dados.setlists,
              contentById: dados.contentById,
              // Downloads de arquivo são a N1-PR5: por ora nada está baixado,
              // então toda setlist com arquivo aparece como ◔ "0 de n".
              filesPresent: new Set<string>(),
              temCache: dados.temCache,
              sync,
              online,
              onTentarNovamente: tentarNovamente,
              onAbrirSetlist: () => undefined,
            }}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: dark.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
