// I1-PR-13 — a casca-efeito das SETLISTS: o "antes" (as setlists velhas, commit 1 = o código da main `aa772df`) × o
// "depois" (as setlists novas, o aceite desta PR: `tests/gates-web/medicoes/setlists.json`), nos cinco estados do "antes"
// (`base-lista`, `base-detalhe`, `base-formulario`, `base-dialogo`, `base-picker`) × três larguras. Anexo, não gate.
// O molde é o `casca-efeito-upload.mjs` da I1-PR-12:
// (1) A CASCA (a barra de cima: y < 64 em C; y < 120 em B e A, onde ela empilha): mesma chave, |Δ| ≤ 1 — iguais / total.
// (2) O CORPO: um nó do "antes" com a MESMA chave no "depois" é, por construção, o mesmo TEXTO (a chave é papel + hash
//     do texto). Separa-se: NÓ VELHO POR COMPONENTE = o texto de UI das setlists velhas (`FRASES_VELHAS`, as do código da
//     main) que aparece no depois — tem de ser 0; COINCIDÊNCIA DE TEXTO = o resto (dado — o título, o artista, a
//     descrição —, e o que é igual nas duas línguas), listada.
// (3) O (b) de cada lado (o `truncate` do web velho em 411) e a LARGURA dos nós do corpo em 1138 (a "largura liberada"
//     da I1-PR-9, div. 728: os nós que a saída da lateral alargou no corpo velho).
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { cortes } from '../../../../scripts/gates-web/g-faixa-classificar.mjs'
const h = (t) => createHash('sha256').update(t).digest('hex').slice(0, 12)
const FRASES_VELHAS = ['Your Setlists', 'Create Setlist', 'Edit setlist', 'Delete setlist', 'Recent', 'Edit', 'Add Songs', 'Songs',
  'Remove song', 'Lyrics', 'Chords', 'Sheet', 'Untitled', 'Select a setlist to view its details', 'No songs yet',
  'Add songs from your library to build this setlist.', 'Create New Setlist', 'Edit Setlist',
  'Create a new setlist to organize your songs for performances.', 'Update your setlist information.', 'Setlist Name *', 'Setlist Name',
  'Description', 'Performance Date', 'Venue', 'Notes', 'e.g., Coffee Shop Acoustic Set', 'Brief description of this setlist...',
  'e.g., The Blue Note', 'Any additional notes about this setlist...', 'Cancel', 'Update Setlist', 'Delete Setlist', 'Delete',
  'Are you sure you want to delete "Show padrão"? This action cannot be undone.', 'Add Songs to Setlist',
  'Select songs from your library to add to this setlist.', 'Search by title, artist, or content type...', 'Select all (4 songs)',
  'Add 0 Songs', 'Close', 'No setlists yet', 'Create your first setlist to organize songs for your performances.',
  'Create Your First Setlist', 'Error loading setlists', 'Try Again', 'Loading...', 'Loading setlists...', 'Loading your setlists...',
  'Loading songs...', 'No matching songs', 'No songs available', 'Try adjusting your search terms.', 'Add some songs to your library first.',
  '60 songs', '8 songs', '1 song', '4h 6m', '32m', '4m', 'Unknown Artist', 'Unknown Title']
// FORA da lista, por serem IGUAIS nas duas línguas: *Tab* (o nome do tipo) e *3 setlists* (a contagem).
const velhas = new Map(FRASES_VELHAS.map((t) => [h(t), t]))
const ler = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const antes = ler('tests/gates-web/medicoes/casca-efeito/antes/setlists.json')
const depois = ler(process.argv[2] ?? 'tests/gates-web/medicoes/setlists.json')
let velhosTotal = 0, n = 0, bAntes = 0, bDepois = 0
for (const id of Object.keys(antes.estados)) for (const L of ['1138', '711', '411']) {
  const mA = antes.estados[id].larguras[L], mD = depois.estados[id]?.larguras?.[L]
  if (!mD) { console.log(`${id} · ${L}: sem o depois`); continue }
  n++
  const A = mA.nos, D = mD.nos
  const casca = (no) => no.y < (L === '1138' ? 64 : 120)
  const porK = new Map(D.map((no) => [no.k, no]))
  const ca = A.filter(casca)
  const iguais = ca.filter((no) => { const m = porK.get(no.k); return m && ['x', 'y', 'w', 'h'].every((c) => Math.abs(m[c] - no[c]) <= 1) }).length
  const velhosAqui = D.filter((no) => !casca(no) && (velhas.has(no.h_texto) || velhas.has(no.h_nome)))
  velhosTotal += velhosAqui.length
  const coincid = A.filter((no) => !casca(no) && porK.has(no.k))
  const ba = cortes(mA).b.length, bd = cortes(mD).b.length
  bAntes += ba; bDepois += bd
  console.log(`${id} · ${L}: casca ${iguais}/${ca.length} iguais · nó velho por componente ${velhosAqui.length}${velhosAqui.length ? ' ' + velhosAqui.map((no) => velhas.get(no.h_texto) ?? velhas.get(no.h_nome)).join(', ') : ''} · coincidência de texto ${coincid.length}: ${coincid.map((no) => `${no.role}/${no.tag} ${no.n} car.`).join('; ')} · (b) ${ba} → ${bd} · scrollWidth ${mA.doc.scrollWidth} → ${mD.doc.scrollWidth} · nós ${A.length} → ${D.length}`)
}
// a largura liberada (div. 728): em 1138, a coluna da lista e o painel — a largura do 1º cartão e da 1ª linha de música
const larg = (j, id, hTexto) => j.estados[id]?.larguras?.['1138']?.nos.find((no) => no.h_texto === hTexto)
console.log(`\nem 1138 (base-detalhe): o conteúdo vai de x=32 a x=1106 (1074 úteis, vão 24) — 2 : 3 = 420 · 630`)
for (const t of ['Garota de Ipanema', 'Construção']) {
  const a = larg(antes, 'base-detalhe', h(t)), d = larg(depois, 'base-detalhe', h(t))
  console.log(`  "${t}": antes x ${a?.x} w ${a?.w} · depois x ${d?.x} w ${d?.w}`)
}
const cartoes = depois.estados['base-detalhe']?.larguras?.['1138']?.nos.filter((no) => no.role === 'button' && no.tag === 'div') ?? []
const remover = depois.estados['base-detalhe']?.larguras?.['1138']?.nos.filter((no) => no.role === 'button' && no.tag === 'button' && no.w === 48 && no.x > 900 && no.y > 64) ?? []
if (cartoes[0] && remover[0]) {
  const lista = cartoes[0].w, painelAte = remover[0].x + remover[0].w + 12 + 1 // o respiro `space.md` à direita da linha + a borda
  const painelDe = cartoes[0].x + lista + 24
  console.log(`  depois: a coluna da lista x ${cartoes[0].x} w ${lista} · o painel x ${painelDe} até ${painelAte} (w ${painelAte - painelDe}) — razão ${(lista / (painelAte - painelDe)).toFixed(3)} (2 : 3 = 0.667)`)
}
console.log(velhosTotal ? `\nNÓ VELHO POR COMPONENTE: ${velhosTotal} — REPROVA` : `\nNÓ VELHO POR COMPONENTE: 0 — nas ${n} (estado × largura) · (b) do antes ${bAntes} → do depois ${bDepois}`)
process.exit(velhosTotal ? 1 : 0)
