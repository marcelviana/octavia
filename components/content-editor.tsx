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
  ZoomIn,
  ZoomOut,
  RotateCw,
  Palette,
  Settings,
  FileText,
  Music,
  Sparkles,
  Clock,
} from "lucide-react"
import { MetadataEditor } from "@/components/metadata-editor"
import { ContentTypeEditor } from "@/components/editors/content-type-editor"

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
      <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Editing: {content.title}
              </h1>
              <div className="flex items-center space-x-3 mt-2">
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-700 border-amber-300 font-medium px-3 py-1"
                >
                  {content.type}
                </Badge>
                {hasChanges && (
                  <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-300 font-medium px-3 py-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Last saved: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-6 shadow-lg w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {(content.type === "Sheet Music" || content.type === "Guitar Tab") && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
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
            <div className="bg-white/90 backdrop-blur-sm border-b border-amber-200 px-6 py-2">
              <TabsList className="bg-amber-50 border border-amber-200">
                <TabsTrigger
                  value="content"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Content
                </TabsTrigger>
                <TabsTrigger
                  value="metadata"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Details
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="flex-1 p-6">
              <div className="h-full bg-white/60 backdrop-blur-sm rounded-xl border border-amber-200 shadow-lg">
                {renderContentEditor()}
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="flex-1 p-6">
              <div className="h-full bg-white/60 backdrop-blur-sm rounded-xl border border-amber-200 shadow-lg p-6">
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
    </div>
  )
}
