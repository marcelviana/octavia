/**
 * O duplo do `native-tela` RECEBE COLUNAS — bloco QL, PR-1 (QL-D16; div. 1185; `fake-react-native.tsx`, `__colunas`).
 *
 * O leitor da PR-3 vai medir a coluna e um caractere pelo `onLayout` e dividir (QL-D13). Aqui se prova, com um leitor
 * de mentira que faz exatamente essa conta, que o duplo entrega as duas medidas e que a conta dá as colunas pedidas — e,
 * pelo avesso, que sem `__colunas` o duplo não chama `onLayout` (o comportamento de antes, de que os outros testes de
 * tela dependem). O controle negativo da QL-PR1 é este mesmo leitor com o duplo desligado: sem colunas, `null`.
 */
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { Text, View } from 'react-native'
import { __colunas, caractereDoDuplo, type EventoDeLayout } from './fake-react-native'
import { achar, desmontar, montar } from './tela'

/** Um leitor de mentira: as colunas = ⌊(largura da coluna − 2 × 32) ÷ largura de um caractere⌋, como a QL-D13 manda. */
function Colunas({ zoom }: { zoom: number }): React.JSX.Element {
  const [coluna, setColuna] = useState<number | null>(null)
  const [caractere, setCaractere] = useState<number | null>(null)
  const colunas = coluna !== null && caractere !== null ? Math.floor((coluna - 64) / (caractere / 10)) : null
  return (
    <View onLayout={(e: EventoDeLayout) => setColuna(e.nativeEvent.layout.width)}>
      <Text style={{ fontSize: zoom }} onLayout={(e: EventoDeLayout) => setCaractere(e.nativeEvent.layout.width)}>
        {'0123456789'}
      </Text>
      <Text testID="colunas">{colunas === null ? 'sem medida' : String(colunas)}</Text>
    </View>
  )
}

afterEach(() => {
  __colunas()
  desmontar()
})

describe('o duplo do native-tela recebe colunas (QL-PR1)', () => {
  it('desligado (o padrão): nenhum onLayout — o comportamento de antes', async () => {
    await montar(<Colunas zoom={22} />)
    expect(achar('colunas')?.textContent).toBe('sem medida')
  })

  it.each([
    [80, 22],
    [55, 22],
    [48, 22],
    [26, 22],
    [26, 40],
    [14, 40],
  ])('__colunas(%i, %i): o leitor de mentira chega às colunas pedidas', async (n, zoom) => {
    __colunas(n, zoom)
    await montar(<Colunas zoom={zoom} />)
    expect(achar('colunas')?.textContent).toBe(String(n))
    expect(caractereDoDuplo(22)).toBeCloseTo(13.333, 3)
  })
})
