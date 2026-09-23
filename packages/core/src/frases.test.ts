/**
 * O CONJUNTO FECHADO de frases da tela 2 (T2-R15 ∪ as fixas do desenho).
 *
 * É o padrão do `fraseDaFalha()` da W2, levado adiante: **o que fecha o
 * conjunto é a omissão** — quem não tem frase declarada cai na genérica. A
 * diferença para lá é que aqui o conjunto também cobre o que NÃO é falha (as
 * frases de progresso, de aviso e de validação), porque a folha congelada as
 * fixou e nenhuma tela pode inventar outra redação.
 */
import { describe, expect, it } from 'vitest'
import { classificar, type Op } from './escrita'
// N2-E19: o barrado (a escrita que nem saiu) também pertence ao conjunto.
import { classificarBarrado } from './escrita'
import { CHAVES, FRASES, frase, type ChaveDeFrase } from './frases'

describe('o conjunto é fechado', () => {
  it('CHAVES e FRASES têm exatamente as mesmas chaves', () => {
    expect([...CHAVES].sort()).toEqual(Object.keys(FRASES).sort())
  })

  it('nenhuma frase é vazia e nenhuma está em inglês (A20)', () => {
    for (const chave of CHAVES) {
      const texto = FRASES[chave]
      expect(texto.length).toBeGreaterThan(0)
      expect(texto).not.toMatch(/\b(loading|error|failed|retry|save|delete|not found|unknown)\b/i)
    }
  })

  it('nenhuma frase traz nome de setlist, título de música ou uuid (T2-R15)', () => {
    for (const chave of CHAVES) {
      expect(FRASES[chave]).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i)
      // O único buraco de interpolação permitido é o prazo do limite de taxa.
      const buracos = FRASES[chave].match(/\{[^}]*\}/g) ?? []
      expect(buracos.every((b) => b === '{N}')).toBe(true)
    }
  })

  it('o {N} só existe na frase de limite com prazo (div. 225)', () => {
    const comBuraco = [...CHAVES].filter((c) => FRASES[c].includes('{N}'))
    expect(comBuraco).toEqual(['limite-com-prazo'])
  })

  it('frase() substitui o prazo e recusa o buraco vazio', () => {
    expect(frase('limite-com-prazo', 30)).toBe('muitas alterações seguidas — tente de novo em 30 s')
    expect(() => frase('limite-com-prazo')).toThrow()
  })
})

describe('as onze frases do T2-R15, verbatim', () => {
  const esperado: Array<[ChaveDeFrase, string]> = [
    // N2-E19 (div. 308): "nada foi salvo" é só de quem NÃO enviou (barrado
    // offline); quem enviou e ficou sem resposta não sabe se foi salvo.
    ['rede', 'sem conexão — nada foi salvo'],
    ['sem-resposta', 'sem resposta do servidor'],
    ['auth', 'não foi possível salvar — confira sua conta no site'],
    ['limite-com-prazo', 'muitas alterações seguidas — tente de novo em {N} s'],
    ['limite-sem-prazo', 'Muitas mudanças em pouco tempo. Os controles de escrita voltam em instantes.'],
    ['sumiu-setlist', 'esta setlist foi apagada em outro lugar'],
    ['sumiu-musica', 'esta música já não estava na setlist'],
    ['ordem-mudou', 'a setlist mudou — a ordem foi recarregada'],
    ['nome-recusado', 'o nome tem um trecho que o servidor não aceita'],
    ['dados-recusados', 'o servidor recusou os dados'],
    ['servidor', 'falha no servidor — nada foi alterado aqui'],
    ['generica', 'não foi possível salvar'],
  ]
  for (const [chave, texto] of esperado) {
    it(`${chave}`, () => {
      expect(FRASES[chave]).toBe(texto)
    })
  }
})

