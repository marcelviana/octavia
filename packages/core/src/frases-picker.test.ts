/**
 * N2-PR6 — as redações do picker (N2-E15, N2-E16). Arquivo próprio, e não
 * mais um `describe` no `frases.test.ts`, porque acrescentar ao `import` de lá
 * é EDITAR uma linha de teste do core, e o G1b só aceita adição.
 */
import { describe, expect, it } from 'vitest'
import {
  CHAVES,
  FRASES,
  TETO_DO_NOME_NO_PICKER,
  adicionadasNestaVisita,
  jaNaSetlist,
  musicasDisponiveis,
  nMusicas,
  placeholderDoPicker,
  reguaBiblioteca,
  reguaNestaSetlist,
  vazioDoPicker,
} from './frases'

describe('N2-E16 — as duas chaves do picker, verbatim das molduras', () => {
  it('"não entrou na setlist" e "adicionada"', () => {
    expect(FRASES['falhou-adicionar']).toBe('não entrou na setlist')
    expect(FRASES.adicionada).toBe('adicionada')
    expect(CHAVES.has('falhou-adicionar')).toBe(true)
    expect(CHAVES.has('adicionada')).toBe(true)
  })
})

describe('N2-E15 / R1·5 — o placeholder, com a reticência acima de 34 caracteres', () => {
  it('o teto é 34', () => {
    expect(TETO_DO_NOME_NO_PICKER).toBe(34)
  })

  it('34 cabem inteiros; 35 viram 34 e a reticência', () => {
    const n34 = 'a'.repeat(34)
    expect(placeholderDoPicker(n34)).toBe(`Adicionar a ${n34}`)
    expect(placeholderDoPicker(`${n34}b`)).toBe(`Adicionar a ${n34}…`)
    expect(placeholderDoPicker('Season 3')).toBe('Adicionar a Season 3')
  })

  it('conta pontos de código: um emoji na fronteira não é partido ao meio', () => {
    const nome = `${'a'.repeat(33)}🎸🎸`
    const p = placeholderDoPicker(nome)
    expect(p).toBe(`Adicionar a ${'a'.repeat(33)}🎸…`)
    expect(p).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/)
  })
})

describe('as redações com dado do §5', () => {
  it('o vazio, em três pedaços, e a biblioteca disponível', () => {
    const v = vazioDoPicker('Season 3')
    expect(`${v.antes}${v.nome}${v.depois}`).toBe('Digite para achar na biblioteca e adicionar a Season 3.')
    expect(musicasDisponiveis(63)).toBe('63 músicas disponíveis.')
    expect(musicasDisponiveis(1)).toBe('1 música disponível.')
  })

  it('as réguas do S4 e o total', () => {
    expect(reguaNestaSetlist('Season 3')).toBe('Nesta setlist · Season 3')
    expect(reguaBiblioteca(63)).toBe('Biblioteca · 63 músicas')
    expect(nMusicas(1)).toBe('1 música')
    expect(nMusicas(8)).toBe('8 músicas')
  })

  it('a marca: sem "×" com uma posição, "n×" com bis', () => {
    expect(jaNaSetlist(1)).toBe('já na setlist')
    expect(jaNaSetlist(2)).toBe('já na setlist · 2×')
    expect(jaNaSetlist(3)).toBe('já na setlist · 3×')
  })

  it('o "nesta visita": nada · 1 adicionada · n adicionadas', () => {
    expect(adicionadasNestaVisita(0)).toBe('nada adicionado nesta visita')
    expect(adicionadasNestaVisita(1)).toBe('1 adicionada nesta visita')
    expect(adicionadasNestaVisita(2)).toBe('2 adicionadas nesta visita')
  })
})
