import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    environment: 'jsdom',
    setupFiles: ['./src/test-setup-integration.ts'],
    include: [
      '**/*.integration.test.{ts,tsx}',
      '**/integration/*.test.{ts,tsx}',
      '**/__tests__/integration/*.test.{ts,tsx}',
      '**/integration/*.integration.test.{ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.unit.test.{ts,tsx}',
      // Remove the overly broad exclusion that was preventing integration tests from running
      // '**/*.test.{ts,tsx}' // This was excluding ALL test files
    ],
    globals: true,
    // Longer timeout for integration tests
    testTimeout: 30000,
    hookTimeout: 30000,
    // Pool options for integration tests
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: false // Allow parallel execution
      }
    },
    // Coverage configuration for integration tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/test-setup*',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/test-*'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  esbuild: {
    target: 'node14'
  }
}) 