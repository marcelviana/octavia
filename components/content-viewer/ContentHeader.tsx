"use client"

/**
 * O cabeçalho da visualização (I1-PR-10; folha 5, README-design §2.4 "cabeçalho" e "Editar"): *voltar* 24 num alvo
 * `touch.min` (nome acessível *Voltar para a biblioteca*; o `router.back()` de antes — decisão 6) · o título em
 * `font.displayMedium` · `size.titleSmall` (sem caixa alta: é dado) · o tipo 20 + *{artista} · {tipo}* em
 * `size.label` `muted` · *Editar* (`touch.list`, contorno `lineInfo`, `renomear` 24 `accentInk`) que leva a
 * `/content/[id]/edit` (decisão 5). Sem favoritar (decisão 20 da folha) e sem apagar (28). A linha quebra no
 * `web.colunaAuth` (420, o limiar que a folha usa); em B as ações têm o recuo `touch.min + space.lg`.
 */
import Link from "next/link"
import { Icone } from "@/components/identidade/icone"
import { CONTROLE_LISTA } from "@/components/identidade/controles"
import { FRASES_LISTA, tipoDe } from "@/components/library/frases-lista"
import { FRASES_VIEW } from "@/components/content/frases-visualizacao"
import type { ConteudoVisto } from "@/components/content/tipos"

export interface ContentHeaderProps {
  content: Pick<ConteudoVisto, "id" | "title" | "artist" | "content_type">
  onBack: () => void
}

export function ContentHeader({ content, onBack }: ContentHeaderProps) {
  const tipo = tipoDe(content.content_type)
  const artista = content.artist || FRASES_LISTA["lib.artista.desconhecido"]
  return (
    <header className="border-b-hairline border-cor-line py-espaco-xl px-web-margem flex flex-wrap items-center gap-y-espaco-lg gap-x-espaco-xl">
      <div className="grow shrink basis-web-coluna-auth min-w-0 flex items-center gap-espaco-lg">
        <button type="button" aria-label={FRASES_VIEW["view.voltar"]} onClick={onBack} className="w-toque-min h-toque-min shrink-0 flex items-center justify-center text-cor-text">
          <Icone nome="voltar" tamanho={24} />
        </button>
        <div className="flex-1 min-w-0 flex flex-col gap-espaco-xs">
          <h1 className="font-fam-display-medium font-peso-display-medium text-tam-title-small leading-natural text-cor-text break-words">{content.title}</h1>
          <div className="flex flex-wrap items-center gap-espaco-sm">
            <Icone nome={tipo.icone} tamanho={20} className="text-cor-line-info" />
            <p className="text-tam-label text-cor-muted">{`${artista} · ${tipo.rotulo.toLocaleLowerCase("pt-BR")}`}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-espaco-lg pl-recuo-cabecalho c:pl-0">
        <Link href={`/content/${encodeURIComponent(content.id)}/edit`} className={`${CONTROLE_LISTA} border-cor-line-info`}>
          <Icone nome="renomear" tamanho={24} className="text-cor-accent-ink" />
          {FRASES_VIEW["view.editar"]}
        </Link>
      </div>
    </header>
  )
}
