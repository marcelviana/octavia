"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SimpleEditorProps {
  defaultValue?: string
  title?: string
  defaultTitle?: string
  onCreate: (data: { title: string; text: string }) => void
}

export function SimpleEditor({ defaultValue = "", title, defaultTitle = "", onCreate }: SimpleEditorProps) {
  const [text, setText] = useState(defaultValue)
  const [songTitle, setSongTitle] = useState(defaultTitle)
  const [preview, setPreview] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || (preview ? "Preview" : "Edit Content")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="content-title">Title</Label>
          <Input
            id="content-title"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="Song title"
          />
        </div>
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
          <Button onClick={() => songTitle.trim() && onCreate({ title: songTitle.trim(), text })} disabled={!songTitle.trim()}>
            Create Content
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
