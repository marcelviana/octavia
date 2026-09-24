import { useEffect, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import { faixaDe, type Faixa } from './faixa'
import { log } from './log'

/**
 * A faixa da janela de agora — o que as TELAS leem (N3-PR2, N3-D28). O
 * `useWindowDimensions` re-renderiza em toda mudança de tamanho, então a tela
 * troca de composição na rotação sem pedir nada. Não loga: a linha `faixa=` é
 * da raiz (`useLinhaDaFaixa`), uma por troca, e uma tela que montasse depois
 * do boot não pode repeti-la.
 */
export function useFaixa(): Faixa {
  return faixaDe(useWindowDimensions().width)
}

/**
 * A raiz do app: a faixa, e a linha `faixa=<A|B|C> w=<dp> h=<dp>` (T3-R1,
 * catalogada no `LOGS-OCTAVIA.md`): **no boot** (a primeira medida) e **a cada
 * rotação**, e também a cada mudança de tamanho de janela que troque a faixa
 * sem girar (janela reduzida). O ref é o que impede uma linha por render —
 * mesma razão do `rotation=` do palco (`StageScreen.tsx`), que continua lá,
 * só na mudança de orientação e só no palco.
 */
export function useLinhaDaFaixa(): Faixa {
  const { width, height } = useWindowDimensions()
  const faixa = faixaDe(width)
  const orientacao = width >= height ? 'paisagem' : 'retrato'
  const anterior = useRef<{ faixa: Faixa; orientacao: string } | null>(null)

  useEffect(() => {
    const a = anterior.current
    anterior.current = { faixa, orientacao }
    if (a !== null && a.faixa === faixa && a.orientacao === orientacao) return
    log(`faixa=${faixa} w=${width.toFixed(1)} h=${height.toFixed(1)}`)
    // `width`/`height` fora das dependências de propósito: a linha sai na
    // TROCA de faixa ou de orientação, com a medida daquele instante — um
    // ajuste de meio dp na mesma faixa e orientação não é evento.
  }, [faixa, orientacao])

  return faixa
}
