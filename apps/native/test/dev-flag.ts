/**
 * `__DEV__` — a global que o Metro define e que o `api.ts` lê no TOPO do
 * módulo (`const FORJAR_401 = __DEV__ && …`, o caminho de dev do A2).
 *
 * Um teste que importe `src/` **estaticamente** avalia esse topo antes de
 * qualquer `beforeAll`, e estoura com `ReferenceError: __DEV__ is not
 * defined` — medido no `apos-escrita.test.tsx`. Importar este módulo ANTES
 * dos de `src/` resolve, porque os `import` de um módulo ES são avaliados na
 * ordem em que estão escritos.
 */
;(globalThis as { __DEV__?: boolean }).__DEV__ = false
export const dev = false
