/**
 * O DUPLO DE `expo-network` com o ouvinte que o TESTE aciona — SY-PR1 (SY-D13, `SY-PRECHECK.md` A8).
 *
 * Até aqui cada teste fazia `vi.mock('expo-network', …)` com um ouvinte INERTE (`addNetworkStateListener: () => ({
 * remove })`): a rede nunca mudava depois da abertura, e nenhum gate podia dizer o que acontece quando ela volta. Este
 * duplo guarda o estado e os ouvintes, e o teste muda a rede com `__rede(alcancavel)`. Quem usa:
 *
 *   vi.mock('expo-network', () => import('./fake-expo-network'))
 *
 * **O que ele reproduz da biblioteca** (`expo-network` 57.0.1, lido no pre-check: `SY-PRECHECK.md` A2.2): o
 * `getNetworkStateAsync()` devolve o estado de agora (o `useOnline` e o `estaOnline` fazem a primeira leitura por ele);
 * o ouvinte recebe `{ isConnected, isInternetReachable, type }` a cada evento — **inclusive repetido** (`__rede(true)`
 * com a rede já de pé entrega de novo: no Android um `onCapabilitiesChanged` sem mudança chega como evento; quem
 * filtra a mudança é o `useOnline`, `net.ts:28-34`). Ele NÃO é mais generoso que a biblioteca (caso 15): não emite nada
 * ao assinar, e não junta eventos — o atraso de 250 ms do Android (`NetworkModule.kt`) não existe aqui.
 *
 * **O que ele NÃO reproduz**: o que o Android entrega de fato — o portal cativo (`VALIDATED`), a troca Wi-Fi ↔ dados, a
 * entrega com o app em segundo plano (SY-D17 (2), A-SY-19). Isso é do aparelho, na PR-4.
 */
export interface EstadoDaRede {
  isConnected: boolean
  isInternetReachable: boolean
  type: string
}

const DE_PE: EstadoDaRede = { isConnected: true, isInternetReachable: true, type: 'WIFI' }
const SEM_REDE: EstadoDaRede = { isConnected: false, isInternetReachable: false, type: 'NONE' }

let estado: EstadoDaRede = DE_PE
const ouvintes = new Set<(e: EstadoDaRede) => void>()
let leituras = 0

export async function getNetworkStateAsync(): Promise<EstadoDaRede> {
  leituras++
  return { ...estado }
}

export function addNetworkStateListener(f: (e: EstadoDaRede) => void): { remove: () => void } {
  ouvintes.add(f)
  return {
    remove: () => {
      ouvintes.delete(f)
    },
  }
}

/** A rede muda (ou se repete) e o evento chega a cada ouvinte — o `onAvailable`/`onLost` da biblioteca. */
export function __rede(alcancavel: boolean): void {
  estado = alcancavel ? { ...DE_PE } : { ...SEM_REDE }
  for (const f of [...ouvintes]) f({ ...estado })
}

/** Muda o estado SEM evento — o estado de quando o app abre (a primeira leitura o encontra assim). */
export function __redeSemEvento(alcancavel: boolean): void {
  estado = alcancavel ? { ...DE_PE } : { ...SEM_REDE }
}

/** Quantos ouvintes estão ligados, e quantas leituras do estado houve — o teste confere o que mediu (regra 4). */
export function __ouvintesDeRede(): number {
  return ouvintes.size
}
export function __leiturasDeRede(): number {
  return leituras
}

/** Rede de pé, sem ouvintes, sem leituras (o começo de cada caso). */
export function __limparRede(): void {
  estado = { ...DE_PE }
  ouvintes.clear()
  leituras = 0
}
