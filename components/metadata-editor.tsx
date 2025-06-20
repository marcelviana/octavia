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
import { Plus, X, Tag, Star } from "lucide-react"

interface MetadataEditorProps {
  content: any
  onChange: (content: any) => void
}

export function MetadataEditor({ content, onChange }: MetadataEditorProps) {
  const [metadata, setMetadata] = useState({
    title: content.title || "",
    artist: content.artist || "",
    album: content.album || "",
    genre: content.genre || "",
    key: content.key || "",
    bpm: content.bpm || "",
    timeSignature: content.timeSignature || "4/4",
    difficulty: content.difficulty || "",
    tags: content.tags || [],
    notes: content.notes || "",
    isFavorite: content.isFavorite || false,
    isPublic: content.isPublic || false,
  })
  const [newTag, setNewTag] = useState("")

  const updateMetadata = (newData: any) => {
    setMetadata(newData)
    onChange({ ...content, ...newData })
  }

  const addTag = () => {
    if (newTag.trim() && !metadata.tags.includes(newTag.trim())) {
      updateMetadata({
        ...metadata,
        tags: [...metadata.tags, newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateMetadata({
      ...metadata,
      tags: metadata.tags.filter((tag: string) => tag !== tagToRemove),
    })
  }

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

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={metadata.title}
                onChange={(e) => updateMetadata({ ...metadata, title: e.target.value })}
                placeholder="Song title"
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={metadata.artist}
                onChange={(e) => updateMetadata({ ...metadata, artist: e.target.value })}
                placeholder="Artist or composer"
              />
            </div>
            <div>
              <Label htmlFor="album">Album</Label>
              <Input
                id="album"
                value={metadata.album}
                onChange={(e) => updateMetadata({ ...metadata, album: e.target.value })}
                placeholder="Album or collection"
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select value={metadata.genre} onValueChange={(value) => updateMetadata({ ...metadata, genre: value })}>
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
        </CardContent>
      </Card>

      {/* Musical Information */}
      <Card>
        <CardHeader>
          <CardTitle>Musical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="key">Key</Label>
              <Select value={metadata.key} onValueChange={(value) => updateMetadata({ ...metadata, key: value })}>
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
                onChange={(e) => updateMetadata({ ...metadata, bpm: e.target.value })}
                placeholder="120"
              />
            </div>
            <div>
              <Label htmlFor="timeSignature">Time Signature</Label>
              <Select
                value={metadata.timeSignature}
                onValueChange={(value) => updateMetadata({ ...metadata, timeSignature: value })}
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
                onValueChange={(value) => updateMetadata({ ...metadata, difficulty: value })}
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
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === "Enter" && addTag()}
            />
            <Button type="button" onClick={addTag} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag: string) => (
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
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={metadata.notes}
            onChange={(e) => updateMetadata({ ...metadata, notes: e.target.value })}
            placeholder="Add any notes about this content..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Options */}
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="favorite"
              checked={metadata.isFavorite}
              onCheckedChange={(checked) => updateMetadata({ ...metadata, isFavorite: !!checked })}
            />
            <Label htmlFor="favorite" className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Favorite</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={metadata.isPublic}
              onCheckedChange={(checked) => updateMetadata({ ...metadata, isPublic: !!checked })}
            />
            <Label htmlFor="public">Make this content public (shareable)</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
