import { useEffect, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import { faixaDe, type Faixa } from './faixa'
import { log } from './log'

/**
 * A faixa da janela de agora, e a linha `faixa=<A|B|C> w=<dp> h=<dp>` (T3-R1,
 * catalogada no `LOGS-OCTAVIA.md`): **no boot** (a primeira medida) e **a cada
 * rotação**, e também a cada mudança de tamanho de janela que troque a faixa
 * sem girar (janela reduzida). O `useWindowDimensions` re-renderiza em toda
 * mudança de tamanho; o ref é o que impede uma linha por render — mesma razão
 * do `rotation=` do palco (`StageScreen.tsx`), que continua lá, só na mudança
 * de orientação e só no palco.
 */
export function useFaixa(): Faixa {
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
