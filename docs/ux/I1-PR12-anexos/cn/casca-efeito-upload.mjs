// I1-PR-12 — a casca-efeito do UPLOAD: o "antes" (o upload velho, commit 1b `7b33d06` = o código da main) × o "depois"
// (o upload novo, o aceite desta PR: `tests/gates-web/medicoes/add-content.json`), nos cinco estados do "antes"
// (`base-criar`, `base-arquivo`, `base-detalhes`, `base-lote`, `base-pronto`) × três larguras. Anexo, não gate.
// O molde é o `casca-efeito-editor.mjs` da I1-PR-11:
// (1) A CASCA (a barra de cima: y < 64 em C; y < 120 em B e A, onde ela empilha): mesma chave, |Δ| ≤ 1 — iguais / total.
// (2) O CORPO: um nó do "antes" com a MESMA chave no "depois" é, por construção, o mesmo TEXTO (a chave é papel + hash
//     do texto). Separa-se: NÓ VELHO POR COMPONENTE = o texto de UI do upload velho (`FRASES_VELHAS`, as do código da
//     main) que aparece no depois — tem de ser 0; COINCIDÊNCIA DE TEXTO = o resto (dado — o título, o artista —, e a
//     casca empilhada em A), listada.
// I1-PR15 (decisão 2 do encerramento; aval 4): o rastro está em `.gz` — lido por `ler-medicao.mjs`.
import { lerJson } from '../../../../scripts/gates-web/ler-medicao.mjs'
import { createHash } from 'node:crypto'
const h = (t) => createHash('sha256').update(t).digest('hex').slice(0, 12)
const FRASES_VELHAS = ['Back', 'Upload', 'Add Details', 'Complete', 'Content Type', 'Lyrics', 'Chords', 'Sheet',
  'How would you like to add content?', 'Create New', 'Start from scratch and build your content manually with our editor.',
  'Import from File', 'Upload and parse existing files (PDF, DOCX, TXT) to extract content automatically.',
  'Upload PDF files or images to import sheet music.', 'Import Type', 'Single Content', 'Import a file with a single song.',
  'Batch Import', 'Import multiple songs from one file.', 'Import Music File', 'Drag and drop your file here, or', 'Browse files',
  'Upload music file', 'Supported formats: .pdf, .docx, .txt (max 50MB)', 'Supported formats: .pdf, .png, .jpg, .jpeg (max 50MB)',
  'Uploading file...', 'Lyrics Editor', 'Chords Editor', 'Tab Editor', 'Title', 'Song title', 'Write your lyrics here...', 'Next',
  'Title is required', 'Add Content Details', 'Add Metadata', 'Fill in the details for your content', 'Content Details', 'Title *',
  'Artist *', 'Album', 'Genre', 'Year', 'Notes', 'Enter song title', 'Enter artist name', 'Enter album name', 'Enter genre', 'Enter year',
  'Add any additional notes or comments', 'Advanced Options', 'Cancel', 'Save Content', 'Saving...', 'Content saved successfully!',
  'Title and Artist are required', 'Import All', 'Artist', '🎉 Done! Your music is now part of your library.',
  'Your new content is now available in your library', 'All songs are now available in your library', 'Add Another', 'Import More',
  'Go to Library', 'Loading...', 'Loading add content...', 'Unknown Artist',
  '• Use blank lines to separate verses and choruses.', '• Add labels like [Verse], [Chorus], [Bridge] for better structure.']
// FORA da lista, por ser IGUAL ao rótulo novo: *Tab* (o nome do tipo nas duas línguas). *Unknown Artist* ESTÁ na lista
// como texto de UI do web velho, mas no depois é VALOR GRAVADO no campo de artista do lote (herança D, div. 824): conta
// à parte (`valor gravado`), não como nó velho.
const VALOR_GRAVADO = new Set([h('Unknown Artist')])
const velhas = new Map(FRASES_VELHAS.map((t) => [h(t), t]))
const ler = lerJson
const antes = ler('tests/gates-web/medicoes/casca-efeito/antes/add-content.json')
const depois = ler(process.argv[2] ?? 'tests/gates-web/medicoes/add-content.json')
let velhosTotal = 0, gravados = 0, n = 0
for (const id of Object.keys(antes.estados)) for (const L of ['1138', '711', '411']) {
  const A = antes.estados[id].larguras[L].nos, D = depois.estados[id]?.larguras?.[L]?.nos
  if (!D) { console.log(`${id} · ${L}: sem o depois`); continue }
  n++
  const casca = (no) => no.y < (L === '1138' ? 64 : 120)
  const mD = new Map(D.map((no) => [no.k, no]))
  const ca = A.filter(casca)
  const iguais = ca.filter((no) => { const m = mD.get(no.k); return m && ['x', 'y', 'w', 'h'].every((c) => Math.abs(m[c] - no[c]) <= 1) }).length
  const comVelha = D.filter((no) => !casca(no) && (velhas.has(no.h_texto) || velhas.has(no.h_nome)))
  const velhosAqui = comVelha.filter((no) => !(VALOR_GRAVADO.has(no.h_texto) && no.role === 'textbox'))
  gravados += comVelha.length - velhosAqui.length
  velhosTotal += velhosAqui.length
  const coincid = A.filter((no) => !casca(no) && mD.has(no.k))
  console.log(`${id} · ${L}: casca ${iguais}/${ca.length} iguais · nó velho por componente ${velhosAqui.length}${velhosAqui.length ? ' ' + velhosAqui.map((no) => velhas.get(no.h_texto) ?? velhas.get(no.h_nome)).join(', ') : ''} · valor gravado ${comVelha.length - velhosAqui.length} · coincidência de texto ${coincid.length}: ${coincid.map((no) => `${no.role}/${no.tag} ${no.n} car.`).join('; ')} · nós ${A.length} → ${D.length}`)
}
console.log(velhosTotal ? `NÓ VELHO POR COMPONENTE: ${velhosTotal} — REPROVA` : `NÓ VELHO POR COMPONENTE: 0 — nas ${n} (estado × largura) · valor gravado "Unknown Artist" no campo do lote: ${gravados}`)
process.exit(velhosTotal ? 1 : 0)
