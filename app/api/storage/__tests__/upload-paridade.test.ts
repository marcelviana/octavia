/**
 * B6 PR-1 — TESTE DE PARIDADE upload→delete (B6-D5', docs/ux/B6-DESENHO.md §5.2).
 *
 * Contrato: todo path que o upload produz DEVE ser deletável pela rota de
 * delete — (a) casa a regex do delete (delete/route.ts:46), (b) passa em
 * storageSchemas.delete.safeParse, (c) igualdade LITERAL com o path
 * esperado da tabela do §5.2 (após o prefixo `<ts>-`).
 *
 * Regra nº 7 (it.fails→it, dois commits na ordem): os casos que o código
 * ATUAL não satisfaz nascem `it.fails` — cada um prova que o teste pega o
 * bug de hoje (sanitização atual: replace(/[<>:"/\\|?*]/g, '_') — espaço,
 * tab, acento, parêntese, apóstrofo, &, #, +, colchete e emoji PASSAM
 * intactos; o L4.1 do pre-check mediu ao vivo o espaço preservado em prod,
 * 201 com "1788212663748-b6 precheck.txt"). O commit do flip (§5.1) os
 * vira `it`. `.hidden.pdf` é o único já-limpo → `it` desde o commit 1.
 */
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { storageSchemas } from '@/lib/api-schemas'

vi.mock('@/lib/supabase-service', () => ({
  getSupabaseServiceClient: vi.fn(),
}))

vi.mock('@/lib/secure-auth-utils', () => ({
  requireAuthServerSecure: vi.fn(async () => ({ uid: 'test-user-b6', email: 'b6@test.local' })),
}))

vi.mock('@/lib/user-rate-limit', async () => {
  const actual = await vi.importActual('@/lib/user-rate-limit')
  return {
    ...(actual as object),
    enforceUserLimit: vi.fn(() => null),
    checkRateLimit: vi.fn(() => ({ ok: true, scope: 'user', limit: 999, remaining: 999, resetTime: Date.now() + 60000 })),
    authFailureLimited: vi.fn(() => false),
    recordAuthFailure: vi.fn(),
    getAuthFailureLimit: vi.fn(() => null),
  }
})

vi.mock('@/lib/logger', () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

// Regex do delete, VERBATIM de app/api/storage/delete/route.ts:46 — o
// lado direito do contrato de paridade
const DELETE_REGEX = /^\d+-[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/

// Conteúdos que passam o sniff de magic bytes (lib/file-signatures.ts):
// pdf = %PDF no offset 0; txt = heurística negativa (sem NUL, sem
// assinatura binária)
const CONTEUDO = {
  'application/pdf': '%PDF-1.4 paridade b6',
  'text/plain': 'paridade b6 — texto simples\n',
} as const

async function uploadCapturandoPath(filename: string, mime: keyof typeof CONTEUDO) {
  const { getSupabaseServiceClient } = await import('@/lib/supabase-service')
  const mockUpload = vi.fn(async (path: string) => ({ data: { path }, error: null }))
  vi.mocked(getSupabaseServiceClient).mockReturnValue({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: () => ({ data: { publicUrl: 'https://x/publico' } }),
      }),
    },
  } as never)
  const { POST } = await import('../upload/route')
  const form = new FormData()
  form.append('file', new File([CONTEUDO[mime]], 'payload.bin', { type: mime }))
  form.append('filename', filename)
  const request = new NextRequest('http://localhost/api/storage/upload', { method: 'POST', body: form })
  const response = await POST(request)
  return { response, mockUpload }
}

function assertParidade(uniqueFilename: string, esperadoAposTs: string) {
  // (a) casa a regex do delete
  expect(uniqueFilename).toMatch(DELETE_REGEX)
  // (b) o schema da rota de delete aceita o path
  expect(storageSchemas.delete.safeParse({ filename: uniqueFilename }).success).toBe(true)
  // (c) igualdade LITERAL com a tabela do §5.2 (após o `<ts>-`)
  expect(uniqueFilename.replace(/^\d+-/, '')).toBe(esperadoAposTs)
}

