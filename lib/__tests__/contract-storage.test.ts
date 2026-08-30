import { describe, it, expect } from 'vitest'
import { storageSchemas, mimeMatchesExtension, ALLOWED_UPLOAD_MIMES, ALLOWED_UPLOAD_EXTENSIONS } from '@/lib/api-schemas'

/**
 * B2 PR-4b — contrato de /api/storage (lista ÚNICA de tipos — resolve b8).
 *
 * Controle negativo (regra nº 7), medido contra o schema antigo:
 *  { filename: 'foto.jpg', contentType: 'image/jpg', size: 1024 }
 *  → 400 "Unsupported file type" (o regex antigo só aceitava image/jpeg;
 *  o switch do route aceitava image/jpg — as listas divergiam).
 */

describe('storageSchemas.upload — b8 e a lista única', () => {
  const ok = (filename: string, contentType: string, size = 1024) =>
    storageSchemas.upload.safeParse({ filename, contentType, size })

  it('b8: image/jpg (MIME de navegador) → aceito (era 400 medido)', () => {
    expect(ok('foto.jpg', 'image/jpg').success).toBe(true)
  })

  it('tipos do produto passam: pdf, txt, docx, png, jpeg', () => {
    expect(ok('cifra.pdf', 'application/pdf').success).toBe(true)
    expect(ok('letra.txt', 'text/plain').success).toBe(true)
    expect(ok('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document').success).toBe(true)
    expect(ok('partitura.png', 'image/png').success).toBe(true)
    expect(ok('foto.jpeg', 'image/jpeg').success).toBe(true)
  })

  it('gif/webp/html/msword saem declaradamente (o switch do route já os barrava — nunca passaram ponta a ponta)', () => {
    expect(ok('anim.gif', 'image/gif').success).toBe(false)
    expect(ok('img.webp', 'image/webp').success).toBe(false)
    expect(ok('page.html', 'text/html').success).toBe(false)
    expect(ok('doc.doc', 'application/msword').success).toBe(false)
  })

  it('0 bytes → 400 · >4MB (teto B5-D4) → 400 · extensão fora da lista → 400 · chave desconhecida → 400', () => {
    expect(ok('cifra.pdf', 'application/pdf', 0).success).toBe(false)
    expect(ok('cifra.pdf', 'application/pdf', 4 * 1024 * 1024 + 1).success).toBe(false)
    expect(ok('arquivo.zip', 'application/pdf').success).toBe(false)
    expect(storageSchemas.upload.safeParse({ filename: 'a.pdf', contentType: 'application/pdf', size: 1, extra: 1 }).success).toBe(false)
  })
})

/**
 * B5 PR-1 — teto 4MB (B5-D4; B5-DESENHO.md §3). Regra nº 7, it.fails→it:
 * este bloco nasceu como `it.fails` contra o schema anterior (max 50MB,
 * que ACEITAVA 5MB — controle negativo codificado no commit 1/2 da
 * branch) e virou `it` no commit do flip. O histórico prova a transição.
 */
describe('B5 PR-1 — teto de upload 4MB (B5-D4)', () => {
  const parse = (size: number) =>
    storageSchemas.upload.safeParse({ filename: 'cifra.pdf', contentType: 'application/pdf', size })

  it('5MB → recusado com too_big em field "size"', () => {
    const res = parse(5 * 1024 * 1024)
    expect(res.success).toBe(false)
    if (!res.success) {
      const issue = res.error.issues.find(i => i.path[0] === 'size')
      expect(issue?.code).toBe('too_big')
      expect(issue?.message).toBe('File exceeds the 4MB limit')
    }
  })

  it('fronteira: 4.194.305 (4MiB + 1) → recusado', () => {
    expect(parse(4 * 1024 * 1024 + 1).success).toBe(false)
  })

  it('fronteira: 4.194.304 (4MiB exato) → aceito (inclusivo — §3.1 do desenho)', () => {
    expect(parse(4 * 1024 * 1024).success).toBe(true)
  })
})

describe('mimeMatchesExtension — a MESMA tabela vale para a checagem do route', () => {
  it('consistências e inconsistências', () => {
    expect(mimeMatchesExtension('cifra.pdf', 'application/pdf')).toBe(true)
    expect(mimeMatchesExtension('foto.jpg', 'image/jpg')).toBe(true)
    expect(mimeMatchesExtension('foto.jpg', 'image/jpeg')).toBe(true)
    // .zip renomeado .pdf com MIME de imagem — inconsistência barrada
    expect(mimeMatchesExtension('cifra.pdf', 'image/png')).toBe(false)
    expect(mimeMatchesExtension('arquivo.zip', 'application/zip')).toBe(false)
  })

  it('toda extensão permitida tem MIME e vice-versa (a tabela é fechada)', () => {
    expect(ALLOWED_UPLOAD_EXTENSIONS.sort()).toEqual(['docx', 'jpeg', 'jpg', 'pdf', 'png', 'txt'])
    expect(ALLOWED_UPLOAD_MIMES).toContain('image/jpg')
  })
})

describe('storageSchemas.delete — o schema da rota real', () => {
  it('filename com convenção do bucket passa; espaços → 400', () => {
    expect(storageSchemas.delete.safeParse({ filename: '1755791234-cifra.pdf' }).success).toBe(true)
    expect(storageSchemas.delete.safeParse({ filename: 'nome com espaço.pdf' }).success).toBe(false)
  })
})
