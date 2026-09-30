/**
 * I1-PR-12 (I1-D29): o texto cita o limite que o SERVIDOR cobra. O número vive em `lib/api-schemas.ts`
 * (`storageSchemas.upload.size`, o `max` do zod, aplicado por `app/api/storage/upload/route.ts`); as frases
 * (`up.formatos`, `up.limite`) citam `LIMITE_MIB`. Se o teto mudar, este teste reprova até o texto mudar — o
 * *"(max 50MB)"* de antes anunciava um limite que nenhuma requisição alcançava.
 */
import { describe, it, expect } from 'vitest'
import { storageSchemas } from '@/lib/api-schemas'
import { EXTENSOES_TEXTO, LIMITE_MIB, fraseUp, listaDeExtensoes, tamanhoDoArquivo } from '@/components/upload/frases-upload'

/** O teto do servidor, lido do schema: o maior tamanho que passa (busca binária sobre o `safeParse`, sem tocar no zod por dentro). */
function tetoDoServidor(): number {
  const passa = (size: number) => storageSchemas.upload.safeParse({ filename: 'a.pdf', contentType: 'application/pdf', size }).success
  let lo = 1, hi = 1024 * 1024 * 1024
  expect(passa(lo)).toBe(true)
  expect(passa(hi)).toBe(false)
  while (hi - lo > 1) { const m = Math.floor((lo + hi) / 2); if (passa(m)) lo = m; else hi = m }
  return lo
}

describe('I1-PR12 — o limite: o texto × o servidor', () => {
  it('LIMITE_MIB é o teto de `storageSchemas.upload.size`, em MiB', () => {
    expect(tetoDoServidor()).toBe(LIMITE_MIB * 1024 * 1024)
  })
  it('as duas frases citam esse número', () => {
    const mib = tetoDoServidor() / (1024 * 1024)
    expect(fraseUp('up.formatos', { lista: listaDeExtensoes(EXTENSOES_TEXTO), n: LIMITE_MIB })).toBe(`formatos: .pdf, .docx, .txt · até ${mib} MiB`)
    expect(fraseUp('up.limite', { n: LIMITE_MIB })).toBe(`o arquivo passa de ${mib} MiB — escolha um menor`)
  })
  it('a lista com "ou" e o tamanho como a folha os escreve', () => {
    expect(listaDeExtensoes(['.pdf', '.docx', '.txt'], true)).toBe('.pdf, .docx ou .txt')
    expect(listaDeExtensoes(['.pdf', '.png', '.jpg', '.jpeg'], true)).toBe('.pdf, .png, .jpg ou .jpeg')
    expect(tamanhoDoArquivo(Math.round(1.8 * 1024 * 1024))).toBe('1,8 MiB')
    expect(tamanhoDoArquivo(58)).toBe('58 B')
    expect(tamanhoDoArquivo(20 * 1024)).toBe('20,0 KiB')
  })
})
