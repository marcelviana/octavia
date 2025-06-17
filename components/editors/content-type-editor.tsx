"use client"

import { ChordEditor } from "@/components/chord-editor"
import { LyricsEditor } from "@/components/lyrics-editor"
import { TabEditor } from "@/components/tab-editor"
import { AnnotationTools } from "@/components/annotation-tools"
import PdfViewer from "@/components/pdf-viewer"
import { ContentType } from "@/types/content"

interface ContentTypeEditorProps {
  content: any
  onChange: (content: any) => void
}

export function ContentTypeEditor({ content, onChange }: ContentTypeEditorProps) {
  const handleContentChange = (newData: any) => {
    onChange({
      ...content,
      content_data: {
        ...content.content_data,
        ...newData,
      },
    })
  }

  switch (content.content_type) {
    case ContentType.CHORD_CHART:
      return (
        <ChordEditor
          content={{
            ...content,
            ...content.content_data,
          }}
          onChange={handleContentChange}
        />
      )
    case ContentType.GUITAR_TAB:
      return (
        <TabEditor
          content={{
            ...content,
            ...content.content_data,
          }}
          onChange={handleContentChange}
        />
      )
    case ContentType.SHEET_MUSIC:
      if (content.file_url && content.file_url.toLowerCase().endsWith(".pdf")) {
        return <PdfViewer url={content.file_url} className="h-[800px]" fullscreen />
      }
      return (
        <AnnotationTools
          content={{
            ...content,
            ...content.content_data,
          }}
          annotations={content.content_data?.annotations || []}
          selectedTool="select"
          zoom={100}
          onAnnotationsChange={(annotations) => handleContentChange({ annotations })}
          onContentChange={handleContentChange}
        />
      )
    case ContentType.LYRICS:
      return (
        <LyricsEditor
          content={{
            ...content,
            ...content.content_data,
          }}
          onChange={handleContentChange}
        />
      )
    default:
      return (
        <div className="p-6 text-center">
          <p className="text-[#A69B8E]">Editor for {content.content_type} is not yet implemented.</p>
        </div>
      )
  }
}
