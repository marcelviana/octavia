"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Music, Guitar, Plus } from "lucide-react"

interface ContentCreatorProps {
  onContentCreated: (content: any) => void
}

export function ContentCreator({ onContentCreated }: ContentCreatorProps) {
  const [activeType, setActiveType] = useState("lyrics")
  const [title, setTitle] = useState("")
  const [text, setText] = useState("")

  useEffect(() => {
    setText("")
    setTitle("")
  }, [activeType])

  const placeholders: Record<string, string> = {
    lyrics: "Write your lyrics here...",
    chords: "Write your chord chart here...",
    tablature: "Write your guitar tab here...",
  }

  const tips: Record<string, string[]> = {
    lyrics: [
      "Use blank lines to separate verses and choruses.",
      "Add labels like [Verse], [Chorus], [Bridge] for better structure.",
    ],
    chords: [
      "Write chord progressions inline or above lyrics.",
      "Align chords with lyrics using spacing or line breaks.",
    ],
    tablature: [
      "Use numbers for fret positions.",
      "Use dashes (-) or empty beats for rhythm.",
      "Align notes vertically for chords.",
      "Use | for measure separators.",
    ],
  }

  const typeNames: Record<string, string> = {
    lyrics: "Lyrics",
    chords: "Chord Chart",
    tablature: "Guitar Tab",
  }

  const contentTypes = [
    { id: "lyrics", name: "Lyrics Sheet", icon: FileText, description: "Create lyrics-only sheets" },
    { id: "chords", name: "Chord Chart", icon: Music, description: "Lyrics with chord progressions" },
    { id: "tablature", name: "Guitar Tablature", icon: Guitar, description: "Create simple guitar tabs" },
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
      <Card>
        <CardHeader>
          <CardTitle>Create New Content</CardTitle>
          <p className="text-gray-600">Choose the type of musical content you want to create</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contentTypes.map((type) => {
              const Icon = type.icon
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    activeType === type.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:shadow-md"
                  }`}
                  onClick={() => setActiveType(type.id)}
                >
                  <CardContent className="p-4 text-center">
                    <Icon className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                    <h3 className="font-medium text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

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
