"use client"

/**
 * *Detalhes* (I1-PR-11; folha 6, a coluna lateral; decisão 10 do aval): Básico · Música · Organização, SEMPRE
 * abertos (o acordeão e o resumo *"n of 4 completed"* de antes saíram — div. 780). Em C, `web.colunaLateral` (320) ao
 * lado do corpo; em B e A desce (`web.empilha`). O que cada campo muda é o de antes (`{ ...content, ...updates }`);
 * o *Compasso* segue editável e segue SEM ir no corpo do `PUT` (div. 771, herança D — `content-editor.tsx`).
 */
import { useState } from "react"
import { Icone } from "@/components/identidade/icone"
import { CaixaDeMarcar, Campo, ENTRADA_META, Selecao } from "@/components/editors/campos"
import { COMPASSOS, DIFICULDADES_EDIT, FRASES_EDIT, GENEROS, TONS, fraseEdit } from "@/components/editors/frases-editor"

interface UnifiedMetadataEditorProps {
  content: any
  onChange: (content: any) => void
}

const GRUPO = "flex flex-col gap-espaco-md border-t-hairline border-cor-line pt-espaco-lg"
const ROTULO_GRUPO = "font-fam-mono font-peso-mono text-tam-label-small tracking-label uppercase text-cor-muted leading-natural"

export function UnifiedMetadataEditor({ content, onChange }: UnifiedMetadataEditorProps) {
  const [newTag, setNewTag] = useState("")

  const updateContent = (updates: any) => {
    onChange({ ...content, ...updates })
  }

  const addTag = () => {
    if (newTag.trim() && !content.tags?.includes(newTag.trim())) {
      updateContent({ tags: [...(content.tags || []), newTag.trim()] })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateContent({ tags: content.tags?.filter((tag: string) => tag !== tagToRemove) || [] })
  }

  const texto = (campo: string, rotulo: string, testid: string, extra: Record<string, string> = {}) => (
    <Campo rotulo={rotulo} id={`meta-${campo}`}>
      <input id={`meta-${campo}`} data-testid={testid} value={content[campo] || ""} onChange={(e) => updateContent({ [campo]: e.target.value })} className={ENTRADA_META} {...extra} />
    </Campo>
  )
  const selecao = (campo: string, rotulo: string, testid: string, opcoes: typeof TONS, escolha: string, padrao = "") => (
    <Campo rotulo={rotulo} id={`meta-${campo}`}>
      <Selecao id={`meta-${campo}`} testid={testid} meta valor={content[campo] || padrao} opcoes={opcoes} escolha={escolha} onMudar={(v) => updateContent({ [campo]: v })} />
    </Campo>
  )

  return (
    <aside className="grow shrink basis-full c:grow-0 c:shrink-0 c:basis-web-coluna-lateral c:box-content min-w-0 border-hairline border-cor-line rounded-raio-control pt-espaco-lg px-espaco-xl pb-espaco-xl flex flex-col gap-espaco-lg">
      <h2 className="font-fam-display font-peso-display text-tam-button tracking-display uppercase text-cor-muted leading-natural">{FRASES_EDIT["edit.meta.detalhes"]}</h2>
      <div className={GRUPO}>
        <h3 className={ROTULO_GRUPO}>{FRASES_EDIT["edit.meta.basico"]}</h3>
        {texto("title", FRASES_EDIT["edit.meta.titulo"], "campo-titulo")}
        {texto("artist", FRASES_EDIT["edit.meta.artista"], "campo-artista")}
        {texto("album", FRASES_EDIT["edit.meta.album"], "campo-album", { placeholder: FRASES_EDIT["edit.meta.album.exemplo"] })}
        {selecao("genre", FRASES_EDIT["edit.meta.genero"], "campo-genero", GENEROS, FRASES_EDIT["edit.meta.genero.escolha"])}
      </div>
      <div className={GRUPO}>
        <h3 className={ROTULO_GRUPO}>{FRASES_EDIT["edit.meta.musica"]}</h3>
        {selecao("key", FRASES_EDIT["edit.meta.tom"], "campo-tom", TONS, FRASES_EDIT["edit.meta.escolha"])}
        {texto("bpm", FRASES_EDIT["edit.meta.bpm"], "campo-bpm", { type: "number", placeholder: "120" })}
        {selecao("time_signature", FRASES_EDIT["edit.meta.compasso"], "campo-compasso", COMPASSOS, FRASES_EDIT["edit.meta.escolha"], "4/4")}
        {selecao("difficulty", FRASES_EDIT["edit.meta.dificuldade"], "campo-dificuldade", DIFICULDADES_EDIT, FRASES_EDIT["edit.meta.escolha"])}
      </div>
      <div className={GRUPO}>
        <h3 className={ROTULO_GRUPO}>{FRASES_EDIT["edit.meta.organizacao"]}</h3>
        <Campo rotulo={FRASES_EDIT["edit.meta.tags"]} id="meta-tags">
          <div className="relative flex items-center">
            <input id="meta-tags" data-testid="campo-tags" value={newTag} onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder={FRASES_EDIT["edit.meta.tags.exemplo"]} className={`${ENTRADA_META} pr-toque-min`} />
            <button type="button" aria-label={FRASES_EDIT["edit.meta.tags.adicionar"]} onClick={addTag}
              className="absolute right-0 w-toque-min h-toque-min flex items-center justify-center text-cor-accent-ink">
              <Icone nome="adicionar" tamanho={20} />
            </button>
          </div>
        </Campo>
        {content.tags?.length > 0 && (
          <div className="flex flex-wrap gap-espaco-sm">
            {content.tags.map((tag: string) => (
              <button key={tag} type="button" aria-label={fraseEdit("edit.meta.tags.tirar", { x: tag })} onClick={() => removeTag(tag)}
                className="h-toque-min rounded-raio-chip border-hairline border-cor-line flex items-center gap-espaco-xs px-espaco-md text-tam-label text-cor-text">
                {tag}
                <Icone nome="fechar" tamanho={20} className="text-cor-muted" />
              </button>
            ))}
          </div>
        )}
        <Campo rotulo={FRASES_EDIT["edit.meta.notas"]} id="meta-notes">
          <textarea id="meta-notes" data-testid="campo-notas" value={content.notes || ""} onChange={(e) => updateContent({ notes: e.target.value })}
            placeholder={FRASES_EDIT["edit.meta.notas.exemplo"]} rows={1}
            className="w-full min-h-toque-min rounded-raio-control border-hairline border-cor-line-info bg-cor-bg py-espaco-md px-espaco-lg text-tam-body leading-natural text-cor-text placeholder:text-cor-muted resize-y" />
        </Campo>
        <CaixaDeMarcar rotulo={FRASES_EDIT["edit.meta.favorita"]} marcado={content.is_favorite || false} onMudar={(v) => updateContent({ is_favorite: !!v })} />
        <CaixaDeMarcar rotulo={FRASES_EDIT["edit.meta.publica"]} marcado={content.is_public || false} onMudar={(v) => updateContent({ is_public: !!v })} />
      </div>
    </aside>
  )
}
