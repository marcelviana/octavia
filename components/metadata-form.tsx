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
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { createContent } from "@/lib/content-service"


interface MetadataFormProps {
  files?: any[]
  createdContent?: any
  onComplete: (metadata: any) => void
  onBack: () => void
}

export function MetadataForm({ files = [], createdContent, onComplete, onBack }: MetadataFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [metadata, setMetadata] = useState({
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

  const keys = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B"]

  const basicCompleted = [metadata.artist, metadata.album, metadata.genre].filter(Boolean).length
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
      console.log("Starting handleSubmit...")
      setIsSubmitting(true);
      // Initialize fresh Supabase client
      const supabase = getSupabaseBrowserClient()
      console.log("Supabase client initialized")

      // Test Supabase connection
      console.log("Testing Supabase connection...")
      try {
        console.log("About to make Supabase query...")
        const { data: testData, error: testError } = await supabase.from('content').select('count').limit(1)
        console.log("Supabase query completed")
        console.log("Test data:", testData)
        console.log("Test error:", testError)

        if (testError) {
          console.error("Supabase connection test failed:", testError)
          alert("Failed to connect to database: " + testError.message)
          return
        }

        console.log("Supabase connection test successful")
      } catch (connectionError: any) {
        console.error("Unexpected error during Supabase connection test:", connectionError)
        console.error("Error details:", {
          name: connectionError?.name,
          message: connectionError?.message,
          stack: connectionError?.stack
        })
        alert("Failed to connect to database. Please try again.")
        return
      }

      // Fetch current user
      console.log("Fetching user...")
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log("Auth response:", { user, userError })

      if (userError) {
        console.error("Auth error:", userError)
        alert("Authentication error: " + userError.message)
        return
      }

      if (!user) {
        console.log("No user found")
        alert("Not logged in. Please log in first.")
        return
      }

      // Build the insert payload
      const payload: any = {
        user_id: user.id,
        title: createdContent?.title || files?.[0]?.name || "Untitled",
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
      }

      // Insert into Supabase
      console.log("Attempting to insert into Supabase...")
      const { data, error } = await supabase.from("content").insert([payload]).select()

      if (error) {
        console.error("Error saving content:", error)
        alert("Error saving content: " + error.message)
        setIsSubmitting(false)
        return
      }

      console.log("Content saved successfully:", data[0])
      // Success: return the new content
      onComplete(data[0])
    } catch (error) {
      console.error("Unexpected error in handleSubmit:", error)
      alert("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    try {
      setIsSubmitting(true)
      if (createdContent?.id) {
        onComplete(createdContent)
        return
      }

      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Not logged in. Please log in first.")
        return
      }

      const payload: any = {
        user_id: user.id,
        title: createdContent?.title || files?.[0]?.name || "Untitled",
        content_type: createdContent?.type || files?.[0]?.contentType || "unknown",
        content_data: createdContent?.content || {},
        file_url: files && files[0]?.url ? files[0].url : null,
        is_favorite: false,
        is_public: false,
      }

      const newContent = await createContent(payload)
      onComplete(newContent)
    } catch (error) {
      console.error("Error skipping metadata:", error)
      alert("Failed to save content. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case "Guitar Tab":
        return <Guitar className="w-5 h-5 text-orange-600" />
      case "Sheet Music":
        return <Music className="w-5 h-5 text-blue-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Content Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Content Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length > 0 ? (
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getContentIcon(file.contentType)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {file.contentType}
                      </Badge>
                      <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : createdContent ? (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {createdContent.type === "guitar-tab" && <Guitar className="w-5 h-5 text-orange-600" />}
              {createdContent.type === "chord-chart" && <Music className="w-5 h-5 text-blue-600" />}
              {createdContent.type === "lyrics" && <FileText className="w-5 h-5 text-gray-600" />}
              <div>
                <p className="font-medium text-gray-900">{createdContent.title}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {createdContent.type.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </Badge>
              </div>
            </div>
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
                  {!openSections.includes("basic") && renderSummary(basicCompleted, 3)}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={handleSkip}>Skip</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Content"}
          </Button>
        </div>
      </div>
    </div>
  )
}
