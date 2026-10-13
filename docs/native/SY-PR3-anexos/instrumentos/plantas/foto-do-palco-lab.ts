/**
 * SY-PR3 — O LABORATÓRIO DA FOTO DA SESSÃO, para os controles negativos do gate (iii): a cópia do da SY-PR1
 * (`SY-PR1-anexos/instrumentos/plantas/foto-do-palco-lab.ts`) com UM defeito a mais. Instrumento de anexo (fora de CI,
 * lint e typecheck, N4-D117). O `cn-sy-pr3.sh` o copia sobre `apps/native/src/foto-do-palco.ts` e devolve o arquivo com
 * `git checkout`.
 *
 * Sem defeito: `entrar` tira a foto, a leitura da mesma setlist devolve a foto, outra setlist lê a viva, `sair` solta.
 *   SY_DEFEITO=nunca-solta  `sair` não solta                                → `sessao-solta` (o da PR-1)
 *   SY_DEFEITO=serve-outra  a foto de uma setlist serve a QUALQUER setlist  → `sessao-outra-setlist` (SY-D45, div. 1283:
 *                           o caso que passava sem controle negativo)
 */
import type { SetlistDTO } from '@octavia/core'

export type AcharSetlist = (setlistId: string) => SetlistDTO | undefined
export interface FotoDaSessao {
  entrar(setlistId: string, achar: AcharSetlist): void
  setlistDaSessao(setlistId: string, achar: AcharSetlist): SetlistDTO | undefined
  sair(): void
}

const DEFEITO = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.SY_DEFEITO ?? ''

export function criarFotoDaSessao(): FotoDaSessao {
  let foto: SetlistDTO | null = null
  return {
    entrar: (setlistId, achar) => {
      foto = achar(setlistId) ?? null
    },
    setlistDaSessao: (setlistId, achar) =>
      foto !== null && (foto.id === setlistId || DEFEITO === 'serve-outra') ? foto : achar(setlistId),
    sair: () => {
      if (DEFEITO !== 'nunca-solta') foto = null
    },
  }
}
