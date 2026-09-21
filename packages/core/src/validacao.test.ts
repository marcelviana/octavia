/**
 * As TRÊS validações do cliente (N2-D21, T2-R3) e a data-calendário local
 * (T2-R2). Nada do filtro de texto do servidor (div. 181): ele não é
 * replicado, e o 400 dele vira frase do conjunto fechado.
 */
import { describe, expect, it } from 'vitest'
import { dataCalendarioLocal, dataExiste, validarAtualizacao, validarCriacao } from './validacao'

describe('T2-R2 — data-calendário local, sem fuso', () => {
  it('23:30 de 16/09 vira 2026-09-16 — os campos LOCAIS, nunca toISOString()', () => {
    // `new Date(a, m, d, …)` monta pelos campos locais, qualquer que seja o
    // fuso do runner. É esse instante que o `toISOString()` empurra para o
    // dia seguinte em todo fuso a oeste de UTC−0:30 — e a coluna do banco é
    // `date` (nota N1 do PRD: timestamp dá 400).
    const d = new Date(2026, 8, 16, 23, 30, 0)
    expect(dataCalendarioLocal(d)).toBe('2026-09-16')
    // O controle: num fuso negativo o ISO de fato diverge, e é por isso que
    // a função não pode usá-lo. (Em UTC ou a leste, os dois coincidem.)
    if (d.getTimezoneOffset() > 30) expect(d.toISOString().slice(0, 10)).toBe('2026-09-17')
  })

  it('mês e dia com dois dígitos sempre', () => {
    expect(dataCalendarioLocal(new Date(2026, 0, 3, 12, 0, 0))).toBe('2026-01-03')
  })
})

describe('T2-R3 (ii) — a data do calendário, que o servidor não confere (div. 154)', () => {
  it('2026-02-31 não existe; 2026-02-28 existe', () => {
    expect(dataExiste('2026-02-31')).toBe(false)
    expect(dataExiste('2026-02-28')).toBe(true)
  })

  it('bissexto: 2028-02-29 existe, 2026-02-29 não', () => {
    expect(dataExiste('2028-02-29')).toBe(true)
    expect(dataExiste('2026-02-29')).toBe(false)
  })

  it('forma errada é data inexistente (o cliente nem chega a enviar)', () => {
    for (const bruta of ['2026-13-01', '2026-00-10', '2026-09-31', '2026-9-1', '2026-09-16T00:00:00Z', '']) {
      expect(dataExiste(bruta)).toBe(false)
    }
  })
})

describe('T2-R3 (i) e (iii) — criar', () => {
  it('nome vazio depois de trim não envia', () => {
    const r = validarCriacao({ name: '   ', performance_date: null })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('nome-vazio')
  })

  it('o nome enviado é o trimado', () => {
    const r = validarCriacao({ name: '  Show de sábado  ', performance_date: null })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.campos).toEqual({ name: 'Show de sábado', performance_date: null })
  })

  it('data impossível não envia; data possível envia', () => {
    const ruim = validarCriacao({ name: 'x', performance_date: '2026-02-31' })
    expect(ruim.ok).toBe(false)
    if (!ruim.ok) expect(ruim.motivo).toBe('data-impossivel')
    expect(validarCriacao({ name: 'x', performance_date: '2026-02-28' }).ok).toBe(true)
  })

  it('o nome com o que o servidor recusa PASSA no cliente (N2-D21, div. 181)', () => {
    // O filtro do servidor não é replicado: o 400 dele vira frase do T2-R15.
    expect(validarCriacao({ name: 'Show — data: 12/10', performance_date: null }).ok).toBe(true)
  })

  it('o limite de 255 é do servidor, não do cliente', () => {
    expect(validarCriacao({ name: 'x'.repeat(300), performance_date: null }).ok).toBe(true)
  })
})

describe('T2-R3 (iii) e T2-R4 — editar: nada mudou → não envia; só o que mudou vai', () => {
  const noServidor = { name: 'Season 3', performance_date: '2025-07-16' }

  it('abrir e sair sem mudar nada não gera PUT (A-N2-24)', () => {
    const r = validarAtualizacao(noServidor, { ...noServidor })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('nada-mudou')
  })

  it('só o nome mudou → corpo só com name', () => {
    const r = validarAtualizacao(noServidor, { name: 'Season 4', performance_date: '2025-07-16' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.campos).toEqual({ name: 'Season 4' })
  })

  it('tirar a data manda performance_date: null e nada mais (C4)', () => {
    const r = validarAtualizacao(noServidor, { name: 'Season 3', performance_date: null })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.campos).toEqual({ performance_date: null })
  })

  it('pôr data numa setlist sem data conta como mudança', () => {
    const r = validarAtualizacao({ name: 'x', performance_date: null }, { name: 'x', performance_date: '2026-10-03' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.campos).toEqual({ performance_date: '2026-10-03' })
  })

  it('espaço a mais no nome NÃO é mudança — o trim vem antes da comparação', () => {
    const r = validarAtualizacao(noServidor, { name: '  Season 3 ', performance_date: '2025-07-16' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('nada-mudou')
  })

  it('nome esvaziado é nome-vazio, não "nada mudou" — e o motivo do campo mais alto vence (R1·7c)', () => {
    const r = validarAtualizacao(noServidor, { name: '  ', performance_date: '2026-02-31' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('nome-vazio')
  })

  it('data impossível na edição também barra', () => {
    const r = validarAtualizacao(noServidor, { name: 'Season 3', performance_date: '2026-02-31' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('data-impossivel')
  })
})
