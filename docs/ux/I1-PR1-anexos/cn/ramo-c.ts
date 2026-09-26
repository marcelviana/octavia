/**
 * I1-PR1 — CN de navegador, ramo c (H-I1-7 (e)): POST /api/auth/session → 429 (Retry-After: 60)
 * no navegador, 60 s, com a cota de /api/profile LIMPA (dev server recém-subido: a cota é memória
 * do processo, lib/user-rate-limit.ts).
 *   antes  (dev server na main):  ≥ 50 voltas e ≥ 50 GET /api/profile
 *   depois (dev server na branch): 1 POST, 0 GET /api/profile, 0 navegações, 1 frase
 * Uso e regras: COMO-RODAR.md e o cabeçalho de comum.ts.
 */
import { rodar } from './comum'

void rodar('c', 429)
