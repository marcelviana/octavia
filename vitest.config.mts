import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Padrão default de coleta do Vitest — explícito para o projeto `web` poder
// excluir packages/** sem perder nada do que era coletado antes (B7-PR7).
const DEFAULT_INCLUDE = ['**/*.{test,spec}.?(c|m)[jt]s?(x)']

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    css: true,
    // Standard settings for fast execution
    testTimeout: 10000,
    hookTimeout: 5000,
    // Exclude integration tests and E2E tests from unit test runs
    exclude: [
      'node_modules/**',
      'tests/ux-audit/**/*',
      '**/*.e2e.{ts,tsx}',
      '**/e2e/**/*',
      '**/*integration*.test.{ts,tsx}',
      '**/integration/**/*.test.{ts,tsx}',
      'apps/**'
    ],
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },
    // B7-PR7 (docs/ux/B7-PRECHECK.md H-N4): dois projetos. `web` herda tudo
    // acima (jsdom, setup, alias @) e deixa de coletar packages/**; `core` é
    // Node puro, SEM setupFiles e SEM alias — isolamento real do
    // packages/core (gate: packages/core/src/isolation.test.ts). Coverage e
    // thresholds continuam na raiz.
    projects: [
      {
        extends: true,
        test: {
          name: 'web',
          include: DEFAULT_INCLUDE,
          exclude: [
            'node_modules/**',
            'tests/ux-audit/**/*',
            '**/*.e2e.{ts,tsx}',
            '**/e2e/**/*',
            '**/*integration*.test.{ts,tsx}',
            '**/integration/**/*.test.{ts,tsx}',
            'apps/**',
            'packages/**'
          ],
        },
      },
      {
        test: {
          name: 'core',
          environment: 'node',
          setupFiles: [],
          globals: true,
          include: ['packages/core/**/*.test.ts'],
          exclude: ['node_modules/**'],
        },
      },
      // W1 (commit 1): o terceiro projeto — `apps/native`. Até aqui NENHUM
      // teste de unidade cobria o nativo (`exclude: ['apps/**']` acima), e é
      // por isso que a garantia offline pôde ser falsa sem nada acusar. O
      // `expo-file-system` não existe fora do device: entra o duplo de
      // `apps/native/test/fake-expo-file-system.ts`, que reproduz os três
      // comportamentos medidos da biblioteca real (div. 113 e 116).
      //
      // Os testes vivem em `apps/native/test/`, FORA de `src/`, porque o
      // `g2g3.sh` varre `apps/native/src` atrás de `testID=` e de linhas
      // `log(` — um teste dentro de `src/` falsearia o G2 e o G3.
      {
        test: {
          name: 'native',
          environment: 'node',
          setupFiles: [],
          globals: false,
          include: ['apps/native/test/**/*.test.ts'],
          exclude: ['node_modules/**'],
        },
        resolve: {
          alias: {
            'expo-file-system': path.resolve(__dirname, 'apps/native/test/fake-expo-file-system.ts'),
          },
        },
      },
      // N2-PR3 (commit 1): o QUARTO projeto — as telas do nativo.
      //
      // Até aqui NENHUM teste renderizava uma tela: o projeto `native` acima
      // coleta só `.ts` em ambiente `node`, e é por isso que o
      // `PRD-TELA-2.md` repete "a parte da TELA é das PRs 3–7" requisito a
      // requisito. Este projeto coleta os `.tsx` do mesmo diretório, em
      // `jsdom`, com o `react-dom` 19.2.3 que JÁ é devDependency de
      // `apps/native` — **nenhuma dependência nova** (o `react-test-renderer`
      // está deprecado no React 19 e não foi instalado).
      //
      // Os três aliases são os módulos que não existem fora do Metro ou do
      // aparelho: `react-native` (fonte com tipos Flow, que o esbuild do Vite
      // não analisa), `react-native-svg` e o `datetimepicker`, que é NATIVO.
      // O `testID` vira `data-testid`, que é a mesma correspondência que o
      // `uiautomator` faz no aparelho (`testID` → `resource-id`).
      //
      // O que este projeto NÃO mede: geometria. Os 190 × 57,8 do botão e os
      // 48 dp da linha de aviso são do dump do aparelho, como sempre nesta
      // série — aqui se mede qual nó existe, com que id, com que texto,
      // ativo ou inativo, e o que acontece ao toque.
      {
        test: {
          name: 'native-tela',
          environment: 'jsdom',
          setupFiles: [],
          globals: false,
          include: ['apps/native/test/**/*.test.tsx'],
          exclude: ['node_modules/**'],
        },
        esbuild: { jsx: 'automatic' },
        resolve: {
          alias: {
            'expo-file-system': path.resolve(__dirname, 'apps/native/test/fake-expo-file-system.ts'),
            'react-native-svg': path.resolve(__dirname, 'apps/native/test/fake-react-native-svg.tsx'),
            'react-native': path.resolve(__dirname, 'apps/native/test/fake-react-native.tsx'),
            '@react-native-community/datetimepicker': path.resolve(
              __dirname,
              'apps/native/test/fake-datetimepicker.tsx',
            ),
          },
        },
      },
    ],
    coverage: {
      enabled: false, // Disabled by default - use test:coverage script to enable
      provider: 'istanbul', // Using istanbul instead of v8 for better Next.js compatibility
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/test-setup-integration.ts',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test-utils/**',
        '**/test-helpers/**',
        '**/mocks/**',
        '**/stubs/**',
        '**/fixtures/**',
        'scripts/**',
        'public/**',
        '.next/**',
        'dist/**',
        // Exclude E2E tests from coverage
        '**/*.e2e.{ts,tsx}',
        '**/e2e/**/*',
        // Exclude Next.js specific files that cause V8 coverage issues
        'app/**/layout.{ts,tsx}',
        'app/**/not-found.{ts,tsx}',
        'app/**/error.{ts,tsx}',
        'app/**/loading.{ts,tsx}',
        'app/**/template.{ts,tsx}',
        'app/**/default.{ts,tsx}',
        'middleware.{ts,tsx}',
        'instrumentation.{ts,tsx}',
        // Exclude server-only and edge runtime files
        '**/route.{ts,tsx}',
        '**/*.server.{ts,tsx}',
        '**/*.edge.{ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
})
