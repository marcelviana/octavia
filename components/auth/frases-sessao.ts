/**
 * I1-PR1 — as frases da sessão (lista declarada da I1-D10/D17; tabela em
 * `docs/ux/I1-PR1-anexos/README.md`). pt-BR, no estilo de
 * `packages/core/src/frases.ts`: minúsculas, travessão. O web não importa o
 * conjunto do nativo neste bloco (I1-D10) — a unificação é herança do N4.
 */
import type { FalhaSessao } from '@/lib/firebase-session-cookies'

export const FRASES_SESSAO = {
  rede: 'sem conexão — a sessão não foi aberta',
  recusado: 'o servidor não aceitou o login — entre de novo',
  'limite-com-prazo': 'muitas tentativas de entrar — tente de novo em {N}',
  'limite-sem-prazo': 'muitas tentativas de entrar — tente de novo em instantes',
  servidor: 'falha no servidor — a sessão não foi aberta',
  renovacao: 'a sessão não foi renovada: {razão}',
  'tentar-de-novo': 'Tentar de novo',
} as const

/** A razão sem o fecho "a sessão não foi aberta" — o que entra no `{razão}` da renovação. */
const RAZAO_CURTA: Record<FalhaSessao['motivo'], string> = {
  rede: 'sem conexão',
  recusado: 'o servidor não aceitou o login — entre de novo',
  limite: '',
  servidor: 'falha no servidor',
}

/** `{N}` só existe quando o `Retry-After` veio: < 60 → "N s"; senão "M min" (arredondado para cima). */
function prazo(segundos: number): string {
  return segundos < 60 ? `${segundos} s` : `${Math.ceil(segundos / 60)} min`
}

function fraseDoLimite(retryAfterS: number | null): string {
  return retryAfterS === null
    ? FRASES_SESSAO['limite-sem-prazo']
    : FRASES_SESSAO['limite-com-prazo'].replace('{N}', prazo(retryAfterS))
}

export function fraseDaFalha(falha: FalhaSessao, origem: 'abertura' | 'renovacao'): string {
  if (origem === 'renovacao') {
    const razao = falha.motivo === 'limite' ? fraseDoLimite(falha.retryAfterS) : RAZAO_CURTA[falha.motivo]
    return FRASES_SESSAO.renovacao.replace('{razão}', razao)
  }
  if (falha.motivo === 'limite') return fraseDoLimite(falha.retryAfterS)
  return FRASES_SESSAO[falha.motivo]
}
