"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ContentType } from "@/types/content"
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
} from "lucide-react"
import { getContentTypeStyle } from "@/lib/content-type-styles"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { createContent } from "@/lib/content-service"
import { useAuth } from "@/contexts/firebase-auth-context"


interface MetadataFormProps {
  files?: any[]
  createdContent?: any
  onComplete: (metadata: any) => void
  onBack: () => void
}

export function MetadataForm({ files = [], createdContent, onComplete, onBack }: MetadataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [metadata, setMetadata] = useState({
    title: createdContent?.title || "",
    artist: "",
    album: "",
    genre: "",
    key: "",
    bpm: "",
    timeSignature: "4/4",
    difficulty: "",
    tags: [] as string[],
    notes: "",
    isFavorite: false,
    isPublic: false,
  })
  const [newTag, setNewTag] = useState("")
  const [openSections, setOpenSections] = useState<string[]>(["basic"])
  const { user } = useAuth()

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

  const basicCompleted = [metadata.title, metadata.artist, metadata.album, metadata.genre].filter(Boolean).length
  const musicalCompleted = [metadata.key, metadata.bpm, metadata.timeSignature, metadata.difficulty].filter(Boolean).length
  const organizationCompleted = [
    metadata.tags.length > 0 ? "tags" : "",
    metadata.notes,
    metadata.isFavorite ? "fav" : "",
    metadata.isPublic ? "pub" : "",
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

  const addTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      setMetadata((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (!user) {
        alert("Not logged in. Please log in first.")
        return
      }

      if (!metadata.title.trim()) {
        alert("Title is required");
        return;
      }

      // Build the insert payload
      const payload: any = {
        title: metadata.title.trim(),
        artist: metadata.artist || null,
        album: metadata.album || null,
        genre: metadata.genre || null,
        content_type: createdContent?.type || files?.[0]?.contentType || "unknown",
        key: metadata.key || null,
        bpm: metadata.bpm ? Number(metadata.bpm) : null,
        time_signature: metadata.timeSignature || "4/4",
        difficulty: metadata.difficulty || null,
        tags: metadata.tags.length ? metadata.tags : null,
        notes: metadata.notes || null,
        is_favorite: !!metadata.isFavorite,
        is_public: !!metadata.isPublic,
      }

      if (createdContent?.content) {
        payload.content_data = createdContent.content
      }
      console.log("Payload prepared:", payload)

      // Example: if you have files[0].url from uploads:
      if (files && files[0]?.url) {
        payload.file_url = files[0].url
        if (!payload.content_data && payload.content_type === ContentType.SHEET_MUSIC) {
          payload.content_data = { file: files[0].url }
        }
      }

      const newContent = await createContent(payload as any)
      onComplete(newContent)
    } catch (error) {
      console.error("Unexpected error in handleSubmit:", error)
      const message = error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }



  const getContentIcon = (type: string) => {
    const styles = getContentTypeStyle(type)
    switch (type) {
      case ContentType.GUITAR_TAB:
      case "Guitar Tab":
      case "Guitar Tablature":
      case "tablature":
        return <Guitar className={`w-6 h-6 ${styles.icon}`} />
      case ContentType.CHORD_CHART:
      case "Chord Chart":
      case "chord_chart":
        return <Music className={`w-6 h-6 ${styles.icon}`} />
      case ContentType.SHEET_MUSIC:
      case "Sheet Music":
      case "sheet_music":
        return <FileText className={`w-6 h-6 ${styles.icon}`} />
      case ContentType.LYRICS:
      case "Lyrics":
      case "lyrics":
        return <Mic className={`w-6 h-6 ${styles.icon}`} />
      default:
        return <FileText className={`w-6 h-6 ${styles.icon}`} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Content Summary */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900">Content Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file, index) => {
                const styles = getContentTypeStyle(file.contentType)
                return (
                  <div key={index} className={`flex items-center space-x-4 p-4 rounded-lg border-2 ${styles.border} ${styles.bg} transition-all duration-200`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.bg} border-2 ${styles.border}`}>
                      {getContentIcon(file.contentType)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-base">{file.name}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge className={`text-xs font-medium ${styles.bg} ${styles.icon} border ${styles.border}`}>
                          {file.contentType}
                        </Badge>
                        <span className="text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : createdContent ? (
            (() => {
              const styles = getContentTypeStyle(createdContent.type)
              return (
                <div className={`flex items-center space-x-4 p-4 rounded-lg border-2 ${styles.border} ${styles.bg} transition-all duration-200`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.bg} border-2 ${styles.border}`}>
                    {getContentIcon(createdContent.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-base">{createdContent.title}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge className={`text-xs font-medium ${styles.bg} ${styles.icon} border ${styles.border}`}>
                        {createdContent.type.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                      <span className="text-xs text-gray-600 bg-white/60 px-2 py-1 rounded-full">
                        Created manually
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()
          ) : null}
        </CardContent>
      </Card>

      {/* Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Details</CardTitle>
          <p className="text-gray-600">Provide information to help organize and find your content</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-4"
          >
            <AccordionItem
              value="basic"
              className="rounded-md border shadow-sm bg-blue-50 data-[state=open]:bg-blue-100"
            >
              <AccordionTrigger className="px-4 py-2 text-left text-sm font-semibold">
                <div className="flex items-center w-full gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="flex-1">Basic Info</span>
                  {!openSections.includes("basic") && renderSummary(basicCompleted, 4)}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={metadata.title}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Song title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="artist">Artist</Label>
                    <Input
                      id="artist"
                      value={metadata.artist}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, artist: e.target.value }))}
                      placeholder="Artist or composer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="album">Album</Label>
                    <Input
                      id="album"
                      value={metadata.album}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, album: e.target.value }))}
                      placeholder="Album or collection"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={metadata.genre}
                      onValueChange={(value) => setMetadata((prev) => ({ ...prev, genre: value }))}
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

            <AccordionItem
              value="musical"
              className="rounded-md border shadow-sm bg-yellow-50 data-[state=open]:bg-yellow-100"
            >
              <AccordionTrigger className="px-4 py-2 text-left text-sm font-semibold">
                <div className="flex items-center w-full gap-2">
                  <Sliders className="w-4 h-4 text-yellow-600" />
                  <span className="flex-1">Musical Info</span>
                  {!openSections.includes("musical") && renderSummary(musicalCompleted, 4)}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Select value={metadata.key} onValueChange={(value) => setMetadata((prev) => ({ ...prev, key: value }))}>
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
                      value={metadata.bpm}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, bpm: e.target.value }))}
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeSignature">Time Signature</Label>
                    <Select
                      value={metadata.timeSignature}
                      onValueChange={(value) => setMetadata((prev) => ({ ...prev, timeSignature: value }))}
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
                      value={metadata.difficulty}
                      onValueChange={(value) => setMetadata((prev) => ({ ...prev, difficulty: value }))}
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

            <AccordionItem
              value="organization"
              className="rounded-md border shadow-sm bg-gray-50 data-[state=open]:bg-gray-100"
            >
              <AccordionTrigger className="px-4 py-2 text-left text-sm font-semibold">
                <div className="flex items-center w-full gap-2">
                  <Folder className="w-4 h-4 text-gray-600" />
                  <span className="flex-1">Organization</span>
                  {!openSections.includes("organization") && renderSummary(organizationCompleted, 4)}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6">
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
                        <Button type="button" onClick={addTag} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {metadata.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                              <Tag className="w-3 h-3" />
                              <span>{tag}</span>
                              <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={metadata.notes}
                      onChange={(e) => setMetadata((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add any notes about this content..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="favorite"
                        checked={metadata.isFavorite}
                        onCheckedChange={(checked) => setMetadata((prev) => ({ ...prev, isFavorite: !!checked }))}
                      />
                      <Label htmlFor="favorite" className="flex items-center space-x-2">
                        <Star className="w-4 h-4" />
                        <span>Add to favorites</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="public"
                        checked={metadata.isPublic}
                        onCheckedChange={(checked) => setMetadata((prev) => ({ ...prev, isPublic: !!checked }))}
                      />
                      <Label htmlFor="public">Make this content public (shareable)</Label>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="border-amber-300 text-amber-700 hover:bg-amber-50 px-6 py-2 font-medium"
        >
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Content"}
        </Button>
      </div>
    </div>
  )
}
