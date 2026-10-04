/**
 * N4-PR5 — o favoritar no core (N4-R7, N4-R8; N4-D22, N4-D23, N4-D35), escrito ANTES do código: contra a `main`, o
 * arquivo reprova — `favoritar.ts` não existe.
 *
 * O core decide o PEDIDO e o que a resposta SIGNIFICA; quem envia é o `apps/native/src/favoritar.ts`. O corpo contra
 * a fixture da N4-PR1 (byte a byte) está no lado do tablet (`apps/native/test/favoritar.test.ts`): o `tsconfig` do
 * core não tem tipos de Node para ler o arquivo, e é lá que o corpo sai pelo fio.
 *
 * As seis espécies da N4-R8, cada uma com a frase do TABLET (as do N2, `frases.ts`), compostas com o nome acessível
 * da estrela pelo separador do tablet (`compor`, N4-PR3):
 *   sem rede · sem resposta · sessão · limite · servidor · genérica.
 */
import { describe, expect, it } from 'vitest'
import {
  FAMILIA_DO_FAVORITAR,
  avisoDoFavoritar,
  classificarFavoritar,
  classificarFavoritarBarrado,
  pedidoFavoritar,
} from './favoritar'

const ID = '00000000-0000-4000-8000-0000000000f1'
const envelope = (code: string, extra: Record<string, unknown> = {}): string =>
  JSON.stringify({ error: 'x', code, ...extra })
const LINHA = {
  id: ID,
  title: 'Favorita do teste',
  artist: null,
  album: null,
  content_type: 'Lyrics',
  content_data: { lyrics: 'texto do projeto' },
  file_url: null,
  is_favorite: true,
  updated_at: '2026-10-04T12:00:00.000+00:00',
}

describe('o pedido (N4-D22): PUT /api/content, {"id","is_favorite"}, valor absoluto', () => {
  it('favoritar e desfavoritar: o corpo, o método, a rota, o op e o id8 do log', () => {
    expect(pedidoFavoritar(ID, true)).toEqual({
      op: 'favorite',
      method: 'PUT',
      path: '/api/content',
      body: `{"id":"${ID}","is_favorite":true}`,
      id: ID,
      valor: true,
      content: '00000000',
    })
    expect(pedidoFavoritar(ID, false).body).toBe(`{"id":"${ID}","is_favorite":false}`)
    expect(pedidoFavoritar(ID, false).op).toBe('unfavorite')
  })

  it('a família do limite é a do servidor para o PUT de content (`content-mutate`), não a das setlists', () => {
    expect(FAMILIA_DO_FAVORITAR).toBe('content-mutate')
  })
})

describe('a resposta (N4-D35): o 200 traz a linha inteira, e é ELA que vai ao cache', () => {
  it('200 com a linha: espécie ok, a linha devolvida, sem frase', () => {
    const r = classificarFavoritar(ID, { status: 200, bodyText: JSON.stringify(LINHA) })
    expect(r.especie).toBe('ok')
    expect(r.linha).toEqual(LINHA)
    expect(r.frase).toBeNull()
  })

  it('200 com corpo que não é a linha pedida (outro id, sem is_favorite, não-JSON): genérica, sem linha', () => {
    for (const corpo of [JSON.stringify({ ...LINHA, id: 'outro' }), JSON.stringify({ id: ID }), 'ok', '']) {
      const r = classificarFavoritar(ID, { status: 200, bodyText: corpo })
      expect(r.especie).toBe('generica')
      expect(r.linha).toBeNull()
      expect(r.frase).toBe('não foi possível salvar')
    }
  })
})

