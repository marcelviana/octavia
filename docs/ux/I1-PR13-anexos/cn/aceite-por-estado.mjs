// I1-PR-13 — o aceite das setlists por estado e por largura, com as erratas candidatas separadas por causa. Anexo, não gate.
// Uso: node docs/ux/I1-PR13-anexos/cn/aceite-por-estado.mjs [tests/gates-web/medicoes/setlists.json]
//  I1-E28: o nome do cartão em `size.title` (a tabela) e não nos 20 px do desenho — cada cartão ~2 px mais alto; em B o
//          painel (abaixo da lista) desce 6: Δy ≈ +6, o resto dentro da tolerância;
//  I1-E29: o editar contra `SET-criar*` — *Salvar*/*Salvando…* mais largo que *Criar*/*Criando…* (o *Cancelar* vai à
//          esquerda) e a 1ª linha do erro mais longa (a 2ª linha, do mesmo bloco, alarga);
//  I1-E30: a N10 contra `SET-adicionar-vazio` — uma linha a menos (sem o apoio): os botões sobem.
import fs from 'node:fs'
import { classificarEstado } from '../../../../scripts/gates-web/g-faixa-classificar.mjs'
const j = JSON.parse(fs.readFileSync(process.argv[2] ?? 'tests/gates-web/medicoes/setlists.json', 'utf8'))
const causa = (id, [dx, dy, dw, dh]) => {
  if (id === 'SET-adicionar-todas-ja' && dy < -4) return 'I1-E30'
  if (id.startsWith('SET-editar') && (Math.abs(dx) > 4 || Math.abs(dw) > 4)) return 'I1-E29'
  if (Math.abs(dx) <= 4 && Math.abs(dw) <= 4 && Math.abs(dh) <= 4 && dy > 4 && dy <= 8) return 'I1-E28'
  return 'OUTRA'
}
const tot = {}, porErrata = {}
let sw = 0, n = 0
console.log('estado · 1138 (e)·(b)·candidatas | 711 (e)·(b)·candidatas | 411 (e)·(b)·(d′) | sem par folha/app (C) | nome-acessível (B) | por errata')
for (const [id, e] of Object.entries(j.estados)) {
  if (!e.larguras) { console.log(`${id}: ${e.inalcancavel ?? JSON.stringify(e.naoAlcancado)}`); continue }
  const c = classificarEstado(e)
  const cel = []
  const aqui = {}
  for (const L of ['1138', '711', '411']) {
    const r = c[L], m = e.larguras[L]
    if (!r) { cel.push('—'); continue }
    n++; if (m.doc.scrollWidth === Number(L)) sw++
    const t = (tot[L] ??= { e: 0, b: 0, errata: 0, dl: 0, semF: 0, semA: 0, nome: 0, rol: 0 })
    t.e += r.e.length; t.b += r.b.length; t.dl += r.dl.length; t.errata += r.errata.length; t.semF += r.semPar.folha.length; t.semA += r.semPar.app.length; t.nome += r.saidas.nomeAcessivel; t.rol += r.saidas.rolagem
    if (L !== '411') for (const o of r.errata) { const k = causa(id, o.delta); aqui[k] = (aqui[k] ?? 0) + 1; porErrata[k] = (porErrata[k] ?? 0) + 1; if (k === 'OUTRA') console.log(`    OUTRA ${id} ${L} ${o.k} ${JSON.stringify(o.delta)}`) }
    cel.push(L === '411' ? `${r.e.length}·${r.b.length}·${r.dl.length}` : `${r.e.length}·${r.b.length}·${r.errata.length}`)
  }
  const C = c['1138']
  console.log(`${id.padEnd(24)} ${cel.join(' | ')} | ${C ? `${C.semPar.folha.length}/${C.semPar.app.length}` : '—'} | ${c['711']?.saidas.nomeAcessivel ?? '—'} | ${Object.entries(aqui).map(([k, v]) => `${k} ${v}`).join(' · ') || '—'}${e.folha?.secao && e.folha.secao !== id ? ` (contra ${e.folha.secao})` : ''}${e.naoAlcancado ? ` NÃO ALCANÇADO ${JSON.stringify(e.naoAlcancado)}` : ''}`)
}
console.log(`\nTOTAL: ${n} (estado × largura) · scrollWidth = viewport em ${sw}/${n}`)
for (const [L, t] of Object.entries(tot)) console.log(`  ${L}: (e) ${t.e} · (b) ${t.b} · (d′) ${t.dl} · errata candidata ${t.errata} · sem par folha/app ${t.semF}/${t.semA} · saídas: nome-acessível ${t.nome} · rolagem ${t.rol}`)
console.log(`erratas candidatas por causa (C e B): ${JSON.stringify(porErrata)}`)
for (const [L, r] of Object.entries(j.requests)) {
  const cnt = {}
  for (const l of r.linhas.filter((l) => l.caminho.startsWith('/api/'))) {
    const k = `${l.metodo} ${l.caminho.replace(/\?.*/, '').replace(/g-set-[a-z]+/, '{id}').replace(/songs\/.+/, 'songs/{linha}')} → ${l.status}`
    cnt[k] = (cnt[k] ?? 0) + 1
  }
  console.log(`${L} · commit ${j.rodadas?.[L]?.commit ?? j.commit} · ${j.rodadas?.[L]?.rodada ?? j.rodada} · prodAbortados ${r.prodAbortados}\n   ${Object.entries(cnt).map(([k, v]) => `${k} ×${v}`).join('\n   ')}`)
}
