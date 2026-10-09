/**
 * QL-PR2 — os casos de BORDA da quebra (`quebra.ts`), os que o gate (`tests/gates/ql-quebra.test.ts`) não cobre. São
 * EXTRAS DA MESMA CLASSE do gate (A-QL-1…A-QL-3): cada caso diz as linhas visuais esperadas, o porquê, e passa pela
 * invariância (A-QL-2) — a mesma conferência do gate (ii), copiada aqui porque o projeto `core` não importa de
 * `tests/` (isolamento, `isolation.test.ts`).
 *
 * Três grupos:
 *   - DERIVADOS: o comportamento sai de R1–R4, do QL-D24 ou do contrato de `quebra.ts` (QL-D41) — o porquê no título;
 *   - DECIDIDOS: R1–R4 não decidiam; foram as perguntas Q1…Q5 da PR-2, e o aval do Marcel (QL-D43…QL-D47,
 *     `docs/native/QL-PR2-anexos/README.md` §11) as decidiu. Eram os PROVISÓRIOS da PR-2; viraram definitivos;
 *   - A VARREDURA: a invariância em todo número de colunas de 3 a 90, nos textos do gate e nos daqui, e a largura de
 *     toda linha visual dentro da coluna (de 10 em diante — abaixo disso o `F#m7(11)` é maior que a coluna, Q3).
 *
 * Controle negativo: contra o `quebrar` que lança (o contrato da PR-1), todo `it` deste arquivo reprova.
 * Texto: só do projeto (`QL-BRIEF.md` §5, as frases inventadas abaixo); nenhum texto de música de terceiro (regra 10).
 */
import { describe, expect, it } from 'vitest'
import { ehLinhaDeAcordes, quebrar, RECUO_DA_CONTINUACAO, type LinhaVisual } from './quebra'
import { colunasDesenhadas } from './quebra'

/** `null` = a invariância vale; senão, o motivo (a conferência do gate (ii)). */
function invariancia(texto: string, r: LinhaVisual[]): string | null {
  const L = texto.split('\n')
  const recuo = ' '.repeat(RECUO_DA_CONTINUACAO)
  const porLinha = new Map<number, LinhaVisual[]>()
  const primeiras: number[] = []
  for (const [k, l] of r.entries()) {
    const linha = L[l.logica]
    if (linha === undefined) return `linha visual ${k + 1}: logica fora do texto`
    if (!(l.inicio >= 0 && l.inicio <= l.fim && l.fim <= linha.length)) return `linha visual ${k + 1}: fatia fora`
    if (l.texto !== (l.continuacao ? recuo : '') + linha.slice(l.inicio, l.fim)) return `linha visual ${k + 1}: texto ≠ recuo + fatia`
    if (l.continuacao !== l.inicio > 0) return `linha visual ${k + 1}: continuacao ≠ (inicio > 0)`
    if (!porLinha.has(l.logica)) {
      porLinha.set(l.logica, [])
      primeiras.push(l.logica)
    }
    porLinha.get(l.logica)!.push(l)
  }
  if (primeiras.length !== L.length || primeiras.some((v, k) => v !== k)) return `linhas lógicas fora de ordem: ${primeiras.join(',')}`
  const junta: string[] = []
  for (const [i, linha] of L.entries()) {
    let s = ''
    for (const l of porLinha.get(i)!) {
      if (l.inicio < s.length) return `linha lógica ${i + 1}: pedaços sobrepostos`
      if (!/^ *$/.test(linha.slice(s.length, l.inicio))) return `linha lógica ${i + 1}: entre os pedaços há o que não é espaço`
      s += ' '.repeat(l.inicio - s.length) + linha.slice(l.inicio, l.fim)
    }
    if (!/^ *$/.test(linha.slice(s.length))) return `linha lógica ${i + 1}: depois do último pedaço há o que não é espaço`
    junta.push(s + ' '.repeat(linha.length - s.length))
  }
  return junta.join('\n') === texto ? null : 'a junção não devolve o texto byte a byte'
}

