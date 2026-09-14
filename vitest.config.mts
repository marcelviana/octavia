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
