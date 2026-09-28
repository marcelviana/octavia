import fs from 'node:fs'
import { cortes } from '../../../../scripts/gates-web/g-faixa-classificar.mjs'
for (const arq of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(arq, 'utf8'))
  for (const [nome, est] of Object.entries(j.estados)) {
    for (const [L, med] of Object.entries(est.larguras ?? {})) {
      if (!med?.nos) continue
      const { b } = cortes(med)
      console.log(`${arq} · ${nome} · ${L}: (b) ${b.length} · doc ${med.doc.clientWidth}→${med.doc.scrollWidth} · nós ${med.nos.length}`)
      if (L === '1138') for (const o of b) {
        const n = med.nos.find(x => x.k === o.k)
        console.log('   ', o.tipo, '|', o.k, '|', n ? `${n.role}/${n.tag} n=${n.n} [x ${n.x.toFixed(1)} y ${n.y.toFixed(1)} w ${n.w.toFixed(1)} h ${n.h.toFixed(1)}] clip=${n.clip ? JSON.stringify([n.clip.x,n.clip.y,n.clip.w,n.clip.h].map(v=>+v.toFixed(1)))+(n.clip.rolagem?' rola':'') : '—'}` : JSON.stringify(o))
      }
    }
  }
}
