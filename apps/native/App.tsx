/**
 * Raiz do app. Responsabilidade única: sessão, cache e sync — a UI é das
 * telas. As fontes não são carregadas aqui: o config plugin do `expo-font`
 * (N1-D6) as embarca no build.
 *
 * **Cache-first** (T1-R13 passo 1): ao entrar, o cache local é lido e
 * renderizado ANTES de qualquer request; o sync (passo 2) roda depois e só
 * substitui o conjunto quando o `planSync` do core diz `apply`.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import type { ContentDTO, SetlistDTO } from '@octavia/core'
import { presentUrls, setFilesUser } from './src/files'
import { log } from './src/log'
import { Navigation } from './src/navigation'
import { useOnline } from './src/net'
import { aplicarLru, baixarSetlist, prefetch7Dias } from './src/prefetch'
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
  const [filesPresent, setFilesPresent] = useState<Set<string>>(new Set())
  const [baixando, setBaixando] = useState<Set<string>>(new Set())
  const online = useOnline()

  /**
   * O indicador ✓ ◔ ✗ (T1-R17) conta ARQUIVOS, e arquivo é estado de disco:
   * qualquer download ou despejo tem de voltar para cá. É por isso que o
   * palco e o prefetch recebem este callback.
   *
   * Ele também é o ponto onde o **LRU** roda (T1-R14). Na N1-PR5 o LRU só
   * corria depois do sync, e o teto ficava furado entre um sync e o
   * seguinte: um "baixar esta setlist" ou o prefetch sob demanda podiam
   * estourá-lo e ninguém apararia (defeito medido no device). Aqui ele corre
   * a cada mudança de disco, que é exatamente quando o total pode crescer.
   *
   * As setlists vêm de um ref, não das dependências: o callback precisa ser
   * **estável**, senão os efeitos do palco que o listam re-disparariam a
   * cada sync.
   */
  const dadosRef = useRef<Dados>(SEM_DADOS)
  const recarregarArquivos = useCallback(() => {
    aplicarLru(dadosRef.current.setlists, dadosRef.current.contentById)
    setFilesPresent(presentUrls())
  }, [])

  useEffect(() => {
    dadosRef.current = dados
  }, [dados])

  /**
   * Passo 3 do T1-R13 — prefetch de 7 dias (T1-R15) e retenção (T1-R14).
   *
   * Roda sobre o conjunto que a tela está mostrando AGORA, e não só depois
   * de um sync bem-sucedido: numa abertura em que o sync falha, o cache
   * anterior continua valendo (T1-R9/A21) e pode ter uma setlist datada cujos
   * arquivos ainda não estão aqui — sem isto, nada os buscaria e o teto do
   * LRU não seria aparado até o próximo sync que desse certo (defeito medido
   * no device, N1-PR5).
   */
  const prefetchEArrumar = useCallback(
    async (setlists: SetlistDTO[], contentById: Map<string, ContentDTO>): Promise<void> => {
      await prefetch7Dias(setlists, contentById)
      recarregarArquivos()
    },
    [recarregarArquivos],
  )

  useEffect(() => {
    return onAuth((user) => {
      if (user === null) {
        log('login-screen')
        setFilesUser(null)
        setFilesPresent(new Set())
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
      const contentById = new Map(r.content.map((c) => [c.id, c]))
      setDados({
        setlists: r.setlists,
        content: r.content,
        contentById,
        temCache: true,
        syncedAtMs: r.syncedAtMs,
      })
      setSync({ fase: 'ok', syncedAtMs: r.syncedAtMs })
      // O `dadosRef` é atualizado à mão aqui porque o efeito que o segue o
      // `setDados` só corre no próximo render — e o LRU precisa das setlists
      // NOVAS para saber o que está garantido.
      dadosRef.current = {
        setlists: r.setlists,
        content: r.content,
        contentById,
        temCache: true,
        syncedAtMs: r.syncedAtMs,
      }
      await prefetchEArrumar(r.setlists, contentById)
      return
    }
    // Falha ou offline: o cache anterior fica exatamente como está (A21) e o
    // estado da tela conta o que houve, sem esconder e sem bloquear (T1-R18).
    setSync(
      r.kind === 'skipped-offline'
        ? { fase: 'offline', syncedAtMs: anterior.syncedAtMs }
        : { fase: 'falha', syncedAtMs: anterior.syncedAtMs },
    )
    // Sync falho ou pulado: o cache anterior é o que vale, e é sobre ele que
    // o prefetch e o LRU trabalham.
    await prefetchEArrumar(anterior.setlists, anterior.contentById)
  }, [prefetchEArrumar])

  useEffect(() => {
    if (estado.fase !== 'dentro') return
    const uid = estado.user.uid
    // O namespace dos arquivos é o mesmo do cache (PRD §5) e precisa estar
    // definido ANTES de qualquer leitura de disco.
    setFilesUser(uid)
    const cache = load(uid)
    const iniciais: Dados = {
      setlists: cache.setlists,
      content: cache.content,
      contentById: cache.contentById,
      temCache: cache.present,
      syncedAtMs: cache.syncedAtMs,
    }
    setDados(iniciais)
    setFilesPresent(presentUrls())
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

  /** T1-R15 manual — "baixar esta setlist" (o botão do S1b/c). */
  const baixarEsta = useCallback(
    (setlistId: string) => {
      const setlist = dados.setlists.find((s) => s.id === setlistId)
      if (setlist === undefined) return
      setBaixando((atual) => new Set(atual).add(setlistId))
      void baixarSetlist(setlist, dados.contentById).finally(() => {
        setBaixando((atual) => {
          const proximo = new Set(atual)
          proximo.delete(setlistId)
          return proximo
        })
        recarregarArquivos()
      })
    },
    [dados, recarregarArquivos],
  )

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
              contents: dados.content,
              contentById: dados.contentById,
              syncDone: sync.fase !== 'sincronizando',
              online,
              onArquivosMudaram: recarregarArquivos,
            }}
            setlists={{
              setlists: dados.setlists,
              contentById: dados.contentById,
              filesPresent,
              baixando,
              temCache: dados.temCache,
              sync,
              online,
              onTentarNovamente: tentarNovamente,
              // `onAbrirSetlist` e `onBuscar` são navegação: quem os liga é o
              // `navigation.tsx`, que tem o `navigation` em mãos. Aqui ficam
              // os no-ops que o tipo exige (padrão desde a N1-PR3b).
              onAbrirSetlist: () => undefined,
              onBuscar: () => undefined,
              onBaixarSetlist: baixarEsta,
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
