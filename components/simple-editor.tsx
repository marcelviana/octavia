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
  placeholder?: string
  tips?: string[]
  onCreate: (data: { title: string; text: string }) => void
}

export function SimpleEditor({ defaultValue = "", title, defaultTitle = "", placeholder = "", tips = [], onCreate }: SimpleEditorProps) {
  const [text, setText] = useState(defaultValue)
  const [songTitle, setSongTitle] = useState(defaultTitle)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || "Edit Content"}</CardTitle>
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
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="font-mono"
          placeholder={placeholder}
        />
        {tips.length > 0 && (
          <div className="text-sm text-gray-500 space-y-1">
            {tips.map((tip) => (
              <p key={tip}>• {tip}</p>
            ))}
          </div>
        )}
        <div>
          <Button onClick={() => songTitle.trim() && onCreate({ title: songTitle.trim(), text })} disabled={!songTitle.trim()}>
            Create Content
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
