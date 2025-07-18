import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    environment: 'jsdom',
    setupFiles: ['./src/test-setup-integration.ts'],
    globals: true,
    css: true,
    include: [
      '**/*.integration.test.{ts,tsx}',
      '**/integration/*.test.{ts,tsx}',
      '**/__tests__/integration/*.test.{ts,tsx}',
      '**/integration/*.integration.test.{ts,tsx}'
    ],
    exclude: [
      'node_modules/**',
      '**/*.unit.test.{ts,tsx}',
      // Exclude Playwright E2E tests from integration tests
      'tests/e2e/**/*',
      '**/*.e2e.{ts,tsx}',
      '**/e2e/**/*'
    ],
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },
    // Environment variables are loaded via test-setup-integration.ts
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
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    },
  }
}) 