"use client"

import { useState } from "react"
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

interface LibraryProps {
  onSelectContent: (content: any) => void
}

export function Library({ onSelectContent }: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState("grid") // grid or list
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [deleteDialog, setDeleteDialog] = useState({ open: false, content: null })

  const handleEdit = (item: any) => {
    onSelectContent(item)
    // This will navigate to the content viewer which has edit functionality
  }

  const handleDelete = (item: any) => {
    setDeleteDialog({ open: true, content: item })
  }

  const confirmDelete = () => {
    if (deleteDialog.content) {
      // Handle delete logic here - remove from content array
      console.log("Deleting content:", deleteDialog.content.title)
      // In a real app, this would call an API to delete the content
    }
    setDeleteDialog({ open: false, content: null })
  }

  const content = [
    {
      id: 1,
      title: "Hotel California",
      artist: "Eagles",
      type: "Guitar Tab",
      genre: "Rock",
      key: "Am",
      bpm: 75,
      difficulty: "Intermediate",
      tags: ["classic", "fingerpicking"],
      isFavorite: true,
      thumbnail: "/placeholder.svg?height=150&width=200",
    },
    {
      id: 2,
      title: "Bohemian Rhapsody",
      artist: "Queen",
      type: "Sheet Music",
      genre: "Rock",
      key: "Bb",
      bpm: 72,
      difficulty: "Advanced",
      tags: ["epic", "piano"],
      isFavorite: false,
      thumbnail: "/placeholder.svg?height=150&width=200",
    },
    {
      id: 3,
      title: "Wonderwall",
      artist: "Oasis",
      type: "Chord Chart",
      genre: "Alternative",
      key: "Em",
      bpm: 87,
      difficulty: "Beginner",
      tags: ["acoustic", "strumming"],
      isFavorite: true,
      thumbnail: "/placeholder.svg?height=150&width=200",
    },
    {
      id: 4,
      title: "Stairway to Heaven",
      artist: "Led Zeppelin",
      type: "Guitar Tab",
      genre: "Rock",
      key: "Am",
      bpm: 82,
      difficulty: "Advanced",
      tags: ["epic", "solo"],
      isFavorite: false,
      thumbnail: "/placeholder.svg?height=150&width=200",
    },
    {
      id: 5,
      title: "Blackbird",
      artist: "The Beatles",
      type: "Guitar Tab",
      genre: "Folk",
      key: "G",
      bpm: 96,
      difficulty: "Intermediate",
      tags: ["fingerpicking", "classic"],
      isFavorite: true,
      thumbnail: "/placeholder.svg?height=150&width=200",
    },
    {
      id: 6,
      title: "Creep",
      artist: "Radiohead",
      type: "Chord Chart",
      genre: "Alternative",
      key: "G",
      bpm: 92,
      difficulty: "Beginner",
      tags: ["emotional", "grunge"],
      isFavorite: false,
      thumbnail: "/placeholder.svg?height=150&width=200",
    },
    {
      id: 7,
      title: "Imagine",
      artist: "John Lennon",
      type: "Lyrics",
      genre: "Pop",
      key: "C",
      bpm: 75,
      difficulty: "Beginner",
      tags: ["classic", "ballad", "vocals"],
      isFavorite: true,
      thumbnail: null,
    },
  ]

  const categories = [
    { value: "all", label: "All Content" },
    { value: "guitar-tab", label: "Guitar Tabs" },
    { value: "sheet-music", label: "Sheet Music" },
    { value: "chord-chart", label: "Chord Charts" },
    { value: "lyrics", label: "Lyrics" },
  ]

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.artist.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.type.toLowerCase().replace(" ", "-") === selectedCategory
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

  const getDifficultyColor = (difficulty: string) => {
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

  return (
    <div className="p-6 space-y-6 bg-[#F7F9FA] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1F36]">Music Library</h1>
          <p className="text-[#AAB4C3]">{filteredContent.length} items in your collection</p>
        </div>
        <Button className="bg-[#295EFF] hover:bg-[#1E4BCC] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Import Content
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#AAB4C3]" />
          <Input
            placeholder="Search by title, artist, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-[#AAB4C3] focus:border-[#295EFF] bg-white"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 border-[#AAB4C3] bg-white">
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
        <Button variant="outline" className="border-[#AAB4C3] text-[#1A1F36] hover:bg-[#E8ECF4]">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" className="border-[#AAB4C3] text-[#1A1F36] hover:bg-[#E8ECF4]">
          <SortAsc className="w-4 h-4 mr-2" />
          Sort
        </Button>
        <div className="flex border border-[#AAB4C3] rounded-lg">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-[#295EFF] text-white" : "text-[#1A1F36] hover:bg-[#E8ECF4]"}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-[#295EFF] text-white" : "text-[#1A1F36] hover:bg-[#E8ECF4]"}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-lg transition-shadow group bg-white border-[#AAB4C3]"
            >
              <CardContent className="p-4">
                <div className="relative">
                  <div onClick={() => onSelectContent(item)}>
                    <div className="absolute top-0 right-0 flex space-x-1">
                      <Button
                        size="sm"
                        variant={item.isFavorite ? "default" : "secondary"}
                        className={`h-8 w-8 p-0 ${item.isFavorite ? "bg-[#FF6B6B] hover:bg-[#E55555]" : "bg-[#E8ECF4] hover:bg-[#AAB4C3]"}`}
                      >
                        <Star className={`w-4 h-4 ${item.isFavorite ? "fill-current text-white" : "text-[#AAB4C3]"}`} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#E8ECF4] hover:bg-[#AAB4C3]"
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
                    <p className="text-sm text-[#AAB4C3] truncate">{item.artist}</p>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs bg-[#E8ECF4] text-[#295EFF]">
                        {getTypeIcon(item.type)}
                        <span className="ml-1">{item.type}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-[#AAB4C3]">
                        {item.key} • {item.bpm} BPM
                      </span>
                      <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>{item.difficulty}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-[#AAB4C3] text-[#AAB4C3]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
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
              className="cursor-pointer hover:shadow-md transition-shadow group bg-white border-[#AAB4C3]"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4" onClick={() => onSelectContent(item)}>
                    {item.type !== "Sheet Music" && item.type !== "Guitar Tab" && item.type !== "Chord Chart" ? (
                      <img
                        src={item.thumbnail || "/placeholder.svg"}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[#E8ECF4] rounded-lg flex items-center justify-center">
                        <span className="text-[#295EFF]">{getTypeIcon(item.type)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-[#1A1F36]">{item.title}</h3>
                      <p className="text-sm text-[#AAB4C3]">{item.artist}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-[#E8ECF4] text-[#295EFF]">
                          {getTypeIcon(item.type)}
                          <span className="ml-1">{item.type}</span>
                        </Badge>
                        <span className="text-xs text-[#AAB4C3]">{item.key}</span>
                        <span className="text-xs text-[#AAB4C3]">{item.bpm} BPM</span>
                        <Badge className={`text-xs ${getDifficultyColor(item.difficulty)}`}>{item.difficulty}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={item.isFavorite ? "default" : "secondary"}
                      className={`h-8 w-8 p-0 ${item.isFavorite ? "bg-[#FF6B6B] hover:bg-[#E55555]" : "bg-[#E8ECF4] hover:bg-[#AAB4C3]"}`}
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? "fill-current text-white" : "text-[#AAB4C3]"}`} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-[#AAB4C3] hover:bg-[#E8ECF4]">
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
        <DialogContent className="bg-white border-[#AAB4C3]">
          <DialogHeader>
            <DialogTitle className="text-[#1A1F36]">Delete Content</DialogTitle>
            <DialogDescription className="text-[#AAB4C3]">
              Are you sure you want to delete "{deleteDialog.content?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, content: null })}
              className="border-[#AAB4C3] text-[#1A1F36] hover:bg-[#E8ECF4]"
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
