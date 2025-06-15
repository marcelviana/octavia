"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface SimpleEditorProps {
  defaultValue?: string
  title?: string
  onCreate: (text: string) => void
}

export function SimpleEditor({ defaultValue = "", title, onCreate }: SimpleEditorProps) {
  const [text, setText] = useState(defaultValue)
  const [preview, setPreview] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || (preview ? "Preview" : "Edit Content")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview ? (
          <div className="whitespace-pre-wrap p-4 border rounded bg-white">
            {text}
          </div>
        ) : (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="font-mono"
          />
        )}
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setPreview(!preview)}>
            Preview
          </Button>
          <Button onClick={() => onCreate(text)}>Create Content</Button>
        </div>
      </CardContent>
    </Card>
  )
}
