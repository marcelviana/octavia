/**
 * As seis escritas, o pedido e a classificação (N2-PR2, T2-R1…R15).
 *
 * Puro: nenhuma request acontece aqui. O que se mede é o que o core DECIDE —
 * o método, o caminho, o corpo, e a espécie de cada resposta. O caminho de
 * rede e a releitura de verdade estão em `apps/native/test/escrita.test.ts`,
 * contra o mock.
 */
import { describe, expect, it } from 'vitest'
import {
  classificar,
  id8,
  pedidoAdicionar,
  pedidoApagar,
  pedidoAtualizar,
  pedidoCriar,
  pedidoRemover,
  pedidoReordenar,
  type Especie,
} from './escrita'

const SL = '4340bf95-1c2d-4e5f-8a9b-0c1d2e3f4a5b'
const SONG = 'bb11cc22-3344-4555-8666-777788889999'
const CONTENT = 'cc33dd44-5566-4777-8888-99990000aaaa'

describe('pedido — método, caminho e corpo de cada operação', () => {
  it('criar: POST /api/setlists, só name (e performance_date quando há)', () => {
    expect(pedidoCriar({ name: 'Show de sábado', performance_date: null })).toEqual({
      op: 'create',
      method: 'POST',
      path: '/api/setlists',
      body: '{"name":"Show de sábado"}',
      setlist: '-',
      items: '-',
    })
    expect(pedidoCriar({ name: 'Show', performance_date: '2026-10-03' }).body).toBe(
      '{"name":"Show","performance_date":"2026-10-03"}',
    )
  })

  it('criar NUNCA manda songs[] (N2-D20) nem description/venue/notes (T2-R1)', () => {
    const corpo = pedidoCriar({ name: 'x', performance_date: '2026-10-03' }).body ?? ''
    expect(Object.keys(JSON.parse(corpo))).toEqual(['name', 'performance_date'])
  })

  it('editar: PUT /api/setlists/[id] só com os campos que mudaram (T2-R4, C4)', () => {
    const p = pedidoAtualizar(SL, { name: 'Outro nome' })
    expect(p.method).toBe('PUT')
    expect(p.path).toBe(`/api/setlists/${SL}`)
    expect(p.body).toBe('{"name":"Outro nome"}')
    expect(p.setlist).toBe('4340bf95')
    // Tirar a data é `null` explícito; o nome nunca vai como null (C4).
    expect(pedidoAtualizar(SL, { performance_date: null }).body).toBe('{"performance_date":null}')
  })

  it('apagar: DELETE /api/setlists/[id], sem corpo', () => {
    const p = pedidoApagar(SL)
    expect([p.method, p.path, p.body]).toEqual(['DELETE', `/api/setlists/${SL}`, null])
  })

  it('adicionar: POST …/songs com {content_id} — sem position (C7)', () => {
    const p = pedidoAdicionar(SL, CONTENT)
    expect(p.method).toBe('POST')
    expect(p.path).toBe(`/api/setlists/${SL}/songs`)
    expect(JSON.parse(p.body ?? '{}')).toEqual({ content_id: CONTENT })
  })

  it('remover: DELETE /api/setlists/songs/[songId] — por setlist_songs.id, NUNCA content_id (T2-R7)', () => {
    const p = pedidoRemover(SL, SONG)
    expect(p.path).toBe(`/api/setlists/songs/${SONG}`)
    expect(p.path).not.toContain(CONTENT)
    // O `setlist=` do log é o da setlist aberta, não o da song.
    expect(p.setlist).toBe('4340bf95')
  })

  it('reordenar: UM PUT …/songs/order com a permutação inteira (T2-R8)', () => {
    const ordem = ['a', 'b', 'c']
    const p = pedidoReordenar(SL, ordem)
    expect(p.method).toBe('PUT')
    expect(p.path).toBe(`/api/setlists/${SL}/songs/order`)
    expect(JSON.parse(p.body ?? '{}')).toEqual({ order: ordem })
    expect(p.items).toBe('3')
  })

  it('id8 são os 8 primeiros do uuid (regra 3 do catálogo)', () => {
    expect(id8(SL)).toBe('4340bf95')
    expect(id8(null)).toBe('-')
  })
})

/** Um envelope do `CONTRATO-DE-ERRO.md`, verbatim. */
function envelope(code: string, error: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ error, code, ...extra })
}

