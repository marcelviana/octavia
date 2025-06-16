"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Music, Guitar, Plus } from "lucide-react"
import { getContentTypeStyle } from "@/lib/content-type-styles"
import { ContentType, ContentTypeId } from "@/types/content"

interface ContentCreatorProps {
  onContentCreated: (content: any) => void
  initialType?: ContentTypeId
  hideTypeSelection?: boolean
}

export function ContentCreator({
  onContentCreated,
  initialType = "lyrics",
  hideTypeSelection = false,
}: ContentCreatorProps) {
  const [activeType, setActiveType] = useState<ContentTypeId>(initialType)
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")

  useEffect(() => {
    setText("")
    setTitle("")
  }, [activeType])

  // Update active type if the prop changes
  useEffect(() => {
    setActiveType(initialType)
  }, [initialType])

  const placeholders: Record<ContentTypeId, string> = {
    lyrics: "Write your lyrics here...",
    chord_chart: "Write your chord chart here...",
    tablature: "Write your guitar tab here...",
    sheet: "Write your sheet music here..."
  }

  const tips: Record<ContentTypeId, string[]> = {
    lyrics: [
      "Use blank lines to separate verses and choruses.",
      "Add labels like [Verse], [Chorus], [Bridge] for better structure.",
    ],
    chord_chart: [
      "Write chord progressions inline or above lyrics.",
      "Align chords with lyrics using spacing or line breaks.",
    ],
    tablature: [
      "Use numbers for fret positions.",
      "Use dashes (-) or empty beats for rhythm.",
      "Align notes vertically for chords.",
      "Use | for measure separators.",
    ],
    sheet: [
      "Add musical notation or sheet music content.",
      "Include tempo, key signature, and other musical markings."
    ]
  }

  const typeNames: Record<ContentTypeId, ContentType> = {
    lyrics: ContentType.LYRICS,
    chord_chart: ContentType.CHORD_CHART,
    tablature: ContentType.GUITAR_TAB,
    sheet: ContentType.SHEET_MUSIC
  }

  const contentTypes: { id: ContentTypeId; name: ContentType; icon: any; description: string }[] = [
    { id: "lyrics", name: ContentType.LYRICS, icon: FileText, description: "Create lyrics-only sheets" },
    { id: "chord_chart", name: ContentType.CHORD_CHART, icon: Music, description: "Lyrics with chord progressions" },
    { id: "tablature", name: ContentType.GUITAR_TAB, icon: Guitar, description: "Create simple guitar tabs" },
    { id: "sheet", name: ContentType.SHEET_MUSIC, icon: FileText, description: "Create sheet music" }
  ]

  const handleCreate = () => {
    if (!title.trim()) {
      alert("Title is required")
      return
    }
    onContentCreated({
      type: typeNames[activeType],
      content: { text },
      title: title.trim(),
    })
  }

  return (
    <div className="space-y-6">
      {!hideTypeSelection && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Content</CardTitle>
            <p className="text-gray-600">Choose the type of musical content you want to create</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {contentTypes.map((type) => {
                const Icon = type.icon
                const styles = getContentTypeStyle(type.id)
                const selected = activeType === type.id
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all min-h-[44px] border ${styles.border} ${
                      selected
                        ? `ring-2 ${styles.ring} ${styles.bg}`
                        : `hover:${styles.bg} hover:${styles.border}`
                    }`}
                    onClick={() => setActiveType(type.id)}
                  >
                    <CardContent className="p-2 md:p-4 text-center">
                      <Icon className={`w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 md:mb-3 ${styles.icon}`} />
                      <h3 className="text-sm md:text-base font-medium text-gray-900">{type.name}</h3>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">{type.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{contentTypes.find((t) => t.id === activeType)?.name} Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="content-title">Title</Label>
            <Input
              id="content-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
            />
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            className="font-mono"
            placeholder={placeholders[activeType]}
          />
          <div className="text-sm text-gray-500 space-y-1">
            {tips[activeType].map((tip) => (
              <p key={tip}>• {tip}</p>
            ))}
          </div>
          <div>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
