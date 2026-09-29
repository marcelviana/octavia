"use client"

/**
 * O corpo do editor por tipo (I1-PR-11). Cifra, tab e letra: o editor de cada tipo, com a MESMA entrada e a MESMA
 * junção de antes (`{ ...content, ...content.content_data }` e o `handleContentChange` que espalha o que volta
 * dentro do `content_data` — a poluição do Bloco D, §1.2 dos anexos, não tocada). Partitura (decisão 6 do aval,
 * I1-E19 — a folha não tem estado para ela): o PAINEL da visualização (`SheetMusicDisplay`: o PDF sem altura fixa, a
 * imagem com `onError`, a notação, o vazio, o formato), e a falha dele sobe para a linha da tela. O
 * `annotation-tools` inerte de antes (ferramenta fixa em "select", fundo que nunca aparecia) morreu.
 */
import { ChordEditor } from "@/components/chord-editor"
import { LyricsEditor } from "@/components/lyrics-editor"
import { TabEditor } from "@/components/tab-editor"
import { SheetMusicDisplay } from "@/components/content-viewer/SheetMusicDisplay"
import type { FalhaDaTela } from "@/components/identidade/linha-da-tela"
import { ContentType, normalizeContentType } from "@/types/content"

const POR_TIPO: Partial<Record<ContentType, typeof ChordEditor>> = {
  [ContentType.CHORDS]: ChordEditor,
  [ContentType.TAB]: TabEditor,
  [ContentType.LYRICS]: LyricsEditor,
}

interface ContentTypeEditorProps {
  content: any
  onChange: (content: any) => void
  aoFalharArquivo: (falha: FalhaDaTela | null) => void
}

export function ContentTypeEditor({ content, onChange, aoFalharArquivo }: ContentTypeEditorProps) {
  const handleContentChange = (newData: any) => {
    onChange({
      ...content,
      content_data: {
        ...content.content_data,
        ...newData,
      },
    })
  }

  const type = normalizeContentType(content.content_type)
  if (type === ContentType.SHEET) return <SheetMusicDisplay content={content} aoFalhar={aoFalharArquivo} />
  // `normalizeContentType` cai em Lyrics no resto (types/content.ts): o "not yet implemented" de antes era inalcançável
  const Editor = POR_TIPO[type] ?? LyricsEditor
  return <Editor content={{ ...content, ...content.content_data }} onChange={handleContentChange} />
}
