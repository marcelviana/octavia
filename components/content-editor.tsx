"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Save,
  X,
  Type,
  Pen,
  Highlighter,
  Eraser,
  Circle,
  Square,
  ArrowRight,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Palette,
  Settings,
  Info,
  Sparkles,
  Clock,
} from "lucide-react"
import { ContentTypeEditor } from "@/components/editors/content-type-editor"
import { getContentTypeStyle } from "@/lib/content-type-styles"
import { UnifiedMetadataEditor } from "@/components/unified-metadata-editor"
import { getContentTypeIcon } from "@/types/content"

interface ContentEditorProps {
  content: any
  onSave: (updatedContent: any) => void
  onCancel: () => void
}

export function ContentEditor({ content, onSave, onCancel }: ContentEditorProps) {
  const [editedContent, setEditedContent] = useState({
    ...content,
    // Map database fields to editor fields
    title: content.title || "",
    artist: content.artist || "",
    album: content.album || "",
    genre: content.genre || "",
    key: content.key || "",
    bpm: content.bpm || "",
    difficulty: content.difficulty || "",
    tags: content.tags || [],
    notes: content.notes || "",
    is_favorite: content.is_favorite || false,
    is_public: content.is_public || false,
    content_data: content.content_data || {},
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [selectedTool, setSelectedTool] = useState("select")
  const [annotations, setAnnotations] = useState<any[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const contentType = content.type || content.content_type
  const styles = getContentTypeStyle(contentType)
  const headerGradient = (() => {
    switch (contentType) {
      case "Lyrics":
        return "from-green-500 to-green-600"
      case "Guitar Tab":
        return "from-blue-500 to-blue-600"
      case "Chord Chart":
        return "from-purple-500 to-purple-600"
      case "Sheet Music":
        return "from-orange-500 to-orange-600"
      default:
        return "from-amber-500 to-orange-600"
    }
  })()

  const getContentIcon = (type: string) => {
    const IconComponent = getContentTypeIcon(type);
    return <IconComponent className="w-4 h-4 text-white" />;
  }

  useEffect(() => {
    setHasChanges(JSON.stringify(editedContent) !== JSON.stringify(content))
  }, [editedContent, content])

  const handleSave = () => {
    const updatedContent = {
      title: editedContent.title,
      artist: editedContent.artist,
      album: editedContent.album,
      genre: editedContent.genre,
      key: editedContent.key,
      bpm: editedContent.bpm ? Number.parseInt(editedContent.bpm) : null,
      difficulty: editedContent.difficulty,
      tags: editedContent.tags,
      notes: editedContent.notes,
      is_favorite: editedContent.is_favorite,
      is_public: editedContent.is_public,
      content_data: {
        ...editedContent.content_data,
        annotations,
        // Store editor-specific data
        ...(content.content_type === "Chord Chart" && editedContent.sections && { sections: editedContent.sections }),
        ...(content.content_type === "Lyrics" && editedContent.lyrics && { lyrics: editedContent.lyrics }),
        ...(content.content_type === "Guitar Tab" && editedContent.measures && { measures: editedContent.measures }),
      },
      updated_at: new Date().toISOString(),
    }

    onSave(updatedContent)
  }

  const renderContentEditor = () => {
    return (
      <ContentTypeEditor
        content={editedContent}
        onChange={(newContent) => {
          setEditedContent(newContent)
        }}
      />
    )
  }

  const tools = [
    { id: "select", icon: ArrowRight, label: "Select" },
    { id: "pen", icon: Pen, label: "Pen" },
    { id: "highlighter", icon: Highlighter, label: "Highlighter" },
    { id: "text", icon: Type, label: "Text" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "square", icon: Square, label: "Rectangle" },
  ]

  const colors = ["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffa500"]

  return (
    <div className="flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-amber-200 px-4 py-3 shadow-md">
        <div className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex items-center flex-wrap gap-3">
            <Button variant="ghost" size="icon" onClick={onCancel} className="hover:bg-amber-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${headerGradient}`}>
                {getContentIcon(contentType)}
              </div>
              <div>
                <h1 className="font-semibold text-lg sm:text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Editing: {content.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={`${styles.bg} ${styles.border} ${styles.icon} font-medium px-2 py-0.5 text-xs`}>
                    {content.type}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    Last saved: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {hasChanges && (
              <span className="text-xs text-amber-700 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" /> Unsaved changes
              </span>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content Editor - Takes 2/3 on desktop, full width on mobile */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border border-amber-200 shadow-lg">
                <CardContent className="p-6">
                  {renderContentEditor()}
                </CardContent>
              </Card>
            </div>

            {/* Details Editor - Takes 1/3 on desktop, stacked below on mobile */}
                         <div className="lg:col-span-1">
               <UnifiedMetadataEditor
                 content={editedContent}
                 onChange={(newContent: any) => {
                   setEditedContent(newContent)
                 }}
               />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
