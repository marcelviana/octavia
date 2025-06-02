"use client"

import { ChordEditor } from "@/components/chord-editor"
import { LyricsEditor } from "@/components/lyrics-editor"
import { TabEditor } from "@/components/tab-editor"
import { AnnotationTools } from "@/components/annotation-tools"

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
    case "Chord Chart":
      return (
        <ChordEditor
          content={{
            ...content,
            ...content.content_data,
          }}
          onChange={handleContentChange}
        />
      )
    case "Guitar Tab":
      return (
        <TabEditor
          content={{
            ...content,
            ...content.content_data,
          }}
          onChange={handleContentChange}
        />
      )
    case "Sheet Music":
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
    case "Lyrics":
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
