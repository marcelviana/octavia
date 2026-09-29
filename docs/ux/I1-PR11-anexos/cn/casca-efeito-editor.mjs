// I1-PR-11 — a casca-efeito do EDITOR: o "antes" (o editor velho, commit 1b da PR-10, `e7ab05f` = o código da main) ×
// o "depois" (o editor novo, o aceite desta PR: `tests/gates-web/medicoes/content-edit.json`), nos cinco estados do
// "antes" (`base-cifra`, `base-letra`, `base-tab`, `base-partitura`, `erro-pdf`) × três larguras. Anexo, não gate.
// (1) A CASCA (a barra de cima: y < 64 em C; y < 120 em B e A, onde ela empilha): mesma chave, |Δ| ≤ 1 — iguais / total.
// (2) O CORPO: um nó do "antes" que tem a MESMA chave no "depois" é, por construção, o mesmo TEXTO (a chave é papel +
//     hash do texto). Separa-se: NÓ VELHO POR COMPONENTE = o texto de UI do editor velho (as frases de
//     `FRASES_VELHAS`, as do código da main) que aparece no depois — tem de ser 0; COINCIDÊNCIA DE TEXTO = o resto
//     (dado — o título, as cordas da tab —, nomes de acorde, palavras iguais nas duas línguas — Capo, BPM —, a casca
//     empilhada em A), listada.
import fs from 'node:fs'
import { createHash } from 'node:crypto'
const h = (t) => createHash('sha256').update(t).digest('hex').slice(0, 12)
const FRASES_VELHAS = ['Song Information', 'Title', 'Artist', 'Key', 'Quick Chords', 'Song Sections', 'Add Section', 'Chord Progression',
  'Lyrics', 'Preview', 'Tab Information', 'Tuning', 'Tablature', 'Add Measure', 'Measure 1', 'Tablature Tips', 'Notation', 'Techniques',
  'Lyrics Editor', 'Formatting tips:', 'Details', 'Organize and categorize your content', 'Basic Info', 'Musical Info', 'Organization',
  'Title *', 'Album', 'Genre', 'Time Signature', 'Difficulty', 'Notes', 'Add to favorites', 'Make this content public (shareable)',
  'Save Changes', 'Unsaved changes', 'Loading editor...', 'Loading...', 'Loading content for editing...', 'Content Not Found', 'Go Back',
  'Browse Library', 'No sheet music image available', 'Remove', 'Failed to load PDF', 'Retry', 'Download', 'Standard (EADGBE)',
  'Focus on a chord input to use quick chords', 'Click to add chords to the focused section', 'Untitled', 'Unknown Artist']
// FORA da lista, por serem IGUAIS à frase nova aprovada (§5.7): *Tags* (`edit.meta.tags`), *Capo*, *BPM* — a 1ª execução
// deste script contou *Tags* como "nó velho" (15, um por estado × largura): era o rótulo NOVO do *Detalhes* (div. 805)
const velhas = new Map(FRASES_VELHAS.map((t) => [h(t), t]))
const ler = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const antes = ler('tests/gates-web/medicoes/casca-efeito/antes/content-edit.json')
const depois = ler('tests/gates-web/medicoes/content-edit.json')
let velhosTotal = 0
for (const id of Object.keys(antes.estados)) for (const L of ['1138', '711', '411']) {
  const A = antes.estados[id].larguras[L].nos, D = depois.estados[id].larguras[L].nos
  const casca = (n) => n.y < (L === '1138' ? 64 : 120)
  const mD = new Map(D.map((n) => [n.k, n]))
  const ca = A.filter(casca)
  const iguais = ca.filter((n) => { const m = mD.get(n.k); return m && ['x', 'y', 'w', 'h'].every((c) => Math.abs(m[c] - n[c]) <= 1) }).length
  const velhosAqui = D.filter((n) => !casca(n) && (velhas.has(n.h_texto) || velhas.has(n.h_nome)))
  velhosTotal += velhosAqui.length
  const coincid = A.filter((n) => !casca(n) && mD.has(n.k))
  console.log(`${id} · ${L}: casca ${iguais}/${ca.length} iguais · nó velho por componente ${velhosAqui.length}${velhosAqui.length ? ' ' + velhosAqui.map((n) => velhas.get(n.h_texto) ?? velhas.get(n.h_nome)).join(', ') : ''} · coincidência de texto ${coincid.length}: ${coincid.map((n) => `${n.role}/${n.tag} ${n.n} car.`).join('; ')}`)
}
console.log(velhosTotal ? `NÓ VELHO POR COMPONENTE: ${velhosTotal} — REPROVA` : 'NÓ VELHO POR COMPONENTE: 0 — nas 15 (estado × largura)')
