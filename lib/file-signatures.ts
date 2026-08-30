/**
 * B5 PR-2 — assinaturas de conteúdo (magic bytes) para a lista única de
 * uploads (B5-DESENHO.md §4).
 *
 * COMENTÁRIO CRUZADO com `lib/api-schemas.ts` (ALLOWED_UPLOADS /
 * ALLOWED_UPLOAD_MIMES): tipo novo na lista EXIGE regra nova aqui — o
 * teste de paridade (lib/__tests__/file-signatures.test.ts) quebra a
 * suíte se as duas tabelas divergirem.
 *
 * Módulo PURO, sem I/O: recebe bytes já em memória (rota de upload) ou
 * lidos por Range GET (reconciliação da PR-3).
 */

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const PDF_SIG = [0x25, 0x50, 0x44, 0x46, 0x2d] as const // %PDF-
const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const
const JPEG_SIG = [0xff, 0xd8, 0xff] as const
const ZIP_SIG = [0x50, 0x4b, 0x03, 0x04] as const // PK\x03\x04

function startsWith(bytes: Uint8Array, sig: readonly number[]): boolean {
  if (bytes.length < sig.length) return false
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false
  }
  return true
}

function asciiIncludes(bytes: Uint8Array, needle: string): boolean {
  const max = bytes.length - needle.length
  outer: for (let i = 0; i <= max; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i + j] !== needle.charCodeAt(j)) continue outer
    }
    return true
  }
  return false
}

function hasNulByte(bytes: Uint8Array, limit: number): boolean {
  const max = Math.min(bytes.length, limit)
  for (let i = 0; i < max; i++) {
    if (bytes[i] === 0x00) return true
  }
  return false
}

/** O que os bytes aparentam ser (só as famílias que a tabela conhece). */
export function detectSignature(bytes: Uint8Array): string | null {
  if (startsWith(bytes, PDF_SIG)) return 'application/pdf'
  if (startsWith(bytes, PNG_SIG)) return 'image/png'
  if (startsWith(bytes, JPEG_SIG)) return 'image/jpeg'
  if (startsWith(bytes, ZIP_SIG)) return 'application/zip' // família zip (inclui OOXML)
  return null
}

// docx É zip: o PK sozinho não distingue do `.zip` renomeado (item 45b —
// exatamente o furo que este módulo fecha). B5 PR-2b (decisão B5-D10):
// a busca é no buffer INTEIRO — a premissa original do desenho §4.1
// ("todo escritor OOXML real põe [Content_Types].xml como entrada
// inicial", regra dos primeiros 4096 bytes) é FALSA para o gerador do
// batch, que grava a entrada por ÚLTIMO (medido na reconciliação da
// PR-3: 20 docx reais recusados; offsets 8003/9011 e 46451/47459).
// Consequência para consumidores: a regra do docx exige o ARQUIVO
// INTEIRO (a rota já tem os bytes em memória, ≤4MB; a reconciliação
// baixa o objeto completo quando o MIME declarado é docx). LIMITAÇÃO
// que PERMANECE declarada: um zip ARTESANAL contendo essa entrada
// passa — o modelo de ameaça é consistência de dados de um app
// single-user, não adversário.
function isDocx(bytes: Uint8Array): boolean {
  return startsWith(bytes, ZIP_SIG) && asciiIncludes(bytes, '[Content_Types].xml')
}

// text/plain não tem magic byte — heurística NEGATIVA (decisão B5-D9):
// não casa com nenhuma assinatura binária da tabela E nenhum byte 0x00
// nos primeiros 8192 bytes. Pega binário renomeado `.txt`; aceita
// qualquer texto UTF-8/Latin-1. LIMITAÇÃO DECLARADA (R1 do aval do
// desenho): UTF-16 legítimo é REJEITADO por construção (bytes 0x00
// alternados) — comportamento conhecido e aceito, não bug.
function isPlausibleText(bytes: Uint8Array): boolean {
  return detectSignature(bytes) === null && !hasNulByte(bytes, 8192)
}

/** Tabela MIME declarado → regra sobre os bytes (paridade travada por teste). */
export const SIGNATURE_RULES: Record<string, (bytes: Uint8Array) => boolean> = {
  'application/pdf': (b) => startsWith(b, PDF_SIG),
  'image/png': (b) => startsWith(b, PNG_SIG),
  'image/jpeg': (b) => startsWith(b, JPEG_SIG),
  // image/jpg não é MIME oficial, mas navegadores o reportam (b8) — mesma regra
  'image/jpg': (b) => startsWith(b, JPEG_SIG),
  [DOCX_MIME]: isDocx,
  'text/plain': isPlausibleText,
}

export function contentMatchesDeclaredMime(
  bytes: Uint8Array,
  declaredMime: string
): { ok: true } | { ok: false; detected: string | null } {
  const rule = SIGNATURE_RULES[declaredMime]
  if (rule && rule(bytes)) return { ok: true }
  return { ok: false, detected: detectSignature(bytes) }
}