/** Quebra, confere a invariância e devolve só os textos. */
function textos(texto: string, tipo: string, colunas: number): string[] {
  const r = quebrar(texto, tipo, colunas)
  expect(invariancia(texto, r), 'invariância (A-QL-2)').toBeNull()
  return r.map((l) => l.texto)
}

describe('ehLinhaDeAcordes — a heurística da Fase B (q2-cifra-pares.sql)', () => {
  it.each([
    'Am  F  C  G',
    'Am            F              C',
    'Am                    F#m7(11)        G          C',
    'C  |  G  x2',
    'Am  F  C  G  (2x)',
    'D/F#  Gsus4  Bb',
    'F#m7(11)',
    '   Am   ',
    'Am\tF',
  ])('entra: %j', (l) => {
    expect(ehLinhaDeAcordes(l)).toBe(true)
  })

  it.each([
    'Intro: Am  E',
    'Intro: Am  E  F#m7(11)  G', // maioria de acordes (4 de 5) — e ainda assim quase acorde: fora do par (R4, QL-D23)
    'A noite chega',
    'E o dia',
    'Refrão',
    'x2',
    '|  :',
    '',
    '    ',
    'Cada janela acesa',
  ])('não entra: %j', (l) => {
    expect(ehLinhaDeAcordes(l)).toBe(false)
  })
})

describe('as bordas DERIVADAS — de R1–R4, do QL-D24 e do contrato (QL-D41)', () => {
  it('texto vazio: uma linha visual vazia, em todo tipo (contrato, item 3: a linha vazia tem uma, "")', () => {
    for (const tipo of ['Lyrics', 'Chords', 'Tab']) {
      expect(quebrar('', tipo, 26)).toEqual([{ texto: '', logica: 0, continuacao: false, inicio: 0, fim: 0 }])
    }
  })

  it('linha vazia no meio: fica, como linha visual vazia (contrato, item 3)', () => {
    expect(textos('a\n\nb', 'Lyrics', 26)).toEqual(['a', '', 'b'])
  })

  it('a última linha sem \\n e com \\n: as linhas lógicas são as do split — o \\n do fim abre uma linha vazia', () => {
    expect(textos('a\nb', 'Lyrics', 26)).toEqual(['a', 'b'])
    expect(textos('a\nb\n', 'Lyrics', 26)).toEqual(['a', 'b', ''])
  })

  it('só espaços que cabem: ficam como estão (R1: nada a cortar)', () => {
    expect(textos('     ', 'Lyrics', 14)).toEqual(['     '])
  })

  it('só espaços maiores que a coluna: uma linha vazia (R1: o espaço do corte sai; R3: os do começo do resto também)', () => {
    expect(textos(' '.repeat(30), 'Lyrics', 14)).toEqual([''])
  })

  it('espaços no fim: ficam quando cabem; quando não, saem (o fim da linha não passa da coluna)', () => {
    expect(textos('abc ', 'Lyrics', 9)).toEqual(['abc '])
    expect(textos('abc def' + ' '.repeat(10), 'Lyrics', 9)).toEqual(['abc def'])
  })

  it('o recuo do autor que cabe fica (nada manda tirar espaço do começo da primeira linha)', () => {
    expect(textos('    abc def', 'Lyrics', 14)).toEqual(['    abc def'])
  })

  it('a palavra do tamanho exato da coluna cabe; com uma letra a mais, parte na última coluna (R1)', () => {
    expect(textos('abcdefghijklmn', 'Lyrics', 14)).toEqual(['abcdefghijklmn'])
    expect(textos('abcdefghijklmno', 'Lyrics', 14)).toEqual(['abcdefghijklmn', '  o'])
  })

  it('3 colunas, o mínimo: a continuação tem 1 coluna útil, e toda palavra de 2 parte (R1, R3)', () => {
    expect(textos('abcd', 'Lyrics', 3)).toEqual(['abc', '  d'])
    expect(textos('ab cd ef', 'Lyrics', 3)).toEqual(['ab', '  c', '  d', '  e', '  f'])
  })

  it('o acento combinante não se separa da letra quando a palavra parte (QL-D24: ele conta 0 e pertence à letra)', () => {
    const r = quebrar('abcdéfgh', 'Lyrics', 5)
    expect(invariancia('abcdéfgh', r)).toBeNull()
    expect(r.map((l) => l.texto)).toEqual(['abcdé', '  fgh'])
    expect(r[0]!.fim).toBe(6)
  })

  it('o emoji (par substituto) conta 1 e não se parte (contrato: todo outro caractere conta 1)', () => {
    expect(textos('ab\u{1F600}cd', 'Lyrics', 3)).toEqual(['ab\u{1F600}', '  c', '  d'])
  })

  it('o \\r fora do fim da linha conta 1 (QL-D24: só o do fim conta 0)', () => {
    expect(textos('abc\rdefghijk', 'Lyrics', 11)).toEqual(['abc\rdefghij', '  k'])
  })

  it('a linha de acordes sem letra embaixo não tem par e quebra como letra (R4: o par é com a linha de baixo)', () => {
    expect(textos('Am  F  C  G  Am  F  C  G\n\nLetra', 'Chords', 14)).toEqual(['Am  F  C  G', '  Am  F  C  G', '', 'Letra'])
    expect(textos('Eu vou\nAm  F  C  G  Am  F  C', 'Chords', 14)).toEqual(['Eu vou', 'Am  F  C  G', '  Am  F  C'])
  })

  it('duas linhas de acordes seguidas: a primeira quebra como letra, a segunda faz par com a letra (R4)', () => {
    expect(textos('Am  F\nC  G\nEu vou cantar a canção', 'Chords', 14)).toEqual(['Am  F', 'C  G', 'Eu vou cantar', '  a canção'])
  })

  it('a letra mais curta que os acordes: depois que ela acaba, o resto dos acordes segue sozinho (R2, R3)', () => {
    expect(textos('Am      F      C      G\nEu vou', 'Chords', 14)).toEqual(['Am      F', 'Eu vou', '  C      G'])
  })
})

