import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Guard do registro histórico da Fase D (housekeeping pós-fila A, item 1).
 *
 * A Fase D encerrou em 2026-08-09 e seus artefatos em docs/ux/fase-d/
 * (data/ e evidence/) são o registro histórico IMUTÁVEL da medição de
 * prod. Invariante: QUALQUER rodada posterior — regressão, validação de
 * PR, diagnóstico — escreve em diretório efêmero, independente do alvo
 * (preview OU prod).
 *
 * Reabrir a escrita histórica exige opt-in explícito e deliberado:
 *   UX_AUDIT_FASE_D_HISTORICO=1
 * (somente para uma re-execução formal da Fase D, que hoje não existe).
 *
 * Mecanismo unificado: usado pelo ItemRecorder/trackSessionPosts
 * (tests/ux-audit/fase-d/recorder.ts), pelos EVIDENCE_DIR dos specs da
 * Fase D e pelo probe-auth-limit.ts — substitui o guard local que o
 * probe tinha (condicionado a UX_AUDIT_BASE_URL; o novo não depende do
 * alvo).
 */

/** Raiz do registro histórico imutável da Fase D. */
export const FASE_D_ROOT = 'docs/ux/fase-d'

let ephemeralRoot: string | null = null

export function resolveFaseDDir(sub: 'data' | 'evidence'): string {
  if (process.env.UX_AUDIT_FASE_D_HISTORICO === '1') {
    return path.join(FASE_D_ROOT, sub)
  }
  if (!ephemeralRoot) {
    ephemeralRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-audit-'))
    console.log(
      `[ux-audit] guard do histórico ativo: escrevendo em ${ephemeralRoot} ` +
        `(${FASE_D_ROOT} permanece intacto; opt-in UX_AUDIT_FASE_D_HISTORICO=1)`
    )
  }
  const dir = path.join(ephemeralRoot, sub)
  // Assert do invariante: o path efêmero resolvido nunca aponta para o
  // registro histórico (cinto e suspensório sobre o mkdtemp acima).
  if (path.resolve(dir).startsWith(path.resolve(FASE_D_ROOT) + path.sep)) {
    throw new Error(`[ux-audit] guard violado: ${dir} resolve para dentro de ${FASE_D_ROOT}`)
  }
  fs.mkdirSync(dir, { recursive: true })
  return dir
}
