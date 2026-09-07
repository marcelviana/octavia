/**
 * N0-PR3 — prova de login email/senha + GET /api/setlists com bearer. NÃO é a tela 1 (N1):
 * sem navegação, sem libs de UI. Linhas de log canônicas em src/log.ts.
 */
import { useEffect, useRef, useState } from 'react'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { auth } from './src/firebase'
import { getSetlists } from './src/api'
import { log } from './src/log'

type Phase = { kind: 'loading' } | { kind: 'login' } | { kind: 'in'; user: User; setlists: number | null; error: string | null }

export default function App() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const loggedInThisRun = useRef(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        log('login-screen')
        setPhase({ kind: 'login' })
        return
      }
      log(`auth uid=${user.uid} src=${loggedInThisRun.current ? 'login' : 'restored'}`)
      setPhase({ kind: 'in', user, setlists: null, error: null })
      getSetlists()
        .then((n) => {
          log(`setlists=${n} src=api`)
          setPhase((p) => (p.kind === 'in' ? { ...p, setlists: n } : p))
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e)
          setPhase((p) => (p.kind === 'in' ? { ...p, error: msg } : p))
        })
    })
  }, [])

  const onLogin = async () => {
    setLoginError(null)
    loggedInThisRun.current = true
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (e: unknown) {
      loggedInThisRun.current = false
      const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : 'unknown'
      setLoginError(`Falha no login (${code})`)
    }
  }

  if (phase.kind === 'loading') return <View style={styles.container}><Text>Carregando…</Text></View>

  if (phase.kind === 'login') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Octavia — entrar</Text>
        <TextInput style={styles.input} placeholder="email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} testID="email" />
        <TextInput style={styles.input} placeholder="senha" secureTextEntry value={password} onChangeText={setPassword} testID="password" />
        <Button title="Entrar" onPress={onLogin} />
        {loginError ? <Text style={styles.error}>{loginError}</Text> : null}
        <StatusBar style="auto" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setlists: {phase.setlists ?? '…'}</Text>
      {phase.error ? <Text style={styles.error}>Erro ao sincronizar ({phase.error})</Text> : null}
      <Button title="Sair" onPress={() => signOut(auth)} />
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 22 },
  input: { width: 320, borderWidth: 1, borderColor: '#999', borderRadius: 6, padding: 10, fontSize: 16 },
  error: { color: '#b00020' },
})
