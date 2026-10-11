/**
 * SY-PR2 — a máquina do VOO ÚNICO, sem rede e sem relógio (SY-D9, SY-D25, SY-D35; `SY-PRECHECK.md` A5). Controles
 * negativos: contra a árvore de antes desta PR o arquivo inteiro reprova por ausência — não há `./voo`. O voo de
 * verdade (o executor contra o mock) é o gate (ii), `apps/native/test/sy-voo.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import { VOO_OCIOSO, pedirVoo, terminouVoo, type EstadoDoVoo } from './voo'

/** Aplica uma sequência de eventos e devolve as ações, na ordem — o roteiro de um voo inteiro. */
function roteiro(eventos: ('pedir' | 'terminou' | 'terminou-cancelando')[]): { acoes: string[]; fim: EstadoDoVoo } {
  let e: EstadoDoVoo = VOO_OCIOSO
  const acoes: string[] = []
  for (const ev of eventos) {
    const r = ev === 'pedir' ? pedirVoo(e) : terminouVoo(e, { cancelarDeNovo: ev === 'terminou-cancelando' })
    acoes.push(`${ev}:${r.acao}`)
    e = r.estado
  }
  return { acoes, fim: e }
}

describe('o voo único — os estados', () => {
  it('começa ocioso', () => {
    expect(VOO_OCIOSO).toBe('ocioso')
  })

  it('ocioso + pedido → roda, e o voo fica em curso', () => {
    expect(pedirVoo('ocioso')).toEqual({ estado: 'em-voo', acao: 'rodar' })
  })

  it('em voo + pedido → marca o "de novo" (nunca dois syncs em curso)', () => {
    expect(pedirVoo('em-voo')).toEqual({ estado: 'em-voo-de-novo', acao: 'marcar' })
  })

  it('em voo com "de novo" + pedido → nada: o "de novo" já marcado atende este também', () => {
    expect(pedirVoo('em-voo-de-novo')).toEqual({ estado: 'em-voo-de-novo', acao: 'nada' })
  })

  it('em voo + terminou → ocioso, nada a rodar', () => {
    expect(terminouVoo('em-voo')).toEqual({ estado: 'ocioso', acao: 'nada' })
  })

  it('em voo com "de novo" + terminou → roda o "de novo", que passa a ser o voo em curso', () => {
    expect(terminouVoo('em-voo-de-novo')).toEqual({ estado: 'em-voo', acao: 'rodar' })
  })

  it('terminou sem voo em curso é defeito de quem chama — recusa, em vez de seguir', () => {
    expect(() => terminouVoo('ocioso')).toThrow(/nenhum sync em curso/)
    expect(() => terminouVoo('ocioso', { cancelarDeNovo: true })).toThrow(/nenhum sync em curso/)
  })
})

describe('o voo único — os pedidos durante o voo', () => {
  it('um pedido durante o voo → exatamente UM "de novo" ao terminar, e depois ocioso', () => {
    expect(roteiro(['pedir', 'pedir', 'terminou', 'terminou'])).toEqual({
      acoes: ['pedir:rodar', 'pedir:marcar', 'terminou:rodar', 'terminou:nada'],
      fim: 'ocioso',
    })
  })

  it('cinco pedidos durante o voo → ainda UM "de novo" (os quatro últimos não somam nada)', () => {
    const r = roteiro(['pedir', 'pedir', 'pedir', 'pedir', 'pedir', 'pedir', 'terminou', 'terminou'])
    expect(r.acoes.filter((a) => a.endsWith(':rodar'))).toHaveLength(2)
    expect(r.acoes).toEqual([
      'pedir:rodar',
      'pedir:marcar',
      'pedir:nada',
      'pedir:nada',
      'pedir:nada',
      'pedir:nada',
      'terminou:rodar',
      'terminou:nada',
    ])
    expect(r.fim).toBe('ocioso')
  })

  it('um pedido durante o "de novo" → outro "de novo" depois dele (o "de novo" é um voo como qualquer outro)', () => {
    expect(roteiro(['pedir', 'pedir', 'terminou', 'pedir', 'terminou', 'terminou']).acoes).toEqual([
      'pedir:rodar',
      'pedir:marcar',
      'terminou:rodar',
      'pedir:marcar',
      'terminou:rodar',
      'terminou:nada',
    ])
  })

  it('sem pedido durante o voo → nenhum "de novo"', () => {
    expect(roteiro(['pedir', 'terminou'])).toEqual({ acoes: ['pedir:rodar', 'terminou:nada'], fim: 'ocioso' })
  })

  it('o pedido depois do fim roda de novo do zero (o voo terminado não guarda nada)', () => {
    expect(roteiro(['pedir', 'terminou', 'pedir', 'terminou']).acoes).toEqual([
      'pedir:rodar',
      'terminou:nada',
      'pedir:rodar',
      'terminou:nada',
    ])
  })
})

describe('o voo único — o cancelamento (SY-D17, o logout no meio)', () => {
  it('o "de novo" marcado se cancela: o voo termina ocioso e nada roda', () => {
    expect(terminouVoo('em-voo-de-novo', { cancelarDeNovo: true })).toEqual({ estado: 'ocioso', acao: 'nada' })
  })

  it('cancelar sem "de novo" marcado não muda nada: o voo termina como terminaria', () => {
    expect(terminouVoo('em-voo', { cancelarDeNovo: true })).toEqual({ estado: 'ocioso', acao: 'nada' })
  })

  it('depois do cancelamento, o próximo pedido roda (o voo não fica trancado)', () => {
    expect(roteiro(['pedir', 'pedir', 'pedir', 'terminou-cancelando', 'pedir', 'terminou'])).toEqual({
      acoes: ['pedir:rodar', 'pedir:marcar', 'pedir:nada', 'terminou-cancelando:nada', 'pedir:rodar', 'terminou:nada'],
      fim: 'ocioso',
    })
  })

  it('`cancelarDeNovo: false` é o terminou de sempre', () => {
    expect(terminouVoo('em-voo-de-novo', { cancelarDeNovo: false })).toEqual(terminouVoo('em-voo-de-novo'))
  })
})

describe('o voo único — pureza', () => {
  it('a mesma entrada dá a mesma saída, e nenhum estado se guarda entre chamadas', () => {
    const estados: EstadoDoVoo[] = ['ocioso', 'em-voo', 'em-voo-de-novo']
    for (const e of estados) {
      expect(pedirVoo(e)).toEqual(pedirVoo(e))
      if (e !== 'ocioso') expect(terminouVoo(e)).toEqual(terminouVoo(e))
    }
  })
})
