"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface LyricsEditorProps {
  content: any
  onChange: (content: any) => void
}

export function LyricsEditor({ content, onChange }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState(content.lyrics || "")

  const updateLyrics = (newLyrics: string) => {
    setLyrics(newLyrics)
    onChange({ ...content, lyrics: newLyrics })
  }

  return (
    <div className="space-y-6">
      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Lyrics Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={lyrics}
              onChange={(e) => updateLyrics(e.target.value)}
              placeholder="Enter your lyrics here...

Use [Verse 1], [Chorus], [Bridge] etc. for section labels
Leave blank lines between sections
Use consistent formatting for better readability"
              className="min-h-[400px] font-mono"
            />
            <div className="text-sm text-gray-500">
              <p>Formatting tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use [Section Name] for verse, chorus, bridge labels</li>
                <li>Leave blank lines to separate sections</li>
                <li>Use consistent indentation for better structure</li>
                <li>Add timing notes in parentheses if needed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => updateLyrics(lyrics + "\n[Verse]\n")}>
              Add Verse
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateLyrics(lyrics + "\n[Chorus]\n")}>
              Add Chorus
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateLyrics(lyrics + "\n[Bridge]\n")}>
              Add Bridge
            </Button>
            <Button variant="outline" size="sm" onClick={() => updateLyrics(lyrics + "\n[Outro]\n")}>
              Add Outro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
