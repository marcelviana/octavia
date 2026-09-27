/**
 * T3-R1 — A FAIXA, NUM PONTO SÓ (N3-D1, N3-D8, N3-D12, N3-D24).
 *
 * Desde a I1-PR-4 o ponto único é `@octavia/identidade` (I1-D30): `faixaDe` e
 * os dois limiares moram em `packages/identidade/src/tokens.ts`, onde o web
 * também os lê (pelo CSS gerado). Este arquivo só reexporta, para que o
 * `useFaixa.ts` e quem mais importa `./faixa` não mudem. Nenhum arquivo do app
 * escreve os limiares (`test/faixa.test.ts` reprova se escrever).
 */
export { faixaDe, type Faixa } from '@octavia/identidade'
