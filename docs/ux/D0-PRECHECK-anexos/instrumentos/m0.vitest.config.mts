// D-0 pre-check, M0 — config própria do instrumento (rastro; N4-D117: fora de CI, lint e typecheck).
// O instrumento NÃO tem sufixo `.test`, para o `include` do projeto `web` (`**/*.test.tsx`) não o coletar no `pnpm test`.
// Rodar da raiz: `npx vitest run --config docs/ux/D0-PRECHECK-anexos/instrumentos/m0.vitest.config.mts`
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

const raiz = path.resolve(__dirname, '../../../..')
export default defineConfig({
  plugins: [react()],
  root: raiz,
  resolve: { alias: { '@': raiz } },
  test: {
    environment: 'jsdom',
    setupFiles: [path.join(raiz, 'src/test-setup.ts')],
    globals: true,
    css: true,
    include: ['docs/ux/D0-PRECHECK-anexos/instrumentos/m0-editor.medir.tsx'],
    env: { NODE_ENV: 'test', VITEST: 'true' },
  },
})
