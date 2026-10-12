/**
 * SY-PR2 — a configuração do instrumento do PRAZO COM O TOKEN DENTRO (commit 5, div. 1269). Instrumento de anexo (fora de CI, lint e
 * typecheck, N4-D117), no molde do `SY-PR1-anexos/instrumentos/prazo/`: o arquivo NÃO se chama `*.test.ts` (o projeto
 * `web` coleta `.test.ts` dentro de `docs/`, div. 1268). A do projeto `native` (Node, o duplo do `expo-file-system`),
 * mais o duplo do `expo-network` POR ALIAS: um `vi.mock('expo-network')` escrito num arquivo de `docs/` resolve o nome
 * a partir de `docs/` (o `node_modules` da raiz), não do `apps/native/src/net.ts` (o de `apps/native`) — o mock não
 * pega, a biblioteca de verdade entra e puxa o `react-native` (medido nesta PR; o instrumento do prazo da PR-1 não via
 * isto porque o `api.ts` não importa o `net.ts`).
 *
 *   pnpm exec vitest run --config docs/native/SY-PR2-anexos/instrumentos/prazo-token/vitest.config.mts
 */
import path from 'node:path'
import { defineConfig } from 'vitest/config'

const RAIZ = path.resolve(__dirname, '../../../../..')

export default defineConfig({
  root: RAIZ,
  test: {
    environment: 'node',
    globals: false,
    include: ['docs/native/SY-PR2-anexos/instrumentos/prazo-token/prazo-token.ts'],
    testTimeout: 180_000,
  },
  resolve: {
    alias: {
      'expo-file-system': path.join(RAIZ, 'apps/native/test/fake-expo-file-system.ts'),
      'expo-network': path.join(RAIZ, 'apps/native/test/fake-expo-network.ts'),
    },
  },
})
