import { describe, it, expect } from 'vitest'
import { isValidContent, bodyOf } from './content-contract'

/**
 * N1-PR2a — uma linha por caso da tabela do PRD §4 / T1-R7 (aceite A6), na
 * versão pós-errata N1-PR1. Os estados "objeto sem a chave" existem nos dados
 * (2 Chords no anexo D5 do B7, fora da conta principal); os demais são o
 * inventário medido em `N1-PRECHECK.md` A3.
 */
describe('isValidContent (T1-R7 (a)–(d))', () => {
  it('Lyrics com lyrics string → ok/text', () => {
    expect(isValidContent('Lyrics', { lyrics: 'É pedra, é ponte' }, null)).toEqual({
      ok: true,
      body: 'text',
    })
  })

  it('Lyrics com objeto sem lyrics → no-key (regra c)', () => {
    expect(isValidContent('Lyrics', { annotations: [] }, null)).toEqual({
      ok: false,
      reason: 'no-key',
    })
  })

  it('Lyrics com lyrics não-string → not-string (regra c)', () => {
    expect(isValidContent('Lyrics', { lyrics: 42 }, null)).toEqual({
      ok: false,
      reason: 'not-string',
    })
  })

  it('Chords com chords string → ok/text', () => {
    expect(isValidContent('Chords', { chords: '[Intro] C7M Dm7' }, null)).toEqual({
      ok: true,
      body: 'text',
    })
  })

  it('Chords com content_data null e file_url → ok/file (cifra escaneada)', () => {
    expect(isValidContent('Chords', null, 'https://host/content-files/1-cifra.pdf')).toEqual({
      ok: true,
      body: 'file',
    })
  })

  it('Chords com content_data null e sem file_url → no-body (regra b)', () => {
    expect(isValidContent('Chords', null, null)).toEqual({ ok: false, reason: 'no-body' })
  })

  it('Chords com objeto sem chords → no-key (os 2 registros do anexo D5)', () => {
    expect(isValidContent('Chords', { sections: [], capo: 2 }, null)).toEqual({
      ok: false,
      reason: 'no-key',
    })
  })

  it('Chords poluído pelo editor do web mas com chords → ok/text (regra a)', () => {
    const poluido = {
      chords: '[Intro] C7M',
      content_data: { chords: '[Intro] C7M' },
      user_id: 'x',
      is_favorite: false,
    }
    expect(isValidContent('Chords', poluido, null)).toEqual({ ok: true, body: 'text' })
  })

  it('Tab com tablature string → ok/text', () => {
    expect(isValidContent('Tab', { tablature: 'e|-----0-----|' }, null)).toEqual({
      ok: true,
      body: 'text',
    })
  })

  it('Tab com objeto sem tablature → no-key', () => {
    expect(isValidContent('Tab', { tuning: 'EADGBE' }, null)).toEqual({
      ok: false,
      reason: 'no-key',
    })
  })

  it('Sheet com file_url é ok/file com content_data null, {file} ou {annotations} (D5b)', () => {
    const url = 'https://host/content-files/1-partitura-12p.pdf'
    const esperado = { ok: true, body: 'file' }
    expect(isValidContent('Sheet', null, url)).toEqual(esperado)
    expect(isValidContent('Sheet', { file: { name: 'x.pdf' } }, url)).toEqual(esperado)
    expect(isValidContent('Sheet', { annotations: [] }, url)).toEqual(esperado)
  })

  it('Sheet sem file_url → no-body', () => {
    expect(isValidContent('Sheet', null, null)).toEqual({ ok: false, reason: 'no-body' })
  })

  it('content_type fora do enum → unknown-type (regra d)', () => {
    expect(isValidContent('Piano', { lyrics: 'x' }, null)).toEqual({
      ok: false,
      reason: 'unknown-type',
    })
  })
})

describe('bodyOf (T1-R7)', () => {
  it('devolve a string da chave de cada tipo', () => {
    expect(bodyOf('Lyrics', { lyrics: 'a' })).toBe('a')
    expect(bodyOf('Chords', { chords: 'b' })).toBe('b')
    expect(bodyOf('Tab', { tablature: 'c' })).toBe('c')
  })

  it('Sheet, content_data null, chave ausente, não-string ou tipo desconhecido → null', () => {
    expect(bodyOf('Sheet', { file: {} })).toBeNull()
    expect(bodyOf('Lyrics', null)).toBeNull()
    expect(bodyOf('Lyrics', { annotations: [] })).toBeNull()
    expect(bodyOf('Lyrics', { lyrics: 42 })).toBeNull()
    expect(bodyOf('Piano', { lyrics: 'a' })).toBeNull()
  })
})

/**
 * N4-PR2 — o contrato lê `sections[]` da Cifra (N4-D40), com a precedência, a
 * ordem, a junção e as partes puladas do leitor do web
 * (`components/content/corpo-de-texto.ts`, `textoDaCifra`, `:47-56`):
 * `sections` como lista NÃO vazia vence o `chords` do topo; cada seção é
 * `name` · `chords` · `lyrics` (só os textos não vazios) por `"\n"`; as seções
 * com texto, por `"\n\n"`. Lista vazia ou não-lista → o `chords` do topo, como
 * antes. Texto fabricado pelo projeto.
 */
