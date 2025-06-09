"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Tag } from "lucide-react"

import { createContent } from "@/lib/content-service"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface TextImportPreviewProps {
  files: any[]
  onComplete: (contents: any[]) => void
  onBack: () => void
}

export function TextImportPreview({ files, onComplete, onBack }: TextImportPreviewProps) {
  const genres = [
    "Rock", "Pop", "Jazz", "Classical", "Blues", "Country", "Folk", "Metal",
    "Punk", "Alternative", "Indie", "Electronic", "Hip Hop", "R&B", "Reggae", "Other"
  ]

  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"]
  const keys = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]

  const [items, setItems] = useState(
    files.map((f) => ({
      ...f,
      title: f.parsedTitle || "",
      body: f.textBody || "",
      band: "",
      genre: "",
      key: "",
      bpm: "",
      timeSignature: "4/4",
      difficulty: "",
      tags: [] as string[],
      notes: "",
      newTag: "",
    }))
  )
  const [isSaving, setIsSaving] = useState(false)

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const addTag = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const tag = item.newTag.trim()
        if (tag && !item.tags.includes(tag)) {
          return { ...item, tags: [...item.tags, tag], newTag: "" }
        }
        return { ...item, newTag: "" }
      })
    )
  }

  const removeTag = (index: number, tag: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, tags: item.tags.filter((t) => t !== tag) } : item
      )
    )
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
          artist: item.band || null,
          genre: item.genre || null,
          content_type: "Lyrics",
          key: item.key || null,
          bpm: item.bpm ? Number(item.bpm) : null,
          time_signature: item.timeSignature || null,
          difficulty: item.difficulty || null,
          tags: item.tags.length ? item.tags : null,
          notes: item.notes || null,
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={item.title} onChange={(e) => updateItem(index, "title", e.target.value)} placeholder="Title" />
              </div>
              <div>
                <Label>Band</Label>
                <Input value={item.band} onChange={(e) => updateItem(index, "band", e.target.value)} placeholder="Band or artist" />
              </div>
              <div>
                <Label>Genre</Label>
                <Select value={item.genre} onValueChange={(value) => updateItem(index, "genre", value)}>
                  <SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger>
                  <SelectContent>
                    {genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Key</Label>
                <Select value={item.key} onValueChange={(value) => updateItem(index, "key", value)}>
                  <SelectTrigger><SelectValue placeholder="Select key" /></SelectTrigger>
                  <SelectContent>
                    {keys.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>BPM</Label>
                <Input type="number" value={item.bpm} onChange={(e) => updateItem(index, "bpm", e.target.value)} placeholder="120" />
              </div>
              <div>
                <Label>Time Signature</Label>
                <Select value={item.timeSignature} onValueChange={(value) => updateItem(index, "timeSignature", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["4/4", "3/4", "2/4", "6/8", "12/8"].map((sig) => (
                      <SelectItem key={sig} value={sig}>{sig}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={item.difficulty} onValueChange={(value) => updateItem(index, "difficulty", value)}>
                  <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Lyrics</Label>
              <Textarea value={item.body} onChange={(e) => updateItem(index, "body", e.target.value)} rows={10} className="font-mono whitespace-pre" />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="mt-2 space-y-2">
                <div className="flex space-x-2">
                  <Input value={item.newTag} onChange={(e) => updateItem(index, "newTag", e.target.value)} placeholder="Add a tag" onKeyDown={(e) => e.key === "Enter" && addTag(index)} />
                  <Button type="button" variant="outline" onClick={() => addTag(index)}><Plus className="w-4 h-4" /></Button>
                </div>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                        <button type="button" onClick={() => removeTag(index, tag)} className="ml-1 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={item.notes} onChange={(e) => updateItem(index, "notes", e.target.value)} className="min-h-[100px]" />
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Content"}
        </Button>
      </div>
    </div>
  )
}