// [nome enviado, MIME, path esperado após `<ts>-`, por que falha HOJE]
const CASOS_FAILS: Array<[string, keyof typeof CONTEUDO, string, string]> = [
  ['b6 precheck.txt', 'text/plain', 'b6_precheck.txt',
    'espaço não está na classe atual [<>:"/\\|?*] — preservado (L4.1 ao vivo)'],
  ['demo\tfinal.txt', 'text/plain', 'demo_final.txt',
    'tab não está na classe atual — preservado'],
  ['coração é ação.pdf', 'application/pdf', 'coracao_e_acao.pdf',
    'acentos e espaços não estão na classe atual — preservados'],
  ['Show (acústico).pdf', 'application/pdf', 'Show__acustico_.pdf',
    'parênteses/espaço/acento não estão na classe atual — preservados'],
  ["d'água & cia.txt", 'text/plain', 'd_agua___cia.txt',
    'apóstrofo/&/espaços não estão na classe atual — preservados'],
  ['hino #1 + bis.pdf', 'application/pdf', 'hino__1___bis.pdf',
    '#/+/espaços não estão na classe atual — preservados'],
  ['[ao vivo].pdf', 'application/pdf', '_ao_vivo_.pdf',
    'colchetes/espaço não estão na classe atual — preservados'],
  ['🎸riff.txt', 'text/plain', '_riff.txt',
    'emoji não está na classe atual — preservado (flag u: 1 "_" por code point)'],
  ['çãõ.pdf', 'application/pdf', 'cao.pdf',
    'diacríticos não estão na classe atual — preservados (sem NFD hoje)'],
]

describe('B6 PR-1 — paridade upload→delete (D5\', §5.2 do desenho)', () => {
  for (const [nome, mime, esperado, motivo] of CASOS_FAILS) {
    it.fails(`paridade: ${JSON.stringify(nome)} → "<ts>-${esperado}" (hoje falha: ${motivo})`, async () => {
      const { response, mockUpload } = await uploadCapturandoPath(nome, mime)
      expect(response.status).toBe(201)
      expect(mockUpload).toHaveBeenCalledOnce()
      assertParidade(mockUpload.mock.calls[0]![0] as string, esperado)
    })
  }

  it('paridade: ".hidden.pdf" → "<ts>-.hidden.pdf" (já-limpo: a regex do delete aceita "." em qualquer posição após o <ts>-)', async () => {
    const { response, mockUpload } = await uploadCapturandoPath('.hidden.pdf', 'application/pdf')
    expect(response.status).toBe(201)
    expect(mockUpload).toHaveBeenCalledOnce()
    assertParidade(mockUpload.mock.calls[0]![0] as string, '.hidden.pdf')
  })

  // Recusados ANTES da sanitização: refine de extensão do
  // storageSchemas.upload (lib/api-schemas.ts:230-232 —
  // split('.').pop() ∉ ALLOWED_UPLOAD_EXTENSIONS → 'File type not
  // allowed'). Asserts do 400, não da paridade.
  it('recusa-anterior: "a.pdf." (ponto final) → 400 field:"filename" File type not allowed (api-schemas.ts:230-232; pop() = "")', async () => {
    const { response, mockUpload } = await uploadCapturandoPath('a.pdf.', 'application/pdf')
    expect(response.status).toBe(400)
    const data = (await response.json()) as { code?: string; details?: unknown }
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: 'filename', message: 'File type not allowed', code: 'custom' },
    ])
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('recusa-anterior: "README" (sem extensão) → 400 field:"filename" File type not allowed (api-schemas.ts:230-232; pop() = "readme")', async () => {
    const { response, mockUpload } = await uploadCapturandoPath('README', 'text/plain')
    expect(response.status).toBe(400)
    const data = (await response.json()) as { code?: string; details?: unknown }
    expect(data.code).toBe('VALIDATION_ERROR')
    expect(data.details).toEqual([
      { field: 'filename', message: 'File type not allowed', code: 'custom' },
    ])
    expect(mockUpload).not.toHaveBeenCalled()
  })
})
