// QL brief — as amostras de texto por largura (o "antes" em texto). Sem aparelho, sem dependência.
// Os textos são INVENTADOS para o brief (nenhuma linha de música real, nenhum título nem artista real — `CLAUDE.md`,
// "Anexo não carrega texto de música"; `D0-ENCERRAMENTO.md` §8.2 item 7; div. 1174). O script monta cada linha, confere o
// comprimento que o brief promete (para se o texto mudar e a promessa não) e imprime cada texto COMO ESTÁ HOJE — a linha
// inteira, que rola para o lado — com a régua das larguras do zoom 22: 26 (A), 48 (o palco e V em B), 55 (V em C) e 80
// (o palco em C). Onde a largura cai DENTRO de um acorde, a linha diz qual.
// Uso, da raiz: node docs/native/QL-BRIEF-anexos/instrumentos/amostras.mjs > docs/native/QL-BRIEF-anexos/amostras.txt
const LARGURAS = [26, 48, 55, 80]
const ONDE = { 26: 'A', 48: 'B', 55: 'V em C', 80: 'palco em C' }
const len = (s) => [...s].length

/** Uma linha de acordes com cada acorde na coluna dada (1 = a primeira). */
function acordes(pares) {
  let s = ''
  for (const [col, ac] of pares) { s = s.padEnd(col - 1, ' ') + ac }
  return s
}
/** Uma linha de corda de tab com exatamente n colunas: a corda, a barra e o desenho do compasso repetido. */
function corda(nome, compasso, n) {
  let s = `${nome}|`
  while (len(s) < n - 1) s += compasso
  return s.slice(0, n - 1) + '|'
}

const TEXTOS = {
  LETRA: {
    titulo: 'Letra — a forma real (no dado do Marcel: a maior linha 77, p95 46)',
    linhas: [
      'Acendi a lanterna do quintal e',
      'Quando a maré da fixture sobe devagar pelo cais lá',
      'o vento assobia baixinho',
      '',
      'Cada passo que eu dou na areia fria deixa um rastro de sal e',
      'e a cidade inteira dorme enquanto o barco da fixture segue sem pressa pro mar',
      'ô ô ô',
    ],
    promessa: { 0: 30, 1: 50, 4: 60, 5: 77 },
  },
  CIFRA: {
    titulo: 'Cifra — pares de 30 e de 50, um acorde que atravessa o corte de 26, a progressão de seção e a linha quase acorde',
    linhas: [
      'Intro: Am  E',
      '',
      acordes([[1, 'Am'], [15, 'F'], [30, 'C']]),
      'Dobrei a esquina da fixture, e',
      acordes([[1, 'Am'], [23, 'F#m7(11)'], [39, 'G'], [50, 'C']]),
      'Cada janela acesa conta uma história de quem passa',
      '',
      'Refrão',
      'Am  F  C  G',
      'E a noite inteira cabe numa canção de exemplo',
    ],
    promessa: { 0: 12, 2: 30, 3: 30, 4: 50, 5: 50, 8: 11, 9: 45 },
    papel: { 0: 'quase acorde (Intro:) — reserva por linha, QL-D23', 2: 'acordes do par de 30', 3: 'letra do par de 30', 4: 'acordes do par de 50 — o F#m7(11) ocupa as colunas 23 a 30 e atravessa o corte de 26', 5: 'letra do par de 50', 7: 'nome da seção', 8: 'progressão da seção — vira par com a linha de baixo (QL-D22)', 9: 'letra da seção' },
  },
  TAB: {
    titulo: 'Tab — 78 colunas, seis cordas (não quebra: rola, como hoje)',
    linhas: [
      corda('e', '-----0-----0----', 78),
      corda('B', '---1---1-----1--', 78),
      corda('G', '-2-------2------', 78),
      corda('D', '----------------', 78),
      corda('A', '-3---------3----', 78),
      corda('E', '----------------', 78),
    ],
    promessa: { 0: 78, 1: 78, 2: 78, 3: 78, 4: 78, 5: 78 },
  },
  NOTA: {
    titulo: 'Nota da música — várias linhas, uma longa',
    linhas: [
      'Capo na 2.',
      'Entrar depois da contagem de quatro do metrônomo da fixture.',
      'Segunda voz só no refrão; no fim, segurar o último acorde até a luz da sala apagar de vez.',
    ],
    promessa: { 0: 10 },
  },
}

const erros = []
for (const [k, t] of Object.entries(TEXTOS)) for (const [i, n] of Object.entries(t.promessa)) {
  const l = t.linhas[Number(i)]
  if (len(l) !== n) erros.push(`${k}[${i}] tem ${len(l)} colunas, o brief promete ${n}: "${l}"`)
}
if (erros.length) { console.error(erros.join('\n')); process.exit(1) }

/** A régua: um traço por coluna até a maior, e a marca ▼ com o número em cada largura. */
function regua(max) {
  const ate = Math.max(max, ...LARGURAS)
  let marcas = ''.padEnd(ate, ' ').split('')
  let nums = ''.padEnd(ate + 12, ' ').split('')
  for (const w of LARGURAS) { marcas[w - 1] = '▼'; const r = String(w); for (let j = 0; j < r.length; j++) nums[w - 1 + j] = r[j] }
  return [nums.join('').trimEnd(), marcas.join('').trimEnd()]
}
function acordeNaColuna(l, col) {
  // o token (sem espaço) que ocupa a coluna `col` e a seguinte — o corte cairia dentro dele
  const cs = [...l]
  if (col >= cs.length || cs[col - 1] === ' ' || cs[col] === ' ' || cs[col] === undefined) return null
  let a = col - 1; while (a > 0 && cs[a - 1] !== ' ') a--
  let b = col; while (b < cs.length && cs[b] !== ' ') b++
  return { token: cs.slice(a, b).join(''), de: a + 1, ate: b }
}

const out = []
out.push('# QL brief — as amostras de texto por largura, COMO ESTÁ HOJE (a linha inteira, que rola para o lado).')
out.push('# Gerado por instrumentos/amostras.mjs. Textos inventados para o brief. Larguras do zoom 22: ' + LARGURAS.map((w) => `${w} = ${ONDE[w]}`).join(' · ') + '.')
out.push('# A régua: cada ▼ fica sobre a ÚLTIMA coluna que cabe naquela largura. Em cada linha: o comprimento e as larguras que ela')
out.push('# passa (onde, hoje, ela sai da coluna e só se lê rolando o corpo para o lado).')
for (const [k, t] of Object.entries(TEXTOS)) {
  const max = Math.max(...t.linhas.map(len))
  out.push('', `## ${k} — ${t.titulo}`, '')
  const [nums, marcas] = regua(max)
  out.push('      ' + nums, '      ' + marcas)  // 6 = o prefixo das linhas: '  NN │'
  t.linhas.forEach((l, i) => {
    const n = len(l)
    const passa = LARGURAS.filter((w) => n > w)
    const dentro = k === 'CIFRA' ? LARGURAS.map((w) => [w, acordeNaColuna(l, w)]).filter(([, a]) => a && /^[A-G]/.test(a.token)) : []
    let info = n === 0 ? '(vazia)' : `${n} col` + (passa.length ? ` · passa de ${passa.join(', ')}` : ' · cabe em todas')
    for (const [w, a] of dentro) info += ` · o corte de ${w} cai dentro de "${a.token}" (col. ${a.de}–${a.ate})`
    if (t.papel?.[i]) info += ` · ${t.papel[i]}`
    out.push(`  ${String(i + 1).padStart(2)} │${l}`)
    out.push(`     │  └ ${info}`)
  })
}
console.log(out.join('\n'))