describe('classificar — o conjunto FECHADO de espécies', () => {
  it('2xx + releitura ok → ok', () => {
    const r = classificar('create', { status: 201, bodyText: '{}' }, 'ok')
    expect(r.especie).toBe('ok')
    expect(r.status).toBe(201)
  })

  it('2xx + releitura falhou → ok-nao-relido (N2-D22), e NUNCA "falhou"', () => {
    const r = classificar('add', { status: 201, bodyText: '{}' }, 'falhou')
    expect(r.especie).toBe('ok-nao-relido')
    expect(r.frase).toBe(
      'Salvo. Não foi possível recarregar a setlist, então o que está na tela pode estar velho.',
    )
  })

  it('404 → sumiu (T2-R10)', () => {
    const r = classificar('delete', { status: 404, bodyText: envelope('NOT_FOUND', 'Setlist not found') }, 'ok')
    expect(r.especie).toBe('sumiu')
    expect(r.code).toBe('NOT_FOUND')
    expect(r.frase).toBe('esta setlist foi apagada em outro lugar')
  })

  it('404 no remover fala de MÚSICA, não de setlist (T2-R15)', () => {
    const r = classificar('remove', { status: 404, bodyText: envelope('NOT_FOUND', 'Song not found') }, 'ok')
    expect(r.frase).toBe('esta música já não estava na setlist')
  })

  it('401 → auth, e a espécie NÃO carrega nenhum pedido de logout (N2-D9)', () => {
    const r = classificar('create', { status: 401, bodyText: envelope('AUTH_REQUIRED', 'Authentication required') }, null)
    expect(r.especie).toBe('auth')
    expect(r.code).toBe('AUTH_REQUIRED')
    expect(r.frase).toBe('não foi possível salvar — confira sua conta no site')
  })

  it('429 com Retry-After → limite, com o prazo e a frase com número (div. 225)', () => {
    const r = classificar(
      'add',
      {
        status: 429,
        bodyText: envelope('RATE_LIMITED', 'Rate limit exceeded', { retryAfter: 30 }),
        headers: { 'Retry-After': '30' },
      },
      null,
    )
    expect(r.especie).toBe('limite')
    expect(r.retryAfter).toBe(30)
    expect(r.frase).toBe('muitas alterações seguidas — tente de novo em 30 s')
  })

  it('429 SEM prazo nenhum → limite, e a frase sem número (N2-D31, moldura N2-X-limite)', () => {
    const r = classificar('add', { status: 429, bodyText: envelope('RATE_LIMITED', 'Rate limit exceeded') }, null)
    expect(r.especie).toBe('limite')
    expect(r.retryAfter).toBeNull()
    expect(r.frase).toBe('Muitas mudanças em pouco tempo. Os controles de escrita voltam em instantes.')
  })

  it('400 e 500 → servidor, com o code do contrato', () => {
    const v = classificar('create', { status: 400, bodyText: envelope('VALIDATION_ERROR', 'Validation failed') }, null)
    expect([v.especie, v.code]).toEqual(['servidor', 'VALIDATION_ERROR'])
    const s = classificar('create', { status: 500, bodyText: envelope('INTERNAL_ERROR', 'Internal server error') }, null)
    expect([s.especie, s.code]).toEqual(['servidor', 'INTERNAL_ERROR'])
    expect(s.frase).toBe('falha no servidor — nada foi alterado aqui')
  })

  it('400 do reorder tem frase própria — a setlist mudou (T2-R15, div. 177: não existe 409)', () => {
    const r = classificar('reorder', { status: 400, bodyText: envelope('VALIDATION_ERROR', 'Validation failed') }, 'ok')
    expect(r.frase).toBe('a setlist mudou — a ordem foi recarregada')
  })

  it('400 em criar e editar é o filtro de texto do servidor (div. 181, N2-D21)', () => {
    for (const op of ['create', 'update'] as const) {
      const r = classificar(op, { status: 400, bodyText: envelope('VALIDATION_ERROR', 'Validation failed') }, null)
      expect(r.frase).toBe('o nome tem um trecho que o servidor não aceita')
    }
  })

  it('falha de transporte → rede', () => {
    const r = classificar('create', { networkError: 'Network request failed' }, null)
    expect(r.especie).toBe('rede')
    expect(r.status).toBeNull()
    expect(r.frase).toBe('sem conexão — nada foi salvo')
  })

  it('rede em criar e adicionar PODE ter gravado (N2-D18); nas outras quatro, não', () => {
    for (const op of ['create', 'add'] as const) {
      expect(classificar(op, { networkError: 'x' }, null).podeTerGravado).toBe(true)
    }
    for (const op of ['update', 'delete', 'remove', 'reorder'] as const) {
      expect(classificar(op, { networkError: 'x' }, null).podeTerGravado).toBe(false)
    }
  })

  it('não-2xx NUNCA tem podeTerGravado — o servidor recusou antes de tocar o banco (§7.1)', () => {
    for (const status of [400, 401, 404, 429, 500]) {
      expect(classificar('create', { status, bodyText: '{}' }, null).podeTerGravado).toBe(false)
    }
  })

  it('code desconhecido e corpo sem envelope caem na genérica (cláusula 1 do contrato)', () => {
    expect(classificar('create', { status: 418, bodyText: envelope('CHA_QUENTE', 'x') }, null).frase).toBe(
      'não foi possível salvar',
    )
    expect(classificar('create', { status: 405, bodyText: '' }, null).frase).toBe('não foi possível salvar')
  })

  it('as espécies são exatamente sete — o conjunto é FECHADO', () => {
    const vistas = new Set<Especie>()
    vistas.add(classificar('create', { status: 201, bodyText: '{}' }, 'ok').especie)
    vistas.add(classificar('create', { status: 201, bodyText: '{}' }, 'falhou').especie)
    vistas.add(classificar('create', { status: 404, bodyText: envelope('NOT_FOUND', 'x') }, 'ok').especie)
    vistas.add(classificar('create', { status: 401, bodyText: envelope('AUTH_REQUIRED', 'x') }, null).especie)
    vistas.add(classificar('create', { status: 429, bodyText: envelope('RATE_LIMITED', 'x') }, null).especie)
    vistas.add(classificar('create', { status: 500, bodyText: envelope('INTERNAL_ERROR', 'x') }, null).especie)
    vistas.add(classificar('create', { networkError: 'x' }, null).especie)
    expect([...vistas].sort()).toEqual(
      ['auth', 'limite', 'ok', 'ok-nao-relido', 'rede', 'servidor', 'sumiu'].sort(),
    )
  })
})