describe('N4-R8 — as seis espécies, cada uma com a frase do tablet', () => {
  it('sem resposta: a request saiu e não voltou', () => {
    const r = classificarFavoritar(ID, { networkError: 'Network request failed' })
    expect([r.especie, r.frase, r.status]).toEqual(['sem-resposta', 'sem resposta do servidor', null])
  })

  it('sessão: 401 (a escrita não desloga — N2-D9)', () => {
    const r = classificarFavoritar(ID, { status: 401, bodyText: envelope('AUTH_REQUIRED') })
    expect([r.especie, r.frase]).toEqual(['auth', 'não foi possível salvar — confira sua conta no site'])
  })

  it('limite: 429 com prazo — a frase com {N}', () => {
    const r = classificarFavoritar(ID, {
      status: 429,
      bodyText: envelope('RATE_LIMITED', { retryAfter: 30 }),
      headers: { 'Retry-After': '30' },
    })
    expect([r.especie, r.retryAfter, r.frase]).toEqual(['limite', 30, 'muitas alterações seguidas — tente de novo em 30 s'])
  })

  it('limite: 429 sem prazo — a frase do N2 sem número', () => {
    const r = classificarFavoritar(ID, { status: 429, bodyText: envelope('RATE_LIMITED') })
    expect(r.especie).toBe('limite')
    expect(r.retryAfter).toBeNull()
    expect(r.chave).toBe('limite-sem-prazo')
  })

  it('servidor: 500 com e sem envelope', () => {
    for (const bodyText of [envelope('INTERNAL_ERROR'), '<html>']) {
      const r = classificarFavoritar(ID, { status: 500, bodyText })
      expect([r.especie, r.frase]).toEqual(['servidor', 'falha no servidor — nada foi alterado aqui'])
    }
  })

  it('genérica: 404 (a música sumiu do servidor), 400 e código desconhecido', () => {
    for (const [status, bodyText] of [
      [404, envelope('NOT_FOUND')],
      [400, envelope('VALIDATION_ERROR')],
      [418, envelope('CODIGO_NOVO')],
    ] as const) {
      const r = classificarFavoritar(ID, { status, bodyText })
      expect([r.especie, r.frase]).toEqual(['generica', 'não foi possível salvar'])
    }
  })

  it('sem rede: barrado ANTES de sair (nenhuma request) — a frase do N2-E19', () => {
    const r = classificarFavoritarBarrado('offline', null)
    expect([r.especie, r.frase, r.status]).toEqual(['rede', 'sem conexão — nada foi salvo', null])
  })

  it('barrado pelo limite aberto: com o que resta do prazo, a frase com {N}; sem, a do N2', () => {
    expect(classificarFavoritarBarrado('ratelimit', 12).frase).toBe('muitas alterações seguidas — tente de novo em 12 s')
    expect(classificarFavoritarBarrado('ratelimit', null).chave).toBe('limite-sem-prazo')
  })

  it('barrado por já haver um pedido em voo para ESTA música: a genérica (nada saiu)', () => {
    expect(classificarFavoritarBarrado('busy', null).especie).toBe('generica')
  })
})

describe('a linha de aviso do tablet: o nome acessível da estrela · a frase da espécie (compor, N4-PR3)', () => {
  it('favoritar com falha de sessão; tirar com falha de servidor', () => {
    const sessao = classificarFavoritar(ID, { status: 401, bodyText: envelope('AUTH_REQUIRED') })
    expect(avisoDoFavoritar('Manhã de ensaio', true, sessao)).toBe(
      'Favoritar “Manhã de ensaio”  ·  não foi possível salvar — confira sua conta no site',
    )
    const servidor = classificarFavoritar(ID, { status: 500, bodyText: envelope('INTERNAL_ERROR') })
    expect(avisoDoFavoritar('Manhã de ensaio', false, servidor)).toBe(
      'Tirar “Manhã de ensaio” das favoritas  ·  falha no servidor — nada foi alterado aqui',
    )
  })

  it('ok não tem aviso', () => {
    expect(avisoDoFavoritar('x', true, classificarFavoritar(ID, { status: 200, bodyText: JSON.stringify(LINHA) }))).toBeNull()
  })
})