describe('as bordas DECIDIDAS no aval da PR-2 — QL-D43…QL-D47 (QL-PR2-anexos §11)', () => {
  it('QL-D43 (Q1) — colunas fora do domínio do contrato (inteiro > 2): RangeError, em todo tipo; a proteção é da tela', () => {
    for (const c of [2, 1, 0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      for (const tipo of ['Lyrics', 'Chords', 'Tab']) expect(() => quebrar('a', tipo, c), `${tipo} ${c}`).toThrow(RangeError)
    }
  })

  it('QL-D44 (Q2a) — a linha de acordes que começa depois da coluna: o primeiro pedaço de acordes, vazio, ocupa linha ("")', () => {
    const t = ' '.repeat(20) + 'C\nEu vou cantar a canção de exemplo'
    expect(textos(t, 'Chords', 14)).toEqual(['', 'Eu vou cantar', '        C', '  a canção de', '  exemplo'])
  })

  it('QL-D44 (Q2b) — no par, o pedaço de letra só de espaço numa continuação não ocupa linha', () => {
    const t = 'C  D  E  F  G  A  B  C  D  E  F  G\nEu' + ' '.repeat(30) + 'sim'
    expect(textos(t, 'Chords', 14)).toEqual(['C  D  E  F  G', 'Eu', '  A  B  C  D', '  E  F  G', '       sim'])
  })

  it('QL-D44 (Q2c) — o recuo do autor maior que a coluna: uma linha vazia, e a palavra na continuação', () => {
    expect(textos(' '.repeat(20) + 'palavra', 'Lyrics', 14)).toEqual(['', '  palavra'])
  })

  it('QL-D45 (Q3a) — no par, o acorde maior que a coluna não parte: o pedaço passa da coluna até o fim dele', () => {
    expect(textos('F#m7(11)/G#\nCada janela acesa', 'Chords', 8)).toEqual(['F#m7(11)/G#', 'Cada janela', '  acesa'])
  })

  // QL-D45 (Q3b): o teste provisório da PR-2 fixava o acorde PARTINDO fora do par (R1: `F#m7(11)` · `  /G#`). O aval o
  // recusou — a R2 se estende à linha de acordes sozinha: o acorde nunca parte. O provisório saiu; este o substitui.
  it('QL-D45 (Q3b) — fora do par (a linha de acordes sozinha, na Cifra), o acorde maior que a coluna fica inteiro', () => {
    expect(textos('F#m7(11)/G#', 'Chords', 8)).toEqual(['F#m7(11)/G#'])
    expect(textos('F#m7(11)/G#  Am', 'Chords', 8)).toEqual(['F#m7(11)/G#', '  Am'])
    expect(textos('Am  F#m7(11)/G#', 'Chords', 8)).toEqual(['Am', '  F#m7(11)/G#'])
    expect(textos('F#m7(11)/G#\n\nCada janela', 'Chords', 8)).toEqual(['F#m7(11)/G#', '', 'Cada', '  janela'])
  })

  it('QL-D45 — na Letra a linha de acordes quebra como letra (QL-D22): o acorde maior que a coluna parte (R1)', () => {
    expect(textos('F#m7(11)/G#', 'Lyrics', 8)).toEqual(['F#m7(11)', '  /G#'])
  })

  it('QL-D45 (Q3c) — o \\t mais largo que a coluna fica sozinho numa linha (para a função andar)', () => {
    expect(textos('abc\tdef', 'Lyrics', 4)).toEqual(['abc', '  \t', '  de', '  f'])
  })

  it('QL-D46 (Q4) — o \\r do fim não impede a linha de acordes (o texto colado com CRLF forma par)', () => {
    expect(ehLinhaDeAcordes('Am            F\r')).toBe(true)
    expect(textos('Am            F\r\nEu vou cantar a canção\r', 'Chords', 14)).toEqual(['Am', 'Eu vou cantar', '  F\r', '  a canção\r'])
  })

  it('QL-D47 (Q5) — o \\t da continuação conta a partir da coluna desenhada (o recuo de 2)', () => {
    // contado da linha lógica, o `ij\tk` ocuparia 10 colunas e não caberia em 9; desenhado, ocupa 9
    expect(textos('abcdefgh ij\tk', 'Lyrics', 9)).toEqual(['abcdefgh', '  ij\tk'])
  })
})

describe('a varredura — a invariância em 3…90 colunas e a largura dentro da coluna', () => {
  const LETRA = [
    'Acendi a lanterna do quintal e',
    'Quando a maré da fixture sobe devagar pelo cais lá',
    'o vento assobia baixinho',
    '',
    'Cada passo que eu dou na areia fria deixa um rastro de sal e',
    'e a cidade inteira dorme enquanto o barco da fixture segue sem pressa pro mar',
    'ô ô ô',
  ].join('\n')
  const CIFRA = [
    'Intro: Am  E',
    '',
    'Am            F              C',
    'Dobrei a esquina da fixture, e',
    'Am                    F#m7(11)        G          C',
    'Cada janela acesa conta uma história de quem passa',
    '',
    'Refrão',
    'Am  F  C  G',
    'E a noite inteira cabe numa canção de exemplo',
  ].join('\n')
  const BORDAS = [
    ' '.repeat(20) + 'C\nEu vou cantar a canção de exemplo',
    'C  D  E  F  G  A  B  C  D  E  F  G\nEu' + ' '.repeat(30) + 'sim',
    'Am      F      C      G\nEu vou',
    '    abc def' + ' '.repeat(12) + '\n' + ' '.repeat(40),
  ].join('\n\n')
  const TEXTOS: [string, string][] = [
    ['Lyrics', LETRA],
    ['Chords', CIFRA],
    ['Lyrics', CIFRA],
    ['Chords', BORDAS],
    ['Lyrics', BORDAS],
    ['Tab', 'e|-----0-----0---|\nB|---1---1-----1-|'],
  ]

  // QL-D45: a linha de acordes sozinha com um acorde de 11 colunas — passa da coluna abaixo de 11, de propósito; por
  // isso entra só na invariância, não na conferência da largura
  const ACORDE_LONGO: [string, string][] = [['Chords', 'F#m7(11)/G#  Am  F\n\nAm  F#m7(11)/G#\nCada janela acesa']]

  it('a invariância vale em todo número de colunas de 3 a 90', () => {
    let rodadas = 0
    for (const [tipo, t] of [...TEXTOS, ...ACORDE_LONGO]) {
      for (let c = 3; c <= 90; c++) {
        expect(invariancia(t, quebrar(t, tipo, c)), `${tipo} em ${c}`).toBeNull()
        rodadas++
      }
    }
    expect(rodadas).toBe((TEXTOS.length + ACORDE_LONGO.length) * 88)
  })

  it('toda linha visual cabe na coluna, de 10 colunas em diante (a Tab fora: ela não quebra)', () => {
    for (const [tipo, t] of TEXTOS) {
      if (tipo === 'Tab') continue
      for (let c = 10; c <= 90; c++) {
        for (const l of quebrar(t, tipo, c)) expect([...l.texto].length, `${tipo} em ${c}: ${JSON.stringify(l.texto)}`).toBeLessThanOrEqual(c)
      }
    }
  })

  it('a Tab sai igual ao texto, linha a linha, em todo número de colunas', () => {
    const tab = TEXTOS.find(([tipo]) => tipo === 'Tab')![1]
    for (let c = 3; c <= 90; c++) expect(quebrar(tab, 'Tab', c).map((l) => l.texto)).toEqual(tab.split('\n'))
  })
})

/**
 * QL-PR3 — a LARGURA DESENHADA de uma linha visual, em colunas (`colunasDesenhadas`). O leitor (`Leitor.tsx`) a usa para
 * achar a linha que passa da coluna — a exceção da QL-D45, que rola para o lado só nessa linha. É a medida do QL-D24, a
 * mesma com que `quebrar` corta: o `\t` até a próxima múltipla de 8 contada da coluna DESENHADA (o recuo é texto da
 * linha visual, QL-D47), o `\r` do fim e o acento combinante contam 0, o resto conta 1 (ponto de código).
 */
describe('QL-PR3 — colunasDesenhadas: a largura de uma linha visual, a medida do QL-D24', () => {
  it('conta pontos de código, o \t até a múltipla de 8, o \r do fim e o acento combinante como 0', () => {
    expect(colunasDesenhadas('')).toBe(0)
    expect(colunasDesenhadas('abc')).toBe(3)
    expect(colunasDesenhadas('ab\tcd')).toBe(10)
    expect(colunasDesenhadas('  ij\tk')).toBe(9)
    expect(colunasDesenhadas('abc\r')).toBe(3)
    expect(colunasDesenhadas('abc\rd')).toBe(5)
    expect(colunasDesenhadas('cafe\u0301')).toBe(4)
    expect(colunasDesenhadas('ab😀')).toBe(3)
  })

  it('toda linha visual de quebrar cabe na coluna por esta medida, com \\t e acento — e a do acorde maior que ela passa (QL-D45)', () => {
    const letra = 'ab\tcd ef gh ij kl mn op\ncafe\u0301 cafe\u0301 cafe\u0301 cafe\u0301\n  ij\tk lm no pq rs'
    for (let c = 8; c <= 26; c++) {
      for (const l of quebrar(letra, 'Lyrics', c)) expect(colunasDesenhadas(l.texto), `${c}: ${JSON.stringify(l.texto)}`).toBeLessThanOrEqual(c)
    }
    // a linha de acordes sozinha (seguida de linha vazia), com o acorde de 11 colunas em 8: ele fica inteiro e passa
    const [primeira, ...resto] = quebrar('F#m7(11)/G#  Am\n', 'Chords', 8)
    expect(primeira?.texto).toBe('F#m7(11)/G#')
    expect(colunasDesenhadas(primeira!.texto)).toBe(11)
    for (const l of resto) expect(colunasDesenhadas(l.texto)).toBeLessThanOrEqual(8)
  })
})