describe('as fixas do desenho congelado (DESIGN-N2/telas.html)', () => {
  it('as três de validação, e só três', () => {
    expect(FRASES['nome-vazio']).toBe('a setlist precisa de um nome')
    expect(FRASES['data-impossivel']).toBe('essa data não existe')
    expect(FRASES['nada-mudou']).toBe('nada mudou desde que você abriu')
  })

  it('as de progresso, no presente e sem prometer "salvo" (regra 1 da folha)', () => {
    expect(FRASES['criando']).toBe('Criando no servidor…')
    expect(FRASES['salvando-ordem']).toBe('Salvando a ordem no servidor…')
    expect(FRASES['apagando']).toBe('Apagando no servidor…')
    for (const chave of ['criando', 'salvando-ordem', 'apagando'] as const) {
      expect(FRASES[chave]).not.toMatch(/salvo/i)
    }
  })

  it('salvo-não-relido em S1 guarda só a metade FIXA da frase da folha (div. 227)', () => {
    // A moldura nomeia a setlist ("Season 4 foi criada. …"); nome é dado, não
    // texto, e S1 monta a primeira oração. Aqui fica a segunda, verbatim.
    expect(FRASES['salvo-nao-relido-s1']).toBe(
      'Não foi possível recarregar a lista, então ela pode não aparecer abaixo ainda.',
    )
  })

  it('salvo-não-relido: nunca "salvo" limpo, nunca "falhou" (N2-D22)', () => {
    expect(FRASES['salvo-nao-relido-s2']).toBe(
      'Salvo. Não foi possível recarregar a setlist, então o que está na tela pode estar velho.',
    )
    expect(FRASES['salvo-nao-relido-picker']).toBe(
      'Salvo. Não foi possível recarregar a setlist, então a contagem abaixo pode estar velha.',
    )
  })

  it('404 declarado: a tela é abandonada e não há botão (R1·4)', () => {
    expect(FRASES['sumiu-declarado']).toBe(
      'Essa setlist não existe mais. A lista abaixo é a que o servidor tem agora.',
    )
  })

  it('sem conexão tem redação própria em S1 e em S2', () => {
    expect(FRASES['sem-rede-s1']).toBe(
      'Sem conexão: dá para abrir e tocar o que está no aparelho, não para criar setlist. O controle volta com a rede.',
    )
    expect(FRASES['sem-rede-s2']).toBe(
      'Sem conexão: dá para ler e tocar, não para mudar a setlist. Os controles de escrita voltam quando a rede voltar.',
    )
  })

  it('teto de 100 e o aviso de que pode ter gravado (N2-D17, N2-D18)', () => {
    expect(FRASES['teto-100']).toBe(
      'Acima de 100 músicas, reordenar por arrasto fica inativo. Adicionar e remover continuam.',
    )
    expect(FRASES['pode-ter-gravado']).toBe('pode já ter sido gravada — confira antes de repetir')
  })
})

describe('toda saída de classificar() pertence ao conjunto', () => {
  const OPS: Op[] = ['create', 'update', 'delete', 'add', 'remove', 'reorder']
  const CODES = [
    'AUTH_REQUIRED',
    'VALIDATION_ERROR',
    'NOT_FOUND',
    'RATE_LIMITED',
    'INTERNAL_ERROR',
    'CODIGO_QUE_NAO_EXISTE',
  ]
  const STATUS = [200, 201, 400, 401, 404, 405, 409, 418, 429, 500, 503]

  it('varredura de op × status × code × releitura', () => {
    const textos = new Set(Object.values(FRASES).map((t) => t.replace('{N}', '30')))
    let n = 0
    for (const op of OPS) {
      for (const status of STATUS) {
        for (const code of [...CODES, null]) {
          for (const releitura of ['ok', 'falhou', null] as const) {
            const bodyText = code === null ? 'nao e json' : JSON.stringify({ error: 'x', code, retryAfter: 30 })
            const r = classificar(op, { status, bodyText, headers: { 'Retry-After': '30' } }, releitura)
            expect(textos.has(r.frase)).toBe(true)
            expect(CHAVES.has(r.chave)).toBe(true)
            n++
          }
        }
      }
    }
    // E a rede, que não tem status.
    for (const op of OPS) {
      const r = classificar(op, { networkError: 'qualquer coisa' }, null)
      expect(textos.has(r.frase)).toBe(true)
      n++
    }
    expect(n).toBe(OPS.length * STATUS.length * (CODES.length + 1) * 3 + OPS.length)
  })

  it('N2-E19 — e o barrado (a escrita que nem saiu) também pertence ao conjunto', () => {
    const textos = new Set(Object.values(FRASES))
    let n = 0
    for (const op of OPS) {
      for (const motivo of ['offline', 'ratelimit', 'busy'] as const) {
        const r = classificarBarrado(op, motivo)
        expect(textos.has(r.frase)).toBe(true)
        expect(CHAVES.has(r.chave)).toBe(true)
        n++
      }
    }
    expect(n).toBe(OPS.length * 3)
  })
})

describe('N2-E21 — `sumiu-nao-relido`: duas orações de origem, cortadas na fronteira', () => {
  it('cada oração é prefixo literal da frase de onde veio (sem o ponto final do corte)', () => {
    const [primeira = '', segunda = ''] = FRASES['sumiu-nao-relido'].split(/(?<=\.) /)
    expect(primeira).toBe('Essa setlist não existe mais.')
    expect(segunda).toBe('Não foi possível recarregar a lista.')
    expect(FRASES['sumiu-declarado'].startsWith(primeira)).toBe(true)
    expect(FRASES['salvo-nao-relido-s1'].startsWith(segunda.slice(0, -1))).toBe(true)
    // E NADA além das duas: a segunda oração de cada origem ficou de fora.
    expect(FRASES['sumiu-nao-relido']).toBe(`${primeira} ${segunda}`)
  })
})
