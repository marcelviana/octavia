/**
 * Estado de rede (PRD T1-R18; N1-D11: `expo-network`).
 * O app **nunca** bloqueia por causa disto: offline é um indicador, e o sync
 * só é pulado quando se sabe que não há rede.
 *
 * **SY-PR4 — o passo 4 do T1-R13 mora em `gatilhos.ts`** (a "PR posterior" que
 * este cabeçalho prometia desde o N1): a rede que volta com o app aberto e a
 * volta do segundo plano depois de 30 s pedem um sync. Os gatilhos assinam o
 * `expo-network` por conta própria (SY-D33) e daqui levam só a redução do
 * estado a um booleano — `alcancavel`, a MESMA que o `useOnline` e o
 * `estaOnline` usam: uma implementação só do que é "ter rede" (no Android,
 * `isInternetReachable` exige a rede `VALIDATED`: o portal cativo não conta,
 * `SY-PRECHECK.md` A2.2). O `useOnline` continua só logando a mudança (`net
 * online|offline`) e mudando o indicador; quem decide o sync são os gatilhos.
 */
import { useEffect, useState } from 'react'
import * as Network from 'expo-network'
import { log } from './log'

/** O estado do `expo-network` reduzido a "tem rede": alcançável, senão conectado, senão não. */
export function alcancavel(estado: { isInternetReachable?: boolean | null; isConnected?: boolean | null }): boolean {
  return estado.isInternetReachable ?? estado.isConnected ?? false
}

export async function estaOnline(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync()
    return alcancavel(estado)
  } catch {
    // Sem resposta do módulo, assume online: quem decide de verdade é a
    // request, e uma falha dela vira `sync fail` visível (T1-R37).
    return true
  }
}

/** Hook do estado de rede; loga só as MUDANÇAS (`net online|offline`). */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let anterior: boolean | null = null
    const aplicar = (valor: boolean): void => {
      if (valor !== anterior) {
        anterior = valor
        log(`net ${valor ? 'online' : 'offline'}`)
        setOnline(valor)
      }
    }
    void estaOnline().then(aplicar)
    const sub = Network.addNetworkStateListener((estado) => {
      aplicar(alcancavel(estado))
    })
    return () => sub.remove()
  }, [])

  return online
}
