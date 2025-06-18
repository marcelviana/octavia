"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { parseDocxFile, parsePdfFile, ParsedSong } from "@/lib/batch-import"
import { createContent } from "@/lib/content-service"
import { toast } from "sonner"
import { FileText, Music, Guitar, Upload } from "lucide-react"
import { getContentTypeStyle } from "@/lib/content-type-styles"
import { ContentType, CONTENT_TYPE_KEYS, ContentTypeId, CONTENT_TYPE_IDS } from "@/types/content"

interface BatchImportProps {
  onComplete: (contents: any[]) => void
}

export function BatchImport({ onComplete }: BatchImportProps) {
  const [songs, setSongs] = useState<(ParsedSong & { include: boolean })[]>([])
  const [type, setType] = useState<ContentTypeId>("lyrics")
  const [fileName, setFileName] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const typeMap: Record<ContentTypeId, { type: ContentType; key: string }> = {
    lyrics: { type: ContentType.LYRICS, key: CONTENT_TYPE_KEYS[ContentType.LYRICS] },
    chord_chart: { type: ContentType.CHORD_CHART, key: CONTENT_TYPE_KEYS[ContentType.CHORD_CHART] },
    tablature: { type: ContentType.GUITAR_TAB, key: CONTENT_TYPE_KEYS[ContentType.GUITAR_TAB] },
    sheet: { type: ContentType.SHEET_MUSIC, key: CONTENT_TYPE_KEYS[ContentType.SHEET_MUSIC] }
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setIsParsing(true)
    try {
      let parsed: ParsedSong[] = []
      if (file.name.toLowerCase().endsWith(".docx")) {
        parsed = await parseDocxFile(file)
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        parsed = await parsePdfFile(file)
      }
      setSongs(parsed.map((s) => ({ ...s, include: true })))
    } catch (err) {
      toast.error("Failed to parse file")
    } finally {
      setIsParsing(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    const selected = songs.filter((s) => s.include)
    if (selected.length === 0) return
    setIsImporting(true)
    try {
      const created = []
      for (const song of selected) {
        const mapping = typeMap[type]
        if (!mapping) {
          toast.error("Invalid content type")
          continue
        }
        const item = await createContent({
          title: song.title,
          content_type: mapping.type,
          content_data: { [mapping.key]: song.body.trim() },
        } as any)
        created.push(item)
      }
      toast.success(`${created.length} songs imported successfully`)
      onComplete(created)
      setSongs([])
      setFileName(null)
    } catch (err) {
      console.error(err)
      toast.error("Failed to import songs")
    } finally {
      setIsImporting(false)
    }
  }

  const contentTypes = [
    { id: "lyrics" as ContentTypeId, name: ContentType.LYRICS, icon: FileText },
    { id: "chord_chart" as ContentTypeId, name: ContentType.CHORD_CHART, icon: Music },
    { id: "tablature" as ContentTypeId, name: ContentType.GUITAR_TAB, icon: Guitar }
  ]

  if (songs.length === 0) {
    return (
      <Card className="p-6 space-y-4">
        <CardHeader className="space-y-1">
          <CardTitle>Batch Import</CardTitle>
          <p className="text-sm text-muted-foreground">
            Import multiple songs from a single document. Titles are detected automatically.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.pdf"
            onChange={handleChange}
            className="hidden"
          />
          <Button type="button" onClick={() => inputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" />
            Select File to Import
          </Button>
          {fileName && <p className="text-sm text-gray-600">{fileName}</p>}
          <div className="grid grid-cols-3 gap-2">
            {contentTypes.map((ct) => {
              const Icon = ct.icon
              const styles = getContentTypeStyle(ct.id)
              const selected = type === ct.id
              return (
                <Card
                  key={ct.id}
                  onClick={() => setType(ct.id)}
                  className={`cursor-pointer border ${styles.border} ${
                    selected
                      ? `ring-2 ${styles.ring} ${styles.bg}`
                      : `hover:${styles.bg} hover:${styles.border}`
                  }`}
                >
                  <CardContent className="p-2 text-center space-y-1">
                    <Icon className={`w-6 h-6 mx-auto ${styles.icon}`} />
                    <p className="text-sm">{ct.name}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {isParsing && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Parsing...</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {songs.map((song, idx) => (
        <Card key={idx} className="space-y-2">
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={song.include}
                onCheckedChange={(v) =>
                  setSongs((prev) =>
                    prev.map((s, i) => (i === idx ? { ...s, include: !!v } : s))
                  )
                }
              />
              <Input
                value={song.title}
                onChange={(e) =>
                  setSongs((prev) =>
                    prev.map((s, i) => (i === idx ? { ...s, title: e.target.value } : s))
                  )
                }
                className="font-medium"
              />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <Textarea
              className="font-mono whitespace-pre"
              value={song.body}
              rows={4}
              onChange={(e) =>
                setSongs((prev) =>
                  prev.map((s, i) => (i === idx ? { ...s, body: e.target.value } : s))
                )
              }
            />
          </CardContent>
        </Card>
      ))}
      <div className="pt-2">
        <Button
          onClick={handleImport}
          disabled={isImporting}
          className="bg-black text-white w-full"
        >
          {isImporting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          )}
          Import All
        </Button>
      </div>
    </div>
  )
}
