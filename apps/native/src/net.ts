/**
 * Estado de rede (PRD T1-R18; N1-D11: `expo-network`).
 * O app **nunca** bloqueia por causa disto: offline é um indicador, e o sync
 * só é pulado quando se sabe que não há rede. Sem retry automático nesta PR —
 * a revalidação ao voltar do background é o passo 4 do T1-R13 (PR posterior).
 */
import { useEffect, useState } from 'react'
import * as Network from 'expo-network'
import { log } from './log'

export async function estaOnline(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync()
    return estado.isInternetReachable ?? estado.isConnected ?? false
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
      aplicar(estado.isInternetReachable ?? estado.isConnected ?? false)
    })
    return () => sub.remove()
  }, [])

  return online
}
