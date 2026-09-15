#!/usr/bin/env node
// Uma linha por dump: os sete x1 em dp, o enabled de cada um, e as duas margens.
import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
const DP = 2.25, JANELA = 2560
const ORDEM = ['auto-scroll','zoom-menos','zoom-mais','tema','indice','busca','sair']
const n1 = (x) => (Math.round(x*10)/10).toFixed(1)
console.log('estado                     ' + ORDEM.map(s=>s.slice(0,6).padStart(7)).join('') + '   mEsq  mDir   vão   enabled=false')
for (const f of process.argv.slice(2)) {
  const xml = readFileSync(f,'utf8'); const p = new Map()
  for (const m of xml.matchAll(/<node\b([^>]*?)\/?>/g)) {
    const a={}; for (const x of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[x[1]]=x[2]
    const id=(a['resource-id']??'').replace(/^.*:id\//,''); if(!ORDEM.includes(id)) continue
    const b=/\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]/.exec(a.bounds??''); if(!b) continue
    p.set(id,{x1:+b[1],x2:+b[3],y1:+b[2],y2:+b[4],en:a.enabled})
  }
  const nome = basename(f,'.xml').padEnd(26)
  if (p.size===0){ console.log(nome+'  (sem barra)'); continue }
  const xs = ORDEM.map(id=>p.has(id)?n1(p.get(id).x1/DP).padStart(7):'      -').join('')
  const mE = n1((p.get(ORDEM[0])?.x1??0)/DP), mD = n1((JANELA-(p.get('sair')?.x2??JANELA))/DP)
  const vao = (p.has('tema')&&p.has('indice')) ? n1((p.get('indice').x1-p.get('tema').x2)/DP) : '-'
  const off = ORDEM.filter(id=>p.get(id)?.en==='false')
  console.log(nome+xs+`  ${mE.padStart(5)} ${mD.padStart(5)} ${String(vao).padStart(6)}   ${off.length?off.join(','):'(nenhum)'}`)
}
