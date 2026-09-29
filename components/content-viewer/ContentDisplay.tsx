"use client"

/**
 * O corpo da visualização (I1-PR-10; folha 5, "corpo | detalhes"): a coluna do corpo — `flex 1 1 0` e
 * **`min-width: 0`** (sem ele a linha longa em `whitespace-pre` empurrava a coluna lateral para fora da tela: os 9
 * (b) de 1138 da linha de base, `docs/ux/I1-PR10-anexos/README.md` §6) — com a linha da tela no topo (a falha do
 * arquivo; a da SESSÃO vence, decisão 14) e o(s) painel(is) do tipo. Em B e A, largura toda.
 * O `scale(zoom)` inerte de antes saiu (o zoom estava sempre em 100 — div. 745).
 */
import { useState } from "react"
import { ContentType, normalizeContentType } from "@/types/content"
import { LinhaDaTela, type FalhaDaTela } from "@/components/identidade/linha-da-tela"
import { FRASES_VIEW } from "@/components/content/frases-visualizacao"
import type { ConteudoVisto } from "@/components/content/tipos"
import { SheetMusicDisplay } from "./SheetMusicDisplay"
import { TabDisplay } from "./TabDisplay"
import { ChordDisplay } from "./ChordDisplay"
import { LyricsDisplay } from "./LyricsDisplay"

export function ContentDisplay({ content }: { content: ConteudoVisto }) {
  const [falha, setFalha] = useState<FalhaDaTela | null>(null)
  const tipo = normalizeContentType(content.content_type)
  return (
    <div className="flex flex-col gap-espaco-lg">
      <LinhaDaTela falha={falha} rotuloTentar={FRASES_VIEW["acao.tentar"]} />
      {tipo === ContentType.SHEET && <SheetMusicDisplay content={content} aoFalhar={setFalha} />}
      {tipo === ContentType.TAB && <TabDisplay content={content} />}
      {tipo === ContentType.CHORDS && <ChordDisplay content={content} />}
      {tipo === ContentType.LYRICS && <LyricsDisplay content={content} />}
    </div>
  )
}
