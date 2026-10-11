/**
 * SY-PR1 — O LABORATÓRIO DOS GATILHOS: uma leitura das regras da A2.3 e da A2.4 (`SY-PRECHECK.md`; SY-D17, SY-D18),
 * escrita para os CONTROLES NEGATIVOS dos gates (i) e (v). Instrumento de anexo (fora de CI, lint e typecheck,
 * N4-D117). **NÃO é a implementação da PR-4** — é a prova de que o gate distingue: o `cn-sy.sh` copia este arquivo sobre
 * `apps/native/src/gatilhos.ts`, roda o gate e devolve o contrato com `git checkout`.
 *
 * Sem defeito, os casos dos gatilhos passam (os "→ 1" e os "→ 0"). Com `SY_DEFEITO=<nome>`, UMA regra se quebra, e o
 * gate tem de acusar exatamente os casos que dependem dela:
 *
 *   intervalo  ignora o intervalo de 30 s          → `dentro-do-intervalo`, `apos-falha-com-status`, `dois-eventos`
 *   primeira   conta a primeira leitura e a repetição como volta → `primeira-leitura`
 *   retenta    tenta de novo sozinho depois de uma falha de rede → `falha-de-rede-nao-retenta`
 *   marca      a marca nunca se apaga por um sync que saiu à rede → `marca-apaga-com-sync`
 *   fundo      dispara com o app em segundo plano  → `rede-volta-no-fundo` (e o que vier depois dele)
 *   sessao     ignora a sessão                      → `sem-sessao`
 *   sem-rede   na volta não confere a rede          → `volta-sem-rede`
 *   curta      a volta curta sem a marca dispara    → `fundo-menos-de-30s`
 *   duplo      pede dois syncs por evento           → a contagem do gate (v)
 */
import { AppState } from 'react-native'
import * as Network from 'expo-network'

export type MotivoDoGatilho = 'net' | 'foreground'
export type DecisaoDoGatilho = 'run' | 'queued' | 'skip-interval' | 'skip-short' | 'skip-offline' | 'skip-background'
export const AUSENCIA_MINIMA_MS = 30_000
export const INTERVALO_MINIMO_MS = 30_000
export interface SyncNaRede {
  inicioMs: number
  fimMs: number | null
  falhaDeRede: boolean
}
export interface LigacaoDosGatilhos {
  sessao: () => string | null
  pedirSync: (motivo: MotivoDoGatilho) => void
  ultimoSyncNaRede: () => SyncNaRede | null
}

const DEFEITO = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SY_DEFEITO ?? ''

export function ligarGatilhos(l: LigacaoDosGatilhos): () => void {
  let online: boolean | null = null
  let fundoDesde: number | null = AppState.currentState === 'active' ? null : Date.now()
  let marca: number | null = null
  let vivo = true

  const decidir = (motivo: MotivoDoGatilho): DecisaoDoGatilho => {
    const u = l.ultimoSyncNaRede()
    if (u !== null && u.fimMs === null) return 'queued' // o voo único marca "de novo"
    if (DEFEITO !== 'intervalo' && u !== null && u.fimMs !== null && !u.falhaDeRede && Date.now() - u.fimMs < INTERVALO_MINIMO_MS) {
      return 'skip-interval'
    }
    void motivo
    return 'run'
  }
  const pedir = (motivo: MotivoDoGatilho): void => {
    const d = decidir(motivo)
    if (d === 'run' || d === 'queued') {
      l.pedirSync(motivo)
      if (DEFEITO === 'duplo') l.pedirSync(motivo)
    }
  }
  const marcaValida = (): boolean => {
    if (marca === null) return false
    const u = l.ultimoSyncNaRede()
    if (DEFEITO !== 'marca' && u !== null && u.inicioMs >= marca) return false
    return true
  }

  void Network.getNetworkStateAsync().then((e) => {
    if (online === null) {
      online = e.isInternetReachable ?? e.isConnected ?? false
      if (DEFEITO === 'primeira' && online && l.sessao() !== null) pedir('net')
    }
  })
  const subRede = Network.addNetworkStateListener((e) => {
    const v = e.isInternetReachable ?? e.isConnected ?? false
    const antes = online
    online = v
    const voltou = DEFEITO === 'primeira' ? v : antes === false && v
    if (!voltou) return
    if (DEFEITO !== 'sessao' && l.sessao() === null) return
    if (DEFEITO !== 'fundo' && AppState.currentState !== 'active') {
      marca = Date.now() // skip-background
      return
    }
    pedir('net')
  })
  const subApp = AppState.addEventListener('change', (estado) => {
    if (estado !== 'active') {
      if (fundoDesde === null) fundoDesde = Date.now()
      return
    }
    const ausencia = fundoDesde === null ? 0 : Date.now() - fundoDesde
    fundoDesde = null
    const comMarca = marcaValida()
    marca = null
    if (DEFEITO !== 'sessao' && l.sessao() === null) return
    void Network.getNetworkStateAsync().then((e) => {
      if (!vivo) return
      const temRede = e.isInternetReachable ?? e.isConnected ?? false
      if (DEFEITO !== 'sem-rede' && !temRede) return // skip-offline: nenhuma chamada ao executor
      if (ausencia >= AUSENCIA_MINIMA_MS || comMarca || DEFEITO === 'curta') pedir(ausencia >= AUSENCIA_MINIMA_MS ? 'foreground' : 'net')
      // senão: skip-short
    })
  })
  let retentar: ReturnType<typeof setInterval> | null = null
  if (DEFEITO === 'retenta') {
    let visto: number | null = null
    retentar = setInterval(() => {
      const u = l.ultimoSyncNaRede()
      if (u !== null && u.fimMs !== null && u.falhaDeRede && u.inicioMs !== visto) {
        visto = u.inicioMs
        l.pedirSync('net')
      }
    }, 20)
  }
  return () => {
    vivo = false
    subRede.remove()
    subApp.remove()
    if (retentar !== null) clearInterval(retentar)
  }
}
