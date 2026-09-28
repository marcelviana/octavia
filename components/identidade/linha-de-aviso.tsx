"use client"

/**
 * A LINHA DE AVISO do web — o componente da folha `0-linha-de-aviso` (I1-PR1;
 * restilizada na I1-PR6 pelos tokens de `@octavia/identidade`). Um só: as
 * próximas superfícies importam este arquivo. Mesmo nome e mesma forma de props
 * do nativo (`apps/native/src/screens/LinhaDeAviso.tsx`: `motivo` + `acao`).
 *
 * README-design §3: altura mín. `touch.min`; respiro (touch.min − 20) / 2 e
 * `space.xl`; vão `space.md`; texto `size.label`, entrelinha 20, `text`, cresce e
 * NUNCA elide; o detalhe em `muted`. O bloco do texto quebra com base no
 * `web.limiarAviso` e a ação *Tentar de novo* (botão de 36 num alvo `touch.min`)
 * desce quando não cabe. Tipos: falha · sem conexão · limite · sucesso.
 * O motivo é o PRIMEIRO `<span>` da linha (o CN da PR-1 o lê assim).
 */
import { Icone } from "@/components/identidade/icone"
import type { NomeIcone } from "@octavia/identidade"

export type TipoDeAviso = "falha" | "rede" | "limite" | "sucesso"

export interface AcaoDoAviso {
  rotulo: string
  onPress: () => void
  inativo?: boolean
}

export interface LinhaDeAvisoProps {
  motivo: string
  tipo?: TipoDeAviso
  detalhe?: string
  acao?: AcaoDoAviso
  className?: string
}

const ICONE: Record<TipoDeAviso, { nome: NomeIcone; tinta: string }> = {
  falha: { nome: "falha", tinta: "text-cor-error-ink" },
  rede: { nome: "sem-conexao", tinta: "text-cor-offline-ink" },
  limite: { nome: "ultima-sincronizacao", tinta: "text-cor-offline-ink" },
  sucesso: { nome: "garantida", tinta: "text-cor-accent-ink" },
}

export function LinhaDeAviso({ motivo, tipo = "falha", detalhe, acao, className = "" }: LinhaDeAvisoProps) {
  const icone = ICONE[tipo]
  return (
    <div
      role={tipo === "sucesso" ? "status" : "alert"}
      className={`w-full min-h-toque-min bg-cor-bg border-hairline border-cor-line flex flex-wrap items-center gap-espaco-md py-aviso-respiro px-espaco-xl font-fam-ui font-peso-ui ${className}`}
    >
      <div className="grow shrink basis-web-limiar-aviso min-w-0 flex items-start gap-espaco-md">
        <Icone nome={icone.nome} tamanho={20} className={icone.tinta} />
        <div className="flex flex-col gap-espaco-xs min-w-0">
          <span className="text-tam-label leading-web-entrelinha-aviso text-cor-text break-words">{motivo}</span>
          {detalhe && <span className="text-tam-label leading-web-entrelinha-aviso text-cor-muted break-words">{detalhe}</span>}
        </div>
      </div>
      {acao && (
        <button
          type="button"
          onClick={acao.onPress}
          disabled={acao.inativo}
          className="shrink-0 h-toque-min flex items-center disabled:text-cor-muted"
        >
          <span className="h-web-botao-aviso rounded-raio-control border-hairline border-cor-line-info flex items-center gap-espaco-sm px-espaco-md text-tam-label text-cor-text whitespace-nowrap">
            <Icone nome="tentar-novamente" tamanho={20} />
            {acao.rotulo}
          </span>
        </button>
      )}
    </div>
  )
}
