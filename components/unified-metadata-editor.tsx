"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Music,
  Guitar,
  FileText,
  Star,
  Tag,
  Plus,
  X,
  Info,
  Sliders,
  Folder,
  Check,
  Mic,
  ChevronDown,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface UnifiedMetadataEditorProps {
  content: any
  onChange: (content: any) => void
}

export function UnifiedMetadataEditor({ content, onChange }: UnifiedMetadataEditorProps) {
  const [newTag, setNewTag] = useState("")
  const [openSections, setOpenSections] = useState<string[]>(["basic"])

  const genres = [
    "Rock",
    "Pop",
    "Jazz",
    "Classical",
    "Blues",
    "Country",
    "Folk",
    "Metal",
    "Punk",
    "Alternative",
    "Indie",
    "Electronic",
    "Hip Hop",
    "R&B",
    "Reggae",
    "Other",
  ]

  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"]

  const keys = [
    "C",
    "Cm",
    "C#",
    "C#m",
    "Db",
    "Dbm",
    "D",
    "Dm",
    "D#",
    "D#m",
    "Eb",
    "Ebm",
    "E",
    "Em",
    "Fb",
    "Fbm",
    "F",
    "Fm",
    "F#",
    "F#m",
    "Gb",
    "Gbm",
    "G",
    "Gm",
    "G#",
    "G#m",
    "Ab",
    "Abm",
    "A",
    "Am",
    "A#",
    "A#m",
    "Bb",
    "Bbm",
    "B",
    "Bm",
    "Cb",
    "Cbm",
  ]

  // Calculate completion status for each section
  const basicCompleted = [content.title, content.artist, content.album, content.genre].filter(Boolean).length
  const musicalCompleted = [content.key, content.bpm, content.difficulty].filter(Boolean).length + 1 // +1 for time_signature which has default
  const organizationCompleted = [
    content.tags?.length > 0 ? "tags" : "",
    content.notes,
    content.is_favorite ? "fav" : "",
    content.is_public ? "pub" : "",
  ].filter(Boolean).length

  const renderSummary = (completed: number, total: number) => {
    const summary = `${completed} of ${total} completed`
    if (completed === total) {
      return (
        <span className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
          <Check className="w-4 h-4 text-green-600" />
          {summary}
        </span>
      )
    }
    return <span className="text-xs text-gray-600 whitespace-nowrap">{summary}</span>
  }

  const updateContent = (updates: any) => {
    onChange({
      ...content,
      ...updates,
    })
  }

  const addTag = () => {
    if (newTag.trim() && !content.tags?.includes(newTag.trim())) {
      updateContent({
        tags: [...(content.tags || []), newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateContent({
      tags: content.tags?.filter((tag: string) => tag !== tagToRemove) || [],
    })
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-amber-200 shadow-lg sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
          <Info className="w-5 h-5 text-amber-600" />
          Details
        </CardTitle>
        <p className="text-sm text-gray-600">Organize and categorize your content</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-4"
        >
          {/* Basic Info Section */}
          <AccordionItem
            value="basic"
            className="rounded-md border shadow-sm bg-blue-50 data-[state=open]:bg-blue-100"
          >
            <AccordionTrigger className="px-4 py-3 text-left text-sm font-semibold hover:no-underline">
              <div className="flex items-center w-full gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="flex-1">Basic Info</span>
                {!openSections.includes("basic") && renderSummary(basicCompleted, 4)}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={content.title || ""}
                    onChange={(e) => updateContent({ title: e.target.value })}
                    placeholder="Song title"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      value={content.artist || ""}
                      onChange={(e) => updateContent({ artist: e.target.value })}
                      placeholder="Artist or composer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="album">Album</Label>
                    <Input
                      id="album"
                      value={content.album || ""}
                      onChange={(e) => updateContent({ album: e.target.value })}
                      placeholder="Album or collection"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    value={content.genre || ""}
                    onValueChange={(value) => updateContent({ genre: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Musical Info Section */}
          <AccordionItem
            value="musical"
            className="rounded-md border shadow-sm bg-yellow-50 data-[state=open]:bg-yellow-100"
          >
            <AccordionTrigger className="px-4 py-3 text-left text-sm font-semibold hover:no-underline">
              <div className="flex items-center w-full gap-2">
                <Sliders className="w-4 h-4 text-yellow-600" />
                <span className="flex-1">Musical Info</span>
                {!openSections.includes("musical") && renderSummary(musicalCompleted, 4)}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="key">Key</Label>
                  <Select 
                    value={content.key || ""} 
                    onValueChange={(value) => updateContent({ key: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      {keys.map((key) => (
                        <SelectItem key={key} value={key}>
                          {key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bpm">BPM</Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={content.bpm || ""}
                    onChange={(e) => updateContent({ bpm: e.target.value })}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label htmlFor="timeSignature">Time Signature</Label>
                  <Select
                    value={content.time_signature || "4/4"}
                    onValueChange={(value) => updateContent({ time_signature: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4/4">4/4</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="2/4">2/4</SelectItem>
                      <SelectItem value="6/8">6/8</SelectItem>
                      <SelectItem value="12/8">12/8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={content.difficulty || ""}
                    onValueChange={(value) => updateContent({ difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Organization Section */}
          <AccordionItem
            value="organization"
            className="rounded-md border shadow-sm bg-gray-50 data-[state=open]:bg-gray-100"
          >
            <AccordionTrigger className="px-4 py-3 text-left text-sm font-semibold hover:no-underline">
              <div className="flex items-center w-full gap-2">
                <Folder className="w-4 h-4 text-gray-600" />
                <span className="flex-1">Organization</span>
                {!openSections.includes("organization") && renderSummary(organizationCompleted, 4)}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-6">
                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        onKeyDown={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button type="button" onClick={addTag} variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {content.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {content.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                            <Tag className="w-3 h-3" />
                            <span>{tag}</span>
                            <button 
                              type="button" 
                              onClick={() => removeTag(tag)} 
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={content.notes || ""}
                    onChange={(e) => updateContent({ notes: e.target.value })}
                    placeholder="Add any notes about this content..."
                    className="min-h-[80px] resize-none"
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="favorite"
                      checked={content.is_favorite || false}
                      onCheckedChange={(checked) => updateContent({ is_favorite: !!checked })}
                    />
                    <Label htmlFor="favorite" className="flex items-center space-x-2 cursor-pointer">
                      <Star className="w-4 h-4" />
                      <span>Add to favorites</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="public"
                      checked={content.is_public || false}
                      onCheckedChange={(checked) => updateContent({ is_public: !!checked })}
                    />
                    <Label htmlFor="public" className="cursor-pointer">Make this content public (shareable)</Label>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
} 