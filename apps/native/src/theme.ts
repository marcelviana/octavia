/**
 * Tokens do nativo — desde a I1-PR-4, REEXPORTADOS de `@octavia/identidade`
 * (I1-D3, I1-D4), a fonte única de web e nativo. Os valores, a origem de cada
 * um e os comentários por campo moram em `packages/identidade/src/tokens.ts`;
 * o `packages/identidade/test/igualdade.test.ts` prova que este arquivo
 * exporta exatamente os valores em dp da linha de base da `main`.
 *
 * O que é só do nativo fica aqui: o `font` como nome de `.ttf` do `expo-font`
 * (o pacote guarda família + peso, I1-D31; a tradução é o `fontes.ts`).
 *
 * Unidades: dp. O Tab S6 e o AVD `octavia_tab32` medem 1138×711 dp (E1).
 */
export {
  dark,
  light,
  colors,
  space,
  radius,
  touch,
  bar,
  size,
  zoomSteps,
  zoomDefault,
  lineHeight,
  tracking,
  faixas,
  type ThemeColors,
  type ThemeName,
  type TokensDaFaixa,
} from '@octavia/identidade'
export { font } from './fontes'
