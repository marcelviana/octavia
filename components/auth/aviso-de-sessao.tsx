"use client"

import { usePathname } from "next/navigation"
import type { EstadoSessao } from "@/contexts/firebase-auth-context"
import { LinhaDeAviso } from "./linha-de-aviso"
import { FRASES_SESSAO, fraseDaFalha } from "./frases-sessao"

/**
 * I1-PR1 (H-I1-7 (c), forma A): a linha de aviso no topo, renderizada pelo
 * provider, para a falha da sessão FORA do /login — a renovação que falhou,
 * ou a abertura que falhou numa página já carregada. No /login quem fala é o
 * painel (uma falha, uma frase). Nada navega; o "Tentar de novo" é do usuário.
 */
export function AvisoDeSessao({
  sessao,
  onTentarDeNovo,
}: {
  sessao: EstadoSessao
  onTentarDeNovo: () => void
}) {
  const pathname = usePathname()
  if (sessao.estado !== "falhou" || pathname === "/login") return null
  return (
    <div className="sticky top-0 z-50 p-2">
      <LinhaDeAviso
        motivo={fraseDaFalha(sessao.falha, sessao.origem)}
        acao={{ rotulo: FRASES_SESSAO["tentar-de-novo"], onPress: onTentarDeNovo }}
      />
    </div>
  )
}
