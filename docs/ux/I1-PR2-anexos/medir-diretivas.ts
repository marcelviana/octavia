/**
 * I1-PR2, commit 1 — a medição "uma diretiva por vez" (rastro).
 *
 * Mesma sonda do CN (`tests/gates-web/google-csp.cn.ts`), contra o `pnpm dev`
 * em :3000, sem sessão, SEM interceptar o Google. A CSP do /login é aplicada
 * (report-only → enforce, mesmo valor) e, por cima, a variante acrescenta só o
 * que as variáveis pedem — reescrevendo o cabeçalho do documento /login local
 * no navegador; nenhum arquivo do app muda para medir.
 *
 *   SONDA_SCRIPT="https://apis.google.com"      acrescenta ao script-src
 *   SONDA_FRAME="https://<origem>"               troca o frame-src 'none' por isto
 *                                                (a origem que a variante (a) mediu)
 *   SONDA_COOP="same-origin-allow-popups"        troca o Cross-Origin-Opener-Policy
 *
 * Uso: pnpm tsx docs/ux/I1-PR2-anexos/medir-diretivas.ts <pasta> "<título>"
 * Para na página de login do Google: nada se digita, nada se clica nela.
 */
import { gravar, sondar, veredito } from '../../../tests/gates-web/google-csp.cn'

const script = process.env.SONDA_SCRIPT
const frame = process.env.SONDA_FRAME
const coop = process.env.SONDA_COOP
const [pasta, titulo] = process.argv.slice(2)

const trocar = (csp: string, dir: string, f: (v: string) => string) =>
  csp.split('; ').map((d) => (d.split(' ')[0] === dir ? f(d) : d)).join('; ')

sondar({
  base: 'http://localhost:3000',
  cabecalhos: (h) => {
    let csp = h['content-security-policy']
    if (script) csp = trocar(csp, 'script-src', (d) => `${d} ${script}`)
    if (frame) csp = trocar(csp, 'frame-src', () => `frame-src ${frame}`)
    const out = { ...h, 'content-security-policy': csp }
    if (coop) out['cross-origin-opener-policy'] = coop
    return out
  },
}).then((r) => {
  // a origem bloqueada no frame-src vai só para o terminal (é o SONDA_FRAME da variante seguinte)
  for (const v of r.violacoes) if (v.includes('directive=frame-src')) console.log(`frame-src bloqueou: ${new URL(v.split('blocked=')[1].split(' ')[0]).origin}`)
  // o host do authDomain vira <authDomain> no anexo (o `gravar` do CN)
  gravar(pasta, r, titulo)
  const m = veredito(r)
  console.log(`${titulo}: ${r.parada ? 'PARADA ' + r.parada : m.length ? 'REPROVA\n  - ' + m.join('\n  - ') : 'PASSA'}`)
})
