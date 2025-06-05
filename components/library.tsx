"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Music,
  FileText,
  Guitar,
  Filter,
  MoreVertical,
  Star,
  Edit,
  Trash2,
  Download,
  Share,
  Plus,
  Mic,
  Clock,
  ChevronDown,
  BookOpen,
} from "lucide-react"
import { getUserContent, deleteContent } from "@/lib/content-service"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LibraryProps {
  onSelectContent: (content: any) => void
}

export function Library({ onSelectContent }: LibraryProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("recent")
  const [viewMode, setViewMode] = useState("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [content, setContent] = useState<any[]>([])
  const [filteredContent, setFilteredContent] = useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({
    contentType: [],
    difficulty: [],
    key: [],
    favorite: false,
  })
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [contentToDelete, setContentToDelete] = useState<any>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true)
        const userContent = await getUserContent()
        setContent(userContent)
        setFilteredContent(userContent)
      } catch (error) {
        console.error("Error loading content:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [])

  useEffect(() => {
    let filtered = [...content]

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((item) => {
        if (activeTab === "guitar-tabs") return item.content_type === "Guitar Tab"
        if (activeTab === "chord-charts") return item.content_type === "Chord Chart"
        if (activeTab === "sheet-music") return item.content_type === "Sheet Music"
        if (activeTab === "lyrics") return item.content_type === "Lyrics"
        if (activeTab === "favorites") return item.is_favorite
        return true
      })
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          (item.artist && item.artist.toLowerCase().includes(query)) ||
          (item.album && item.album.toLowerCase().includes(query)),
      )
    }

    // Apply additional filters
    if (selectedFilters.contentType.length > 0) {
      filtered = filtered.filter((item) => selectedFilters.contentType.includes(item.content_type))
    }

    if (selectedFilters.difficulty.length > 0) {
      filtered = filtered.filter((item) => selectedFilters.difficulty.includes(item.difficulty))
    }

    if (selectedFilters.key.length > 0) {
      filtered = filtered.filter((item) => selectedFilters.key.includes(item.key))
    }

    if (selectedFilters.favorite) {
      filtered = filtered.filter((item) => item.is_favorite)
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (sortBy === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sortBy === "artist") {
      filtered.sort((a, b) => (a.artist || "").localeCompare(b.artist || ""))
    }

    setFilteredContent(filtered)
  }, [content, activeTab, searchQuery, sortBy, selectedFilters])

  const getContentIcon = (type: string) => {
    switch (type) {
      case "Guitar Tab":
        return <Guitar className="w-5 h-5 text-blue-600" />
      case "Chord Chart":
        return <Music className="w-5 h-5 text-purple-600" />
      case "Sheet Music":
        return <FileText className="w-5 h-5 text-amber-600" />
      case "Lyrics":
        return <Mic className="w-5 h-5 text-green-600" />
      default:
        return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  const getContentColor = (type: string) => {
    switch (type) {
      case "Guitar Tab":
        return "from-blue-500 to-blue-600"
      case "Chord Chart":
        return "from-purple-500 to-purple-600"
      case "Sheet Music":
        return "from-amber-500 to-amber-600"
      case "Lyrics":
        return "from-green-500 to-green-600"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const getContentBg = (type: string) => {
    switch (type) {
      case "Guitar Tab":
        return "bg-blue-50 border-blue-200"
      case "Chord Chart":
        return "bg-purple-50 border-purple-200"
      case "Sheet Music":
        return "bg-amber-50 border-amber-200"
      case "Lyrics":
        return "bg-green-50 border-green-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleAddContent = () => {
    router.push("/add-content")
  }

  const handleEditContent = (content: any) => {
    router.push(`/content/${content.id}/edit`)
  }

  const handleDeleteContent = async (content: any) => {
    setContentToDelete(content)
    setDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!contentToDelete) return

    try {
      await deleteContent(contentToDelete.id)
      const userContent = await getUserContent()
      setContent(userContent)
      setFilteredContent(userContent)
      setDeleteDialog(false)
      setContentToDelete(null)
    } catch (error) {
      console.error("Error deleting content:", error)
    }
  }

  return (
    <div className="p-6 bg-gradient-to-b from-[#fff9f0] to-[#fff5e5] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Your Music Library
          </h1>
          <p className="text-[#A69B8E] mt-1">Manage and organize all your musical content</p>
        </div>
        <Button
          onClick={handleAddContent}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by title, artist, or album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-amber-200 focus:border-amber-400 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-amber-200 bg-white hover:bg-amber-50">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <p className="text-sm font-medium mb-1">Content Type</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {["Guitar Tab", "Chord Chart", "Sheet Music", "Lyrics"].map((type) => (
                      <Badge
                        key={type}
                        variant={selectedFilters.contentType.includes(type) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedFilters((prev) => ({
                            ...prev,
                            contentType: prev.contentType.includes(type)
                              ? prev.contentType.filter((t: string) => t !== type)
                              : [...prev.contentType, type],
                          }))
                        }}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm font-medium mb-1 mt-3">Difficulty</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {["Beginner", "Intermediate", "Advanced"].map((difficulty) => (
                      <Badge
                        key={difficulty}
                        variant={selectedFilters.difficulty.includes(difficulty) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedFilters((prev) => ({
                            ...prev,
                            difficulty: prev.difficulty.includes(difficulty)
                              ? prev.difficulty.filter((d: string) => d !== difficulty)
                              : [...prev.difficulty, difficulty],
                          }))
                        }}
                      >
                        {difficulty}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center mt-3">
                    <input
                      type="checkbox"
                      id="favorites"
                      checked={selectedFilters.favorite}
                      onChange={() => setSelectedFilters((prev) => ({ ...prev, favorite: !prev.favorite }))}
                      className="mr-2"
                    />
                    <label htmlFor="favorites" className="text-sm">
                      Favorites only
                    </label>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] border-amber-200 bg-white hover:bg-amber-50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="artist">Artist (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md overflow-hidden border-amber-200">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-amber-100 text-amber-800" : "bg-white text-gray-600"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-amber-100 text-amber-800" : "bg-white text-gray-600"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-white border border-amber-200 p-1 rounded-lg">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-md transition-all"
          >
            All Content
          </TabsTrigger>
          <TabsTrigger
            value="guitar-tabs"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-md transition-all"
          >
            <Guitar className="w-4 h-4 mr-2" />
            Guitar Tabs
          </TabsTrigger>
          <TabsTrigger
            value="chord-charts"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
          >
            <Music className="w-4 h-4 mr-2" />
            Chord Charts
          </TabsTrigger>
          <TabsTrigger
            value="sheet-music"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white rounded-md transition-all"
          >
            <FileText className="w-4 h-4 mr-2" />
            Sheet Music
          </TabsTrigger>
          <TabsTrigger
            value="lyrics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white rounded-md transition-all"
          >
            <Mic className="w-4 h-4 mr-2" />
            Lyrics
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-md transition-all"
          >
            <Star className="w-4 h-4 mr-2" />
            Favorites
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
        </div>
      ) : filteredContent.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border border-amber-100 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
            <p className="text-[#A69B8E] mb-4">
              {searchQuery || Object.values(selectedFilters).some((v) => (Array.isArray(v) ? v.length > 0 : v))
                ? "Try adjusting your search or filters"
                : "Add your first piece of music content to get started"}
            </p>
            <Button
              onClick={handleAddContent}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Content
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => (
            <Card
              key={item.id}
              className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-md hover:shadow-lg transition-all overflow-hidden group"
            >
              <div className={`h-3 w-full bg-gradient-to-r ${getContentColor(item.content_type)}`}></div>
              <CardContent className="p-5 pt-4">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getContentBg(
                      item.content_type,
                    )}`}
                  >
                    {getContentIcon(item.content_type)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectContent(item)}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditContent(item)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteContent(item)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 cursor-pointer" onClick={() => onSelectContent(item)}>
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                  <p className="text-sm text-[#A69B8E] line-clamp-1">{item.artist || "Unknown Artist"}</p>
                  <div className="flex items-center mt-3 space-x-2">
                    <Badge variant="outline" className="bg-white">
                      {item.key || "No Key"}
                    </Badge>
                    {item.difficulty && (
                      <Badge
                        className={
                          item.difficulty === "Beginner"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : item.difficulty === "Intermediate"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {item.difficulty}
                      </Badge>
                    )}
                    {item.is_favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs text-[#A69B8E]">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(item.created_at)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      onClick={() => onSelectContent(item)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/90 backdrop-blur-sm border border-amber-100 shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y divide-amber-100">
              {filteredContent.map((item) => (
                <div key={item.id} className="p-4 hover:bg-amber-50 transition-colors flex items-center">
                  <div className="mr-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getContentBg(
                        item.content_type,
                      )}`}
                    >
                      {getContentIcon(item.content_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectContent(item)}>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <div className="flex items-center text-sm text-[#A69B8E]">
                      <span className="truncate">{item.artist || "Unknown Artist"}</span>
                      {item.album && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="truncate">{item.album}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {item.key && (
                      <Badge variant="outline" className="bg-white">
                        {item.key}
                      </Badge>
                    )}
                    {item.difficulty && (
                      <Badge
                        className={
                          item.difficulty === "Beginner"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : item.difficulty === "Intermediate"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {item.difficulty}
                      </Badge>
                    )}
                    {item.is_favorite && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                  </div>
                  <div className="ml-4 hidden md:flex items-center text-sm text-[#A69B8E]">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(item.created_at)}
                  </div>
                  <div className="ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSelectContent(item)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditContent(item)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Share className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteContent(item)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contentToDelete?.title}&quot;? This action cannot be undone.
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
