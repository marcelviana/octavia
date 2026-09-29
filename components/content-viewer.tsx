"use client"

/**
 * A visualização de um content (I1-PR-10; folha `5-content-visualizacao`): o cabeçalho (voltar · título · tipo ·
 * *Editar*) e, abaixo, o corpo e a coluna lateral — lado a lado em C (vão `space.xl`, a lateral em
 * `web.colunaLateral`), empilhados em B e A. Contêiner `web.conteiner`, margem `web.margem`, respiro `space.xxl`.
 * Saíram o favoritar local e falso, o apagar inalcançável (`hooks/useContentActions.ts`, `DeleteDialog`) e a barra
 * de palco desligada (`ContentToolbar`) — decisões 20 e 28 da folha, div. 737.
 */
import { ContentHeader } from "./content-viewer/ContentHeader"
import { ContentDisplay } from "./content-viewer/ContentDisplay"
import { ContentSidebar } from "./content-viewer/ContentSidebar"
import { LimiteDoCorpo } from "@/components/content/limite-do-corpo"
import { rotuloDoTipo } from "@/components/content/frases-visualizacao"
import type { ConteudoVisto } from "@/components/content/tipos"

export interface ContentViewerProps {
  content: ConteudoVisto
  onBack: () => void
}

export function ContentViewer({ content, onBack }: ContentViewerProps) {
  return (
    <div className="w-full max-w-web-conteiner mx-auto flex flex-col text-cor-text font-fam-ui font-peso-ui leading-natural">
      <ContentHeader content={content} onBack={onBack} />
      <div className="flex flex-wrap items-start gap-espaco-xl py-espaco-xxl px-web-margem">
        <div className="grow shrink basis-full c:basis-0 min-w-0">
          <LimiteDoCorpo rotulo={rotuloDoTipo(content.content_type)}>
            <ContentDisplay content={content} />
          </LimiteDoCorpo>
        </div>
        <ContentSidebar content={content} />
      </div>
    </div>
  )
}
