"use client"

/**
 * A conta na casca (I1-PR-9; README-design §2.4 "conta": `touch.min` × `touch.min`,
 * `radius.pill`, `font.uiBold` · `size.label`; nome acessível *Conta de {nome}*).
 * O menu é só *Sair* (I1-E13: *Perfil* saiu com a página, I1-D19; sem o
 * cabeçalho nome + e-mail e sem a foto). O `signOut()` é o de antes.
 */
import { useAuth } from "@/contexts/firebase-auth-context"
import { Icone } from "@/components/identidade/icone"
import { FRASES_CASCA, iniciais } from "@/components/identidade/frases-casca"
import { ItemDoMenu, PainelDoMenu, useMenu } from "@/components/identidade/menu"

const BOTAO = "w-toque-min h-toque-min shrink-0 rounded-raio-pill border-hairline border-cor-line-info flex items-center justify-center font-fam-ui-bold font-peso-ui-bold text-tam-label text-cor-text"

export function ContaDaCasca() {
  const { user, profile, signOut, isLoading } = useAuth()
  const menu = useMenu()
  if (isLoading || !user) return <div aria-hidden="true" className={BOTAO} />
  const nome = profile?.full_name || user.email || ""
  return (
    <div ref={menu.ref} className="relative shrink-0">
      <button
        type="button"
        data-testid="casca-conta"
        aria-label={FRASES_CASCA["casca.conta"].replace("{nome}", nome)}
        aria-haspopup="menu"
        aria-expanded={menu.aberto}
        onClick={menu.alternar}
        className={BOTAO}
      >
        {iniciais(profile?.full_name, user.email)}
      </button>
      {menu.aberto && (
        <PainelDoMenu className="right-0 mt-espaco-sm py-espaco-sm">
          <ItemDoMenu testid="casca-sair" onSelect={() => { menu.fechar(); void signOut() }}>
            <Icone nome="sair" tamanho={20} className="text-cor-line-info" />
            {FRASES_CASCA["casca.sair"]}
          </ItemDoMenu>
        </PainelDoMenu>
      )}
    </div>
  )
}
