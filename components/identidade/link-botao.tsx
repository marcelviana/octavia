/**
 * Os botões do S0 — subiram de `components/auth/controles-auth.tsx` na I1-PR-7
 * (div. 687: a landing precisa deles; `components/identidade/` é a casa dos
 * componentes do molde). As classes-base, que os botões de auth também usam:
 * o principal (`touch.list`, `radius.control`, `font.uiBold` · `size.button`) e
 * o secundário (`web.botaoAuth` = touch.list + 2, contorno `lineInfo`,
 * `size.bodySmall`). A tinta de cada estado fica com quem usa.
 */
import { Icone } from "@/components/identidade/icone"
import type { NomeIcone } from "@octavia/identidade"

export const BOTAO_PRINCIPAL = "w-full h-toque-list rounded-raio-control border-hairline flex items-center justify-center gap-espaco-md font-fam-ui-bold font-peso-ui-bold text-tam-button"

export const BOTAO_SECUNDARIO = "w-full h-web-botao-auth rounded-raio-control border-hairline border-cor-line-info flex items-center justify-center gap-espaco-md text-tam-body-small"

/** O link com cara de botão (Ir para o login, Voltar para o login; Entrar e Criar conta da landing). */
export function LinkBotao({ principal, icone, children }: { principal?: boolean; icone?: NomeIcone; children: React.ReactNode }) {
  return (
    <span className={principal ? `${BOTAO_PRINCIPAL} bg-cor-text border-cor-text text-cor-bg` : `${BOTAO_SECUNDARIO} text-cor-text`}>
      {icone && <Icone nome={icone} tamanho={24} />}
      {children}
    </span>
  )
}
