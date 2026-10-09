/**
 * O comparador do TEXTO LÓGICO (`apps/native/scripts/texto-logico.mjs`) — bloco QL, PR-1 (QL-D16; A-QL-5). É ele que
 * os três instrumentos que leem o nó `corpo` usam (o G-par de V, o (e) do G-N3, o `corpo-logico.mjs`), então a prova
 * de que ele DISTINGUE mora aqui, sem aparelho:
 *
 *   - CP: a saída esperada de TODO caso do gate da quebra (`packages/core/fixtures/ql-quebra.json`, as molduras da folha
 *     e os derivados) é uma quebra do texto do caso, com o número de continuações que a moldura mostra; e o texto sem
 *     quebra (o desenho de hoje) é ele mesmo, com 0;
 *   - CN: cada quebra que MUDA O TEXTO é recusada — uma letra trocada, uma palavra a menos, um caractere a mais, duas
 *     linhas fora de ordem, uma linha visual a menos, e o acorde fora da sílaba (o pedaço de acordes deslocado de 1).
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ehQuebraDe } from '../scripts/texto-logico.mjs'

const fx = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../packages/core/fixtures/ql-quebra.json'), 'utf8')) as {
  textos: Record<string, string>
  casos: { id: string; texto: string; esperado: string[] }[]
}
const caso = (id: string): { texto: string; esperado: string[] } => {
  const c = fx.casos.find((x) => x.id === id)!
  return { texto: fx.textos[c.texto]!, esperado: c.esperado }
}

describe('texto lógico (QL-PR1) — o desenho vale como o texto quando é uma quebra dele', () => {
  it('CP: toda saída esperada do gate da quebra é quebra do seu texto; o desenho sem quebra é o próprio texto', () => {
    const out: string[] = []
    for (const c of fx.casos) {
      const texto = fx.textos[c.texto]!
      const r = ehQuebraDe(c.esperado, texto)
      out.push(`  ${r.ok ? '✓' : '✗'} ${c.id.padEnd(20)} ${c.esperado.length} desenhadas · ${r.linhasLogicas} lógicas · ${r.continuacoes} continuações`)
      expect(r.ok, `${c.id}: ${r.motivo}`).toBe(true)
      const hoje = ehQuebraDe(texto.split('\n'), texto)
      expect([hoje.ok, hoje.continuacoes], `${c.id}: o desenho de hoje`).toEqual([true, 0])
    }
    console.log([`texto lógico — CP sobre ${fx.casos.length} casos`, ...out].join('\n'))
    // as continuações que as molduras mostram: a Letra em 26 (15 linhas visuais de 7) e a Cifra em 26 e em 14
    expect(ehQuebraDe(caso('letra-26').esperado, caso('letra-26').texto).continuacoes).toBe(8)
    expect(ehQuebraDe(caso('cifra-26').esperado, caso('cifra-26').texto).continuacoes).toBe(7)
    expect(ehQuebraDe(caso('cifra-14').esperado, caso('cifra-14').texto).continuacoes).toBe(15)
  })

  it('CN: a quebra que muda o texto é recusada', () => {
    const { texto: letra, esperado: l26 } = caso('letra-26')
    const { texto: cifra, esperado: c26 } = caso('cifra-26')
    const trocar = (xs: string[], i: number, y: string): string[] => xs.map((x, k) => (k === i ? y : x))
    const cns: [string, string[], string][] = [
      ['uma letra trocada (lanterna → lanterma)', trocar(l26, 0, 'Acendi a lanterma do'), letra],
      ['uma palavra a menos (a continuação sem "quintal")', trocar(l26, 1, '  e'), letra],
      ['um caractere a mais no fim de um pedaço', trocar(l26, 0, 'Acendi a lanterna do!'), letra],
      ['duas linhas fora de ordem', [l26[1]!, l26[0]!, ...l26.slice(2)], letra],
      ['uma linha visual a menos (o "  pro mar")', l26.filter((x) => x !== '  pro mar'), letra],
      ['o acorde fora da sílaba (o F#m7(11) uma coluna à direita)', c26.map((x) => (x === '      F#m7(11)        G' ? '       F#m7(11)        G' : x)), cifra],
      ['o pedaço de acordes depois da letra (o par invertido)', c26.map((x, k) => (x === '  fixture, e' ? c26[k - 1]! : x === '           C' && c26[k + 1] === '  fixture, e' ? '  fixture, e' : x)), cifra],
    ]
    const out: string[] = []
    for (const [nome, desenho, texto] of cns) {
      const r = ehQuebraDe(desenho, texto)
      out.push(`  ${r.ok ? '✗ ACEITOU' : '✓ recusou'}  ${nome}`)
      expect(r.ok, `CN aceito: ${nome}`).toBe(false)
    }
    console.log([`texto lógico — ${cns.length} CN`, ...out].join('\n'))
  })
})
