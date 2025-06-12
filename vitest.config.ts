import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
