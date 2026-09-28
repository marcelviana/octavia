"use client"

import { usePathname } from "next/navigation"
import type { EstadoSessao } from "@/contexts/firebase-auth-context"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"
import { FRASES_SESSAO, fraseDaFalha } from "./frases-sessao"

/**
 * I1-PR1 (H-I1-7 (c), forma A): a linha de aviso no topo, renderizada pelo
 * provider, para a falha da sessão FORA do /login — a renovação que falhou,
 * ou a abertura que falhou numa página já carregada. No /login quem fala é o
 * painel (uma falha, uma frase). Nada navega; o "Tentar de novo" é do usuário.
 */
/**
 * I1-PR-9 (decisão 9 do aval): no painel e na biblioteca a linha é desenhada pela
 * PRÓPRIA tela, abaixo do título (folha 4, `SESSAO-nao-renovada`;
 * `components/identidade/linha-da-tela.tsx`); nas telas de corpo velho segue aqui,
 * no topo, até a PR de cada uma.
 */
export const ROTAS_QUE_DESENHAM_A_LINHA: readonly string[] = ["/login", "/dashboard", "/library"]

/** I1-PR-10 (decisão 14): a visualização `/content/<id>` também desenha a linha (abaixo do cabeçalho); o editor `/content/<id>/edit`, não. */
export const desenhaNaTela = (caminho: string) => ROTAS_QUE_DESENHAM_A_LINHA.includes(caminho) || /^\/content\/[^/]+$/.test(caminho)

export function AvisoDeSessao({
  sessao,
  onTentarDeNovo,
}: {
  sessao: EstadoSessao
  onTentarDeNovo: () => void
}) {
  const pathname = usePathname()
  if (sessao.estado !== "falhou" || desenhaNaTela(pathname ?? "")) return null
  return (
    <div className="sticky top-0 z-50 p-2">
      <LinhaDeAviso
        motivo={fraseDaFalha(sessao.falha, sessao.origem)}
        acao={{ rotulo: FRASES_SESSAO["tentar-de-novo"], onPress: onTentarDeNovo }}
      />
    </div>
  )
}
