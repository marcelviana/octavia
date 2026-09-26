/**
 * I1-PR1 — CN de navegador, ramo b (H-I1-7 (d)): POST /api/auth/session → 500 no navegador, 60 s.
 *   antes  (dev server na main):  ≥ 50 voltas e ≥ 50 GET /api/profile
 *   depois (dev server na branch): 1 POST, 0 GET /api/profile, 0 navegações, 1 frase
 * Uso e regras: COMO-RODAR.md e o cabeçalho de comum.ts.
 */
import { rodar } from './comum'

void rodar('b', 500)
