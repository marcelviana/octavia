"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Save,
  X,
  Undo,
  Redo,
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
  FileText,
  Info,
  Music,
  Sparkles,
  Clock,
} from "lucide-react"
import { MetadataEditor } from "@/components/metadata-editor"
import { ContentTypeEditor } from "@/components/editors/content-type-editor"
import { getContentTypeStyle } from "@/lib/content-type-styles"

interface ContentEditorProps {
  content: any
  onSave: (updatedContent: any) => void
  onCancel: () => void
}

export function ContentEditor({ content, onSave, onCancel }: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState("content")
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
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])

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

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1]
      setRedoStack([...redoStack, editedContent])
      setEditedContent(previousState)
      setUndoStack(undoStack.slice(0, -1))
    }
  }

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1]
      setUndoStack([...undoStack, editedContent])
      setEditedContent(nextState)
      setRedoStack(redoStack.slice(0, -1))
    }
  }

  const saveToUndoStack = () => {
    setUndoStack([...undoStack, editedContent])
    setRedoStack([]) // Clear redo stack when new action is performed
  }

  const renderContentEditor = () => {
    return (
      <ContentTypeEditor
        content={editedContent}
        onChange={(newContent) => {
          saveToUndoStack()
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-amber-200 px-4 py-2 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <Button variant="ghost" size="icon" onClick={onCancel} className="sm:mr-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${headerGradient}`}>
                <Music className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-semibold text-lg sm:text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Editing: {content.title}
              </h1>
            </div>
            <Badge variant="outline" className={`${styles.bg} ${styles.border} ${styles.icon} font-medium px-2 py-0.5`}>
              {content.type}
            </Badge>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              Last saved: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="hidden sm:block h-6" />
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div className="relative">
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              {hasChanges && (
                <Badge className="absolute -top-2 -right-2 sm:hidden" variant="destructive">
                  !
                </Badge>
              )}
            </div>
            {hasChanges && (
              <Badge variant="destructive" className="hidden sm:inline-flex bg-red-100 text-red-700 border-red-300 font-medium px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {(content.type === "Sheet Music" || content.type === "Guitar Tab") && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 overflow-x-auto">
            <div className="flex items-center space-x-6 flex-shrink-0">
              {/* Drawing Tools */}
              <div className="flex items-center space-x-2 bg-amber-50 rounded-xl p-2 border border-amber-200">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <Button
                      key={tool.id}
                      variant={selectedTool === tool.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTool(tool.id)}
                      className={
                        selectedTool === tool.id
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                          : "hover:bg-amber-100 text-amber-700"
                      }
                      title={tool.label}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  )
                })}
              </div>

              {/* Colors */}
              <div className="flex items-center space-x-2 bg-amber-50 rounded-xl p-2 border border-amber-200">
                <Palette className="w-4 h-4 text-amber-600 mr-1" />
                <div className="flex space-x-1">
                  {colors.map((color) => (
                    <div
                      key={color}
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2 bg-amber-50 rounded-xl p-2 border border-amber-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  disabled={zoom <= 50}
                  className="hover:bg-amber-100 text-amber-700"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-16 text-center text-amber-700">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                  className="hover:bg-amber-100 text-amber-700"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="hover:bg-amber-100 text-amber-700">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-amber-100 text-amber-700">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-gray-200 bg-gray-50 px-4">
              <TabsList className="bg-white/80 backdrop-blur-sm border border-amber-200 p-1 rounded-xl shadow-md flex flex-col sm:flex-row flex-wrap gap-2 w-full h-auto">
                <TabsTrigger
                  value="content"
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg text-amber-700 hover:bg-amber-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r ${headerGradient}`}
                >
                  <FileText className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger
                  value="metadata"
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-lg text-amber-700 hover:bg-amber-50 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r ${headerGradient}`}
                >
                  <Info className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="flex-1 p-4 sm:p-6 w-full">
              <div className="h-full bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 shadow-lg p-4 sm:p-6">
                {renderContentEditor()}
              </div>
            </TabsContent>

          <TabsContent value="metadata" className="flex-1 p-4 sm:p-6 w-full">
            <div className="h-full bg-white/80 backdrop-blur-sm rounded-xl border border-amber-200 shadow-lg p-4 sm:p-6">
              <MetadataEditor
                content={editedContent}
                onChange={(newContent) => {
                  saveToUndoStack()
                  setEditedContent(newContent)
                }}
              />
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
    {/* Footer */}
    <div className="sticky bottom-0 z-20 flex justify-end p-2 bg-white/80 backdrop-blur-sm border-t border-amber-200">
      <Button variant="outline" size="sm" className="mr-2">
        Preview
      </Button>
      {hasChanges && (
        <span className="text-xs text-red-700 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Unsaved changes
        </span>
      )}
    </div>
  </div>
  );
}
