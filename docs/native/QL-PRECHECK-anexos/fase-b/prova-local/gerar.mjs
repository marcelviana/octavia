// Fixture da prova local das consultas da Fase B (QL pre-check): o g-par.json do core + linhas escritas aqui, pelo
// projeto (nenhum texto de terceiro). Gera fixture.json (linhas da tabela) e esperado.json (o que as consultas devem dar,
// calculado com o `bodyOf` do core e a mesma heurística de linha de acordes).
import fs from 'node:fs'
import { bodyOf } from '../../../../../packages/core/src/content-contract.ts'
const P = 'xVDJRBh1WpPOatbfWahOLttYn1E3'
const gpar = JSON.parse(fs.readFileSync(new URL('../../../../../packages/core/fixtures/g-par.json', import.meta.url), 'utf8'))
const rep = (n, base = 'la ') => (base.repeat(Math.ceil(n / base.length))).slice(0, n)
const linhas = []
let k = 0
const add = (content_type, content_data, notes = null, user_id = P) => linhas.push({ id: `00000000-0000-4000-8000-${String(++k).padStart(12, '0')}`, user_id, content_type, content_data, notes })
for (const it of gpar.par) add(it.content_type, it.content_data ?? null, null)
add('Lyrics', { lyrics: [rep(26), rep(27), rep(49), rep(56), rep(81), ''].join('\n') }, 'Entrar depois da contagem.\nSegunda voz no refrão, segurar o último acorde até apagar a sala inteira.')
add('Lyrics', { lyrics: 'C   G   Am   F\nQuando a fixture chega a linha segue\n\nLinha só de letra' }, '   ')
add('Chords', { chords: 'Em7  A7(9)  D/F#  G\n' + rep(60, 'pa ') + '\nC  |  G  x2\n\nBm\n' + rep(20) + '\nA noite da fixture' })
add('Chords', { sections: [{ name: 'Verso', chords: 'Am F C G', lyrics: 'D        G\n' + rep(70, 'lu ') }, { name: '', chords: '', lyrics: '' }, { name: 'Refrão', lyrics: 'E\tA\n' + rep(30) + '\r' }] })
add('Tab', { tablature: 'e|' + '-'.repeat(90) + '|\nB|---3---|' }, 'nota curta')
add('Sheet', null, null)
add('Lyrics', { lyrics: 'cora\u0063\u0327a\u0303o em NFD' })
add('Lyrics', { lyrics: rep(200) }, null, 'OUTRA-CONTA-nao-conta')
fs.writeFileSync(new URL('./fixture.json', import.meta.url), JSON.stringify(linhas))
// esperado
const TOK = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|M|°|º|\+|-|[0-9]|\(|\)|#|b)*(\/[A-G](#|b)?)?$/
const SEP = /^([|:.\-]+|x?[0-9]+x?|\([0-9]+x\))$/
const ehAcordes = (l) => { const t = l.trim(); if (t === '') return false; const toks = t.split(/[ \t]+/); return toks.every((x) => TOK.test(x) || SEP.test(x)) && toks.some((x) => TOK.test(x)) }
const princ = linhas.filter((l) => l.user_id === P)
const out = {}
for (const tipo of ['Chords', 'Lyrics', 'Sheet', 'Tab']) {
  const ms = princ.filter((l) => l.content_type === tipo)
  const corpos = ms.map((m) => ({ id: m.id, c: bodyOf(m.content_type, m.content_data) })).filter((x) => x.c !== null && x.c !== '')
  const ls = corpos.flatMap((x) => x.c.split('\n').map((l) => ({ id: x.id, n: [...l].length, l })))
  const acima = (n) => ({ m: new Set(ls.filter((x) => x.n > n).map((x) => x.id)).size, l: ls.filter((x) => x.n > n).length })
  const pares = corpos.flatMap((x) => { const L = x.c.split('\n'); const r = []; for (let i = 0; i + 1 < L.length; i++) if (ehAcordes(L[i]) && !ehAcordes(L[i + 1]) && L[i + 1].trim() !== '') r.push({ id: x.id, a: [...L[i]].length, p: Math.max([...L[i]].length, [...L[i + 1]].length) }); return r })
  out[tipo] = { musicas: ms.length, com_corpo: corpos.length, linhas: ls.length, a26: acima(26), a48: acima(48), a55: acima(55), a80: acima(80), maior: ls.length ? Math.max(...ls.map((x) => x.n)) : null,
    tab_char: corpos.filter((x) => x.c.includes('\t')).length, cr: corpos.filter((x) => x.c.includes('\r')).length, nfd: corpos.filter((x) => /[\u0300-\u036f]/.test(x.c)).length,
    acordes: ls.filter((x) => ehAcordes(x.l)).length, pares: pares.length, pares_a26: pares.filter((p) => p.p > 26).length, pares_a48: pares.filter((p) => p.p > 48).length, maior_par: pares.length ? Math.max(...pares.map((p) => p.p)) : null }
}
const notas = princ.filter((l) => l.notes !== null && l.notes.trim() !== '')
out.notas = { com_notas: notas.length, maior: Math.max(...notas.map((n) => [...n.notes].length)), maior_linha: Math.max(...notas.flatMap((n) => n.notes.split('\n').map((l) => [...l].length))), mais_de_uma_linha: notas.filter((n) => n.notes.includes('\n')).length }
fs.writeFileSync(new URL('./esperado.json', import.meta.url), JSON.stringify(out, null, 1))
console.log(JSON.stringify(out))
