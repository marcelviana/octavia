// QL pre-check, o acréscimo da QL-D14 à consulta 2 (as linhas "quase acorde"). Parte da fixture da Fase A
// (fixture.json, intacta) e acrescenta linhas escritas pelo projeto que caem no critério e que não caem → fixture-b.json.
// O esperado das DUAS fixtures sai em esperado-b.json ({a, b}), pelo `bodyOf` do core e a mesma heurística em JS: a
// prova é que as colunas da Fase A não mudam na fixture A, e que todas as colunas batem na B.
// Uso, da raiz: npx tsx docs/native/QL-PRECHECK-anexos/fase-b/prova-local/gerar-b.mjs
import fs from 'node:fs'
import { bodyOf } from '../../../../../packages/core/src/content-contract.ts'
const P = 'xVDJRBh1WpPOatbfWahOLttYn1E3'
const a = JSON.parse(fs.readFileSync(new URL('./fixture.json', import.meta.url), 'utf8'))
const b = [...a]
let k = 100
const add = (content_type, content_data, notes = null) => b.push({ id: `00000000-0000-4000-8000-${String(++k).padStart(12, '0')}`, user_id: P, content_type, content_data, notes })
const longa = (n) => 'lo '.repeat(Math.ceil(n / 3)).slice(0, n)
// Cifra: entram no critério — "Intro: Am7(9)  E", "A  E  fim", "Refrão  C  G" + 40 colunas (> 26), uma de 60 (> 55);
// não entram — "Am  F  C  G  (2x)" (é de acordes), "Eu vou cantar" (nenhum acorde), linha vazia.
add('Chords', { chords: ['Intro: Am7(9)  E', 'A  E  fim', 'Refrão  C  G  ' + longa(40), 'Am  F  C  G  (2x)', 'Eu vou cantar', '', 'Ponte  Dm  ' + longa(60)].join('\n') })
// Letra: "A noite da fixture" (homógrafo — entra no critério, não na maioria) e "E  A  D  fim de linha" (entra nos dois).
add('Lyrics', { lyrics: ['A noite da fixture', 'E  A  D  fim', 'Verso sem acorde nenhum'].join('\n') })
fs.writeFileSync(new URL('./fixture-b.json', import.meta.url), JSON.stringify(b))

const TOK = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(\/[A-G](#|b)?)?$/
const SEP = /^([|:.\-]+|x?[0-9]+x?|\([0-9]+x\))$/
const classe = (l) => {
  const t = l.trim(); if (t === '') return { acordes: false, quase: false, maioria: false }
  const toks = t.split(/[ \t]+/); const na = toks.filter((x) => TOK.test(x)).length; const ns = toks.filter((x) => !TOK.test(x) && SEP.test(x)).length
  const quase = na > 0 && na + ns < toks.length
  return { acordes: na > 0 && na + ns === toks.length, quase, maioria: quase && 2 * (na + ns) >= toks.length }
}
const len = (s) => [...s].length
const fr = (q, ac) => (q + ac === 0 ? null : Math.round((q / (q + ac)) * 1000) / 1000)
function calc(linhas) {
  const princ = linhas.filter((l) => l.user_id === P)
  const out = {}
  for (const tipo of ['Chords', 'Lyrics', 'Sheet', 'Tab']) {
    const ms = princ.filter((l) => l.content_type === tipo)
    const corpos = ms.map((m) => ({ id: m.id, c: bodyOf(m.content_type, m.content_data) })).filter((x) => x.c !== null && x.c !== '')
    const ls = corpos.flatMap((x) => x.c.split('\n').map((l) => ({ id: x.id, n: len(l), l, ...classe(l) })))
    const acima = (n) => ({ m: new Set(ls.filter((x) => x.n > n).map((x) => x.id)).size, l: ls.filter((x) => x.n > n).length })
    const pares = corpos.flatMap((x) => { const L = x.c.split('\n'); const r = []; for (let i = 0; i + 1 < L.length; i++) if (classe(L[i]).acordes && !classe(L[i + 1]).acordes && L[i + 1].trim() !== '') r.push({ p: Math.max(len(L[i]), len(L[i + 1])) }); return r })
    const q = ls.filter((x) => x.quase), ac = ls.filter((x) => x.acordes).length, qm = ls.filter((x) => x.maioria).length
    out[tipo] = { musicas: ms.length, com_corpo: corpos.length, linhas: ls.length, a26: acima(26), a48: acima(48), a55: acima(55), a80: acima(80),
      maior: ls.length ? Math.max(...ls.map((x) => x.n)) : null, tab_char: corpos.filter((x) => x.c.includes('\t')).length, cr: corpos.filter((x) => x.c.includes('\r')).length,
      nfd: corpos.filter((x) => /[̀-ͯ]/.test(x.c)).length, acordes: ac, pares: pares.length, pares_a26: pares.filter((p) => p.p > 26).length,
      pares_a48: pares.filter((p) => p.p > 48).length, maior_par: pares.length ? Math.max(...pares.map((p) => p.p)) : null,
      quase: q.length, musicas_quase: new Set(q.map((x) => x.id)).size, quase_a26: q.filter((x) => x.n > 26).length, quase_a48: q.filter((x) => x.n > 48).length,
      quase_a55: q.filter((x) => x.n > 55).length, quase_a80: q.filter((x) => x.n > 80).length, fracao_quase: fr(q.length, ac), quase_maioria: qm, fracao_quase_maioria: fr(qm, ac) }
  }
  const notas = princ.filter((l) => l.notes !== null && l.notes.trim() !== '')
  out.notas = { com_notas: notas.length, maior: Math.max(...notas.map((n) => len(n.notes))), maior_linha: Math.max(...notas.flatMap((n) => n.notes.split('\n').map(len))), mais_de_uma_linha: notas.filter((n) => n.notes.includes('\n')).length }
  return out
}
const esperado = { a: calc(a), b: calc(b) }
fs.writeFileSync(new URL('./esperado-b.json', import.meta.url), JSON.stringify(esperado, null, 1))
for (const f of ['a', 'b']) for (const t of ['Chords', 'Lyrics']) { const o = esperado[f][t]; console.log(f, t, JSON.stringify(o)) }
