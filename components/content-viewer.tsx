"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Bookmark,
  Share,
  Edit,
  Star,
  Volume2,
  Settings,
  MoreVertical,
  Trash2,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { ContentEditor } from "@/components/content-editor"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ContentViewerProps {
  content: any
  onBack: () => void
  onEnterPerformance: () => void
}

export function ContentViewer({ content, onBack, onEnterPerformance }: ContentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 3
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  const handleDelete = () => {
    setDeleteDialog(true)
  }

  const confirmDelete = () => {
    // Handle delete logic here
    console.log("Deleting content:", content.title)
    // In a real app, this would call an API to delete the content
    setDeleteDialog(false)
    onBack() // Navigate back to library after deletion
  }

  if (isEditMode) {
    return (
      <ContentEditor
        content={content}
        onSave={(updatedContent) => {
          // Handle save logic
          setIsEditMode(false)
        }}
        onCancel={() => setIsEditMode(false)}
      />
    )
  }

  if (!content) return null

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-F2EDE5 border-b border-A69B8E p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{content.title}</h1>
              <p className="text-sm text-gray-600">
                {content.artist} • {content.type}
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary">{content.key}</Badge>
              <Badge variant="secondary">{content.bpm} BPM</Badge>
              <Badge
                className={
                  content.difficulty === "Beginner"
                    ? "bg-green-100 text-green-800"
                    : content.difficulty === "Intermediate"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {content.difficulty}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Bookmark className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Star className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={onEnterPerformance}>
              <Play className="w-4 h-4 mr-2" />
              Performance Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-800 text-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white hover:bg-gray-700"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Volume2 className="w-4 h-4" />
              <Slider value={[75]} max={100} step={1} className="w-20" />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Zoom:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                className="text-white hover:bg-gray-700"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="text-white hover:bg-gray-700"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="text-white hover:bg-gray-700"
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="text-white hover:bg-gray-700"
              >
                Next
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex">
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto bg-F2EDE5">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-2xl">
              <CardContent className="p-0">
                <div
                  className="bg-white p-8 min-h-[800px] relative"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                >
                  {/* Sheet Music Content */}
                  <div className="space-y-6">
                    <div className="text-center border-b pb-4">
                      <h2 className="text-2xl font-bold">{content.title}</h2>
                      <p className="text-lg text-gray-600">{content.artist}</p>
                      <div className="flex justify-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Key: {content.key}</span>
                        <span>Tempo: {content.bpm} BPM</span>
                        <span>Time: 4/4</span>
                      </div>
                    </div>

                    {/* Mock Sheet Music Content */}
                    <div className="space-y-8">
                      {content.type === "Guitar Tab" && (
                        <div className="space-y-4">
                          <div className="font-mono text-sm space-y-1">
                            <div>E|--0----3----0----2----0---------0----3----0----2----0---------|</div>
                            <div>B|----1----1----1----1----1---------1----1----1----1----1-------|</div>
                            <div>G|------0----0----0----0----0---------0----0----0----0----0-----|</div>
                            <div>D|--------2----2----2----2----2---------2----2----2----2----2---|</div>
                            <div>A|--3---------------------------3------------------------------|</div>
                            <div>E|--------------------------------------------------------------|</div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Capo 7th fret</p>
                            <p>Standard tuning (EADGBE)</p>
                          </div>
                        </div>
                      )}

                      {content.type === "Chord Chart" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-4 gap-4">
                            {["Am", "F", "C", "G"].map((chord) => (
                              <div key={chord} className="text-center p-4 border rounded-lg">
                                <div className="text-lg font-bold mb-2">{chord}</div>
                                <div className="text-xs font-mono space-y-1">
                                  <div>●○○○○○</div>
                                  <div>●●●●●●</div>
                                  <div>○●○○●○</div>
                                  <div>○○●●○○</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-2 text-sm">
                            <p>
                              <strong>Verse:</strong> Am - F - C - G
                            </p>
                            <p>
                              <strong>Chorus:</strong> F - Am - C - G
                            </p>
                            <p>
                              <strong>Bridge:</strong> Am - F - Am - G
                            </p>
                          </div>
                        </div>
                      )}

                      {content.type === "Sheet Music" && (
                        <div className="space-y-6">
                          <img src="/placeholder.svg?height=400&width=600" alt="Sheet music" className="w-full" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white border-l border-A69B8E p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Song Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Genre:</span>
                  <span>{content.genre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Key:</span>
                  <span>{content.key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BPM:</span>
                  <span>{content.bpm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span>{content.difficulty}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {content.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Practice Notes</h3>
              <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                <p className="text-gray-700">
                  Remember to practice the fingerpicking pattern slowly before increasing tempo.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Related Songs</h3>
              <div className="space-y-2">
                <div className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm font-medium">Dust in the Wind</p>
                  <p className="text-xs text-gray-500">Kansas</p>
                </div>
                <div className="p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm font-medium">Tears in Heaven</p>
                  <p className="text-xs text-gray-500">Eric Clapton</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{content.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
