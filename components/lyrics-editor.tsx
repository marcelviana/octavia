"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, AlignLeft, AlignCenter, AlignRight } from "lucide-react"

interface LyricsEditorProps {
  content: any
  onChange: (content: any) => void
}

export function LyricsEditor({ content, onChange }: LyricsEditorProps) {
  const [lyrics, setLyrics] = useState(content.lyrics || "")
  const [fontSize, setFontSize] = useState("16")
  const [alignment, setAlignment] = useState("left")
  const [showPreview, setShowPreview] = useState(false)

  const updateLyrics = (newLyrics: string) => {
    setLyrics(newLyrics)
    onChange({ ...content, lyrics: newLyrics })
  }

  const formatLyrics = (text: string) => {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("[") && line.endsWith("]")) {
        return (
          <div key={index} className="font-bold text-blue-600 mt-4 mb-2">
            {line}
          </div>
        )
      }
      return (
        <div key={index} className="mb-1">
          {line || <br />}
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Editor Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Formatting Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 overflow-x-auto">
            <div className="flex items-center space-x-2">
              <Label>Font Size:</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12px</SelectItem>
                  <SelectItem value="14">14px</SelectItem>
                  <SelectItem value="16">16px</SelectItem>
                  <SelectItem value="18">18px</SelectItem>
                  <SelectItem value="20">20px</SelectItem>
                  <SelectItem value="24">24px</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant={alignment === "left" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlignment("left")}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={alignment === "center" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlignment("center")}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={alignment === "right" ? "default" : "outline"}
                size="sm"
                onClick={() => setAlignment("right")}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Edit" : "Preview"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Editor/Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{showPreview ? "Preview" : "Lyrics Editor"}</CardTitle>
        </CardHeader>
        <CardContent>
          {showPreview ? (
            <div
              className="bg-white p-6 border rounded-lg min-h-[400px]"
              style={{
                fontSize: `${fontSize}px`,
                textAlign: alignment as any,
              }}
            >
              {formatLyrics(lyrics)}
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                value={lyrics}
                onChange={(e) => updateLyrics(e.target.value)}
                placeholder="Enter your lyrics here...

Use [Verse 1], [Chorus], [Bridge] etc. for section labels
Leave blank lines between sections
Use consistent formatting for better readability"
                className="min-h-[400px] font-mono"
                style={{ fontSize: `${fontSize}px` }}
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
          )}
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
