/**
 * Renovação do ID token (PRD T1-R2): o cliente pede o token ao SDK antes de
 * cada request e força renovação quando faltam menos que o buffer para o
 * `exp` do JWT — o mesmo buffer de 5 min do web (`lib/auth-manager.ts:10`).
 * Lógica pura: o SDK do Firebase entra por injeção na camada de rede
 * (`createAuthFetch`), nunca aqui.
 */

/**
 * Renovar agora? `exp` em SEGUNDOS (campo do JWT), `now` em MILISSEGUNDOS
 * (`Date.now()`). O limite é inclusivo: faltando exatamente `bufferSeconds`,
 * renova.
 */
export function shouldRefresh(expSeconds: number, nowMs: number, bufferSeconds = 300): boolean {
  if (!Number.isFinite(expSeconds)) return true
  return expSeconds * 1000 - nowMs <= bufferSeconds * 1000
}

// Alfabeto base64url (RFC 4648 §5) — decodificação própria porque o core não
// tem `lib.dom` (`atob`) nem os tipos do Node (`Buffer`), por decisão de
// isolamento (N0-PRECHECK C1/E3).
const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function decodeBase64Url(input: string): string | null {
  const source = input.replace(/=+$/, '')
  const bytes: number[] = []
  let acc = 0
  let bits = 0
  for (const char of source) {
    const value = BASE64URL.indexOf(char)
    if (value < 0) return null
    acc = (acc << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((acc >> bits) & 0xff)
    }
  }
  return decodeUtf8(bytes)
}

function decodeUtf8(bytes: number[]): string | null {
  let out = ''
  let i = 0
  while (i < bytes.length) {
    const first = bytes[i]
    if (first === undefined) return null
    let codePoint: number
    let length: number
    if (first < 0x80) {
      codePoint = first
      length = 1
    } else if ((first & 0xe0) === 0xc0) {
      codePoint = first & 0x1f
      length = 2
    } else if ((first & 0xf0) === 0xe0) {
      codePoint = first & 0x0f
      length = 3
    } else if ((first & 0xf8) === 0xf0) {
      codePoint = first & 0x07
      length = 4
    } else {
      return null
    }
    if (i + length > bytes.length) return null
    for (let j = 1; j < length; j++) {
      const next = bytes[i + j]
      if (next === undefined || (next & 0xc0) !== 0x80) return null
      codePoint = (codePoint << 6) | (next & 0x3f)
    }
    out += String.fromCodePoint(codePoint)
    i += length
  }
  return out
}

/**
 * `exp` (segundos) do payload de um ID token, **sem verificar assinatura** —
 * o servidor é quem verifica (`docs/api/AUTH.md`); aqui só se lê o relógio
 * para decidir a renovação. `null` quando o token não tem três partes, o
 * payload não é base64url/JSON, ou não há `exp` numérico.
 */
export function decodeExp(idToken: string): number | null {
  const parts = idToken.split('.')
  if (parts.length !== 3) return null
  const payload = parts[1]
  if (payload === undefined || payload.length === 0) return null
  const json = decodeBase64Url(payload)
  if (json === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const exp = (parsed as { exp?: unknown }).exp
  return typeof exp === 'number' && Number.isFinite(exp) ? exp : null
}
