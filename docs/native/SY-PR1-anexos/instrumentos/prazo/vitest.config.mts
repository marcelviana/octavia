/**
 * SY-PR1 (SY-D19) — a configuração do instrumento do prazo de rede. Instrumento de anexo (fora de CI, lint e
 * typecheck, N4-D117) com a sua configuração. O arquivo NÃO se chama `*.test.ts` de propósito: o projeto `web` do
 * `vitest.config.mts` da raiz coleta todo arquivo `.test.ts` e exclui `apps` e `packages`, mas não `docs` — com o nome
 * de teste, a suíte do repositório o rodaria (medido nesta PR: 153 arquivos e 1 reprovado, sem o `SY_FIXTURE`).
 * É a do projeto `native` (Node, o duplo do `expo-file-system`), com a raiz no repositório.
 *
 *   pnpm exec vitest run --config docs/native/SY-PR1-anexos/instrumentos/prazo/vitest.config.mts
 */
import path from 'node:path'
import { defineConfig } from 'vitest/config'

const RAIZ = path.resolve(__dirname, '../../../../..')

export default defineConfig({
  root: RAIZ,
  test: {
    environment: 'node',
    globals: false,
    include: ['docs/native/SY-PR1-anexos/instrumentos/prazo/prazo-medida.ts'],
    testTimeout: 180_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      'expo-file-system': path.join(RAIZ, 'apps/native/test/fake-expo-file-system.ts'),
    },
  },
})
