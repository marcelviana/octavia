"use client"

/**
 * A TELA DE ERRO GLOBAL (I1-PR-14) — o que o limite de `app/layout.tsx` (`lib/error-boundary.tsx`) mostra quando uma
 * exceção de render escapa de toda tela. SEM FOLHA: composição mecânica (decisões 12 e 13 do aval) — a casca do auth
 * (`CascaAuth`: a marca, a coluna, o rótulo *Erro*), sempre, com ou sem sessão (o limite está por fora dos provedores
 * de sessão, div. 894); a `LinhaDeAviso` de falha com `motivo.generico` e *Tentar de novo*, que RECARREGA a página
 * (decisão 11: o *Reload page* de antes; o *Try again* que re-renderizava saiu); e, só em desenvolvimento, os detalhes
 * (a pilha do erro e a dos componentes), que quebram linha e nunca empurram a página (o "antes" rolava em B e A).
 */
import { CascaAuth } from "@/components/auth/casca-auth"
import { LinhaDeAviso } from "@/components/identidade/linha-de-aviso"
import { FRASES_ERRO } from "./frases-erro"

interface DetalhesDoErro {
  pilha?: string
  pilhaDeComponentes?: string | null
}

export interface TelaDeErroProps {
  onTentar: () => void
  /** só em desenvolvimento — quem decide é o limite, como antes */
  detalhes?: DetalhesDoErro
}

export function TelaDeErro({ onTentar, detalhes }: TelaDeErroProps) {
  return (
    <CascaAuth rotulo={FRASES_ERRO["erro.rotulo"]}>
      <LinhaDeAviso motivo={FRASES_ERRO["erro.motivo"]} acao={{ rotulo: FRASES_ERRO["erro.tentar"], onPress: onTentar }} />
      {detalhes && (
        <details className="min-w-0 border-hairline border-cor-line rounded-raio-control px-espaco-lg py-espaco-md text-tam-label text-cor-muted">
          <summary className="cursor-pointer min-h-toque-min flex items-center text-cor-text">{FRASES_ERRO["erro.detalhes"]}</summary>
          <pre className="font-fam-mono whitespace-pre-wrap break-words min-w-0 text-tam-label leading-entrelinha-text">
            {detalhes.pilha}
            {"\n\n"}
            {FRASES_ERRO["erro.pilha"]}
            {detalhes.pilhaDeComponentes}
          </pre>
        </details>
      )}
    </CascaAuth>
  )
}
