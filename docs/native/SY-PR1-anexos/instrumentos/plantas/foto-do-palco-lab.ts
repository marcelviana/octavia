/**
 * SY-PR1 — O LABORATÓRIO DA FOTO DA SESSÃO (SY-D22), para o controle negativo do gate (iii). Instrumento de anexo (fora
 * de CI, lint e typecheck, N4-D117); **não é a implementação da PR-3**. O `cn-sy.sh` o copia sobre
 * `apps/native/src/foto-do-palco.ts` e devolve o contrato com `git checkout`.
 *
 * Sem defeito: `entrar` tira a foto, a leitura da mesma setlist devolve a foto, outra setlist lê a viva, `sair` solta.
 * Com `SY_DEFEITO=nunca-solta`: `sair` não solta — o caso `sessao-solta` tem de reprovar.
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
    setlistDaSessao: (setlistId, achar) => (foto !== null && foto.id === setlistId ? foto : achar(setlistId)),
    sair: () => {
      if (DEFEITO !== 'nunca-solta') foto = null
    },
  }
}
