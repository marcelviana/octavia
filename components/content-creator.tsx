"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Guitar, Music, Plus, Trash2, Eye } from "lucide-react"

interface ContentCreatorProps {
  onContentCreated: (content: any) => void
}

export function ContentCreator({ onContentCreated }: ContentCreatorProps) {
  const [activeType, setActiveType] = useState("lyrics")
  const [lyricsTitle, setLyricsTitle] = useState("")
  const [lyricsContent, setLyricsContent] = useState("")
  const [chordChart, setChordChart] = useState({
    title: "",
    artist: "",
    key: "",
    capo: "",
    sections: [{ name: "Verse 1", chords: "Am F C G", lyrics: "" }],
  })
  const [tabContent, setTabContent] = useState({
    title: "",
    artist: "",
    tuning: "Standard (EADGBE)",
    capo: "",
    tabs: [
      "E|--0--3--0--2--0--|",
      "B|--1--1--1--1--1--|",
      "G|--0--0--0--0--0--|",
      "D|--2--2--2--2--2--|",
      "A|--3-------------|",
      "E|----------------|",
    ],
  })

  const contentTypes = [
    {
      id: "lyrics",
      name: "Lyrics Sheet",
      icon: FileText,
      description: "Create lyrics-only sheets",
    },
    {
      id: "chords",
      name: "Chord Chart",
      icon: Music,
      description: "Lyrics with chord progressions",
    },
    {
      id: "tablature",
      name: "Guitar Tablature",
      icon: Guitar,
      description: "Create simple guitar tabs",
    },
  ]

  const addChordSection = () => {
    setChordChart((prev) => ({
      ...prev,
      sections: [...prev.sections, { name: "", chords: "", lyrics: "" }],
    }))
  }

  const removeChordSection = (index: number) => {
    setChordChart((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }))
  }

  const updateChordSection = (index: number, field: string, value: string) => {
    setChordChart((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) => (i === index ? { ...section, [field]: value } : section)),
    }))
  }

  const handleCreate = () => {
    let content
    switch (activeType) {
      case "lyrics":
        if (!lyricsTitle.trim()) {
          alert("Title is required")
          return
        }
        content = {
          type: "Lyrics",
          content: { lyrics: lyricsContent },
          title: lyricsTitle.trim(),
        }
        break
      case "chords":
        if (!chordChart.title.trim()) {
          alert("Title is required")
          return
        }
        content = {
          type: "Chord Chart",
          content: chordChart,
          title: chordChart.title.trim(),
        }
        break
      case "tablature":
        if (!tabContent.title.trim()) {
          alert("Title is required")
          return
        }
        content = {
          type: "Guitar Tab",
          content: tabContent,
          title: tabContent.title.trim(),
        }
        break
      default:
        return
    }
    onContentCreated(content)
  }

  return (
    <div className="space-y-6">
      {/* Content Type Selection */}
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

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{contentTypes.find((t) => t.id === activeType)?.name} Editor</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeType === "lyrics" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="lyrics-title">Title</Label>
                <Input
                  id="lyrics-title"
                  value={lyricsTitle}
                  onChange={(e) => setLyricsTitle(e.target.value)}
                  placeholder="Song title"
                />
              </div>
              <div>
                <Label htmlFor="lyrics">Lyrics</Label>
                <Textarea
                  id="lyrics"
                  placeholder="Enter your lyrics here..."
                  value={lyricsContent}
                  onChange={(e) => setLyricsContent(e.target.value)}
                  className="min-h-[300px] font-mono"
                />
              </div>
              <div className="text-sm text-gray-500">
                <p>Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use blank lines to separate verses and choruses</li>
                  <li>Add [Verse], [Chorus], [Bridge] labels for structure</li>
                  <li>Use consistent formatting for better readability</li>
                </ul>
              </div>
            </div>
          )}

          {activeType === "chords" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="chord-title">Title</Label>
                  <Input
                    id="chord-title"
                    value={chordChart.title}
                    onChange={(e) => setChordChart((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Song title"
                  />
                </div>
                <div>
                  <Label htmlFor="chord-artist">Artist</Label>
                  <Input
                    id="chord-artist"
                    value={chordChart.artist}
                    onChange={(e) => setChordChart((prev) => ({ ...prev, artist: e.target.value }))}
                    placeholder="Artist name"
                  />
                </div>
                <div>
                  <Label htmlFor="chord-key">Key</Label>
                  <Select
                    value={chordChart.key}
                    onValueChange={(value) => setChordChart((prev) => ({ ...prev, key: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select key" className="bg-F2EDE5" />
                    </SelectTrigger>
                    <SelectContent className="bg-F2EDE5">
                      {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="chord-capo">Capo</Label>
                  <Input
                    id="chord-capo"
                    value={chordChart.capo}
                    onChange={(e) => setChordChart((prev) => ({ ...prev, capo: e.target.value }))}
                    placeholder="Fret number"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Song Sections</h4>
                  <Button variant="outline" size="sm" onClick={addChordSection}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                {chordChart.sections.map((section, index) => (
                  <Card key={index} className="p-4 bg-F2EDE5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Section name (e.g., Verse 1, Chorus)"
                          value={section.name}
                          onChange={(e) => updateChordSection(index, "name", e.target.value)}
                          className="max-w-xs"
                        />
                        {chordChart.sections.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeChordSection(index)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <Label>Chord Progression</Label>
                        <Input
                          placeholder="Am F C G"
                          value={section.chords}
                          onChange={(e) => updateChordSection(index, "chords", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Lyrics</Label>
                        <Textarea
                          placeholder="Enter lyrics for this section..."
                          value={section.lyrics}
                          onChange={(e) => updateChordSection(index, "lyrics", e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeType === "tablature" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="tab-title">Title</Label>
                  <Input
                    id="tab-title"
                    value={tabContent.title}
                    onChange={(e) => setTabContent((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Song title"
                  />
                </div>
                <div>
                  <Label htmlFor="tab-artist">Artist</Label>
                  <Input
                    id="tab-artist"
                    value={tabContent.artist}
                    onChange={(e) => setTabContent((prev) => ({ ...prev, artist: e.target.value }))}
                    placeholder="Artist name"
                  />
                </div>
                <div>
                  <Label htmlFor="tab-tuning">Tuning</Label>
                  <Select
                    value={tabContent.tuning}
                    onValueChange={(value) => setTabContent((prev) => ({ ...prev, tuning: value }))}
                  >
                    <SelectTrigger className="bg-F2EDE5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-F2EDE5">
                      <SelectItem value="Standard (EADGBE)">Standard (EADGBE)</SelectItem>
                      <SelectItem value="Drop D (DADGBE)">Drop D (DADGBE)</SelectItem>
                      <SelectItem value="Open G (DGDGBD)">Open G (DGDGBD)</SelectItem>
                      <SelectItem value="DADGAD">DADGAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tab-capo">Capo</Label>
                  <Input
                    id="tab-capo"
                    value={tabContent.capo}
                    onChange={(e) => setTabContent((prev) => ({ ...prev, capo: e.target.value }))}
                    placeholder="Fret number"
                  />
                </div>
              </div>

              <div>
                <Label>Tablature</Label>
                <div className="mt-2 space-y-2">
                  {tabContent.tabs.map((line, index) => (
                    <Input
                      key={index}
                      value={line}
                      onChange={(e) => {
                        const newTabs = [...tabContent.tabs]
                        newTabs[index] = e.target.value
                        setTabContent((prev) => ({ ...prev, tabs: newTabs }))
                      }}
                      className="font-mono text-sm"
                      placeholder={`${["E", "B", "G", "D", "A", "E"][index]}|`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  <p>Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use numbers for fret positions</li>
                    <li>Use dashes (-) for empty beats</li>
                    <li>Align notes vertically for chords</li>
                    <li>Use | for measure separators</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
