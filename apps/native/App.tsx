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
import { ligarPrefetchAposEscrita } from './src/apos-escrita'
import type { EstadoLocal } from './src/escrita'
import { useFaixa } from './src/useFaixa'
import { presentUrls, sanearArquivos, setFilesUser } from './src/files'
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

/**
 * N3-PR1 — a régua de desenvolvimento (`src/screens/ReguaDeDev.tsx`). Por
 * `require` atrás de `__DEV__`, e não por `import`: no release o Metro troca
 * `__DEV__` por `false` e dobra a expressão ANTES de coletar as dependências,
 * então o módulo nem entra no bundle — não basta não desenhar.
 */
const ReguaDeDev: (() => React.JSX.Element | null) | null = __DEV__
  ? (require('./src/screens/ReguaDeDev') as typeof import('./src/screens/ReguaDeDev')).ReguaDeDev
  : null

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
  // T3-R1: a decisão da faixa e a linha `faixa=` no boot e na rotação. Nenhuma
  // tela lê o valor ainda (N3-PR1); as PRs de superfície passam a ler.
  useFaixa()

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

  /**
   * O mesmo refresh SEM o LRU — o que corre a cada arquivo que assenta (W1).
   *
   * Com a barreira de lote, o indicador só se atualizava no FIM de todo o
   * plano: o cartão saltava de "0 de 5" para "5 de 5", e com um arquivo lento
   * no primeiro lote **nunca saía de 0**. Com a fila de trabalhadores, cada
   * arquivo que chega pode atualizar na hora, e é isso que o "parcial
   * honesto" desta PR significa na tela (aceite W1-A7).
   *
   * Por que sem o LRU: o `aplicarLru` é varredura de arrumação, não precisa
   * correr por arquivo — corre uma vez ao fim da fila, e o motivo que o pôs
   * no caminho (o teto ficava furado entre um sync e o seguinte) continua
   * satisfeito.
   */
  const atualizarPresentes = useCallback(() => {
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
      await prefetch7Dias(setlists, contentById, atualizarPresentes)
      recarregarArquivos()
    },
    [recarregarArquivos, atualizarPresentes],
  )

  /**
   * **T2-R17 / div. 228 — o gancho do prefetch, ligado aqui.**
   *
   * A releitura que segue uma escrita (N2-D13) não passa pelo `planSync`, que
   * é o caminho que dispara o prefetch nas duas saídas do `rodarSync` abaixo.
   * A N2-PR2 deixou o gancho `aoRelerSetlists` e o declarou INERTE, para que o
   * requisito não parecesse atendido por construção; a ligação é esta, e o que
   * ela faz é dar à releitura de uma escrita o mesmo tratamento que um sync
   * dá: criar ou datar para os próximos 7 dias baixa os arquivos sem o músico
   * abrir a setlist.
   *
   * O `contentById` vai como FUNÇÃO sobre o `dadosRef`: o índice muda a cada
   * sync, e um gancho que capturasse o mapa de hoje continuaria trabalhando
   * sobre ele depois.
   */
  useEffect(() => {
    return ligarPrefetchAposEscrita(
      () => dadosRef.current.contentById,
      atualizarPresentes,
      recarregarArquivos,
    )
  }, [atualizarPresentes, recarregarArquivos])

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
      // T1-R10: conjunto de content inalterado volta com a MESMA referência
      // (`reconcileByUpdatedAt`), e o índice por id é reaproveitado — senão
      // todo derivado que o lê se recriaria num sync com `invalidated=0`.
      const contentById =
        r.content === anterior.content
          ? anterior.contentById
          : new Map(r.content.map((c) => [c.id, c]))
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
        // T1-R36 / D-b: a chave do core viaja até a tela, que escolhe o texto.
        : { fase: 'falha', syncedAtMs: anterior.syncedAtMs, messageKey: r.messageKey },
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
    // A varredura da abertura (W1): o conserto do caminho de escrita impede
    // que nasçam arquivos envenenados; só isto tira os que já nasceram — o
    // `ensureFile` vê que o `localizar()` achou e nunca retenta. Roda ANTES
    // do primeiro `presentUrls()` para que o cartão nunca chegue a dizer
    // "garantida" sobre um arquivo que vai sumir um instante depois.
    sanearArquivos()
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

  /**
   * N2-PR3 — o cache de onde a escrita parte (T2-R9). É o mesmo conjunto que a
   * tela mostra: a escrita não parte de uma foto sua, parte do que está no
   * aparelho agora.
   */
  const estadoLocal: EstadoLocal | null =
    estado.fase === 'dentro'
      ? {
          uid: estado.user.uid,
          setlists: dados.setlists,
          content: dados.content,
          syncedAtMs: dados.syncedAtMs,
        }
      : null

  /**
   * A releitura de uma escrita já GRAVOU o cache (é o `escrita.ts` que o faz,
   * T2-R9); o que falta é a tela mostrar o que foi gravado. O `contentById`
   * não se recria quando o conjunto de content não mudou — a escrita não o
   * toca (N2-D1), então ele é sempre o anterior.
   */
  const aoRelerNaEscrita = useCallback((setlists: SetlistDTO[], syncedAtMs: number | null) => {
    setDados((atual) => ({ ...atual, setlists, temCache: true, syncedAtMs: syncedAtMs ?? atual.syncedAtMs }))
    if (syncedAtMs !== null) setSync({ fase: 'ok', syncedAtMs })
  }, [])

  /** T1-R15 manual — "baixar esta setlist" (o botão do S1b/c). */
  const baixarEsta = useCallback(
    (setlistId: string) => {
      const setlist = dados.setlists.find((s) => s.id === setlistId)
      if (setlist === undefined) return
      setBaixando((atual) => new Set(atual).add(setlistId))
      void baixarSetlist(setlist, dados.contentById, atualizarPresentes)
        // O `.finally` sozinho limpava o "Baixando…" e **não tratava a
        // rejeição**: o botão aceitava o toque e falhava em silêncio (o
        // sintoma que o `DESIGN-V1` §8.2 nomeou). As falhas de download já
        // saem uma a uma pela fila; este `catch` é o que sobra depois delas.
        .catch((erro: unknown) => {
          log(`download-error ${erro instanceof Error ? erro.message : 'falha ao baixar'}`)
        })
        .finally(() => {
          setBaixando((atual) => {
            const proximo = new Set(atual)
            proximo.delete(setlistId)
            return proximo
          })
          recarregarArquivos()
        })
    },
    [dados, recarregarArquivos, atualizarPresentes],
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
              estadoLocal,
              aoRelerNaEscrita,
            }}
          />
        )}
        {ReguaDeDev !== null ? <ReguaDeDev /> : null}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: dark.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
