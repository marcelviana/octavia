"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { parseDocxFile, parsePdfFile, ParsedSong } from "@/lib/batch-import"

interface BatchImportProps {
  onComplete: (contents: any[]) => void
}

export function BatchImport({ onComplete }: BatchImportProps) {
  const [songs, setSongs] = useState<(ParsedSong & { include: boolean })[]>([])
  const [type, setType] = useState("Lyrics")

  const handleFile = async (file: File) => {
    let parsed: ParsedSong[] = []
    if (file.name.toLowerCase().endsWith(".docx")) {
      parsed = await parseDocxFile(file)
    } else if (file.name.toLowerCase().endsWith(".pdf")) {
      parsed = await parsePdfFile(file)
    }
    setSongs(parsed.map((s) => ({ ...s, include: true })))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = () => {
    const selected = songs.filter((s) => s.include).map((s) => ({
      title: s.title,
      body: s.body.trim(),
      content_type: type,
    }))
    onComplete(selected)
  }

  if (songs.length === 0) {
    return (
      <Card className="p-4 space-y-4">
        <CardHeader>
          <CardTitle>Batch Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".docx,.pdf" onChange={handleChange} />
          <div>
            <label className="mr-2 text-sm">Content Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lyrics">Lyrics</SelectItem>
                <SelectItem value="Chord Chart">Chord Chart</SelectItem>
                <SelectItem value="Guitar Tab">Guitar Tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {songs.map((song, idx) => (
        <Card key={idx} className="p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={song.include}
              onCheckedChange={(v) =>
                setSongs((prev) => prev.map((s, i) => (i === idx ? { ...s, include: !!v } : s)))
              }
            />
            <Input
              value={song.title}
              onChange={(e) =>
                setSongs((prev) => prev.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s)))
              }
            />
          </div>
          <Textarea
            className="font-mono whitespace-pre"
            value={song.body}
            rows={4}
            onChange={(e) =>
              setSongs((prev) => prev.map((s, i) => (i === idx ? { ...s, body: e.target.value } : s)))
            }
          />
        </Card>
      ))}
      <Button onClick={handleImport}>Import All</Button>
    </div>
  )
}
