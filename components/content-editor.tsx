"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { AnnotationTools } from "@/components/annotation-tools"
import { ChordEditor } from "@/components/chord-editor"
import { LyricsEditor } from "@/components/lyrics-editor"
import { TabEditor } from "@/components/tab-editor"
import { MetadataEditor } from "@/components/metadata-editor"

interface ContentEditorProps {
  content: any
  onSave: (updatedContent: any) => void
  onCancel: () => void
}

export function ContentEditor({ content, onSave, onCancel }: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [editedContent, setEditedContent] = useState(content)
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
    onSave({
      ...editedContent,
      annotations,
      lastModified: new Date().toISOString(),
    })
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
    switch (content.type) {
      case "Chord Chart":
        return (
          <ChordEditor
            content={editedContent}
            onChange={(newContent) => {
              saveToUndoStack()
              setEditedContent(newContent)
            }}
          />
        )
      case "Guitar Tab":
        return (
          <TabEditor
            content={editedContent}
            onChange={(newContent) => {
              saveToUndoStack()
              setEditedContent(newContent)
            }}
          />
        )
      case "Sheet Music":
        return (
          <AnnotationTools
            content={editedContent}
            annotations={annotations}
            selectedTool={selectedTool}
            zoom={zoom}
            onAnnotationsChange={setAnnotations}
            onContentChange={(newContent) => {
              saveToUndoStack()
              setEditedContent(newContent)
            }}
          />
        )
      default:
        return (
          <LyricsEditor
            content={editedContent}
            onChange={(newContent) => {
              saveToUndoStack()
              setEditedContent(newContent)
            }}
          />
        )
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Editing: {content.title}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary">{content.type}</Badge>
                {hasChanges && <Badge variant="destructive">Unsaved Changes</Badge>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoStack.length === 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={redoStack.length === 0}>
              <Redo className="w-4 h-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {(content.type === "Sheet Music" || content.type === "Guitar Tab") && (
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Drawing Tools */}
              <div className="flex items-center space-x-1 border-r pr-4">
                <Button
                  variant={selectedTool === "select" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool("select")}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedTool === "pen" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool("pen")}
                >
                  <Pen className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedTool === "highlighter" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool("highlighter")}
                >
                  <Highlighter className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedTool === "text" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool("text")}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedTool === "eraser" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool("eraser")}
                >
                  <Eraser className="w-4 h-4" />
                </Button>
              </div>

              {/* Shapes */}
              <div className="flex items-center space-x-1 border-r pr-4">
                <Button
                  variant={selectedTool === "circle" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool("circle")}
                >
                  <Circle className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedTool === "square" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedTool("square")}
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>

              {/* Colors */}
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm">
                  <Palette className="w-4 h-4" />
                </Button>
                <div className="flex space-x-1">
                  {["#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"].map((color) => (
                    <div
                      key={color}
                      className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  disabled={zoom <= 50}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm w-12 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="bg-white border-b border-gray-200 px-4">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="metadata">Details</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="content" className="flex-1 p-6">
              {renderContentEditor()}
            </TabsContent>

            <TabsContent value="metadata" className="flex-1 p-6">
              <MetadataEditor
                content={editedContent}
                onChange={(newContent) => {
                  saveToUndoStack()
                  setEditedContent(newContent)
                }}
              />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium mb-4">Editor Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Auto-save</Label>
                      <input type="checkbox" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show grid</Label>
                      <input type="checkbox" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Snap to grid</Label>
                      <input type="checkbox" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Properties</h3>
              <div className="space-y-3">
                <div>
                  <Label>Tool: {selectedTool}</Label>
                </div>
                <div>
                  <Label>Zoom: {zoom}%</Label>
                </div>
                <div>
                  <Label>Annotations: {annotations.length}</Label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recent Changes</h3>
              <div className="text-sm text-gray-600">
                <p>Last modified: {new Date().toLocaleTimeString()}</p>
                <p>Changes: {hasChanges ? "Unsaved" : "Saved"}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Add Text Box
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Insert Chord
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Add Fingering
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
