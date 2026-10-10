/**
 * AS PREFERÊNCIAS GRAVADAS NO APARELHO — QL-PR4 (QL-D39; `docs/native/QL-REQUISITOS.md` QL-R16, A-QL-18).
 *
 * A PRIMEIRA preferência do app gravada no aparelho fora do Firebase: **as notas da música recolhidas no palco**. Vale
 * para todas as músicas e é lembrada de verdade — recolhidas uma vez, o palco abre recolhido de novo, depois de sair do
 * palco ou de matar o app. **O zoom e o tema NÃO entram aqui**: seguem como hoje, estado do palco que recomeça a cada
 * palco aberto (T1-R31, T1-R32; QL-D39).
 *
 * A CHAVE, declarada: `octavia:palco:notas-recolhidas`, no `AsyncStorage` (a dependência que o app já tinha para a
 * sessão do Firebase, `firebase.ts` — nenhuma dependência nova). No Android ele mora no banco SQLite `RKStorage` do app
 * (`/data/data/rocks.octavia.app/databases/`), ao lado das chaves `firebase:*` — fora da pasta de cache da sessão
 * (`files/octavia-<uid>/`), que a receita do cache do APARATO guarda e regrava. O valor é `"1"` (recolhidas); **abertas
 * é o padrão e APAGA a chave**: o aparelho que nunca recolheu, ou que abriu de novo, fica como estava antes desta PR.
 *
 * A carga começa quando o módulo é importado (o app o importa na partida, pelo palco), e o palco a lê de memória: ao
 * abrir, o estado já está lá. Antes de a carga terminar, e se o armazenamento falhar (ler ou gravar), vale o padrão —
 * abertas — e o palco não cai: a falha é silenciosa, porque uma preferência perdida não é uma falha que o músico
 * precise ler (a nota continua à vista).
 */
import { useSyncExternalStore } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const CHAVE_NOTAS_RECOLHIDAS = 'octavia:palco:notas-recolhidas'

let recolhidas = false
/** O músico já mudou nesta sessão: a carga que chegar depois não desfaz o toque. */
let mudouNaSessao = false
const ouvintes = new Set<() => void>()
const avisar = (): void => {
  for (const f of ouvintes) f()
}

async function carregar(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(CHAVE_NOTAS_RECOLHIDAS)
    if (!mudouNaSessao) recolhidas = v === '1'
  } catch {
    // vale o padrão (abertas), ou o que o toque já pôs
  }
  avisar()
}

/** A carga, começada na importação; quem precisa do valor lido (o teste de reabrir) espera por ela. */
export const preferenciasCarregadas: Promise<void> = carregar()

export function notasRecolhidas(): boolean {
  return recolhidas
}

/** Muda já (a tela redesenha) e grava; a promessa é a gravação, que não rejeita. */
export function definirNotasRecolhidas(v: boolean): Promise<void> {
  recolhidas = v
  mudouNaSessao = true
  avisar()
  const gravar = v ? AsyncStorage.setItem(CHAVE_NOTAS_RECOLHIDAS, '1') : AsyncStorage.removeItem(CHAVE_NOTAS_RECOLHIDAS)
  return gravar.catch(() => undefined)
}

function assinar(f: () => void): () => void {
  ouvintes.add(f)
  return () => {
    ouvintes.delete(f)
  }
}

/** As notas recolhidas, como estado de tela: o mesmo valor em todo palco aberto. */
export function useNotasRecolhidas(): boolean {
  return useSyncExternalStore(assinar, notasRecolhidas, notasRecolhidas)
}
