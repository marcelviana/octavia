"use client"

/**
 * O limite de render do CORPO (I1-PR-10; folha 5, `VIEW-erro-render`; div. 744): uma exceção de render no corpo
 * mostra a `LinhaDeAviso` *"algo deu errado"* com *Tentar de novo* (volta a renderizar — o *"Try again"* de antes;
 * *"Reload page"* e o `error.message` cru saem, nota da folha) e o painel do tipo vazio; a casca, o cabeçalho e os
 * detalhes ficam de pé. O `lib/error-boundary.tsx` (o limite global de `app/layout.tsx`) não muda.
 */
import { Component, type ErrorInfo, type ReactNode } from "react"
import logger from "@/lib/logger"
import { LinhaDaTela } from "@/components/identidade/linha-da-tela"
import { CentroDoPainel, Painel } from "@/components/content/painel"
import { FRASES_VIEW } from "@/components/content/frases-visualizacao"

interface Props { rotulo: string; children: ReactNode }

export class LimiteDoCorpo extends Component<Props, { falhou: boolean }> {
  state = { falhou: false }

  static getDerivedStateFromError() {
    return { falhou: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("Visualização: exceção de render no corpo", error, info)
  }

  render() {
    if (!this.state.falhou) return this.props.children
    return (
      <div className="flex flex-col gap-espaco-lg">
        <LinhaDaTela
          falha={{ tipo: "falha", motivo: FRASES_VIEW["view.erro.render"], onTentar: () => this.setState({ falhou: false }) }}
          rotuloTentar={FRASES_VIEW["acao.tentar"]}
        />
        <Painel rotulo={this.props.rotulo}><CentroDoPainel /></Painel>
      </div>
    )
  }
}
