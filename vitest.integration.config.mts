import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    css: true,
    // Extended timeouts for integration tests
    testTimeout: 30000,
    hookTimeout: 10000,
    // Include only integration tests
    include: [
      'tests/integration/**/*.test.{ts,tsx}',
      '**/*integration*.test.{ts,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'tests/e2e/**/*',
      '**/*.e2e.{ts,tsx}',
      '**/e2e/**/*'
    ],
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage-integration',
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
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
        'tests/e2e/**/*',
        '**/*.e2e.{ts,tsx}',
        '**/e2e/**/*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
})