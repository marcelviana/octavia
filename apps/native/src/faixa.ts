/**
 * T3-R1 — A FAIXA, NUM PONTO SÓ (N3-D1, N3-D8, N3-D12, N3-D24).
 *
 * A composição de cada superfície se escolhe pela **largura útil da janela**
 * em dp — não pela orientação, não pelo aparelho:
 *
 *   A  < 700      celular em pé (411,4) — desenhada no N3, implementada no N5
 *   B  700 – 960  tablet em pé (711,1); o celular deitado (914,3) cai aqui
 *   C  > 960      tablet deitado (1137,8) — o congelado V1/N2, que não muda
 *
 * O limite A | B é 700 e não os 600 do cabeçalho da folha: N3-D12, errata
 * N3-E1. **Este é o único arquivo do app que conhece os dois números**
 * (`test/faixa.test.ts` reprova se outro arquivo os escrever): nenhuma tela ou
 * componente compara largura por conta própria — a regra de componente, com os
 * limiares 667,5 / 474 / 430, é herança do bloco iOS (N3-D24).
 *
 * Na N3-PR1 **nenhuma tela lê a faixa ainda**: o que ela entrega é a decisão e
 * a linha de log que a prova (A-N3-1, `useFaixa.ts`). As PRs de superfície
 * passam a ler daqui.
 *
 * Função pura, sem `react-native`: é o que o `test/faixa.test.ts` importa no
 * projeto `native` do Vitest, que não troca o `react-native` por duplo.
 */
export type Faixa = 'A' | 'B' | 'C'

export function faixaDe(larguraDp: number): Faixa {
  if (larguraDp < 700) return 'A'
  if (larguraDp <= 960) return 'B'
  return 'C'
}