describe('N4-PR2 — sections[] da Cifra (N4-D40)', () => {
  const VELHO = 'C  Am\nTexto velho do topo'

  it('seções com acordes vazios e letra: o nome e a letra, sem a linha de acordes', () => {
    const d = {
      chords: VELHO,
      sections: [{ id: 1, name: 'Content', chords: '', lyrics: 'Linha um\nLinha dois' }],
    }
    expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
    expect(bodyOf('Chords', d)).toBe('Content\nLinha um\nLinha dois')
  })

  it('seções completas: nome · acordes · letra por "\\n"; as seções por "\\n\\n", na ordem da lista', () => {
    const d = {
      chords: VELHO,
      sections: [
        { name: 'Verso 1', chords: 'G D Em', lyrics: 'Texto do verso' },
        { name: 'Refrão', chords: 'C G', lyrics: 'Texto do refrão' },
      ],
    }
    expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
    expect(bodyOf('Chords', d)).toBe('Verso 1\nG D Em\nTexto do verso\n\nRefrão\nC G\nTexto do refrão')
  })

  it('lista de seções vazia: cai no chords do topo (o web faz o mesmo)', () => {
    const d = { chords: VELHO, sections: [] }
    expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
    expect(bodyOf('Chords', d)).toBe(VELHO)
  })

  it('seções sem chords no topo: deixa de ser no-key', () => {
    const d = { sections: [{ name: 'Verso', chords: 'D A', lyrics: 'Texto' }], annotations: [] }
    expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
    expect(bodyOf('Chords', d)).toBe('Verso\nD A\nTexto')
  })

  it('seções e file_url: o corpo é o texto das seções (o painel da Cifra do web não mostra arquivo)', () => {
    const d = { sections: [{ name: 'Verso', lyrics: 'Texto' }] }
    expect(isValidContent('Chords', d, 'https://host/content-files/1-cifra.pdf')).toEqual({ ok: true, body: 'text' })
    expect(bodyOf('Chords', d)).toBe('Verso\nTexto')
  })

  it('seções vencem também o chords do topo em lista', () => {
    const d = { chords: [{ name: 'C' }], sections: [{ name: 'Verso', lyrics: 'Texto' }] }
    expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
    expect(bodyOf('Chords', d)).toBe('Verso\nTexto')
  })

  it('a progression continua fora do contrato (fora do par, Bloco D): só as seções', () => {
    const d = { sections: [{ name: 'Verso', lyrics: 'Texto' }], progression: { Verso: ['C', 'G'] } }
    expect(bodyOf('Chords', d)).toBe('Verso\nTexto')
  })

  describe('malformadas — nunca lança; faz o que o web faz', () => {
    it('sections que não é lista (objeto, texto, número, null): cai no chords do topo', () => {
      for (const sections of [{ name: 'X', lyrics: 'y' }, 'texto', 7, null]) {
        const d = { chords: VELHO, sections }
        expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
        expect(bodyOf('Chords', d)).toBe(VELHO)
      }
    })

    it('sections que não é lista e sem chords no topo: no-key, como antes', () => {
      expect(isValidContent('Chords', { sections: { name: 'X' } }, null)).toEqual({ ok: false, reason: 'no-key' })
      expect(bodyOf('Chords', { sections: 'texto' })).toBeNull()
    })

    it('item que não é objeto (null, texto, número, lista): pulado', () => {
      const d = { chords: VELHO, sections: [null, 'solta', 42, ['a'], { name: 'Verso', lyrics: 'Texto' }] }
      expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
      expect(bodyOf('Chords', d)).toBe('Verso\nTexto')
    })

    it('campo que não é texto (número, lista, objeto) ou texto vazio: a parte é pulada', () => {
      const d = { sections: [{ name: 7, chords: ['C', 'G'], lyrics: 'Texto' }, { name: '', chords: { a: 1 }, lyrics: 'Outro' }] }
      expect(isValidContent('Chords', d, null)).toEqual({ ok: true, body: 'text' })
      expect(bodyOf('Chords', d)).toBe('Texto\n\nOutro')
    })

    it('lista não vazia sem nenhuma parte com texto: sem corpo — o web mostra o vazio e NÃO cai no chords do topo', () => {
      const d = { chords: VELHO, sections: [{ name: '', chords: '', lyrics: '' }, null] }
      expect(isValidContent('Chords', d, null)).toEqual({ ok: false, reason: 'no-body' })
      expect(bodyOf('Chords', d)).toBeNull()
    })
  })

  describe('o que não muda', () => {
    it('a Cifra escaneada (content_data null + file_url) segue arquivo', () => {
      expect(isValidContent('Chords', null, 'https://host/content-files/1-cifra.pdf')).toEqual({ ok: true, body: 'file' })
      expect(bodyOf('Chords', null)).toBeNull()
    })

    it('Letra e Tab com uma chave sections: a chave do tipo, como antes', () => {
      const secoes = [{ name: 'Verso', chords: 'C', lyrics: 'Texto da seção' }]
      expect(isValidContent('Lyrics', { lyrics: 'Letra', sections: secoes }, null)).toEqual({ ok: true, body: 'text' })
      expect(bodyOf('Lyrics', { lyrics: 'Letra', sections: secoes })).toBe('Letra')
      expect(isValidContent('Tab', { tablature: 'e|---0', sections: secoes }, null)).toEqual({ ok: true, body: 'text' })
      expect(bodyOf('Tab', { tablature: 'e|---0', sections: secoes })).toBe('e|---0')
      expect(isValidContent('Lyrics', { sections: secoes }, null)).toEqual({ ok: false, reason: 'no-key' })
      expect(bodyOf('Lyrics', { sections: secoes })).toBeNull()
    })

    it('Partitura e tipo fora do enum com sections: como antes', () => {
      const secoes = [{ name: 'Verso', lyrics: 'Texto' }]
      expect(isValidContent('Sheet', { sections: secoes }, null)).toEqual({ ok: false, reason: 'no-body' })
      expect(bodyOf('Sheet', { sections: secoes })).toBeNull()
      expect(isValidContent('Piano', { sections: secoes }, null)).toEqual({ ok: false, reason: 'unknown-type' })
      expect(bodyOf('Piano', { sections: secoes })).toBeNull()
    })
  })
})
