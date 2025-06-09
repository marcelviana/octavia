"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createContent } from "@/lib/content-service"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface TextImportPreviewProps {
  files: any[]
  onComplete: (contents: any[]) => void
  onBack: () => void
}

export function TextImportPreview({ files, onComplete, onBack }: TextImportPreviewProps) {
  const [items, setItems] = useState(
    files.map((f) => ({
      ...f,
      title: f.parsedTitle || "",
      body: f.textBody || "",
    }))
  )
  const [isSaving, setIsSaving] = useState(false)

  const updateItem = (index: number, field: string, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const results = [] as any[]
      for (const item of items) {
        const payload = {
          user_id: user.id,
          title: item.title || "Untitled",
          content_type: "Lyrics",
          content_data: { lyrics: item.body },
          is_favorite: false,
          is_public: false,
        }
        const created = await createContent(payload as any)
        results.push(created)
      }
      onComplete(results)
    } catch (e) {
      console.error(e)
      alert("Failed to save imported files")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={item.title}
              onChange={(e) => updateItem(index, "title", e.target.value)}
              placeholder="Title"
            />
            <Textarea
              value={item.body}
              onChange={(e) => updateItem(index, "body", e.target.value)}
              rows={10}
              className="font-mono whitespace-pre"
            />
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Content"}
        </Button>
      </div>
    </div>
  )
}
