/**
 * O duplo de `react-native-pdf` (N3-PR5).
 *
 * O módulo real é NATIVO e publica JSX dentro de um `.js` (`index.js:462`),
 * que o `vite:import-analysis` do projeto `native-tela` recusa antes de
 * qualquer `vi.mock` — é por isso que nenhum teste de tela montava o palco
 * até a N3-PR5. Aqui ele vira um `div` com o `testID` e mais nada: o PDF, a
 * pinça e a paginação são do aparelho (S3d, A13). O que os CNs do palco medem
 * é a barra superior, que não depende dele.
 */
import { createElement } from 'react'

export default function Pdf(p: { testID?: string; [k: string]: unknown }): React.JSX.Element {
  return createElement('div', { 'data-testid': p.testID, 'data-pdf': 'true' })
}
