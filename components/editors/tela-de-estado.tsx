"use client"

/**
 * Os estados da rota do editor sem o editor (I1-PR-11; folha 6: `EDIT-carregando-auth`, `-carregando`,
 * `-carregando-editor`, `-sem-usuario`, `-erro-*`, `-404`), TODOS na casca (decisão 4 do aval — antes, fora dela, e o
 * sem usuário era `return null`). A linha da tela no topo (a falha da carga com o motivo da espécie; a da sessão
 * vence) e, no centro (respiro `space.xxxl`), a frase em `font.display` · `size.title` · `tracking.display`, caixa
 * alta, e as ações *Voltar* (o `router.back()` de antes) · *Ir para a biblioteca* (a `/library` de antes). O `data-tela`
 * (não `data-testid`: a coleta do G-faixa marcaria o invólucro como nó) é o que o medidor espera.
 */
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Casca, ConteudoDaCasca } from "@/components/identidade/casca"
import { Icone } from "@/components/identidade/icone"
import { CONTROLE_LISTA } from "@/components/identidade/controles"
import { LinhaDaTela, type FalhaDaTela } from "@/components/identidade/linha-da-tela"
import { FRASES_EDIT } from "@/components/editors/frases-editor"

export interface TelaDeEstadoProps {
  frase?: string
  falha?: FalhaDaTela | null
  acoes?: boolean
  testid: string
}

export function TelaDeEstado({ frase, falha = null, acoes = false, testid }: TelaDeEstadoProps) {
  const router = useRouter()
  return (
    <Casca>
      <ConteudoDaCasca>
        <LinhaDaTela falha={falha} rotuloTentar={FRASES_EDIT["acao.tentar"]} />
        <div data-tela={testid} className="py-espaco-xxxl flex flex-col items-center justify-center gap-espaco-xl text-center">
          {frase && <p className="font-fam-display font-peso-display text-tam-title tracking-display uppercase leading-natural">{frase}</p>}
          {acoes && (
            <div className="flex flex-wrap justify-center gap-espaco-lg">
              <button type="button" onClick={() => router.back()} className={`${CONTROLE_LISTA} border-cor-line-info`}>
                <Icone nome="voltar" tamanho={24} />
                {FRASES_EDIT["acao.voltar"]}
              </button>
              <Link href="/library" className={`${CONTROLE_LISTA} border-cor-line-info`}>{FRASES_EDIT["edit.ir-biblioteca"]}</Link>
            </div>
          )}
        </div>
      </ConteudoDaCasca>
    </Casca>
  )
}
