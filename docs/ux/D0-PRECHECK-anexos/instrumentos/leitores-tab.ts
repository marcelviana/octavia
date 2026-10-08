/**
 * D-0 pre-check (A4, A6; div. 1148) — os dois leitores da Tab sobre formas FABRICADAS de `content_data`.
 * Rastro de instrumento (N4-D117): fora de CI, lint e typecheck; função pura, nenhuma requisição, nenhum texto de
 * música (as cordas são do compasso-fixture do próprio editor, `components/tab-editor.tsx:20-22`; o resto é fabricado).
 * Rodar da raiz: `npx tsx docs/ux/D0-PRECHECK-anexos/instrumentos/leitores-tab.ts`.
 */
import { isValidContent, bodyOf } from '../../../../packages/core/src/content-contract'
import { textoDaTab } from '../../../../components/content/corpo-de-texto'

const EXEMPLO = [{ id: 1, strings: ['E|--0--3--0--2--0--|', 'B|--1--1--1--1--1--|', 'G|--0--0--0--0--0--|', 'D|--2--2--2--2--2--|', 'A|--3-------------|', 'E|----------------|'] }]
const casos: Record<string, Record<string, unknown> | null> = {
  'criada do zero        {tablature:""}': { tablature: '' },
  'lote                  {tablature:"e|--1--|"}': { tablature: 'e|--1--|' },
  'editada no site       {tablature:"e|--1--|", measures:[exemplo]}': { tablature: 'e|--1--|', measures: EXEMPLO },
  'do zero + editada     {tablature:"", measures:[exemplo]}': { tablature: '', measures: EXEMPLO },
  'upload                null': null,
  'só measures           {measures:[exemplo]}': { measures: EXEMPLO },
}
for (const [nome, d] of Object.entries(casos)) {
  const v = isValidContent('Tab', d, null)
  const b = bodyOf('Tab', d)
  const w = textoDaTab(d)
  console.log(`${nome}\n   core: ${JSON.stringify(v)} corpo=${b === null ? 'null' : `len ${b.length}`} | site: ${w === null ? 'null (o vazio do painel)' : `len ${w.length}`}`)
}
