/**
 * **A frase que chega à tela do músico é de um conjunto FECHADO.** W2, div.
 * 125 e 131.
 *
 * Por que isto é TESTE e não gate: o `gate:a20` acusa LITERAL em posição de
 * texto, e o que vazava para o palco não era literal em lugar nenhum — era
 * valor de tempo de execução, vindo da biblioteca
 * (`Call to function 'FileSystemDownloadTask.start' has been rejected.`).
 * **Nenhum escopo do a20 o alcança**: nem `src`, nem `apps/native` inteiro.
 * O gate tem escopo menor do que o ACEITE A20 que ele carimba — div. 130, e é
 * o padrão do `LOGS-OCTAVIA.md` num lugar novo. Quem alcança é isto.
 *
 * E a lista de frases está escrita AQUI, não importada do `files.ts`: um teste
 * que importasse a lista da fonte passaria a aprovar qualquer frase que alguém
 * acrescentasse lá. A lista é a afirmação; a fonte é o que se mede contra ela.
 *
 * Roda no projeto `native` do Vitest — ou seja, **roda no CI, em toda PR**,
 * que é o que o W1 abriu (div. 129: os cinco gates de script não rodam lá).
 */
import { describe, expect, it } from 'vitest'
import { FALHA_GENERICA, falha, fraseDaFalha } from '../src/files'

const NOME = '1751910900697-Easy_-_Guitar.pdf'

/**
 * O CONJUNTO FECHADO — as frases que podem chegar ao `testID` download-erro.
 * Duas são padrões porque carregam número; o resto é literal.
 */
const FRASES = [
  'não consegui baixar',
  'o arquivo chegou vazio',
  'o arquivo chegou corrompido',
]
const PADROES = [/^arquivo incompleto: \d+ de (\d+|\?) bytes$/, /^o servidor respondeu \d{3}$/]

function estaNoConjunto(frase: string): boolean {
  return FRASES.includes(frase) || PADROES.some((re) => re.test(frase))
}

/** O que a biblioteca realmente lançou, medido no aparelho pelo W1, e vizinhos. */
const CRUAS = [
  "Call to function 'FileSystemDownloadTask.start' has been rejected.",
  'Unable to download file from https://xyz.supabase.co/storage/v1/object/sign/content-files/a.pdf. Response status: 404',
  'Unable to download file from https://xyz.supabase.co/a.pdf',
  'ENOENT: no such file or directory',
  'Network request failed',
  'The operation couldn’t be completed. (NSURLErrorDomain error -1009.)',
  'pausado',
  '',
]

describe('a frase que o músico lê (div. 125)', () => {
  it('nenhuma mensagem crua de biblioteca chega à tela', () => {
    for (const bruta of CRUAS) {
      const frase = fraseDaFalha(falha(new Error(bruta), NOME))
      expect(estaNoConjunto(frase), `${JSON.stringify(bruta)} → ${JSON.stringify(frase)}`).toBe(true)
    }
  })

  it('o nome do objeto do bucket NÃO vai para a tela — vai para o log', () => {
    const e = falha(new Error("Call to function 'x' has been rejected."), NOME)
    expect(fraseDaFalha(e)).toBe(FALHA_GENERICA)
    expect(fraseDaFalha(e)).not.toContain(NOME)
    // e o log continua diagnosticável, com o nome e a causa
    expect(e.message).toContain(NOME)
    expect(e.message).toContain('has been rejected')
  })

  it('o `status: NNN` continua traduzido, e sem a URL', () => {
    const e = falha(
      new Error('Unable to download file from https://xyz.supabase.co/a.pdf. Response status: 404'),
      NOME,
    )
    expect(fraseDaFalha(e)).toBe('o servidor respondeu 404')
    expect(e.message).toBe(`${NOME}: o servidor respondeu 404`)
    expect(e.message).not.toContain('https://')
  })

  it('a URL some do DETALHE também no ramo genérico (regra 2 do catálogo)', () => {
    const e = falha(new Error('boom https://xyz.supabase.co/content-files/a.pdf?token=abc'), NOME)
    expect(e.message).not.toContain('https://')
    expect(e.message).toContain('<url>')
  })

  it('o que não é `Error` também não vaza', () => {
    for (const x of [undefined, null, 42, { message: 'Loading failed' }, 'plain string']) {
      expect(estaNoConjunto(fraseDaFalha(falha(x, NOME)))).toBe(true)
    }
  })

  it('CONTROLE NEGATIVO — o conjunto sabe reprovar', () => {
    expect(estaNoConjunto("Call to function 'x' has been rejected.")).toBe(false)
    expect(estaNoConjunto(`${NOME}: não consegui baixar`)).toBe(false)
    expect(estaNoConjunto('o servidor respondeu quatrocentos e quatro')).toBe(false)
  })

  it('um erro que nunca passou pelo `falha()` também cai no genérico', () => {
    // A CLASSE 2 da div. 131 pelo avesso: mesmo que algum caminho ainda escape
    // do `falha()`, a tela não recebe a mensagem crua — recebe a genérica.
    expect(fraseDaFalha(new Error('EPERM: operation not permitted'))).toBe(FALHA_GENERICA)
    expect(fraseDaFalha('qualquer coisa')).toBe(FALHA_GENERICA)
  })
})
