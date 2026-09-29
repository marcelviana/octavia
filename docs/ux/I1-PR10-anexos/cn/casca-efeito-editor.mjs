// I1-PR-10 — a casca-efeito do EDITOR velho (o `pdf-viewer` que a PR-10 restiliza e ele monta): o "antes" (commit 1b,
// o código da main) × o "depois" (commit 2b), nó a nó pela chave `k` do medidor. Anexo, não gate. Por estado × largura:
// idênticos, só posição (Δx/Δy > 1, mesmo tamanho), tamanho diferente (Δw/Δh > 1), e os nós que só existem de um lado.
// Os nós DENTRO do visualizador de PDF saem à parte: no "depois" é o nó `t:pdf-viewer#1` e o que cai na caixa dele;
// no "antes" (sem testid), o que cai na mesma faixa vertical a partir do topo do visualizador.
// Uso (da raiz): node docs/ux/I1-PR10-anexos/cn/casca-efeito-editor.mjs
import fs from 'node:fs'
const ler = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const antes = ler('tests/gates-web/medicoes/casca-efeito/antes/content-edit.json')
const depois = ler('tests/gates-web/medicoes/casca-efeito/depois/content-edit.json')
const d1 = (a, b) => Math.abs(a - b) > 1
for (const [id, ea] of Object.entries(antes.estados)) {
  for (const L of ['1138', '711', '411']) {
    const A = ea.larguras?.[L]?.nos, B = depois.estados[id]?.larguras?.[L]?.nos
    if (!A || !B) { console.log(`${id} · ${L}: sem medição de um dos lados`); continue }
    const viewer = B.find((n) => n.k === 't:pdf-viewer#1')
    const dentro = (n) => viewer && n.y >= viewer.y - 1 && n.x >= viewer.x - 1 && n.x + n.w <= viewer.x + viewer.w + 1
    const mA = new Map(A.map((n) => [n.k, n])), mB = new Map(B.map((n) => [n.k, n]))
    const c = { iguais: 0, posicao: 0, tamanho: 0, soAntes: 0, soDepois: 0 }, viewerC = { posicao: 0, tamanho: 0, soAntes: 0, soDepois: 0 }
    const fora = []
    for (const [k, a] of mA) {
      const b = mB.get(k)
      const noViewer = viewer && a.y >= viewer.y - 1
      if (!b) { (noViewer ? viewerC : c).soAntes++; if (!noViewer) fora.push(`só antes: ${a.role}/${a.tag} ${a.n} car.`); continue }
      const tam = d1(a.w, b.w) || d1(a.h, b.h), pos = d1(a.x, b.x) || d1(a.y, b.y)
      const alvo = dentro(b) ? viewerC : c
      if (tam) { alvo.tamanho++; if (alvo === c) fora.push(`tamanho: ${a.role}/${a.tag} ${a.n} car. [${a.w}×${a.h} → ${b.w}×${b.h}]`) }
      else if (pos) { alvo.posicao++; if (alvo === c) fora.push(`posição: ${a.role}/${a.tag} ${a.n} car. Δ(${Math.round(b.x - a.x)},${Math.round(b.y - a.y)})`) }
      else c.iguais++
    }
    for (const [k, b] of mB) if (!mA.has(k)) { if (dentro(b) || k === 't:pdf-viewer#1') viewerC.soDepois++; else { c.soDepois++; fora.push(`só depois: ${b.role}/${b.tag} ${b.n} car.`) } }
    console.log(`${id} · ${L}: FORA do visualizador — iguais ${c.iguais} · só posição ${c.posicao} · tamanho ${c.tamanho} · só antes ${c.soAntes} · só depois ${c.soDepois}` +
      (viewer ? ` | DENTRO do visualizador (y ≥ ${Math.round(viewer.y)}) — posição ${viewerC.posicao} · tamanho ${viewerC.tamanho} · só antes ${viewerC.soAntes} · só depois ${viewerC.soDepois}` : ''))
    for (const f of fora) console.log(`    ${f}`)
  }
}
