import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts', './vitest.setup.ts'],
    globals: true,
    css: true,
    // Exclude integration tests and E2E tests from unit test runs
    exclude: [
      'node_modules/**',
      'tests/e2e/**/*',
      '**/*.e2e.{ts,tsx}',
      '**/e2e/**/*',
      '**/*integration*.test.{ts,tsx}',
      '**/integration/**/*.test.{ts,tsx}'
    ],
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },
    coverage: {
      provider: 'v8',
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
        'tests/e2e/**/*',
        '**/*.e2e.{ts,tsx}',
        '**/e2e/**/*'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
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