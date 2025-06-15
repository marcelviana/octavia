"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SimpleEditor } from "@/components/simple-editor"

interface TextImportPreviewProps {
  files: any[]
  onComplete: (contents: any[]) => void
  onBack: () => void
}

export function TextImportPreview({ files, onComplete, onBack }: TextImportPreviewProps) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<any[]>([])

  const handleCreate = ({ title, text }: { title: string; text: string }) => {
    const file = files[index]
    setResults((prev) => [
      ...prev,
      {
        title,
        body: text,
        content_type: "Lyrics",
      },
    ])
    if (index < files.length - 1) {
      setIndex(index + 1)
    } else {
      onComplete(results.concat([
        {
          title,
          body: text,
          content_type: "Lyrics",
        },
      ]))
    }
  }

  if (files.length === 0) return null

  const file = files[index]

  return (
    <div className="space-y-6">
      <SimpleEditor
        title={`${file.name} (${index + 1}/${files.length})`}
        defaultValue={file.textBody || file.originalText || ""}
        defaultTitle={file.parsedTitle || file.name}
        onCreate={handleCreate}
      />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
      </div>
    </div>
  )
}
