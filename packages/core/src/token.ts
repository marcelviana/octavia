/**
 * Renovação do ID token (PRD T1-R2): o cliente força renovação quando faltam
 * menos que o buffer de 5 min para o `exp` do JWT — o mesmo do web
 * (`lib/auth-manager.ts:10`).
 *
 * Commit 1 de 2 (regra nº 7): stub — a implementação entra no commit 2.
 */

export function shouldRefresh(
  _expSeconds: number,
  _nowMs: number,
  _bufferSeconds = 300,
): boolean {
  throw new Error('not implemented')
}

export function decodeExp(_idToken: string): number | null {
  throw new Error('not implemented')
}
