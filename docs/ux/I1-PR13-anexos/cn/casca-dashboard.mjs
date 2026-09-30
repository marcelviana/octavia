// I1-PR-13 — o `app/layout.tsx` mudou (o Toaster do sonner saiu — decisão 18 do aval): a casca de uma tela JÁ redesenhada,
// antes × depois. Antes = `tests/gates-web/medicoes/dashboard.json` (o aceite da I1-PR-9, estado `DASH`); depois = o mesmo
// estado medido sobre esta PR (`tests/gates-web/medicoes/casca-efeito/depois/dashboard.json`, `G_FAIXA_ESTADOS=DASH`).
// Anexo, não gate. Casca = y < 64 em C, y < 120 em B e A.
// I1-PR15 (decisão 2 do encerramento; aval 4): o rastro está em `.gz` — lido por `ler-medicao.mjs`.
import { lerJson } from '../../../../scripts/gates-web/ler-medicao.mjs'
const a = lerJson('tests/gates-web/medicoes/dashboard.json')
const d = lerJson(process.argv[2] ?? 'tests/gates-web/medicoes/casca-efeito/depois/dashboard.json')
console.log(`antes: ${JSON.stringify(a.rodadas?.['1138'] ?? { rodada: a.rodada, commit: a.commit })} · depois: ${d.rodada} ${d.commit}`)
let delta = 0
for (const L of ['1138', '711', '411']) {
  const A = a.estados.DASH.larguras[L].nos, D = d.estados.DASH.larguras[L].nos
  const mD = new Map(D.map((n) => [n.k, n])), mA = new Map(A.map((n) => [n.k, n]))
  const casca = (n) => n.y < (L === '1138' ? 64 : 120)
  const ca = A.filter(casca)
  const iguais = ca.filter((n) => { const m = mD.get(n.k); return m && ['x', 'y', 'w', 'h'].every((c) => Math.abs(m[c] - n[c]) <= 1) }).length
  const identicos = A.filter((n) => { const m = mD.get(n.k); return m && ['x', 'y', 'w', 'h'].every((c) => m[c] === n[c]) }).length
  const soAntes = A.filter((n) => !mD.has(n.k)), soDepois = D.filter((n) => !mA.has(n.k))
  const mudaram = A.filter((n) => { const m = mD.get(n.k); return m && !['x', 'y', 'w', 'h'].every((c) => m[c] === n[c]) }).length
  delta += mudaram + soDepois.length + (ca.length - iguais) + soAntes.filter((n) => n.h > 0).length
  console.log(`DASH · ${L}: casca ${iguais}/${ca.length} iguais · nós ${A.length} → ${D.length} · idênticos (x, y, w, h) ${identicos} · mudaram ${mudaram} · só antes ${soAntes.length} [${soAntes.map((n) => `<${n.tag}> ${n.w}×${n.h} ${n.h_texto ?? n.h_nome}`).join('; ')}] · só depois ${soDepois.length} · doc ${JSON.stringify(a.estados.DASH.larguras[L].doc) === JSON.stringify(d.estados.DASH.larguras[L].doc) ? 'igual' : 'DIFERE'}`)
}
console.log(delta ? `Δ: ${delta}` : 'Δ: 0 — o único nó que sai é a <section> do Toaster do sonner (fca0c0beacd0 = sha256("Notifications alt+T")[:12], altura 0)')
