// I1-PR-9 — o corpo velho de `setlists` e `content` com a casca nova (medicoes/casca-efeito/) × o mesmo corpo com a
// casca velha (medicoes/cn-main/), nó a nó pela chave, sem os nós da casca velha. Critério (div. 727; div. 728 → (a),
// Marcel): zero Δ de tamanho, EXCETO a largura que um corpo fluido ganha em 1138 com a saída da lateral (+144 em duas
// colunas, +288 em uma; a altura só pode diminuir, pela linha que deixa de quebrar) — contada à parte, "largura liberada".
// Uso (da raiz): node docs/ux/I1-PR9-anexos/cn/casca-efeito-corpo.mjs [pasta do casca-efeito]
// I1-PR15 (decisão 2 do encerramento): o `cn-main/` e o `casca-efeito/` estão em `.gz` — lidos por `ler-medicao.mjs`.
import { lerJson } from '../../../../scripts/gates-web/ler-medicao.mjs'
const CASCA_VELHA = new Set(['heading:365feefa2df3', 'button:67b696468610', 'button:6a1ad7ecd437', 'button:∅'])
for (const s of ['setlists', 'content']) {
  const a = lerJson(`tests/gates-web/medicoes/cn-main/${s}.json`).estados.base.larguras
  const b = lerJson(`${process.argv[2] ?? 'tests/gates-web/medicoes/casca-efeito'}/${s}.json`).estados.base.larguras
  for (const l of ['1138', '711', '411']) {
    const base = (k) => k.replace(/#\d+$/, '')
    const va = a[l].nos.filter((n) => !CASCA_VELHA.has(base(n.k)))
    const vb = b[l].nos
    const kb = new Map(vb.map((n) => [n.k, n]))
    let mesmoTam = 0, difTam = [], liberada = [], sumiu = []
    const desloc = new Map()
    for (const n of va) {
      const m = kb.get(n.k)
      if (!m) { sumiu.push(`${n.role}/${n.n}`); continue }
      const dw = m.w - n.w, dh = m.h - n.h
      if (Math.abs(dw) <= 1 && Math.abs(dh) <= 1) mesmoTam++
      else if (l === '1138' && (Math.abs(dw - 144) <= 1 || Math.abs(dw - 288) <= 1) && dh <= 1) liberada.push(`${n.role}/${n.n} ${n.w}×${n.h}→${m.w}×${m.h}`)
      else difTam.push(`${n.role}/${n.n} ${n.w}×${n.h}→${m.w}×${m.h}`)
      const d = `${Math.round(m.x - n.x)},${Math.round(m.y - n.y)}`; desloc.set(d, (desloc.get(d) ?? 0) + 1)
    }
    const kaSet = new Set(a[l].nos.map((n) => n.k))
    const novos = vb.filter((n) => !kaSet.has(n.k)).length
    console.log(`${s} · ${l}: nós do corpo (cn-main, sem a casca velha) ${va.length} · no casca-efeito ${vb.length} (${novos} novos = a casca nova + o que mudou) · sumiram ${sumiu.length}${sumiu.length ? ' [' + sumiu.slice(0, 6).join(', ') + ']' : ''} · mesmo tamanho (±1) ${mesmoTam} · largura liberada ${liberada.length}${liberada.length ? ' [' + liberada.join('; ') + ']' : ''} · tamanho diferente ${difTam.length}${difTam.length ? ' [' + difTam.slice(0, 4).join('; ') + ']' : ''} · deslocamento (Δx,Δy): ${[...desloc].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([d, c]) => `${d} ×${c}`).join(' · ')}`)
  }
}
