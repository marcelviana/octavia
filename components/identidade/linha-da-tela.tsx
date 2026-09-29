"use client"

/**
 * A LINHA DA TELA (I1-PR-9; README-design §3 "uma linha por tela: se há mais de
 * uma falha, vence a que bloqueia mais"): abaixo do título, a `LinhaDeAviso` da
 * tela. A falha da SESSÃO vence a da página (decisão 9 do aval: sem sessão
 * nenhuma escrita passa) — é o `SESSAO-nao-renovada` da folha 4, com as frases
 * da PR-1 (`frases-sessao.ts`) e o *Tentar de novo* do provider.
 */
import { useAuth } from "@/contexts/firebase-auth-context"
import { FRASES_SESSAO, fraseDaFalha } from "@/components/auth/frases-sessao"
import { LinhaDeAviso, type TipoDeAviso } from "@/components/identidade/linha-de-aviso"

export interface FalhaDaTela {
  tipo: TipoDeAviso
  motivo: string
  /** I1-PR-11: a segunda linha (`muted`) — *o que você escreveu continua aqui* (N2) na falha de salvar */
  detalhe?: string
  /** sem ele, a linha não tem ação (401/403, 429 — README-design §3) */
  onTentar?: () => void
}

export function LinhaDaTela({ falha, rotuloTentar }: { falha: FalhaDaTela | null; rotuloTentar: string }) {
  const { sessao, tentarSessaoDeNovo } = useAuth()
  if (sessao.estado === "falhou") {
    return (
      <LinhaDeAviso
        motivo={fraseDaFalha(sessao.falha, sessao.origem)}
        acao={{ rotulo: FRASES_SESSAO["tentar-de-novo"], onPress: () => void tentarSessaoDeNovo() }}
      />
    )
  }
  if (!falha) return null
  return (
    <LinhaDeAviso
      tipo={falha.tipo}
      motivo={falha.motivo}
      detalhe={falha.detalhe}
      acao={falha.onTentar ? { rotulo: rotuloTentar, onPress: falha.onTentar } : undefined}
    />
  )
}
