/**
 * D-0 pre-check, commit 2 (§9.5) — os campos do corpo do `PUT` do editor, um a um, contra o esquema REAL da rota
 * (`contentSchemas.update`, `lib/api-schemas.ts`). Para cada campo: o valor que o editor manda quando a coluna da linha
 * é `null` (a normalização de `components/content-editor.tsx:33-48` e o corpo de `:51-73`, transcritos à mão abaixo,
 * com a linha citada). Função pura, 0 requisições; rastro (N4-D117). Rodar: `npx tsx <este arquivo>` da raiz.
 */
import { contentSchemas } from '../../../../lib/api-schemas'

const ID = '00000000-0000-4000-8000-0000000000d0'
// [campo, o que o editor manda quando a coluna é null, a linha]
const CAMPOS: [string, unknown, string][] = [
  ['title', '', 'content-editor.tsx:36 (title || "") — a coluna é NOT NULL: inalcançável a partir de null'],
  ['artist', '', 'content-editor.tsx:37 (artist || "")'],
  ['album', '', 'content-editor.tsx:38 (album || "")'],
  ['genre', '', 'content-editor.tsx:39 (genre || "")'],
  ['key', '', 'content-editor.tsx:40 (key || "")'],
  ['bpm', null, 'content-editor.tsx:41 (bpm || "") e :58 (bpm ? parseInt : null) → null'],
  ['difficulty', '', 'content-editor.tsx:42 (difficulty || "")'],
  ['tags', [], 'content-editor.tsx:43 (tags || [])'],
  ['notes', '', 'content-editor.tsx:44 (notes || "")'],
  ['is_favorite', false, 'content-editor.tsx:45 (is_favorite || false)'],
  ['is_public', false, 'content-editor.tsx:46 (is_public || false)'],
  ['content_data', { annotations: [] }, 'content-editor.tsx:47 (content_data || {}) e :64-71 — o tipo vem da linha (a 1149, à parte)'],
]
for (const [campo, valor, onde] of CAMPOS) {
  const r = contentSchemas.update.safeParse({ id: ID, [campo]: valor })
  const motivo = r.success ? '' : ' · ' + r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  console.log(`${campo.padEnd(12)} manda ${JSON.stringify(valor).padEnd(18)} → ${r.success ? 'ACEITO' : 'RECUSADO'}${motivo}\n${' '.repeat(14)}(${onde})`)
}
// o conserto da D0-D19: o campo vazio como null
const r = contentSchemas.update.safeParse({ id: ID, difficulty: null })
console.log(`\ndifficulty   manda null              → ${r.success ? 'ACEITO' : 'RECUSADO'}   (o conserto da D0-D19 no editor)`)
