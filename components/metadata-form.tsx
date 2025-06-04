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
import { Music, Guitar, FileText, Star, Tag, Plus, X } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"


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

      // Basic validation
      if (!metadata.title) {
        console.log("No title provided")
        alert("Title is required!")
        return
      }

      // Build the insert payload
      const payload: any = {
        user_id: user.id,
        title: metadata.title,
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
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Song title"
                required
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
            <div>
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

          {/* Musical Information */}
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

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="mt-2 space-y-3">
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
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

          {/* Notes */}
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

          {/* Options */}
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
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!metadata.title.trim() || isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Content"}
        </Button>
      </div>
    </div>
  )
}
