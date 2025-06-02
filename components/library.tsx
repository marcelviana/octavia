"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Grid, List, Music, FileText, Guitar, Star, Plus, SortAsc } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreVertical, Edit, Trash2 } from "lucide-react"
import { getUserContent, deleteContent, toggleFavorite } from "@/lib/content-service"
import { useRouter } from "next/navigation"
import type { Database } from "@/types/supabase"

type Content = Database["public"]["Tables"]["content"]["Row"]

interface LibraryProps {
  onSelectContent?: (content: Content) => void
  onEditContent?: (content: Content) => void
  onNavigate?: (screen: string) => void
}

export function Library({ onSelectContent, onEditContent, onNavigate }: LibraryProps) {
  const router = useRouter()
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("grid") // grid or list
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; content: Content | null }>({
    open: false,
    content: null,
  })

  // Load content on component mount
  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserContent()
      setContent(data)
    } catch (err) {
      console.error("Error loading content:", err)
      setError("Failed to load content. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContent = (item: Content) => {
    // Navigate to the content page using the database ID
    router.push(`/content/${item.id}`)
  }

  const handleEdit = (item: Content) => {
    // Navigate to content page for editing
    router.push(`/content/${item.id}`)
  }

  const handleDelete = (item: Content) => {
    setDeleteDialog({ open: true, content: item })
  }

  const confirmDelete = async () => {
    if (deleteDialog.content) {
      try {
        await deleteContent(deleteDialog.content.id)
        setContent(content.filter((item) => item.id !== deleteDialog.content!.id))
        setDeleteDialog({ open: false, content: null })
      } catch (err) {
        console.error("Error deleting content:", err)
        setError("Failed to delete content. Please try again.")
      }
    }
  }

  const handleToggleFavorite = async (item: Content) => {
    try {
      const updatedItem = await toggleFavorite(item.id, !item.is_favorite)
      setContent(content.map((c) => (c.id === item.id ? updatedItem : c)))
    } catch (err) {
      console.error("Error toggling favorite:", err)
      setError("Failed to update favorite status.")
    }
  }

  const categories = [
    { value: "all", label: "All Content" },
    { value: "Guitar Tab", label: "Guitar Tabs" },
    { value: "Sheet Music", label: "Sheet Music" },
    { value: "Chord Chart", label: "Chord Charts" },
    { value: "Lyrics", label: "Lyrics" },
  ]

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.artist && item.artist.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || item.content_type === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Guitar Tab":
        return <Guitar className={viewMode === "grid" ? "w-4 h-4" : "w-6 h-6"} />
      case "Sheet Music":
        return <Music className={viewMode === "grid" ? "w-4 h-4" : "w-6 h-6"} />
      case "Chord Chart":
        return <FileText className={viewMode === "grid" ? "w-4 h-4" : "w-6 h-6"} />
      case "Lyrics":
        return <FileText className={viewMode === "grid" ? "w-4 h-4" : "w-6 h-6"} />
      default:
        return <Music className={viewMode === "grid" ? "w-4 h-4" : "w-6 h-6"} />
    }
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-[#2E7CE4] border-[#F2EDE5] rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-[#1A1F36]">Loading your music library...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadContent} className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-[#fff9f0] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1F36]">Music Library</h1>
          <p className="text-[#A69B8E]">{filteredContent.length} items in your collection</p>
        </div>
        <Button className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white" onClick={() => router.push("/add-content")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A69B8E]" />
          <Input
            placeholder="Search by title, artist, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-[#A69B8E] focus:border-[#2E7CE4] bg-white"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 border-[#A69B8E] bg-white">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" className="border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]">
          <SortAsc className="w-4 h-4 mr-2" />
          Sort
        </Button>
        <div className="flex border border-[#A69B8E] rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-[#2E7CE4] text-white" : "text-[#1A1F36] hover:bg-[#F2EDE5]"}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-[#2E7CE4] text-white" : "text-[#1A1F36] hover:bg-[#F2EDE5]"}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-[#A69B8E] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#1A1F36] mb-2">No content found</h3>
          <p className="text-[#A69B8E] mb-4">
            {searchTerm || selectedCategory !== "all"
              ? "Try adjusting your search or filters"
              : "Start building your music library by adding some content"}
          </p>
          <Button className="bg-[#2E7CE4] hover:bg-[#1E5BB8] text-white" onClick={() => router.push("/add-content")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Content
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition-shadow group bg-white border-[#A69B8E]"
            >
              <CardContent className="p-4">
                <div className="relative">
                  <div onClick={() => handleSelectContent(item)}>
                    <div className="absolute top-0 right-0 flex space-x-1">
                      <Button
                        size="sm"
                        variant={item.is_favorite ? "default" : "secondary"}
                        className={`h-8 w-8 p-0 ${item.is_favorite ? "bg-[#FF6B6B] hover:bg-[#E55555]" : "bg-[#F2EDE5] hover:bg-[#A69B8E]"}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(item)
                        }}
                      >
                        <Star
                          className={`w-4 h-4 ${item.is_favorite ? "fill-current text-white" : "text-[#A69B8E]"}`}
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#F2EDE5] hover:bg-[#A69B8E]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-semibold text-[#1A1F36] truncate">{item.title}</h3>
                    <p className="text-sm text-[#A69B8E] truncate">{item.artist || "Unknown Artist"}</p>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs bg-[#F2EDE5] text-[#2E7CE4]">
                        {getTypeIcon(item.content_type)}
                        <span className="ml-1">{item.content_type}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-[#A69B8E]">
                        {item.key || "N/A"} • {item.bpm || "N/A"} BPM
                      </span>
                      <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                        {item.difficulty || "N/A"}
                      </Badge>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-[#A69B8E] text-[#A69B8E]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredContent.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow group bg-white border-[#A69B8E]"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4" onClick={() => handleSelectContent(item)}>
                    <div className="w-16 h-16 bg-[#F2EDE5] rounded-lg flex items-center justify-center">
                      <span className="text-[#2E7CE4]">{getTypeIcon(item.content_type)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1A1F36]">{item.title}</h3>
                      <p className="text-sm text-[#A69B8E]">{item.artist || "Unknown Artist"}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-[#F2EDE5] text-[#2E7CE4]">
                          {getTypeIcon(item.content_type)}
                          <span className="ml-1">{item.content_type}</span>
                        </Badge>
                        <span className="text-xs text-[#A69B8E]">{item.key || "N/A"}</span>
                        <span className="text-xs text-[#A69B8E]">{item.bpm || "N/A"} BPM</span>
                        <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={item.is_favorite ? "default" : "secondary"}
                      className={`h-8 w-8 p-0 ${item.is_favorite ? "bg-[#FF6B6B] hover:bg-[#E55555]" : "bg-[#F2EDE5] hover:bg-[#A69B8E]"}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(item)
                      }}
                    >
                      <Star className={`w-4 h-4 ${item.is_favorite ? "fill-current text-white" : "text-[#A69B8E]"}`} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#A69B8E] hover:bg-[#F2EDE5]">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(item)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, content: null })}>
        <DialogContent className="bg-white border-[#A69B8E]">
          <DialogHeader>
            <DialogTitle className="text-[#1A1F36]">Delete Content</DialogTitle>
            <DialogDescription className="text-[#A69B8E]">
              Are you sure you want to delete "{deleteDialog.content?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, content: null })}
              className="border-[#A69B8E] text-[#1A1F36] hover:bg-[#F2EDE5]"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="bg-[#FF6B6B] hover:bg-[#E55555]">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
