"use client"

/**
 * O cabeçalho do editor (I1-PR-11; folha 6, README-design §2.4 "cabeçalho do editor", "chip", "Salvar"): *voltar* 24
 * num alvo `touch.min` (nome acessível *Voltar sem salvar*, N12; o `router.back()` de antes) · o título em
 * `font.displayMedium` · `size.titleSmall` · o tipo em `size.label` `muted` (o selo de antes lia `content.type`, campo
 * que a linha não tem, e saía vazio) · o chip *alterações não salvas* SÓ com alteração (resposta 21) · *Salvar*
 * (`touch.list`, `garantida` 24 `accentInk` — I1-E6); inativo: o `garantida` em `lineInfo`, rótulo `muted` e, sem
 * alteração, o motivo *nada mudou desde que você abriu* (N6) ao lado; durante o envio, *Salvando…* (resposta 22).
 * Em B as ações descem com o recuo `touch.min + space.lg`. O *"Last saved: {hora}"* de antes (a hora do render) saiu.
 */
import { Icone } from "@/components/identidade/icone"
import { CONTROLE_LISTA } from "@/components/identidade/controles"
import { FRASES_EDIT } from "@/components/editors/frases-editor"

export interface CabecalhoDoEditorProps {
  titulo: string
  tipo: string
  alterado: boolean
  salvando: boolean
  onVoltar: () => void
  onSalvar: () => void
}

export function CabecalhoDoEditor({ titulo, tipo, alterado, salvando, onVoltar, onSalvar }: CabecalhoDoEditorProps) {
  const ativo = alterado && !salvando
  return (
    <header className="border-b-hairline border-cor-line py-espaco-xl px-web-margem flex flex-wrap items-center gap-y-espaco-lg gap-x-espaco-xl">
      <div className="grow shrink basis-web-coluna-auth min-w-0 flex items-center gap-espaco-lg">
        <button type="button" aria-label={FRASES_EDIT["edit.voltar"]} onClick={onVoltar} className="w-toque-min h-toque-min shrink-0 flex items-center justify-center text-cor-text">
          <Icone nome="voltar" tamanho={24} />
        </button>
        <div className="flex-1 min-w-0 flex flex-col gap-espaco-xs">
          <h1 className="font-fam-display-medium font-peso-display-medium text-tam-title-small leading-natural text-cor-text break-words">{titulo}</h1>
          <p className="text-tam-label text-cor-muted">{tipo}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-espaco-lg pl-recuo-cabecalho c:pl-0">
        {alterado && (
          <span className="h-espaco-xxl rounded-raio-chip border-hairline border-cor-offline-ink flex items-center px-espaco-md text-tam-web-metadado text-cor-offline-ink">
            {FRASES_EDIT["edit.nao-salvo"]}
          </span>
        )}
        {!alterado && <p className="text-tam-label text-cor-muted">{FRASES_EDIT["edit.nada-mudou"]}</p>}
        <button type="button" onClick={onSalvar} disabled={!ativo} className={`${CONTROLE_LISTA} border-cor-line-info disabled:text-cor-muted`}>
          <Icone nome="garantida" tamanho={24} className={ativo ? "text-cor-accent-ink" : "text-cor-line-info"} />
          {salvando ? FRASES_EDIT["edit.salvando"] : FRASES_EDIT["edit.salvar"]}
        </button>
      </div>
    </header>
  )
}
