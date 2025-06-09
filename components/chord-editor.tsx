"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { MusicText } from "@/components/music-text"

interface ChordEditorProps {
  content: any
  onChange: (content: any) => void
}

export function ChordEditor({ content, onChange }: ChordEditorProps) {
  const [chordData, setChordData] = useState({
    title: content.title || "",
    artist: content.artist || "",
    key: content.key || "",
    capo: content.capo || "",
    bpm: content.bpm || "",
    sections: content.sections || [{ id: 1, name: "Verse 1", chords: "Am F C G", lyrics: "Sample lyrics here..." }],
  })

  const updateChordData = (newData: any) => {
    setChordData(newData)
    onChange({ ...content, ...newData })
  }

  const addSection = () => {
    const newSection = {
      id: Date.now(),
      name: "",
      chords: "",
      lyrics: "",
    }
    updateChordData({
      ...chordData,
      sections: [...chordData.sections, newSection],
    })
  }

  const removeSection = (sectionId: number) => {
    updateChordData({
      ...chordData,
      sections: chordData.sections.filter((section: any) => section.id !== sectionId),
    })
  }

  const updateSection = (sectionId: number, field: string, value: string) => {
    updateChordData({
      ...chordData,
      sections: chordData.sections.map((section: any) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    })
  }

  const commonChords = ["C", "G", "Am", "F", "D", "Em", "A", "E", "Dm", "B7"]

  return (
    <div className="space-y-6">
      {/* Song Information */}
      <Card>
        <CardHeader>
          <CardTitle>Song Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={chordData.title}
                onChange={(e) => updateChordData({ ...chordData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={chordData.artist}
                onChange={(e) => updateChordData({ ...chordData, artist: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="key">Key</Label>
              <Select value={chordData.key} onValueChange={(value) => updateChordData({ ...chordData, key: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="capo">Capo</Label>
              <Input
                id="capo"
                value={chordData.capo}
                onChange={(e) => updateChordData({ ...chordData, capo: e.target.value })}
                placeholder="Fret"
              />
            </div>
            <div>
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={chordData.bpm}
                onChange={(e) => updateChordData({ ...chordData, bpm: e.target.value })}
                placeholder="120"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Chord Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Chords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {commonChords.map((chord) => (
              <Button
                key={chord}
                variant="outline"
                size="sm"
                onClick={() => {
                  // Add chord to current section logic
                }}
              >
                {chord}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Song Sections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Song Sections</CardTitle>
            <Button onClick={addSection}>
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {chordData.sections.map((section: any, index: number) => (
            <Card key={section.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                    <Input
                      placeholder="Section name (e.g., Verse 1, Chorus)"
                      value={section.name}
                      onChange={(e) => updateSection(section.id, "name", e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  {chordData.sections.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label>Chord Progression</Label>
                  <Input
                    placeholder="Am F C G"
                    value={section.chords}
                    onChange={(e) => updateSection(section.id, "chords", e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label>Lyrics</Label>
                  <Textarea
                    placeholder="Enter lyrics for this section..."
                    value={section.lyrics}
                    onChange={(e) => updateSection(section.id, "lyrics", e.target.value)}
                    className="min-h-[100px] font-mono"
                  />
                </div>
              </div>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-6 border rounded-lg">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{chordData.title || "Untitled"}</h2>
              <p className="text-lg text-gray-600">{chordData.artist || "Unknown Artist"}</p>
              <div className="flex justify-center space-x-4 mt-2 text-sm text-gray-500">
                {chordData.key && <span>Key: {chordData.key}</span>}
                {chordData.capo && <span>Capo: {chordData.capo}</span>}
                {chordData.bpm && <span>BPM: {chordData.bpm}</span>}
              </div>
            </div>

            <div className="space-y-6">
              {chordData.sections.map((section: any) => (
                <div key={section.id}>
                  {section.name && <h3 className="font-bold text-blue-600 mb-2">{section.name}:</h3>}
                  {section.chords && <p className="font-mono bg-gray-100 p-2 rounded mb-2">Chords: {section.chords}</p>}
                  {section.lyrics && (
                    <MusicText text={section.lyrics} monospace={false} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
