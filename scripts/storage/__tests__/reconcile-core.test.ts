import { describe, it, expect } from 'vitest'
import {
  parseRef, cruzar, parseArgs, podeDeletar, IDADE_MINIMA_DIAS,
  type BucketObj, type DbRef,
} from '../reconcile-core'

/**
 * B5 PR-3 — unit do núcleo da reconciliação (B5-DESENHO.md §5.2).
 * parseRef é o portado do pre-check (apêndice B) — os casos aqui incluem
 * o %20 real do bucket ("Easy%20-%20Guitar.pdf", ref casada do §2.4).
 */

describe('parseRef — idêntico ao do pre-check', () => {
  it('URL pública padrão → bucket+path', () => {
    expect(parseRef('https://x.supabase.co/storage/v1/object/public/content-files/1750546056712-flyme.jpg'))
      .toEqual({ bucket: 'content-files', path: '1750546056712-flyme.jpg' })
  })

  it('URL com %20 → decodeURIComponent (o caso real do §2.4)', () => {
    expect(parseRef('https://x.supabase.co/storage/v1/object/public/content-files/1750171474983-Easy%20-%20Guitar.pdf'))
      .toEqual({ bucket: 'content-files', path: '1750171474983-Easy - Guitar.pdf' })
  })

  it('variante sem /public/ → também parseia', () => {
    expect(parseRef('https://x.supabase.co/storage/v1/object/content-files/a.pdf'))
      .toEqual({ bucket: 'content-files', path: 'a.pdf' })
  })

  it('URL fora do padrão do storage → null (avatar do Google do §2.4)', () => {
    expect(parseRef('https://lh3.googleusercontent.com/a/ACg8ocL=s96-c')).toBe(null)
  })
})

describe('cruzar — fixtures dos dois sentidos', () => {
  const agora = new Date('2026-08-30T12:00:00Z')
  const obj = (path: string, createdAt: string | null): BucketObj => ({
    path, size: 100, contentType: 'application/pdf', createdAt, updatedAt: createdAt,
  })
  const ref = (path: string, origem = 'content.file_url', id = 'row-1'): DbRef => ({
    origem, id, url: `https://x.supabase.co/storage/v1/object/public/content-files/${encodeURIComponent(path)}`,
  })

  it('classifica A, B, casados e fora-do-padrão; duplicata de ref não vira 2 órfãos', () => {
    const objects = [
      obj('orfao-velho.pdf', '2026-08-01T00:00:00Z'), // 29 dias
      obj('casado.pdf', '2026-08-01T00:00:00Z'),
      obj('casado duas vezes.pdf', '2026-08-01T00:00:00Z'),
    ]
    const refs: DbRef[] = [
      ref('casado.pdf'),
      ref('casado duas vezes.pdf', 'content.file_url', 'row-2'),
      ref('casado duas vezes.pdf', 'content.file_url', 'row-3'), // duplicata real do §2.4
      ref('sumido-do-bucket.pdf', 'content.file_url', 'row-4'), // órfão B
      { origem: 'profiles.avatar_url', id: 'u1', url: 'https://lh3.googleusercontent.com/a/x' },
    ]
    const r = cruzar(objects, refs, { bucket: 'content-files', agora })
    expect(r.orfaosA.map((o) => o.path)).toEqual(['orfao-velho.pdf'])
    expect(r.orfaosB.map((o) => o.ref.path)).toEqual(['sumido-do-bucket.pdf'])
    expect(r.casados).toHaveLength(3) // 3 refs ↔ 2 objetos distintos
    expect(r.foraDoStorage).toHaveLength(1)
  })

  it('idade mínima: órfão de 3 dias é recente (removivel=false); de 10 dias é removível', () => {
    const objects = [
      obj('recente.pdf', '2026-08-27T12:00:00Z'), // 3 dias
      obj('antigo.pdf', '2026-08-20T12:00:00Z'), // 10 dias
    ]
    const r = cruzar(objects, [], { bucket: 'content-files', agora })
    const porPath = Object.fromEntries(r.orfaosA.map((o) => [o.path, o.removivel]))
    expect(porPath['recente.pdf']).toBe(false)
    expect(porPath['antigo.pdf']).toBe(true)
    expect(IDADE_MINIMA_DIAS).toBe(7)
  })

  it('órfão sem createdAt legível → NÃO removível (conservador)', () => {
    const r = cruzar([obj('sem-data.pdf', null)], [], { bucket: 'content-files', agora })
    expect(r.orfaosA[0]?.removivel).toBe(false)
    expect(r.orfaosA[0]?.idadeDias).toBe(null)
  })
})

describe('parseArgs — guardas do CLI (§5.2)', () => {
  it('default e --report → modo report', () => {
    expect(parseArgs([])).toEqual({ modo: 'report' })
    expect(parseArgs(['--report'])).toEqual({ modo: 'report' })
  })

  it('--delete SEM --lista → recusado (B5-D2: sem modo "delete tudo")', () => {
    expect(() => parseArgs(['--delete'])).toThrow(/--delete exige --lista/)
  })

  it('--delete --lista <arquivo> → modo delete com a lista', () => {
    expect(parseArgs(['--delete', '--lista', 'aprovada.txt'])).toEqual({ modo: 'delete', lista: 'aprovada.txt' })
  })

  it('--report e --delete juntos → recusado (mutuamente exclusivos)', () => {
    expect(() => parseArgs(['--report', '--delete', '--lista', 'x'])).toThrow(/mutuamente exclusivos/)
  })

  it('argumento desconhecido → recusado', () => {
    expect(() => parseArgs(['--tudo'])).toThrow(/argumento desconhecido/)
  })
})

describe('podeDeletar — guarda TOCTOU do modo delete (§5.2)', () => {
  const lista = new Set(['aprovado.pdf'])

  it('na lista + existe + sem ref → ok', () => {
    expect(podeDeletar('aprovado.pdf', lista, true, true)).toEqual({ ok: true })
  })

  it('objeto re-referenciado entre o relatório e o delete → PULADO com registro', () => {
    expect(podeDeletar('aprovado.pdf', lista, true, false)).toEqual({
      ok: false,
      motivo: 're-referenciado no banco entre o relatório e o delete (TOCTOU)',
    })
  })

  it('fora da lista aprovada → pulado', () => {
    expect(podeDeletar('intruso.pdf', lista, true, true)).toEqual({ ok: false, motivo: 'fora da lista aprovada' })
  })

  it('objeto já inexistente → pulado', () => {
    expect(podeDeletar('aprovado.pdf', lista, false, true)).toEqual({
      ok: false,
      motivo: 'objeto não existe mais no bucket',
    })
  })
})
