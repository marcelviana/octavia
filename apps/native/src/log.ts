/**
 * Linha canônica de log do nativo — contrato em
 * `docs/native/LOGS-OCTAVIA.md` (N1-D5). Sai na tag `ReactNativeJS` do
 * logcat com o prefixo `OCTAVIA:`, e é o instrumento dos aceites A1–A22.
 *
 * **Nunca** entra aqui: token, email, senha, corpo de música, termo de busca
 * literal (só o comprimento) ou URL completa (só o último segmento).
 */
export function log(event: string): void {
  console.log('OCTAVIA: ' + event)
}
