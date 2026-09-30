/**
 * I1-PR-14 — as frases da tela de erro global (`tela-de-erro.tsx`; decisão 13 do aval). Sem folha: a composição é
 * mecânica (a marca do auth + a `LinhaDeAviso`). pt-BR, o estilo das outras listas: o rótulo e o botão com inicial
 * maiúscula, o resto em minúsculas. O motivo e a ação são os das listas que já existem.
 */
import { FRASES_AUTH } from "@/components/auth/frases-auth"
import { FRASES_SESSAO } from "@/components/auth/frases-sessao"

export const FRASES_ERRO = {
  "erro.rotulo": "Erro",
  "erro.motivo": FRASES_AUTH["motivo.generico"],
  "erro.tentar": FRASES_SESSAO["tentar-de-novo"],
  "erro.detalhes": "detalhes do erro (só em desenvolvimento)",
  "erro.pilha": "pilha de componentes:",
} as const
