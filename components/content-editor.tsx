"use client"

/**
 * O editor de um content (I1-PR-11; folha `6-content-editor`): o cabeçalho e, abaixo, o corpo por tipo e *Detalhes*
 * — lado a lado em C (vão `space.xl`, *Detalhes* em `web.colunaLateral`), empilhados em B e A. A linha da tela (a falha
 * de salvar com *o que você escreveu continua aqui*, N2; a do arquivo da partitura; a da sessão vence) fica no topo do
 * corpo. Contêiner `web.conteiner`, margem `web.margem`, respiro `space.xxl`.
 *
 * O ESTADO (`editedContent`) e o CORPO do `PUT` são os de antes, linha a linha — gate byte a byte em
 * `tests/gates/i1-editor-put.test.tsx`. Duas coisas mudaram, decididas no aval: *alterações não salvas* e o *Salvar*
 * ativo quando o corpo do `PUT` (sem o `updated_at`) difere do corpo de abertura (decisão 2; antes o estado normalizado
 * — `null → ""` — contra a linha crua marcava alteração ao abrir, div. 772); e o *Salvar* inativo durante o envio
 * (decisão 5 — um clique duplo não manda dois `PUT`). O *Compasso* segue fora do corpo (div. 771, herança D).
 * O morto de antes saiu: `zoom`, `selectedTool`, `canvasRef`, as ferramentas e as cores de anotação (nada os lia).
 */
import { useMemo, useState } from "react"
import { CabecalhoDoEditor } from "@/components/editors/cabecalho-do-editor"
import { ContentTypeEditor } from "@/components/editors/content-type-editor"
import { UnifiedMetadataEditor } from "@/components/unified-metadata-editor"
import { LinhaDaTela, type FalhaDaTela } from "@/components/identidade/linha-da-tela"
import { FRASES_EDIT } from "@/components/editors/frases-editor"
import { rotuloDoTipo } from "@/components/content/frases-visualizacao"
import { ContentType, normalizeContentType } from "@/types/content"

interface ContentEditorProps {
  content: any
  onSave: (updatedContent: any) => void
  onCancel: () => void
  salvando?: boolean
  falhaAoSalvar?: FalhaDaTela | null
}

const estadoInicial = (content: any) => ({
  ...content,
  // Map database fields to editor fields
  title: content.title || "",
  artist: content.artist || "",
  album: content.album || "",
  genre: content.genre || "",
  key: content.key || "",
  bpm: content.bpm || "",
  difficulty: content.difficulty || "",
  tags: content.tags || [],
  notes: content.notes || "",
  is_favorite: content.is_favorite || false,
  is_public: content.is_public || false,
  content_data: content.content_data || {},
})

/** O corpo do `PUT` de antes, sem o `updated_at` (que o salvar põe no fim, como antes). */
function corpoDoPut(editedContent: any, annotations: any[], contentType: string) {
  return {
    title: editedContent.title,
    artist: editedContent.artist,
    album: editedContent.album,
    genre: editedContent.genre,
    key: editedContent.key,
    bpm: editedContent.bpm ? Number.parseInt(editedContent.bpm) : null,
    difficulty: editedContent.difficulty,
    tags: editedContent.tags,
    notes: editedContent.notes,
    is_favorite: editedContent.is_favorite,
    is_public: editedContent.is_public,
    content_data: {
      ...editedContent.content_data,
      annotations,
      // Store editor-specific data
      ...(normalizeContentType(contentType) === ContentType.CHORDS && editedContent.sections && { sections: editedContent.sections }),
      ...(normalizeContentType(contentType) === ContentType.LYRICS && editedContent.lyrics && { lyrics: editedContent.lyrics }),
      ...(normalizeContentType(contentType) === ContentType.TAB && editedContent.measures && { measures: editedContent.measures }),
    },
  }
}

export function ContentEditor({ content, onSave, onCancel, salvando = false, falhaAoSalvar = null }: ContentEditorProps) {
  const [editedContent, setEditedContent] = useState(() => estadoInicial(content))
  // o `annotations` de antes: estado local que nada escreve — vai `[]` no corpo, como antes (herança D, §1.2)
  const [annotations] = useState<any[]>([])
  const [falhaDoArquivo, setFalhaDoArquivo] = useState<FalhaDaTela | null>(null)
  const inicial = useMemo(() => JSON.stringify(corpoDoPut(estadoInicial(content), [], content.content_type)), [content])
  const alterado = JSON.stringify(corpoDoPut(editedContent, annotations, content.content_type)) !== inicial

  const handleSave = () => {
    if (salvando) return
    const updatedContent = { ...corpoDoPut(editedContent, annotations, content.content_type), updated_at: new Date().toISOString() }
    onSave(updatedContent)
  }

  return (
    <div className="w-full max-w-web-conteiner mx-auto flex flex-col text-cor-text font-fam-ui font-peso-ui leading-natural">
      <CabecalhoDoEditor
        titulo={content.title}
        tipo={rotuloDoTipo(content.content_type).toLocaleLowerCase("pt-BR")}
        alterado={alterado}
        salvando={salvando}
        onVoltar={onCancel}
        onSalvar={handleSave}
      />
      <div className="flex flex-wrap items-start gap-espaco-xl py-espaco-xxl px-web-margem">
        <div className="grow shrink basis-full c:basis-0 min-w-0 flex flex-col gap-espaco-xl">
          <LinhaDaTela falha={falhaAoSalvar ?? falhaDoArquivo} rotuloTentar={FRASES_EDIT["acao.tentar"]} />
          <ContentTypeEditor content={editedContent} onChange={setEditedContent} aoFalharArquivo={setFalhaDoArquivo} />
        </div>
        <UnifiedMetadataEditor content={editedContent} onChange={setEditedContent} />
      </div>
    </div>
  )
}
